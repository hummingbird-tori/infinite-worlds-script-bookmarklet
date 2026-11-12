# Infinite Worlds Cloud & File Sync Workbench

A lightweight, auto-updating multi-tab bookmarklet tool designed for **Infinite Worlds** to easily backup world JSON files, discover and load preset worlds straight from GitHub, selectively merge data (such as Specialist Instructions, `instructionBlocks`, `triggerEvents`, and `trackedItems`), and directly manage, reorder, expand, and insert JSON array entries using the built-in JSON Workbench tab.

---

## Installation

1. Create a **New Bookmark** in your browser's bookmarks bar.
2. Name it something recognizable (e.g., `IW Workbench`).
3. Paste the following snippet into the **URL / Address** field:

```javascript
javascript:(function(){const s=document.createElement('script');s.src='[https://raw.githack.com/hummingbird-tori/infinite-worlds-script-bookmarklet/main/loader.js';document.head.appendChild(s](https://raw.githack.com/hummingbird-tori/infinite-worlds-script-bookmarklet/main/loader.js';document.head.appendChild(s));})();

```

*(Because this points to `raw.githack.com`, updates pushed to the repository automatically load the next time you click the bookmark—no manual reinstalling required.)*

---

## How to Use & Setup

1. **Open Your World:** Open your world in the **Infinite Worlds World Editor**.
2. **Enable Raw JSON:**
* Check **"Shop optional features"**.
* Click **"Misc advanced features (experimental)"**.
* Select **"Show Raw Json"** and click **"Refresh raw JSON"** so the tool can detect your active world's data container.


3. **Trigger the Tool:** Click your saved bookmark from your bookmarks bar to open the management modal.

### Tab 1: Cloud Sync

1. **Choose a Source:**
* Pick a preset world directly from the automated GitHub dropdown folder (`/script-jsons`),
* Upload a local `.json` world file, or
* Paste JSON manually into the text area.


2. **Inspect & Extract:** Click **Extract Data** to parse the file. The tool scans for Specialist Instructions, `instructionBlocks`, `triggerEvents`, and `trackedItems` while automatically detecting and flagging conflicts/duplicates.
3. **Select & Inject:** Use the section **Select All / Deselect All** toggles or check individual items you want to bring over, then click **Inject Selected Items to World** to merge them into your active world (automatically ensuring `enableAISpecificInstructionBlocks: true` is set).
4. **Backup World:** Easily download a clean `.json` backup of your active world at any time.

### Tab 2: JSON Workbench

1. Click **Load Arrays** to pull your world's active merge arrays (`skills`, `instructionBlocks`, `trackedItems`, etc.).
2. **Expand & Edit Raw JSON:** Click any entry in an array to expand its raw JSON inspector with live syntax checking, beautify/minify formatting, edit fields directly, and click **Apply Changes**.
3. **Reorder Positions:** Type a new target position number into any item's **Pos:** input field to instantly shift its order.
4. **Insert New Objects:** Click **+ Add New** on any array section, specify the insertion position, paste a raw JSON object with live validation, and click **Insert Object**.
5. **Save Changes:** Review your staged modifications and click **Save & Import Changes** to push them back to your world.

---

## Forking & Customizing

Want to host your own library of preset worlds and scripts? Feel free to fork this repository:

1. **Fork this repo** to your own GitHub account.
2. Open `loader.js` and update the `REPO_API_URL` constant near the top of the file to point to your GitHub username and repository:

```javascript
const REPO_API_URL = "[https://api.github.com/repos/YOUR-USERNAME/YOUR-REPO-NAME/contents/script-jsons](https://api.github.com/repos/YOUR-USERNAME/YOUR-REPO-NAME/contents/script-jsons)";

```

3. Add your own `.json` world files into the `/script-jsons` folder.
4. **Update your bookmarklet URL** to point to your new repository by replacing the username and repository name in your browser bookmark:

```javascript
javascript:(function(){const s=document.createElement('script');s.src='[https://raw.githack.com/YOUR-USERNAME/YOUR-REPO-NAME/main/loader.js';document.head.appendChild(s](https://raw.githack.com/YOUR-USERNAME/YOUR-REPO-NAME/main/loader.js';document.head.appendChild(s));})();

```

> **Note on Update Propagation:** Due to CDN caching behavior via `raw.githack.com`, updates pushed to your repository may not always appear instantaneously. While the exact propagation timing can vary, updates have been observed to populate straight to the active bookmark without requiring a page refresh once the cache clears or fetches successfully.
