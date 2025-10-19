/**
 * Platform Registry
 *
 * Central registry for all supported platforms.
 * This file manages platform registration and provides easy access to platform configurations.
 */

const PlatformRegistry = {
  platforms: {},

  /**
   * Register a platform
   * @param {Object} platform - Platform configuration object
   */
  register(platform) {
    if (!platform.id) {
      throw new Error('Platform must have an id');
    }
    this.platforms[platform.id] = platform;
  },

  /**
   * Get a platform by ID
   * @param {string} id - Platform ID
   * @returns {Object|null} Platform configuration or null if not found
   */
  get(id) {
    return this.platforms[id] || null;
  },

  /**
   * Get all registered platforms
   * @returns {Object} All platforms keyed by ID
   */
  getAll() {
    return this.platforms;
  },

  /**
   * Get all platform IDs
   * @returns {Array<string>} Array of platform IDs
   */
  getAllIds() {
    return Object.keys(this.platforms);
  },

  /**
   * Check if a platform is registered
   * @param {string} id - Platform ID
   * @returns {boolean} True if platform is registered
   */
  has(id) {
    return id in this.platforms;
  }
};

// Auto-register platforms when this file is loaded
// Note: This assumes facebook.js and tiktok.js are loaded before this file
if (typeof FacebookPlatform !== 'undefined') {
  PlatformRegistry.register(FacebookPlatform);
}

if (typeof TikTokPlatform !== 'undefined') {
  PlatformRegistry.register(TikTokPlatform);
}
