# Infinite Worlds Cloud & File Sync Bookmarklet

A lightweight, injection-powered bookmarklet tool designed for **Infinite Worlds** to easily backup world JSON files, discover and load community preset worlds straight from GitHub, and selectively merge data (like `instructionBlocks`, `triggerEvents`, and `trackedItems`) between worlds.

---

## 🚀 Installation

To install the bookmarklet in your browser:

1. Create a **New Bookmark** in your browser's bookmarks bar.
2. Name it something recognizable (e.g., `IW Cloud Sync`).
3. Paste the following snippet into the **URL / Address** field:

```javascript
javascript:(function(){const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/hummingbird-tori/infinite-worlds-script-bookmarklet@main/loader.js?t='+Date.now();document.head.appendChild(s);})();

```

---

## 📖 How to Use

Once installed, follow these steps inside your Infinite Worlds session:

1. **Open Your World:** Navigate to the world you want to modify or backup.
2. **Access the JSON View:** Unhide and refresh the raw JSON object view inside the app (click **"Refresh raw JSON"** so the tool can detect your active world's data container).
3. **Trigger the Tool:** Click your saved **IW Cloud Sync** bookmark from your bookmarks bar. A management modal will pop up.
4. **Choose a Source:**
* Pick a preset world directly from the automated GitHub dropdown folder, **OR**
* Upload a local `.json` world file, **OR**
* Paste JSON manually into the text area.


5. **Inspect & Extract:** Click **"Extract Arrays"** to parse the file. The tool will scan for compatible structures (`instructionBlocks`, `triggerEvents`, and `trackedItems`).
6. **Select & Inject:** Check the items you want to bring over, then click **"Inject Selected Items to World"** to seamlessly merge them into your active world.

---
