/**
 * Content Script - Runs on all TikTok pages
 * Listens for commands from the background script and executes actions
 */

console.log('[Expunged] Content script loaded on:', window.location.href);

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForElement = async (selector, timeout = 10000, interval = 200) => {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const element = document.querySelector(selector);
      if (element) return resolve(element);
      if (Date.now() - start >= timeout) {
        return reject(new Error(`Timeout: Element ${selector} not found`));
      }
      setTimeout(check, interval);
    };
    check();
  });
};

// Check page type
function getPageType() {
  const url = window.location.href;
  if (url.includes('/explore')) return 'explore';
  if (url.includes('/video/')) return 'video';
  return 'other';
}

// Get username from profile button
async function getUsername() {
  try {
    const profileButton = await waitForElement('[data-e2e="nav-profile"]', 3000);
    const href = profileButton.getAttribute('href');
    if (href && href.startsWith('/@')) {
      const username = href.replace('/@', '').split('?')[0].split('/')[0];
      return username;
    }
  } catch (error) {
    console.log('[Expunged] Could not detect username:', error.message);
  }
  return null;
}

// Find inbox items on explore page
function findInboxItems() {
  return Array.from(document.querySelectorAll('[data-e2e="inbox-list-item"]'));
}

// Get video URL from inbox item
function getVideoUrlFromInboxItem(item) {
  const link = item.querySelector('a[href*="/video/"]');
  return link ? link.href : null;
}

// Find user's comment on video page
function findMyCommentButton(username) {
  if (!username) return null;

  const commentWrappers = Array.from(document.querySelectorAll('[class*="CommentItemWrapper"]'));

  for (const wrapper of commentWrappers) {
    const usernameLink = wrapper.querySelector(`a[href="/@${username}"]`);
    if (usernameLink) {
      const moreButton = wrapper.querySelector('[class*="DivMore"][aria-haspopup="dialog"]');
      if (!moreButton) {
        return wrapper.querySelector('div[aria-haspopup="dialog"]');
      }
      return moreButton;
    }
  }

  return null;
}

// Delete comment on current video page
async function deleteCommentOnCurrentPage(username) {
  console.log('[Expunged] Looking for comment by:', username);

  try {
    // Wait for comments to load
    await waitForElement('[class*="CommentItemWrapper"]', 5000).catch(() => null);
    await sleep(1000);

    const commentButton = findMyCommentButton(username);

    if (!commentButton) {
      console.log('[Expunged] No comment found by this user on this video');
      return { found: false };
    }

    console.log('[Expunged] Found comment, clicking three-dot menu...');
    commentButton.click();
    await sleep(1000);

    // Click delete button
    const deleteButton = await waitForElement('[data-e2e="comment-delete"]', 3000);
    deleteButton.click();
    console.log('[Expunged] Clicked delete button');
    await sleep(1000);

    // Click confirm button
    const confirmButton = await waitForElement('[data-e2e="comment-modal-delete"]', 3000);
    confirmButton.click();
    console.log('[Expunged] Clicked confirm button');
    await sleep(1500);

    console.log('[Expunged] ✅ Comment deleted successfully');
    return { found: true, deleted: true };

  } catch (error) {
    console.error('[Expunged] Error deleting comment:', error);
    return { found: true, deleted: false, error: error.message };
  }
}

// Click Comments tab on explore page
async function clickCommentsTab() {
  try {
    console.log('[Expunged] Clicking Comments tab...');
    const commentsTab = await waitForElement('[data-e2e="comments"]', 5000);
    commentsTab.click();
    console.log('[Expunged] ✅ Clicked Comments tab');
    await sleep(2000);
    return { success: true };
  } catch (error) {
    console.error('[Expunged] Error clicking Comments tab:', error);
    return { success: false, error: error.message };
  }
}

// Message listener - receives commands from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Expunged] Received message:', message);

  (async () => {
    try {
      switch (message.action) {
        case 'getPageType':
          sendResponse({ pageType: getPageType() });
          break;

        case 'getUsername':
          const username = await getUsername();
          sendResponse({ username });
          break;

        case 'clickCommentsTab':
          const tabResult = await clickCommentsTab();
          sendResponse(tabResult);
          break;

        case 'getInboxItems':
          const items = findInboxItems();
          const firstItemUrl = items.length > 0 ? getVideoUrlFromInboxItem(items[0]) : null;
          sendResponse({
            count: items.length,
            firstItemUrl
          });
          break;

        case 'deleteComment':
          const result = await deleteCommentOnCurrentPage(message.username);
          sendResponse(result);
          break;

        case 'removeFirstInboxItem':
          const inboxItems = findInboxItems();
          if (inboxItems.length > 0) {
            inboxItems[0].remove();
            sendResponse({ removed: true });
          } else {
            sendResponse({ removed: false });
          }
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('[Expunged] Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();

  return true; // Keep channel open for async response
});

console.log('[Expunged] Content script ready and listening for commands');
