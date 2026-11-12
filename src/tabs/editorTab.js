import { getBtn, getJsonBox, getActiveWorldJson } from '../utils/dom.js';

export function renderEditorTab(container) {
    container.innerHTML = `
        <div style="background:#1f1e26;padding:12px;border-radius:6px;border:1px solid #3f3c4d;display:flex;flex-direction:column;gap:8px;">
            <h4 style="margin:0;color:#818cf8;font-size:13px;">Direct JSON Workbench & Reorder</h4>
            <p style="margin:0;font-size:11px;color:#9ca3af;">Inspect and reorder active world elements directly or push custom JSON objects.</p>
            
            <div style="display:flex;gap:8px;">
                <button id="iw-edit-refresh" style="background:#4f46e5;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Load Active World Data</button>
            </div>
        </div>
        
        <div id="iw-editor-output" style="background:#111015;border:1px solid #3f3c4d;border-radius:6px;padding:8px;max-height:220px;overflow-y:auto;font-size:11px;color:#d1d5db;">
            <em>Click "Load Active World Data" to inspect arrays and reorder items.</em>
        </div>
    `;

    container.querySelector('#iw-edit-refresh').onclick = () => {
        const world = getActiveWorldJson();
        const out = container.querySelector('#iw-editor-output');
        if (!world) {
            out.innerHTML = '<span style="color:#ef4444;">Could not read active world JSON. Make sure you refreshed raw JSON in the app.</span>';
            return;
        }

        out.innerHTML = '';
        
        // List arrays available for management
        Object.keys(world).forEach(key => {
            if (Array.isArray(world[key])) {
                const section = document.createElement('div');
                section.style.cssText = 'margin-bottom:8px;padding:6px;background:#17161c;border-radius:4px;border:1px solid #2d2a38;';
                
                const title = document.createElement('div');
                title.style.cssText = 'font-weight:bold;color:#f59e0b;font-size:11px;margin-bottom:4px;';
                title.textContent = `${key} (${world[key].length} items)`;
                section.appendChild(title);

                world[key].forEach((item, idx) => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:2px 0;font-size:10px;border-bottom:1px solid #222;';
                    
                    const name = typeof item === 'string' ? item : (item.name || item.title || item.variableName || `Index ${idx}`);
                    const span = document.createElement('span');
                    span.textContent = `${idx + 1}. ${name}`;
                    
                    row.appendChild(span);
                    section.appendChild(row);
                });

                out.appendChild(section);
            }
        });
    };
}