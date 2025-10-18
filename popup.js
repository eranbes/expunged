function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status show ${type}`;
}

function showProgress() {
  document.getElementById('progressSection').style.display = 'block';
}

function updateCounter(count) {
  document.getElementById('deleteCounter').textContent = count;
  // Save counter to storage
  chrome.storage.local.set({ deleteCounter: count });
}

function showPageStatus(message, isOnPage) {
  const pageStatus = document.getElementById('pageStatus');
  pageStatus.textContent = message;
  pageStatus.className = isOnPage ? 'page-status on-page' : 'page-status not-on-page';
  pageStatus.style.display = 'flex';
}

function hidePageStatus() {
  document.getElementById('pageStatus').style.display = 'none';
}

// Restore state when popup opens
async function restoreState() {
  const { deleteCounter, isDeleting, deleteType, excludeOwnPosts } = await chrome.storage.local.get([
    'deleteCounter', 
    'isDeleting', 
    'deleteType',
    'excludeOwnPosts'
  ]);
  
  // Restore counter if deletion is in progress
  if (isDeleting && deleteCounter !== undefined) {
    showProgress();
    updateCounter(deleteCounter);
    showStatus(`Deleting items... Keep tab open!`, 'info');
  }
  
  // Restore checkbox state
  if (excludeOwnPosts !== undefined) {
    document.getElementById('excludeOwnPosts').checked = excludeOwnPosts;
  }
}

// Check current page when popup opens
async function checkCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url) return;
  
  if (tab.url.includes('facebook.com') && tab.url.includes('allactivity')) {
    if (tab.url.includes('COMMENTSCLUSTER')) {
      showPageStatus('✓ You are on the Comments page', true);
    } else if (tab.url.includes('LIKEDPOSTS')) {
      showPageStatus('✓ You are on the Reactions page', true);
    } else {
      showPageStatus('✓ You are on an activity page', true);
    }
  } else if (tab.url.includes('facebook.com')) {
    showPageStatus('Navigate to an activity page using Step 1', false);
  } else {
    showPageStatus('Not on Facebook - click a button in Step 1', false);
  }
}

// Run checks when popup opens
restoreState();
checkCurrentPage();

document.getElementById('navigateComments').addEventListener('click', async () => {
  hidePageStatus();
  await navigateToActivityPage('comments');
});

document.getElementById('navigateReactions').addEventListener('click', async () => {
  hidePageStatus();
  await navigateToActivityPage('reactions');
});

document.getElementById('startDeletion').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Check if we're on a Facebook activity page (either /me/ or /{user_id}/)
  if (!tab.url || !tab.url.includes('facebook.com') || !tab.url.includes('allactivity')) {
    showStatus('Please navigate to the activity page first using Step 1!', 'error');
    return;
  }
  
  const excludeOwnPosts = document.getElementById('excludeOwnPosts').checked;
  
  // Determine type from URL
  let type = 'comments';
  if (tab.url.includes('LIKEDPOSTS')) {
    type = 'reactions';
  }
  
  // Save state
  await chrome.storage.local.set({
    isDeleting: true,
    deleteType: type,
    excludeOwnPosts: excludeOwnPosts,
    deleteCounter: 0
  });
  
  showStatus(`Deleting items... Keep tab open!`, 'info');
  showProgress();
  updateCounter(0);
  
  await executeCleanup(type, tab.id, excludeOwnPosts);
});

async function navigateToActivityPage(type) {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  let activityUrl;
  if (type === 'comments') {
    activityUrl = 'https://www.facebook.com/me/allactivity?activity_history=false&category_key=COMMENTSCLUSTER';
  } else {
    activityUrl = 'https://www.facebook.com/me/allactivity?activity_history=false&category_key=LIKEDPOSTS';
  }
  
  showStatus(`Navigating to ${type} page...`, 'info');
  await chrome.tabs.update(tab.id, { url: activityUrl });
  
  setTimeout(() => {
    showStatus(`Ready! Now click "Start Deleting" in Step 2`, 'success');
    showPageStatus(`✓ You are on the ${type === 'comments' ? 'Comments' : 'Reactions'} page`, true);
  }, 3000);
}

async function executeCleanup(type, tabId, excludeOwnPosts) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: cleanupActivities,
      args: [type, excludeOwnPosts]
    });
    
    // Set up message listener for counter updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'updateCounter') {
        updateCounter(message.count);
      } else if (message.type === 'finished') {
        updateCounter(message.count);
        showStatus(`Completed! Deleted ${message.count} items.`, 'success');
        // Clear deletion state
        chrome.storage.local.set({ isDeleting: false });
      }
    });
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
    // Clear deletion state on error
    chrome.storage.local.set({ isDeleting: false });
  }
}

// This function runs in the Facebook page context
function cleanupActivities(type, excludeOwnPosts) {
  let deletedCount = 0;
  let noChangeCount = 0;
  const maxNoChangeAttempts = 5;
  window.stopDeleting = false;

  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper to scroll down
  function scrollDown() {
    window.scrollTo(0, document.body.scrollHeight);
  }

  // Send update to popup
  function updatePopup(count, finished = false) {
    try {
      chrome.runtime.sendMessage({
        type: finished ? 'finished' : 'updateCounter',
        count: count
      });
    } catch (e) {
      // Silently fail if popup is closed
    }
  }

  // Check if a comment is on own post
  function isCommentOnOwnPost(button) {
    if (!excludeOwnPosts) {
      return false;
    }

    // Look for context that indicates this is own post
    const container = button.closest('[role="article"]') || button.closest('div[data-ad-preview]') || button.closest('li');
    if (!container) return false;

    const text = container.textContent.toLowerCase();
    
    // Look for indicators that this is a comment on own post
    // Facebook shows "You commented on your post" or similar text
    if (text.includes('you commented on your') || 
        text.includes('your post') && text.includes('comment')) {
      return true;
    }

    return false;
  }

  // Find activity items (not messenger or other menus)
  function findActivityItems() {
    const allButtons = Array.from(document.querySelectorAll('[role="button"]'));
    
    // Filter to find buttons that are part of activity entries
    const activityButtons = allButtons.filter(btn => {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      
      // Must have "More options" in aria-label
      if (!ariaLabel.toLowerCase().includes('more options')) {
        return false;
      }
      
      // Should NOT be part of messenger
      const parent = btn.closest('div[role="main"]') || btn.closest('[data-pagelet]');
      if (parent) {
        const parentText = parent.textContent.toLowerCase();
        // Exclude if it's clearly a messenger item
        if (parentText.includes('delete chat') || parentText.includes('archive chat')) {
          return false;
        }
        // Include if it contains activity keywords
        if (parentText.includes('reacted') || 
            parentText.includes('liked') || 
            parentText.includes('commented') ||
            parentText.includes('shared')) {
          return true;
        }
      }
      
      return false;
    });
    
    return activityButtons;
  }

  // Find delete/unlike option in the opened menu
  function findDeleteOption() {
    const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
    
    for (const item of menuItems) {
      const text = item.textContent.toLowerCase();
      if (text.includes('unlike') ||
          text.includes('delete') || 
          text.includes('remove') || 
          text.includes('move to trash') ||
          text.includes('move to bin')) {
        // Make sure it's not "Delete chat" or "Archive chat"
        if (!text.includes('chat')) {
          return item;
        }
      }
    }
    return null;
  }

  // Find confirm button in modal
  function findConfirmButton() {
    const buttons = Array.from(document.querySelectorAll('[role="button"]'));
    for (const btn of buttons) {
      const text = btn.textContent.trim().toLowerCase();
      if ((text === 'delete' || 
           text === 'confirm' || 
           text === 'remove' ||
           text === 'move to trash' ||
           text === 'move to bin') &&
          !text.includes('chat')) {
        return btn;
      }
    }
    return null;
  }

  // Close any open menus by pressing Escape
  function closeMenus() {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true
    }));
  }

  // Main deletion process
  async function deleteNext() {
    if (window.stopDeleting) {
      alert('Deletion stopped. Refresh the page to see results.');
      return false;
    }

    // Find activity item menu buttons
    const activityButtons = findActivityItems();

    if (activityButtons.length === 0) {
      // Scroll and try again
      scrollDown();
      await wait(3000);
      
      const newButtons = findActivityItems();
      if (newButtons.length === 0) {
        noChangeCount++;
        
        if (noChangeCount >= maxNoChangeAttempts) {
          updatePopup(deletedCount, true);
          alert(`Completed! Deleted ${deletedCount} ${type}. Refresh the page to see results.`);
          return false;
        }
      } else {
        noChangeCount = 0;
      }
      return true;
    }

    noChangeCount = 0;

    // Check if we should skip this item (comment on own post)
    if (isCommentOnOwnPost(activityButtons[0])) {
      // Skip this item - close any open menus and continue
      closeMenus();
      await wait(500);
      return true;
    }

    // Click the first activity menu button
    activityButtons[0].click();
    await wait(1500);

    // Find and click delete/unlike option
    const deleteOption = findDeleteOption();
    if (!deleteOption) {
      closeMenus();
      await wait(500);
      return true;
    }

    deleteOption.click();
    await wait(1500);

    // Check if there's a confirmation needed
    const confirmButton = findConfirmButton();
    if (confirmButton) {
      confirmButton.click();
      await wait(2000); // Wait for deletion to actually complete
    } else {
      await wait(1500); // Wait for deletion without confirmation
    }
    
    deletedCount++;
    updatePopup(deletedCount);
    
    // Close any remaining menus
    closeMenus();
    await wait(500);
    
    return true;
  }

  // Main loop
  async function deleteLoop() {
    while (true) {
      const shouldContinue = await deleteNext();
      if (!shouldContinue) {
        break;
      }
      
      // Add a delay between deletions to avoid rate limiting
      await wait(1500);
    }
  }

  // Start the process
  deleteLoop().catch(err => {
    alert(`Error occurred: ${err.message}`);
  });
}
