/**
 * Base Platform Interface
 *
 * All platform implementations should follow this structure.
 * This serves as documentation for what each platform must provide.
 */

class BasePlatform {
  constructor() {
    this.id = '';           // Platform identifier (e.g., 'facebook', 'tiktok')
    this.name = '';         // Display name (e.g., 'Facebook', 'TikTok')
    this.domain = '';       // Primary domain (e.g., 'facebook.com')
  }

  /**
   * Navigation URLs for different activity types
   * @returns {Object} URLs for comments, reactions, etc.
   */
  getUrls() {
    return {
      comments: '',
      reactions: ''
    };
  }

  /**
   * Page detection functions
   * @returns {Object} Functions to detect if user is on specific pages
   */
  getPageDetection() {
    return {
      comments: (url) => false,
      reactions: (url) => false,
      anyActivity: (url) => false,
      onSite: (url) => false
    };
  }

  /**
   * Check if manual navigation is required
   * @returns {boolean} True if user must manually navigate
   */
  requiresManualNavigation() {
    return false;
  }

  /**
   * Get manual navigation instructions
   * @param {string} type - Activity type (comments, reactions)
   * @returns {string} Instructions for user
   */
  getManualNavigationInstructions(type) {
    return '';
  }

  /**
   * Cleanup function that runs in the page context
   * This is injected into the target page via chrome.scripting.executeScript
   *
   * @param {string} type - Activity type (comments, reactions)
   * @param {boolean} excludeOwnPosts - Whether to exclude own posts (platform-specific)
   */
  getCleanupFunction() {
    // This should return the actual function to be injected
    // Must be a function, not a reference
    return function cleanupActivities(type, excludeOwnPosts) {
      // Platform-specific implementation
    };
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BasePlatform;
}
