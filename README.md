<div align="center">
  <img src="logo.png" alt="Expunged Logo" width="200"/>

  # Expunged - Social Media Activity Cleaner Chrome Extension

  **Clear your social media record by automatically deleting comments and reactions from Facebook and TikTok.**
</div>

Expunged is a free, open-source Chrome extension that helps you bulk delete comments and reactions from Facebook and TikTok quickly and easily. Take control of your digital footprint and clean up your social media history with just a few clicks.

## 🎯 Key Features

- ✅ **Multi-Platform Support** - Works with both Facebook and TikTok
- ✅ **Bulk Delete Comments** - Remove all your comments automatically on both platforms
- ✅ **Bulk Delete Reactions** - Unlike posts and remove reactions in bulk
- ✅ **Smart Filtering** - Option to keep comments on your own posts (Facebook)
- ✅ **Real-Time Progress** - Watch the deletion counter update live
- ✅ **Privacy-First** - All processing happens locally in your browser
- ✅ **No Data Collection** - Zero tracking, zero analytics, completely private
- ✅ **Easy Platform Switching** - Toggle between Facebook and TikTok with one click
- ✅ **Works on Any Profile** - Automatically detects your logged-in account

## 🚀 Why Use Expunged?

### Clean Up Your Digital Past
Remove embarrassing comments, old reactions, and unwanted social media history from Facebook and TikTok. Perfect for:
- Job seekers cleaning up their online presence
- Anyone concerned about digital privacy
- Users wanting to start fresh on social media
- People managing their online reputation

### Save Time
Instead of manually clicking through hundreds or thousands of comments and reactions on Facebook and TikTok, Expunged automates the entire process. What would take hours or days is done in minutes.

### Stay Private
Unlike other tools that require API access or login credentials, Expunged works directly in your browser. Your data never leaves your computer.

## 📥 Installation

### Step 1: Download the Extension
Download the latest release: [expunged-extension.zip](https://github.com/eranbes/expunged/releases)

### Step 2: Extract Files
Unzip the downloaded file to a folder on your computer.

### Step 3: Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right corner)
3. Click **Load unpacked**
4. Select the folder containing the extension files
5. The Expunged icon will appear in your Chrome toolbar

## 📖 How to Use Expunged

### Step 0: Select Platform
1. Click the Expunged extension icon in Chrome
2. Select either **Facebook** or **TikTok** platform button at the top

### For Facebook:

#### Step 1: Navigate to Activity Page
1. Choose either:
   - **Go to Comments Page** - To delete your comments
   - **Go to Reactions Page** - To delete your likes/reactions
2. Wait for Facebook to load the activity page

#### Step 2: Start Deletion
1. *(Optional)* Check "Don't delete comments on my own posts" to preserve those
2. Click **Start Deleting**
3. Keep the tab open and watch the real-time counter
4. Wait for completion notification

### For TikTok:

#### For Reactions (Likes):
1. Go to TikTok.com and log in
2. Click **Go to Reactions Page** in the extension
3. Extension will automatically navigate to TikTok home
4. Click **Start Deleting**
5. Extension will:
   - Navigate to your profile automatically
   - Click the "Liked" tab
   - Open videos in overlay viewer
   - Remove likes one by one using arrow navigation
6. Keep the tab open and watch the counter

#### For Comments:
1. Go to TikTok.com and log in
2. Click **Go to Comments Page** in the extension
3. Extension will navigate to TikTok Explore page
4. Click **Start Deleting**
5. Extension will:
   - Click the "Comments" tab automatically
   - Navigate between Explore and video pages
   - Find and delete only YOUR comments
   - Track processed videos to avoid duplicates
6. Keep the tab open - you'll see pages changing automatically

### Tips for Best Results
- Keep the tab **active and visible** during deletion
- Don't click on the page or switch tabs while it's running
- For large histories, the process may take 10-30 minutes
- You can stop early by opening Console (F12) and typing `window.stopDeleting = true`
- TikTok may have stricter rate limiting - if deletion stops, wait 30 minutes and try again

## 🔒 Privacy & Security

### Your Data is Safe
- **No server communication** - Everything runs locally in your browser
- **No API keys required** - Works directly with Facebook's interface
- **No tracking or analytics** - We don't collect any data about you
- **Open source** - Review the code yourself for transparency

### Platform Terms of Service
This extension automates clicking through Facebook and TikTok's user interfaces. While it respects each platform's functionality, automated actions may be subject to rate limiting. Use responsibly and at your own discretion.

## ⚙️ Technical Details

### How It Works

**Facebook:**
- Uses Chrome's scripting API to inject deletion script
- Scrolls through activity page identifying items
- Clicks delete buttons and confirms deletions
- Filters out Messenger items and optionally own posts

**TikTok Reactions (Likes):**
- Navigates to profile → Liked tab
- Opens first video in overlay viewer (no page reload!)
- Uses `setInterval` to repeatedly:
  - Click unlike button
  - Click arrow to next video
- Stays in viewer = fast and reliable

**TikTok Comments:**
- Uses persistent background script architecture
- Content script survives page navigations
- Orchestrates: Explore → Video → Delete → Back to Explore
- Tracks processed videos to avoid infinite loops
- Finds only YOUR comments by matching username

### Smart Detection
- **Facebook**: Filters out Messenger items to avoid accidental deletions
- **Facebook**: Identifies comments on your own posts (when option enabled)
- **TikTok**: Automatic username detection from profile button
- **TikTok**: Uses stable `data-e2e` attributes for selectors
- **TikTok**: Skips videos already processed (prevents loops)
- **Both platforms**: Handles confirmation dialogs
- **Both platforms**: Includes delays to prevent rate limiting

### Built With
- Manifest V3 (latest Chrome extension standard)
- Vanilla JavaScript (no external dependencies)
- Chrome Extensions API
- Local storage for state persistence
- Modular platform architecture for easy extensibility

### Architecture
The extension uses a modular platform architecture with three different approaches:

**1. Simple Injection (Facebook, TikTok Likes)**
- Injects single cleanup function into page
- Works when no page navigation needed
- Fast and straightforward

**2. Background Orchestration (TikTok Comments)**
- `background.js` - Service worker that orchestrates
- `content-script.js` - Runs on all TikTok pages
- Survives page navigations
- Tracks state across pages

**3. Platform Modules** (`platforms/`)
- Each platform has its own file
- Platform registry for management
- Easy to add new platforms

See `ARCHITECTURE.md` for detailed technical documentation.

## 🛠️ Troubleshooting

### Extension Won't Load
- Ensure Developer mode is enabled in `chrome://extensions/`
- Verify all files (especially icons) are in the folder
- Try reloading the extension

### Nothing Happens When I Click "Start Deleting"
- Make sure you've selected the correct platform (Facebook or TikTok)
- Verify you're on the correct activity/profile page for that platform
- Check that the green checkmark appears showing you're on the right page
- Reload the extension: go to `chrome://extensions/` and click reload

### Deletion Stopped Working
- The platform may have rate-limited you - wait 15-30 minutes and try again
- Refresh the page and restart the process
- Check your internet connection
- For TikTok: Make sure you're on your profile page and the content is visible

### Wrong Items Being Deleted
- Verify you've selected the correct platform button
- Verify you're on the correct activity page (Comments or Reactions)
- For Facebook: If using "exclude own posts" option, ensure it's checked before starting

### TikTok-Specific Issues
- **Content not found**: TikTok's DOM structure may have changed. Please report this as an issue on GitHub
- **Slow deletion**: TikTok has more conservative rate limiting than Facebook - this is normal
- **Private profile**: Make sure your liked videos are not set to private in settings

## 🤝 Contributing

Contributions are welcome! This is an open-source project.

### To Contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Version History

### Version 1.1.0 (Current)
- ✅ **NEW: TikTok Reactions (Likes) support** - Automatically navigate profile and unlike videos
- ✅ **NEW: TikTok Comments support** - Delete comments using background script orchestration
- ✅ **NEW: Platform switcher** - Toggle between Facebook and TikTok in UI
- ✅ **NEW: Persistent background script** - Survives page navigations for TikTok comments
- ✅ **NEW: Content script** - Handles actions on TikTok pages
- ✅ **NEW: Smart video tracking** - Prevents infinite loops by tracking processed videos
- ✅ **NEW: Automatic username detection** - Works for any logged-in TikTok user
- ✅ Multi-platform architecture with platform-specific deletion logic
- ✅ Uses stable `data-e2e` selectors for TikTok reliability
- ✅ All features from v1.0.0 maintained for Facebook

### Version 1.0.0
- ✅ Generic profile support (works for any logged-in user)
- ✅ Option to exclude comments on own posts (Facebook)
- ✅ Real-time deletion counter with state persistence
- ✅ Visual indicators for current page status
- ✅ Two-step navigation process
- ✅ No console logging for cleaner operation
- ✅ Improved error handling and user feedback

## ⚠️ Disclaimer

**Use at your own risk.** This extension permanently deletes social media content from Facebook and TikTok. There is no undo function. Always ensure you want to delete items before starting the process.

Facebook and TikTok may:
- Change their interface, potentially breaking this extension
- Rate limit or throttle automated actions
- Update their Terms of Service
- Restrict or suspend accounts using automation tools

We are not responsible for any account restrictions, data loss, or other issues that may arise from using this tool.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **GitHub Repository**: [https://github.com/eranbes/expunged](https://github.com/eranbes/expunged)
- **Issues & Bug Reports**: [GitHub Issues](https://github.com/eranbes/expunged/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/eranbes/expunged/discussions)
- **Latest Release**: [Download Here](https://github.com/eranbes/expunged/releases)

## 🌟 Support the Project

If Expunged helped you clean up your Facebook history, consider:
- ⭐ Starring the repository on GitHub
- 🐛 Reporting bugs or issues you find
- 💡 Suggesting new features
- 📢 Sharing with others who might need it

## 📧 Contact

Have questions or feedback? Open an issue on GitHub or reach out to the maintainers.

---

**Made with ❤️ for digital privacy**
