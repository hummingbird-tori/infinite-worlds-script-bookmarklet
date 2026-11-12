(function() {
    if (document.getElementById('iw-sync-modal')) return;

    const REPO_API_URL = "https://api.github.com/repos/hummingbird-tori/infinite-worlds-script-bookmarklet/contents/script-jsons";

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
    d.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;max-height:85vh;background:#17161c;color:#f3f4f6;border:1px solid #3f3c4d;border-radius:10px;z-index:99999;font-family:sans-serif;display:flex;flex-direction:column;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    
    d.innerHTML = `
        <div style="padding:12px 16px;background:#1f1e26;border-bottom:1px solid #3f3c4d;display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;font-size:15px;color:#fff;">Infinite Worlds Cloud & File Sync</h3>
            <button id="iw-close" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer;">&times;</button>
        </div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:75vh;">
            
            <div style="background:#1f1e26;padding:10px 12px;border-radius:6px;border:1px solid #3f3c4d;display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;color:#818cf8;font-weight:600;">Discovered Presets from GitHub (/script jsons):</label>
                <div style="display:flex;gap:8px;">
                    <select id="iw-preset-select" style="background:#111015;color:#fff;border:1px solid #3f3c4d;border-radius:4px;padding:6px;font-size:12px;flex-grow:1;">
                        <option value="">-- Loading discovered presets... --</option>
                    </select>
                    <button id="iw-load-preset" style="background:#4f46e5;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Load Preset</button>
                </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;background:#1f1e26;padding:8px 12px;border-radius:6px;border:1px solid #3f3c4d;">
                <span style="font-size:12px;color:#d1d5db;"><b>Backup Current World:</b> Save active JSON to file</span>
                <button id="iw-download" style="background:#0284c7;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Download World .json</button>
            </div>
            
            <p style="margin:0;font-size:12px;color:#9ca3af;"><b>Step 1:</b> Upload a local file, pick a preset, or paste JSON below, then click <b>Extract Arrays</b>.</p>
            <textarea id="iw-box" style="width:100%;height:130px;background:#111015;color:#e5e7eb;border:1px solid #3f3c4d;border-radius:6px;padding:8px;font-family:monospace;font-size:11px;box-sizing:border-box;resize:vertical;" placeholder="Paste world JSON here, upload, or load preset..."></textarea>
            
            <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;">
                <input type="file" id="iw-file-input" accept=".json,application/json" style="display:none;">
                <button id="iw-upload-btn" style="background:#374151;color:#fff;border:1px solid #4b5563;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Upload .json File</button>
                <button id="iw-extract" style="background:#4f46e5;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Extract Arrays</button>
            </div>
            
            <hr style="border:0;border-top:1px solid #3f3c4d;margin:4px 0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;"><b>Step 2:</b> Select items to inject into your current active world.</p>
            <div id="iw-selection-container" style="background:#111015;border:1px solid #3f3c4d;border-radius:6px;padding:8px;max-height:180px;overflow-y:auto;font-size:12px;color:#d1d5db;"><em>No arrays extracted yet. Load or paste JSON and click Extract.</em></div>
            
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                <span id="iw-status" style="font-size:11px;color:#9ca3af;"></span>
                <button id="iw-inject-selected" style="background:#059669;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;opacity:0.5;" disabled>Inject Selected Items to World</button>
            </div>
        </div>
    `;
    document.body.appendChild(d);
    document.getElementById('iw-close').onclick = () => d.remove();

    const selectEl = document.getElementById('iw-preset-select');

    async function discoverPresets() {
        try {
            const response = await fetch(REPO_API_URL);
            if (!response.ok) throw new Error('Failed to fetch repo contents');
            const files = await response.json();
            
            selectEl.innerHTML = '<option value="">-- Select a discovered preset world --</option>';
            
            let count = 0;
            files.forEach(file => {
                if (file.type === 'file' && file.name.endsWith('.json')) {
                    const opt = document.createElement('option');
                    opt.value = file.download_url;
                    opt.textContent = file.name;
                    selectEl.appendChild(opt);
                    count++;
                }
            });

            if (count === 0) {
                selectEl.innerHTML = '<option value="">-- No .json files found in folder --</option>';
            }
        } catch (err) {
            selectEl.innerHTML = '<option value="">-- Error loading presets via API --</option>';
            console.error(err);
        }
    }
    discoverPresets();

    document.getElementById('iw-load-preset').onclick = async () => {
        const fileUrl = selectEl.value;
        if (!fileUrl) {
            alert('Please select a preset file from the dropdown first.');
            return;
        }
        try {
            document.getElementById('iw-status').textContent = 'Loading preset from GitHub...';
            const res = await fetch(fileUrl);
            if (!res.ok) throw new Error('Network response was not ok');
            const text = await res.text();
            document.getElementById('iw-box').value = text;
            document.getElementById('iw-status').textContent = 'Loaded preset successfully!';
            document.getElementById('iw-extract').click();
        } catch(err) {
            alert('Failed to load preset: ' + err.message);
            document.getElementById('iw-status').textContent = '';
        }
    };

    document.getElementById('iw-download').onclick = () => {
        const ta = getJsonBox();
        if (!ta || !ta.value.trim()) {
            alert('App JSON box is empty. Click "Refresh raw JSON" in the app first.');
            return;
        }
        try {
            const parsed = JSON.parse(ta.value);
            const safeTitle = (parsed.title || 'infinite_worlds_export').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
            const blob = new Blob([JSON.stringify(parsed, null, 4)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = safeTitle + '.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch(e) {
            alert('Failed to parse current world JSON: ' + e.message);
        }
    };

    const fileInput = document.getElementById('iw-file-input');
    document.getElementById('iw-upload-btn').onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('iw-box').value = ev.target.result;
            document.getElementById('iw-extract').click();
            fileInput.value = '';
        };
        reader.readAsText(file);
    };

    let extractedData = null;
    document.getElementById('iw-extract').onclick = () => {
        try {
            const val = document.getElementById('iw-box').value;
            if (!val.trim()) {
                alert('Please select a preset, upload a file, or paste JSON first.');
                return;
            }
            extractedData = JSON.parse(val);
            const container = document.getElementById('iw-selection-container');
            container.innerHTML = '';
            const arrays = ['instructionBlocks', 'triggerEvents', 'trackedItems'];
            let total = 0;
            
            arrays.forEach(arrKey => {
                if (Array.isArray(extractedData[arrKey]) && extractedData[arrKey].length > 0) {
                    const header = document.createElement('div');
                    header.style.cssText = 'font-weight:bold;color:#818cf8;margin-top:6px;margin-bottom:2px;font-size:12px;';
                    header.textContent = '--- ' + arrKey + ' (' + extractedData[arrKey].length + ') ---';
                    container.appendChild(header);
                    
                    extractedData[arrKey].forEach((item, idx) => {
                        total++;
                        const label = document.createElement('label');
                        label.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;cursor:pointer;font-size:11px;';
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.checked = true;
                        checkbox.dataset.arrayKey = arrKey;
                        checkbox.dataset.itemIndex = idx;
                        
                        const nameDisplay = item.name || item.variableName || ('Item #' + (idx + 1) + ' (' + (item.id || 'No ID') + ')');
                        
                        label.appendChild(checkbox);
                        const span = document.createElement('span');
                        span.textContent = '[' + arrKey + '] ' + nameDisplay;
                        label.appendChild(span);
                        container.appendChild(label);
                    });
                }
            });

            const injectBtn = document.getElementById('iw-inject-selected');
            if (total > 0) {
                injectBtn.removeAttribute('disabled');
                injectBtn.style.opacity = '1';
                document.getElementById('iw-status').textContent = 'Found ' + total + ' items ready for selection.';
            } else {
                container.innerHTML = '<em>No instructionBlocks, triggerEvents, or trackedItems found in this JSON.</em>';
                injectBtn.setAttribute('disabled', 'true');
                injectBtn.style.opacity = '0.5';
                document.getElementById('iw-status').textContent = '';
            }
        } catch(e) {
            alert('Invalid JSON: ' + e.message);
        }
    };

    document.getElementById('iw-inject-selected').onclick = () => {
        try {
            const ta = getJsonBox();
            const btn = getBtn('Import JSON to world');
            if (!ta || !btn) {
                alert('App JSON box or import button not found. Make sure you are on the JSON view tab and clicked "Refresh raw JSON".');
                return;
            }
            if (!ta.value.trim()) {
                alert('The app JSON box is empty. Click "Refresh raw JSON" in the app first so we have a base to inject into.');
                return;
            }
            const currentWorld = JSON.parse(ta.value);
            const checkboxes = document.querySelectorAll('#iw-selection-container input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                alert('No items selected!');
                return;
            }

            checkboxes.forEach(cb => {
                const arrKey = cb.dataset.arrayKey;
                const idx = cb.dataset.itemIndex;
                const newItem = extractedData[arrKey][idx];

                if (!Array.isArray(currentWorld[arrKey])) {
                    currentWorld[arrKey] = [];
                }

                const existingIdx = currentWorld[arrKey].findIndex(ex => 
                    (newItem.id && ex.id === newItem.id) || 
                    (newItem.name && ex.name === newItem.name) || 
                    (newItem.variableName && ex.variableName === newItem.variableName)
                );

                if (existingIdx >= 0) {
                    currentWorld[arrKey][existingIdx] = newItem;
                } else {
                    currentWorld[arrKey].push(newItem);
                }
            });

            ta.value = JSON.stringify(currentWorld, null, 4);
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            ta.dispatchEvent(new Event('change', { bubbles: true }));
            btn.click();
            alert('Selected items successfully injected and imported into your active world!');
        } catch(e) {
            alert('Injection Error: ' + e.message);
        }
    };
})();
