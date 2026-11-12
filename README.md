# Infinite Worlds Cloud & File Sync Bookmarklet

A lightweight, auto-updating bookmarklet tool designed for **Infinite Worlds** to easily backup world JSON files, discover and load preset worlds straight from GitHub, and selectively merge data (such as 'Specialist Instructions' `instructionBlocks`, `triggerEvents`, and `trackedItems`) between worlds.

---

## Installation

1. Create a **New Bookmark** in your browser's bookmarks bar.

2. Name it something recognizable (e.g., `IW Cloud Sync`).
3. Paste the following snippet into the **URL / Address** field:

```javascript
javascript:(function(){const s=document.createElement('script');s.src='https://raw.githack.com/hummingbird-tori/infinite-worlds-script-bookmarklet/main/loader.js';document.head.appendChild(s);})();

```

*(Because this points to `raw.githack.com`, any updates pushed to the repository automatically load the next time you click the bookmark—no manual reinstalling required.)*

---

## How to Use

1. **Open Your World:** Navigate to the world you want to modify or backup.

2. **Access the JSON View:** Unhide and refresh the raw JSON object view inside the app (click **Refresh raw JSON** so the tool can detect your active world's data container).
3. **Trigger the Tool:** Click your saved **IW Cloud Sync** bookmark from your bookmarks bar to open the management modal.
4. **Choose a Source:**
- Pick a preset world directly from the automated GitHub dropdown folder (`/script-jsons`),

- Upload a local `.json` world file, or

- Paste JSON manually into the text area.



5. **Inspect & Extract:** Click **Extract Arrays** to parse the file. The tool scans for 'specialist instructions',`instructionBlocks`, `triggerEvents`, and `trackedItems`.
6. **Select & Inject:** Check the items you want to bring over, then click **Inject Selected Items to World** to merge them into your active world.

---

## Forking & Customizing

Want to host your own library of preset worlds and scripts? Feel free to fork this repository:

1. **Fork this repo** to your own GitHub account.

2. Open `loader.js` and update the `REPO_API_URL` constant on line 4 to point to your GitHub username and repository:

```javascript
const REPO_API_URL = "https://api.github.com/repos/YOUR-USERNAME/YOUR-REPO-NAME/contents/script-jsons";

```

3. Add your own `.json` world files into the `/script-jsons` folder.
4. Update the bookmarklet URL to reference your GitHub username and repository path via `raw.githack.com`.
