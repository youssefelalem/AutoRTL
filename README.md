# 🌍 Smart RTL for AI & Web (Chrome Extension)

![Version](https://img.shields.io/badge/version-2.0.0-blue) ![Status](https://img.shields.io/badge/status-stable-green) ![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Brave-orange)

A lightweight, privacy-focused browser extension designed to fix Arabic text alignment (RTL) issues on AI platforms like **Google Gemini, ChatGPT, and Claude**, without breaking code blocks or UI layouts.

## 🚀 The Problem
Most AI interfaces default to Left-to-Right (LTR) alignment. When typing in Arabic (or Hebrew/Persian), this causes:
- Punctuation marks (`.`, `?`, `:`) to appear on the wrong side.
- Bullet points and numbered lists to break or misalign.
- Mixed content (English words inside Arabic sentences) to look scrambled.

## 🛠️ The Solution
**Smart RTL** automatically detects Arabic content and forces Right-to-Left direction **only** on text paragraphs, while smart filters ensure that:
1.  **Code Blocks remain untouched** (Left-aligned) for readability.
2.  **UI Elements** (menus, buttons) are not affected.
3.  **Numbered Lists** are formatted correctly with proper margins.

## ✨ Features
- 🧠 **Smart Detection:** Uses Regex to detect Arabic characters dynamically.
- 🛡️ **Code Safety:** Automatically ignores `<pre>`, `<code>`, and syntax-highlighted blocks.
- ⚡ **Real-time Observer:** Works seamlessly with streaming AI responses (text that appears gradually).
- 🎚️ **Toggle Switch:** Includes a popup menu to Enable/Disable the extension instantly without refreshing.
- 💾 **Persistence:** Remembers your preference (On/Off) locally.

## 📦 Installation (Developer Mode)
Since this extension is open-source and currently not on the Chrome Web Store, you can install it manually:

1.  Clone this repository or download the **ZIP** file.
2.  Open your browser (Chrome, Edge, or Brave).
3.  Navigate to `chrome://extensions`.
4.  Enable **Developer Mode** (toggle in the top right corner).
5.  Click **Load Unpacked**.
6.  Select the folder containing these files.
7.  Done! 🎉

## 🔧 Technical Details
- **Manifest V3:** Compliant with the latest Google Chrome extension standards.
- **MutationObserver:** Used to monitor DOM changes efficiently (zero performance lag).
- **Local Storage:** Saves user preferences securely.

## 📂 Project Structure
├── manifest.json # Extension configuration
├── content.js # The core logic script
├── popup.html # The UI for the toggle switch
├── popup.js # Logic for the popup UI
├── icon.png # Extension icon
└── README.md # Documentation
## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Developed with ❤️ by Youssef El Alem*