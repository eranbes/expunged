/**
 * TikTok Platform Implementation
 * Based on gabireze's approach: https://github.com/gabireze/tiktok-all-liked-videos-remover
 */

const TikTokPlatform = {
  id: 'tiktok',
  name: 'TikTok',
  domain: 'tiktok.com',

  getUrls() {
    return {
      comments: 'https://www.tiktok.com/explore',
      reactions: 'https://www.tiktok.com/' // Start at home, will navigate to profile
    };
  },

  getPageDetection() {
    return {
      comments: (url) => url.includes('tiktok.com/explore'),
      reactions: (url) => url.includes('tiktok.com'),
      anyActivity: (url) => url.includes('tiktok.com'),
      onSite: (url) => url.includes('tiktok.com')
    };
  },

  requiresManualNavigation() {
    return false;
  },

  getManualNavigationInstructions(type) {
    return `Navigate to your profile to see your ${type}`;
  },

  getCleanupFunction() {
    // This function runs in the TikTok page context
    return function cleanupActivitiesTikTok(type, excludeOwnPosts) {
      let deletedCount = 0;
      window.stopDeleting = false;

      // Helper function to wait
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Wait for an element to appear in the DOM with timeout
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

      // Stop script with message
      const stopScript = (message, error = "") => {
        let logMessage = `${message}. Process complete.`;
        if (error) {
          console.error({ message: logMessage, error });
        } else {
          console.log(logMessage);
        }
        updatePopup(deletedCount, true);
      };

      // ==================================================================
      // REACTIONS (LIKES) - Uses gabireze's approach
      // ==================================================================

      const clickProfileTab = async () => {
        try {
          console.log('🔍 Looking for profile button...');
          const profileButton = await waitForElement('[data-e2e="nav-profile"]');
          profileButton.click();
          console.log("✅ Clicked 'Profile' button");
          await sleep(5000);
          return true;
        } catch (error) {
          stopScript("Profile button not found", error);
          return false;
        }
      };

      const clickLikedTab = async () => {
        try {
          console.log('🔍 Looking for Liked tab...');
          const likedTab = await waitForElement('[data-e2e="liked-tab"]');
          likedTab.click();
          console.log("✅ Clicked 'Liked' tab");
          await sleep(5000);
        } catch (error) {
          stopScript("Error clicking Liked tab", error);
        }
      };

      const clickFirstLikedVideo = async () => {
        try {
          console.log('🔍 Looking for first liked video...');
          const firstVideo = await waitForElement('[class*="DivPlayerContainer"]');
          firstVideo.click();
          console.log("✅ Opened first liked video in viewer");
          await sleep(5000);
        } catch (error) {
          stopScript("No liked videos found", error);
        }
      };

      const removeLikesWithArrows = async () => {
        console.log('🚀 Starting like removal loop...');

        const interval = setInterval(async () => {
          if (window.stopDeleting) {
            clearInterval(interval);
            stopScript("Deletion stopped by user");
            return;
          }

          const nextVideoButton = document.querySelector('[data-e2e="arrow-right"]');
          const likeButton = document.querySelector('[data-e2e="browse-like-icon"]');

          if (!likeButton) {
            clearInterval(interval);
            console.log('❌ Like button not found - may be at end of list');
            closeVideoViewer();
            return;
          }

          // Click to unlike
          likeButton.click();
          deletedCount++;
          updatePopup(deletedCount);
          console.log(`✅ Removed like #${deletedCount}`);

          // Check if we can go to next video
          if (!nextVideoButton || nextVideoButton.disabled) {
            clearInterval(interval);
            console.log('🏁 No more videos - reached the end');
            closeVideoViewer();
            return;
          }

          // Move to next video
          nextVideoButton.click();
          console.log('➡️ Moved to next video');
        }, 2000); // Process one every 2 seconds
      };

      const closeVideoViewer = async () => {
        try {
          const closeButton = document.querySelector('[data-e2e="browse-close"]');
          if (closeButton) {
            closeButton.click();
            console.log("✅ Closed video viewer");
            stopScript(`All done! Removed ${deletedCount} likes`);
          } else {
            stopScript(`Completed ${deletedCount} likes (could not find close button)`);
          }
        } catch (error) {
          stopScript(`Completed ${deletedCount} likes`, error);
        }
      };

      // ==================================================================
      // COMMENTS - Uses background script orchestration
      // ==================================================================

      const handleComments = async () => {
        console.log('📧 Comments deletion uses background script orchestration');
        console.log('Signaling background script to start...');

        // The background script with content script will handle the deletion
        // This injected function just needs to signal it to start

        try {
          chrome.runtime.sendMessage({
            action: 'startTikTokCommentDeletion',
            tabId: window.chrome?.runtime?.id // This won't work, we need tab ID from popup
          });
        } catch (e) {
          console.log('Note: Background orchestration triggered from popup, not here');
        }
      };

      // ==================================================================
      // MAIN ENTRY POINT
      // ==================================================================

      async function main() {
        // Prevent multiple instances
        if (window.tiktokCleanupRunning) {
          console.log('⚠️ Cleanup already running, skipping...');
          return;
        }
        window.tiktokCleanupRunning = true;

        console.log('🚀 TikTok cleanup script started');
        console.log('📋 Type:', type);

        try {
          if (type === 'reactions') {
            // Use gabireze's approach for likes
            console.log('💙 Using profile + liked tab approach');
            const wentToProfile = await clickProfileTab();
            if (!wentToProfile) return;

            await clickLikedTab();
            await clickFirstLikedVideo();
            await removeLikesWithArrows();
          } else if (type === 'comments') {
            await handleComments();
          } else {
            console.error('Unknown type:', type);
            stopScript('Unknown activity type');
          }
        } catch (error) {
          stopScript("Unexpected error in main flow", error);
        } finally {
          window.tiktokCleanupRunning = false;
        }
      }

      // Start the process
      main();
    };
  }
};
