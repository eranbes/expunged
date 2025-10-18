<div align="center">
  <img src="logo.png" alt="Expunged Logo" width="200"/>

  # Expunged - Facebook Activity Cleaner Chrome Extension

  **Clear your Facebook record by automatically deleting comments and reactions from your past.**
</div>

Expunged is a free, open-source Chrome extension that helps you bulk delete Facebook comments and reactions quickly and easily. Take control of your digital footprint and clean up your social media history with just a few clicks.

## 🎯 Key Features

- ✅ **Bulk Delete Facebook Comments** - Remove all your comments automatically
- ✅ **Bulk Delete Facebook Reactions** - Unlike posts and remove reactions in bulk
- ✅ **Smart Filtering** - Option to keep comments on your own posts
- ✅ **Real-Time Progress** - Watch the deletion counter update live
- ✅ **Privacy-First** - All processing happens locally in your browser
- ✅ **No Data Collection** - Zero tracking, zero analytics, completely private
- ✅ **Easy Two-Step Process** - Navigate and delete with simple clicks
- ✅ **Works on Any Profile** - Automatically detects your logged-in account

## 🚀 Why Use Expunged?

### Clean Up Your Digital Past
Remove embarrassing comments, old reactions, and unwanted social media history from Facebook. Perfect for:
- Job seekers cleaning up their online presence
- Anyone concerned about digital privacy
- Users wanting to start fresh on Facebook
- People managing their online reputation

### Save Time
Instead of manually clicking through hundreds or thousands of Facebook comments and reactions, Expunged automates the entire process. What would take hours or days is done in minutes.

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

### Step 1: Navigate to Activity Page
1. Click the Expunged extension icon in Chrome
2. Choose either:
   - **Go to Comments Page** - To delete your comments
   - **Go to Reactions Page** - To delete your likes/reactions
3. Wait for Facebook to load the activity page

### Step 2: Start Deletion
1. *(Optional)* Check "Don't delete comments on my own posts" to preserve those
2. Click **Start Deleting**
3. Keep the tab open and watch the real-time counter
4. Wait for completion notification

### Tips for Best Results
- Keep the Facebook tab **active and visible** during deletion
- Don't click on the page or switch tabs while it's running
- For large histories, the process may take 10-30 minutes
- You can stop early by opening Console (F12) and typing `window.stopDeleting = true`

## 🔒 Privacy & Security

### Your Data is Safe
- **No server communication** - Everything runs locally in your browser
- **No API keys required** - Works directly with Facebook's interface
- **No tracking or analytics** - We don't collect any data about you
- **Open source** - Review the code yourself for transparency

### Facebook Terms of Service
This extension automates clicking through Facebook's user interface. While it respects Facebook's functionality, automated actions may be subject to rate limiting. Use responsibly and at your own discretion.

## ⚙️ Technical Details

### How It Works
Expunged uses Chrome's scripting API to:
1. Navigate to your Facebook activity log
2. Identify comment and reaction items
3. Click the "More options" menu for each item
4. Select "Delete" or "Unlike" option
5. Confirm deletion when prompted
6. Scroll to load more items
7. Repeat until all items are processed

### Smart Detection
- Filters out Messenger items to avoid accidental deletions
- Identifies comments on your own posts (when option enabled)
- Handles both immediate deletions and confirmation dialogs
- Includes delays to prevent Facebook rate limiting

### Built With
- Manifest V3 (latest Chrome extension standard)
- Vanilla JavaScript (no external dependencies)
- Chrome Extensions API
- Local storage for state persistence

## 🛠️ Troubleshooting

### Extension Won't Load
- Ensure Developer mode is enabled in `chrome://extensions/`
- Verify all files (especially icons) are in the folder
- Try reloading the extension

### Nothing Happens When I Click "Start Deleting"
- Make sure you're on the correct Facebook activity page
- Check that the green checkmark appears showing you're on the right page
- Reload the extension: go to `chrome://extensions/` and click reload

### Deletion Stopped Working
- Facebook may have rate-limited you - wait 15-30 minutes and try again
- Refresh the Facebook page and restart the process
- Check your internet connection

### Wrong Items Being Deleted
- Verify you're on the correct activity page (Comments or Reactions)
- If using "exclude own posts" option, ensure it's checked before starting

## 🤝 Contributing

Contributions are welcome! This is an open-source project.

### To Contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Version History

### Version 1.0.0 (Current)
- ✅ Generic profile support (works for any logged-in user)
- ✅ Option to exclude comments on own posts
- ✅ Real-time deletion counter with state persistence
- ✅ Visual indicators for current page status
- ✅ Two-step navigation process
- ✅ No console logging for cleaner operation
- ✅ Improved error handling and user feedback

## ⚠️ Disclaimer

**Use at your own risk.** This extension permanently deletes Facebook content. There is no undo function. Always ensure you want to delete items before starting the process.

Facebook may:
- Change their interface, potentially breaking this extension
- Rate limit or throttle automated actions
- Update their Terms of Service

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
