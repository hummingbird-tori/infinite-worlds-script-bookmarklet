(function() {
    if (document.getElementById('iw-sync-modal')) return;

    const REPO_API_URL = "https://api.github.com/repos/hummingbird-tori/infinite-worlds-script-bookmarklet/contents/script%20jsons";
    const SCRIPT_VERSION = "v2.3 (Updated: Nov 2026)"; // <-- Version badge for instant verification

    // --- App Helpers ---
    function getBtn(t) {
        for (let b of document.querySelectorAll('button')) {
            if (b.textContent && b.textContent.includes(t)) return b;
        }
        return null;
    }

    function getJsonBox() {
        const btn = getBtn('Refresh raw JSON');
        if (btn) {
            let p = btn.parentElement;
            while (p && p !== document.body) {
                const ta = p.querySelector('textarea.anvil-text-area');
                if (ta) return ta;
                p = p.parentElement;
            }
        }
        for (let ta of document.querySelectorAll('textarea.anvil-text-area')) {
            if (ta.clientHeight > 200 || (ta.value && ta.value.includes('possibleCharacters'))) return ta;
        }
        return document.querySelector('textarea.anvil-text-area');
    }

    // --- Build UI ---
    const d = document.createElement('div');
    d.id = 'iw-sync-modal';
    d.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:720px;max-height:85vh;background:#17161c;color:#f3f4f6;border:1px solid #3f3c4d;border-radius:10px;z-index:99999;font-family:sans-serif;display:flex;flex-direction:column;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    
    d.innerHTML = `
        <div style="padding:12px 16px;background:#1f1e26;border-bottom:1px solid #3f3c4d;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <h3 style="margin:0;font-size:15px;color:#fff;">Infinite Worlds Cloud & File Sync</h3>
                <span id="iw-version-badge" style="background:#374151;color:#9ca3af;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;" title="Active script version running in browser">${SCRIPT_VERSION}</span>
            </div>
            <button id="iw-close" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer;">&times;</button>
        </div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:75vh;">
            
            <div style="background:#1f1e26;padding:10px 12px;border-radius:6px;border:1px solid #3f3c4d;display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;color:#818cf8;font-weight:600;">Discovered Presets from GitHub (/script jsons):</label>
                <div style="display:flex;gap:8px;">
                    <select id="iw-preset-select" style="background:#111015;color:#fff;border:1px solid #3f3c4d;border-radius:4px;padding:6px;font-size:12px;flex-grow:1;">
                        <option value="">-- Loading discovered presets... --</option>
                    </select>
                    <button id="iw-load-preset" style="background
