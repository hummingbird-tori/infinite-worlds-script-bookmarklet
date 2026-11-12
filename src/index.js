import { getJsonBox } from './utils/dom.js';

const SCRIPT_VERSION = "v3.0 (Modular)";

export function initWorkbench(baseUrl) {
    if (document.getElementById('iw-modal')) return;

    // --- Build UI Shell ---
    const modal = document.createElement('div');
    modal.id = 'iw-modal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:760px;max-height:85vh;background:#17161c;color:#f3f4f6;border:1px solid #3f3c4d;border-radius:10px;z-index:99999;font-family:sans-serif;display:flex;flex-direction:column;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    
    modal.innerHTML = `
        <div style="padding:12px 16px;background:#1f1e26;border-bottom:1px solid #3f3c4d;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:12px;">
                <h3 style="margin:0;font-size:15px;color:#fff;">Infinite Worlds Workbench</h3>
                <div style="display:flex;gap:4px;background:#111015;padding:2px;border-radius:6px;border:1px solid #3f3c4d;">
                    <button id="iw-tab-sync-btn" style="background:#4f46e5;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Cloud Sync</button>
                    <button id="iw-tab-editor-btn" style="background:transparent;color:#9ca3af;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">JSON Workbench</button>
                </div>
                <span style="background:#374151;color:#9ca3af;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">${SCRIPT_VERSION}</span>
            </div>
            <button id="iw-close" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer;">&times;</button>
        </div>
        <div id="iw-tab-content" style="padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:75vh;flex-grow:1;"></div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#iw-close').onclick = () => modal.remove();

    const contentArea = modal.querySelector('#iw-tab-content');
    const syncBtn = modal.querySelector('#iw-tab-sync-btn');
    const editorBtn = modal.querySelector('#iw-tab-editor-btn');

    async function switchTab(tabName) {
        contentArea.innerHTML = '<div style="color:#9ca3af;text-align:center;padding:20px;">Loading tab...</div>';
        
        if (tabName === 'sync') {
            syncBtn.style.background = '#4f46e5';
            syncBtn.style.color = '#fff';
            editorBtn.style.background = 'transparent';
            editorBtn.style.color = '#9ca3af';
            
            const { renderSyncTab } = await import('./tabs/syncTab.js');
            renderSyncTab(contentArea);
        } else if (tabName === 'editor') {
            editorBtn.style.background = '#4f46e5';
            editorBtn.style.color = '#fff';
            syncBtn.style.background = 'transparent';
            syncBtn.style.color = '#9ca3af';
            
            const { renderEditorTab } = await import('./tabs/editorTab.js');
            renderEditorTab(contentArea);
        }
    }

    syncBtn.onclick = () => switchTab('sync');
    editorBtn.onclick = () => switchTab('editor');

    // Default load Cloud Sync tab
    switchTab('sync');
}