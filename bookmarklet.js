javascript:(async function() {
    if (document.getElementById('iw-modal')) return;
    
    // CHANGE THIS to your actual GitHub username, repo name, and branch!
    const BASE_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/src/';
    
    try {
        const { initWorkbench } = await import(BASE_URL + 'index.js?v=' + Date.now());
        initWorkbench(BASE_URL);
    } catch (err) {
        alert('Failed to load Infinite Worlds Workbench: ' + err.message);
        console.error(err);
    }
})();