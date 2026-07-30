# Domain Bookmark Organizer 🔖

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bilingual](https://img.shields.io/badge/Language-English%20%7C%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-green.svg)](#-bilingual-support)

A lightweight, privacy-focused Chrome Extension that automatically organizes your bookmarks by domain name inside any folder you choose.

---

## ✨ Features

- **Custom Folder Selection:** Choose any specific folder or sub-folder from your existing Chrome bookmarks tree via a dynamic dropdown menu.
- **Smart Domain Grouping:** Automatically extracts host domains (e.g., `github.com`, `google.com`) and creates neat sub-folders to group your links.
- **Remove Duplicate(s) Links:** Switch Toggle to remove duplicate(s) links in folder.
- **Bilingual Support (EN / AR):** Default English interface with a seamless toggle for Arabic (`RTL` layout, mirrored UI, and language preference saved locally).
- **100% Private & Local:** Runs completely within your browser. Zero remote servers, zero tracking, and no external data calls.
- **Built for Manifest V3:** fully compliant with modern Chrome Extension standards and security guidelines.

---

## 📁 Project Structure

```text
DomainBookmarkOrganizer/
├── manifest.json          # Extension config & permissions (Manifest V3)
├── popup.html             # Extension UI structure
├── popup.js               # Application logic, i18n switcher & bookmark handler
├── PRIVACY_POLICY.md      # Detailed privacy policy statement
├── icons/                 # Extension icons (16x16, 48x48, 128x128)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── store_assets/          # Screenshots prepared for Chrome Web Store
    ├── screenshot1_en.png
    └── screenshot2_ar.png

```

## 🚀 Installation & Local Testing

1.Clone or Download this repository:

```bash

git clone https://github.com/waeldief/DomainBookmarkOrganizer.git

```
2. Open Google Chrome and navigate to:
```text

chrome://extensions/

```
3. Enable Developer mode using the toggle switch in the top-right corner.
4. Click the Load unpacked button in the top-left corner.
5. Select the `DomainBookmarkOrganizer` root directory.

## 🛠️ How It Works
1. Click the extension icon in your Chrome toolbar.
2. Select your preferred language (English or العربية).
3. Pick the target folder you want to organize from the dropdown list.
4. Select (Switch) if you want to remove duplicate(s) links in folder.
4. Click Organize Selected Folder.
5. The extension reads the bookmarks in that folder, groups them by domain name, creates domain sub-folders, and moves the corresponding links inside.

## 🔒 Permissions Explained


| Permission | Purpose |
| :---       | :---      |
| bookmarks  | "Reads your folder hierarchy, creates new domain sub-folders, and moves your bookmarks upon your action."       |
| storage    | Saves your language preference (English or Arabic) locally on your browser.


## 📜 Privacy Policy
This extension does not collect, track, store, or transmit any user data, URLs, or personal information. All bookmark management tasks happen 100% locally on your machine. Read the full PRIVACY_POLICY.md for complete details.

## 👨‍💻 Author & Support
- **Developer / Author Name:** W.Dief @ MWM World Co
- **Developer Website:** https://www.mwmworld.com
- **Support Email:** support@mwmworld.com
- **Source Code / Repository:** https://github.com/waeldief/DomainBookmarkOrganizer

## 📄 License
This project is licensed under the [MIT License](https://mit-license.org/license.txt).
