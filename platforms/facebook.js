/**
 * Facebook Platform Implementation
 */

const FacebookPlatform = {
  id: 'facebook',
  name: 'Facebook',
  domain: 'facebook.com',

  getUrls() {
    return {
      comments: 'https://www.facebook.com/me/allactivity?activity_history=false&category_key=COMMENTSCLUSTER',
      reactions: 'https://www.facebook.com/me/allactivity?activity_history=false&category_key=LIKEDPOSTS'
    };
  },

  getPageDetection() {
    return {
      comments: (url) => url.includes('facebook.com') && url.includes('allactivity') && url.includes('COMMENTSCLUSTER'),
      reactions: (url) => url.includes('facebook.com') && url.includes('allactivity') && url.includes('LIKEDPOSTS'),
      anyActivity: (url) => url.includes('facebook.com') && url.includes('allactivity'),
      onSite: (url) => url.includes('facebook.com')
    };
  },

  requiresManualNavigation() {
    return false;
  },

  getManualNavigationInstructions(type) {
    return '';
  },

  getCleanupFunction() {
    // This function runs in the Facebook page context
    return function cleanupActivities(type, excludeOwnPosts) {
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
    };
  }
};
