/**
 * Expunged Extension - Main Popup Script
 * Uses modular platform architecture for multi-platform support
 */

let currentPlatform = 'facebook';

// ============================================================================
// UI Helper Functions
// ============================================================================

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

// ============================================================================
// Platform Management
// ============================================================================

function setPlatform(platformId) {
  if (!PlatformRegistry.has(platformId)) {
    console.error(`Platform ${platformId} not found`);
    return;
  }

  currentPlatform = platformId;
  chrome.storage.local.set({ currentPlatform: platformId });

  // Update theme
  document.body.className = `theme-${platformId}`;

  // Update UI
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const capitalizedId = platformId.charAt(0).toUpperCase() + platformId.slice(1);
  const button = document.getElementById(`platform${capitalizedId}`);
  if (button) {
    button.classList.add('active');
  }

  // Re-check current page
  checkCurrentPage();
}

function getCurrentPlatform() {
  return PlatformRegistry.get(currentPlatform);
}

// ============================================================================
// State Management
// ============================================================================

async function restoreState() {
  const {
    deleteCounter,
    isDeleting,
    deleteType,
    excludeOwnPosts,
    currentPlatform: savedPlatform
  } = await chrome.storage.local.get([
    'deleteCounter',
    'isDeleting',
    'deleteType',
    'excludeOwnPosts',
    'currentPlatform'
  ]);

  // Restore platform selection
  if (savedPlatform && PlatformRegistry.has(savedPlatform)) {
    setPlatform(savedPlatform);
  }

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

// ============================================================================
// Page Detection
// ============================================================================

async function checkCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url) return;

  const platform = getCurrentPlatform();
  if (!platform) return;

  const detection = platform.getPageDetection();

  if (detection.comments(tab.url)) {
    showPageStatus(`✓ You are on the ${platform.name} Comments page`, true);
  } else if (detection.reactions(tab.url)) {
    showPageStatus(`✓ You are on the ${platform.name} Reactions page`, true);
  } else if (detection.anyActivity(tab.url)) {
    showPageStatus(`✓ You are on a ${platform.name} activity page`, true);
  } else if (detection.onSite(tab.url)) {
    showPageStatus('Navigate to an activity page using Step 1', false);
  } else {
    showPageStatus(`Not on ${platform.name} - click a button in Step 1`, false);
  }
}

// ============================================================================
// Navigation
// ============================================================================

async function navigateToActivityPage(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const platform = getCurrentPlatform();

  if (!platform) {
    showStatus('Platform not found', 'error');
    return;
  }

  // Check if platform requires manual navigation
  if (platform.requiresManualNavigation()) {
    const instructions = platform.getManualNavigationInstructions(type);
    showStatus(instructions, 'info');
    showPageStatus(`Open ${platform.name} and go to your profile to see your ${type}`, false);
    return;
  }

  // Auto-navigate for platforms that support it
  const urls = platform.getUrls();
  const activityUrl = urls[type];

  if (!activityUrl) {
    showStatus(`${type} page not configured for ${platform.name}`, 'error');
    return;
  }

  showStatus(`Navigating to ${platform.name}...`, 'info');
  await chrome.tabs.update(tab.id, { url: activityUrl });

  // Save the selected type to storage so we know what the user wants to delete
  await chrome.storage.local.set({ selectedType: type });

  setTimeout(() => {
    showStatus(`Ready! Now click "Start Deleting" in Step 2`, 'success');
    if (platform.id === 'tiktok') {
      showPageStatus(`✓ On TikTok Explore - ready to delete ${type}`, true);
    } else {
      showPageStatus(`✓ You are on the ${type === 'comments' ? 'Comments' : 'Reactions'} page`, true);
    }
  }, 3000);
}

// ============================================================================
// Deletion Process
// ============================================================================

async function startDeletion() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const platform = getCurrentPlatform();

  if (!platform) {
    showStatus('Platform not found', 'error');
    return;
  }

  const detection = platform.getPageDetection();

  // Check if we're on the correct platform's activity page
  if (!tab.url || !detection.anyActivity(tab.url)) {
    showStatus('Please navigate to the activity page first using Step 1!', 'error');
    return;
  }

  const excludeOwnPosts = document.getElementById('excludeOwnPosts').checked;

  // Get the type that the user selected (stored when they clicked "Go to ... Page")
  const storage = await chrome.storage.local.get(['selectedType']);
  let type = storage.selectedType || 'comments'; // Default to comments if not set

  console.log('Using selected type from storage:', type);

  // Save state
  await chrome.storage.local.set({
    isDeleting: true,
    deleteType: type,
    excludeOwnPosts: excludeOwnPosts,
    deleteCounter: 0,
    deletePlatform: currentPlatform
  });

  showStatus(`Deleting items... Keep tab open!`, 'info');
  showProgress();
  updateCounter(0);

  await executeCleanup(type, tab.id, excludeOwnPosts, platform);
}

async function executeCleanup(type, tabId, excludeOwnPosts, platform) {
  console.log('executeCleanup called with:', { platformId: platform.id, type, tabId });

  try {
    // Special handling for TikTok comments - uses background script orchestration
    if (platform.id === 'tiktok' && type === 'comments') {
      console.log('✅ Using background script orchestration for TikTok comments');

      chrome.runtime.sendMessage({
        action: 'startTikTokCommentDeletion',
        tabId: tabId
      }, (response) => {
        if (response && response.started) {
          console.log('✅ Background orchestration started');
        } else {
          console.error('❌ Failed to start background orchestration');
          showStatus('Error: Could not start comment deletion', 'error');
        }
      });

      // Set up message listener for counter updates from background script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'updateCounter') {
          updateCounter(message.count);
        } else if (message.type === 'finished') {
          updateCounter(message.count);
          showStatus(`Completed! Deleted ${message.count} comments.`, 'success');
          chrome.storage.local.set({ isDeleting: false });
        }
      });

      return;
    }

    // Regular approach for everything else (including TikTok reactions)
    const cleanupFunc = platform.getCleanupFunction();

    console.log('Injecting cleanup script for', platform.name, 'type:', type);

    const result = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: cleanupFunc,
      args: [type, excludeOwnPosts]
    });

    console.log('Script injection result:', result);

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
    console.error('Script injection error:', error);
    showStatus(`Error: ${error.message}`, 'error');
    // Clear deletion state on error
    chrome.storage.local.set({ isDeleting: false });
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
  // Platform switcher buttons
  const platformIds = PlatformRegistry.getAllIds();
  platformIds.forEach(platformId => {
    const capitalizedId = platformId.charAt(0).toUpperCase() + platformId.slice(1);
    const button = document.getElementById(`platform${capitalizedId}`);
    if (button) {
      button.addEventListener('click', () => setPlatform(platformId));
    }
  });

  // Navigation buttons
  document.getElementById('navigateComments').addEventListener('click', async () => {
    hidePageStatus();
    await navigateToActivityPage('comments');
  });

  document.getElementById('navigateReactions').addEventListener('click', async () => {
    hidePageStatus();
    await navigateToActivityPage('reactions');
  });

  // Start deletion button
  document.getElementById('startDeletion').addEventListener('click', startDeletion);
}

// ============================================================================
// Initialization
// ============================================================================

// Initialize when popup opens
restoreState();
checkCurrentPage();
setupEventListeners();
