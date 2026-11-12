(async function() {
    if (document.getElementById('iw-modal')) return;
    
    // CHANGE THIS if you fork it to your own username/repo!
    const BASE_URL = 'https://raw.githack.com/hummingbird-tori/infinite-worlds-script-bookmarklet/main/src/';
    
    try {
        const { initWorkbench } = await import(BASE_URL + 'index.js?v=' + Date.now());
        initWorkbench();
    } catch (err) {
        alert('Failed to load Infinite Worlds Workbench: ' + err.message);
        console.error(err);
    }
})();
