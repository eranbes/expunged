/**
 * Background Service Worker
 * Orchestrates TikTok comment deletion across page navigations
 */

console.log('[Expunged] Background service worker loaded');

// State management for TikTok comment deletion
let deletionState = {
  isActive: false,
  platform: null,
  type: null,
  username: null,
  deletedCount: 0,
  tabId: null,
  processedVideos: new Set() // Track which videos we've already visited
};

// Helper to send message to content script
async function sendToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Helper to navigate tab
async function navigateTab(tabId, url) {
  return new Promise((resolve) => {
    chrome.tabs.update(tabId, { url }, () => {
      // Wait for page to load
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
        if (updatedTabId === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(() => resolve(), 2000); // Extra wait for JS to initialize
        }
      });
    });
  });
}

// Main orchestration function for TikTok comments
async function orchestrateTikTokCommentDeletion(tabId) {
  console.log('[Expunged] Starting TikTok comment deletion orchestration');

  deletionState.isActive = true;
  deletionState.tabId = tabId;
  deletionState.processedVideos = new Set(); // Reset processed videos

  try {
    // Step 1: Get username
    console.log('[Expunged] Step 1: Getting username...');
    const usernameResponse = await sendToContentScript(tabId, { action: 'getUsername' });

    if (!usernameResponse.username) {
      throw new Error('Could not detect username');
    }

    deletionState.username = usernameResponse.username;
    console.log('[Expunged] Username:', deletionState.username);

    // Step 2: Click Comments tab
    console.log('[Expunged] Step 2: Clicking Comments tab...');
    await sendToContentScript(tabId, { action: 'clickCommentsTab' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for tab content to load

    // Step 3: Start deletion loop
    console.log('[Expunged] Step 3: Starting deletion loop...');
    await deletionLoop(tabId);

    console.log('[Expunged] ✅ Deletion complete!', deletionState.deletedCount, 'comments deleted');

  } catch (error) {
    console.error('[Expunged] Error in orchestration:', error);
  } finally {
    deletionState.isActive = false;
  }
}

// Deletion loop - processes inbox items one by one
async function deletionLoop(tabId) {
  let noItemsCount = 0;
  const maxNoItemsAttempts = 3;

  while (deletionState.isActive) {
    try {
      // Check current page type
      const pageTypeResponse = await sendToContentScript(tabId, { action: 'getPageType' });
      const pageType = pageTypeResponse.pageType;

      console.log('[Expunged] Current page type:', pageType);

      if (pageType === 'explore') {
        // On explore page - get next inbox item
        const inboxResponse = await sendToContentScript(tabId, { action: 'getInboxItems' });

        console.log('[Expunged] Inbox items found:', inboxResponse.count);

        if (inboxResponse.count === 0) {
          noItemsCount++;
          console.log('[Expunged] No items found, attempt:', noItemsCount);

          if (noItemsCount >= maxNoItemsAttempts) {
            console.log('[Expunged] No more items, finishing...');
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        noItemsCount = 0;

        if (!inboxResponse.firstItemUrl) {
          console.log('[Expunged] No video URL in first item, removing it...');
          await sendToContentScript(tabId, { action: 'removeFirstInboxItem' });
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Check if we've already processed this video
        if (deletionState.processedVideos.has(inboxResponse.firstItemUrl)) {
          console.log('[Expunged] ⏭️  Already processed this video, skipping...');
          await sendToContentScript(tabId, { action: 'removeFirstInboxItem' });
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        // Mark this video as processed
        deletionState.processedVideos.add(inboxResponse.firstItemUrl);

        // Remove item from DOM and navigate to video
        console.log('[Expunged] Navigating to video:', inboxResponse.firstItemUrl);
        await sendToContentScript(tabId, { action: 'removeFirstInboxItem' });
        await navigateTab(tabId, inboxResponse.firstItemUrl);

      } else if (pageType === 'video') {
        // On video page - try to delete comment
        console.log('[Expunged] On video page, attempting to delete comment...');

        const deleteResponse = await sendToContentScript(tabId, {
          action: 'deleteComment',
          username: deletionState.username
        });

        if (deleteResponse.deleted) {
          deletionState.deletedCount++;
          console.log('[Expunged] ✅ Deleted comment #', deletionState.deletedCount);

          // Update popup counter
          chrome.runtime.sendMessage({
            type: 'updateCounter',
            count: deletionState.deletedCount
          }).catch(() => {}); // Ignore if popup is closed
        } else {
          console.log('[Expunged] No comment deleted');
        }

        // Navigate back to explore page
        console.log('[Expunged] Navigating back to explore...');
        await navigateTab(tabId, 'https://www.tiktok.com/explore');

      } else {
        console.log('[Expunged] Unknown page type, going to explore...');
        await navigateTab(tabId, 'https://www.tiktok.com/explore');
      }

      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('[Expunged] Error in deletion loop:', error);

      // Try to recover by going back to explore
      try {
        await navigateTab(tabId, 'https://www.tiktok.com/explore');
      } catch (navError) {
        console.error('[Expunged] Could not recover, stopping:', navError);
        break;
      }
    }
  }

  // Finished
  chrome.runtime.sendMessage({
    type: 'finished',
    count: deletionState.deletedCount
  }).catch(() => {}); // Ignore if popup is closed
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Expunged] Background received message:', message);

  if (message.action === 'startTikTokCommentDeletion') {
    const { tabId } = message;
    orchestrateTikTokCommentDeletion(tabId);
    sendResponse({ started: true });
  }

  if (message.action === 'stopDeletion') {
    deletionState.isActive = false;
    sendResponse({ stopped: true });
  }

  if (message.action === 'getDeletionState') {
    sendResponse(deletionState);
  }

  return true;
});

console.log('[Expunged] Background service worker ready');
