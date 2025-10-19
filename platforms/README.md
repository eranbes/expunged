# Platform Architecture

This directory contains platform-specific implementations for the Expunged extension.

## Directory Structure

```
platforms/
├── README.md          # This file - documentation
├── base.js           # Base platform interface (documentation)
├── facebook.js       # Facebook platform implementation
├── tiktok.js         # TikTok platform implementation
└── registry.js       # Platform registry and loader
```

## How It Works

The extension uses a modular platform architecture that makes it easy to add support for new social media platforms.

### Components

1. **base.js** - Defines the interface that all platforms should implement
2. **Platform files** (facebook.js, tiktok.js, etc.) - Platform-specific implementations
3. **registry.js** - Central registry that manages all platforms
4. **popup.js** - Main extension logic that uses the platform modules

### Loading Order

Platform files must be loaded in this order in `popup.html`:

```html
<script src="platforms/facebook.js"></script>
<script src="platforms/tiktok.js"></script>
<!-- Add new platform files here -->
<script src="platforms/registry.js"></script>
<script src="popup.js"></script>
```

## Adding a New Platform

To add support for a new platform (e.g., Instagram, Twitter, Reddit):

### Step 1: Create the Platform File

Create `platforms/yourplatform.js`:

```javascript
const YourPlatformPlatform = {
  id: 'yourplatform',
  name: 'YourPlatform',
  domain: 'yourplatform.com',

  getUrls() {
    return {
      comments: 'https://www.yourplatform.com/activity/comments',
      reactions: 'https://www.yourplatform.com/activity/likes'
    };
  },

  getPageDetection() {
    return {
      comments: (url) => url.includes('yourplatform.com') && url.includes('/comments'),
      reactions: (url) => url.includes('yourplatform.com') && url.includes('/likes'),
      anyActivity: (url) => url.includes('yourplatform.com') && url.includes('/activity'),
      onSite: (url) => url.includes('yourplatform.com')
    };
  },

  requiresManualNavigation() {
    // Return true if users must manually navigate to the page
    // Return false if the extension can auto-navigate
    return false;
  },

  getManualNavigationInstructions(type) {
    // Instructions shown to user if requiresManualNavigation() is true
    return `Please go to your YourPlatform ${type} page`;
  },

  getCleanupFunction() {
    // This function runs in the page context (injected via chrome.scripting.executeScript)
    return function cleanupActivitiesYourPlatform(type, excludeOwnPosts) {
      let deletedCount = 0;

      // Helper to wait
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Send updates to popup
      function updatePopup(count, finished = false) {
        try {
          chrome.runtime.sendMessage({
            type: finished ? 'finished' : 'updateCounter',
            count: count
          });
        } catch (e) {
          // Popup might be closed
        }
      }

      // Your platform-specific deletion logic here
      async function deleteNext() {
        // 1. Find items to delete (using platform-specific selectors)
        const items = document.querySelectorAll('.your-platform-item-selector');

        if (items.length === 0) {
          updatePopup(deletedCount, true);
          return false;
        }

        // 2. Click delete button
        const firstItem = items[0];
        const deleteBtn = firstItem.querySelector('.delete-button');
        deleteBtn.click();
        await wait(1000);

        // 3. Confirm if needed
        const confirmBtn = document.querySelector('.confirm-delete');
        if (confirmBtn) {
          confirmBtn.click();
          await wait(1000);
        }

        deletedCount++;
        updatePopup(deletedCount);
        return true;
      }

      // Main loop
      async function deleteLoop() {
        while (true) {
          const shouldContinue = await deleteNext();
          if (!shouldContinue) break;
          await wait(1500);
        }
      }

      deleteLoop().catch(err => {
        alert(`Error occurred: ${err.message}`);
      });
    };
  }
};
```

### Step 2: Register the Platform

The platform will auto-register when `registry.js` loads. Just make sure to:

1. Add the script tag to `popup.html` BEFORE `registry.js`:
   ```html
   <script src="platforms/yourplatform.js"></script>
   ```

2. Add a platform button to `popup.html`:
   ```html
   <button id="platformYourPlatform" class="platform-btn">YourPlatform</button>
   ```
   Note: The button ID must be `platform` + capitalized platform name

### Step 3: Update Manifest

Add host permissions in `manifest.json`:

```json
"host_permissions": [
  "https://www.yourplatform.com/*",
  "https://yourplatform.com/*"
]
```

### Step 4: Test

1. Reload the extension in Chrome
2. Click the YourPlatform button
3. Test navigation and deletion

## Platform Interface Reference

Each platform object must provide:

### Required Properties

- `id` (string) - Unique identifier (lowercase, no spaces)
- `name` (string) - Display name
- `domain` (string) - Primary domain (e.g., 'facebook.com')

### Required Methods

#### `getUrls()`
Returns navigation URLs for each activity type.

```javascript
getUrls() {
  return {
    comments: 'https://...',
    reactions: 'https://...'
  };
}
```

#### `getPageDetection()`
Returns functions to detect if user is on specific pages.

```javascript
getPageDetection() {
  return {
    comments: (url) => boolean,
    reactions: (url) => boolean,
    anyActivity: (url) => boolean,
    onSite: (url) => boolean
  };
}
```

#### `requiresManualNavigation()`
Returns whether the platform requires manual navigation.

```javascript
requiresManualNavigation() {
  return true; // or false
}
```

#### `getManualNavigationInstructions(type)`
Returns instructions for manual navigation (if required).

```javascript
getManualNavigationInstructions(type) {
  return `Instructions for ${type}`;
}
```

#### `getCleanupFunction()`
Returns the function that will be injected into the page.

**Important**: This function must be completely self-contained. It cannot reference any external variables or functions from your platform file.

```javascript
getCleanupFunction() {
  return function cleanupActivities(type, excludeOwnPosts) {
    // All logic must be inside this function
  };
}
```

## Tips for Platform-Specific Deletion Logic

1. **Use robust selectors**: Prefer `data-*` attributes or role attributes over class names
2. **Add delays**: Wait for menus/modals to appear and actions to complete
3. **Handle scrolling**: Scroll to load more content when items run out
4. **Detect completion**: Stop when no new items appear after scrolling
5. **Send updates**: Use `chrome.runtime.sendMessage` to update the popup counter
6. **Error handling**: Wrap in try/catch and show user-friendly errors

## Example: Finding DOM Selectors

To find the right selectors for a new platform:

1. Open the platform's website in Chrome
2. Open DevTools (F12)
3. Navigate to the activity page you want to target
4. Inspect the HTML structure:
   - Find item containers
   - Find delete/menu buttons
   - Find confirmation buttons
5. Look for stable attributes (`data-*`, `role`, `aria-*`)
6. Test selectors in the Console:
   ```javascript
   document.querySelectorAll('[data-your-selector]')
   ```

## Testing Checklist

When adding a new platform:

- [ ] Platform file created with correct structure
- [ ] Platform auto-registers in registry
- [ ] Button added to popup.html
- [ ] Host permissions added to manifest.json
- [ ] Can switch to platform in UI
- [ ] Page detection works correctly
- [ ] Navigation works (auto or manual)
- [ ] Deletion logic works
- [ ] Counter updates in real-time
- [ ] Completion message appears
- [ ] No console errors

## Troubleshooting

**Platform not appearing**: Check that the script is loaded before `registry.js` in `popup.html`

**Button doesn't work**: Verify button ID is `platform` + capitalized platform ID

**Can't find items**: Use DevTools to verify selectors are correct

**Deletion doesn't work**: Check browser console for errors in the injected script

**Rate limiting**: Add longer delays in the cleanup function
