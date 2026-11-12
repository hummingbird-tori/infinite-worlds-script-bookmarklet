(function() {
    if (document.getElementById('iw-modal')) return;

    // --- 1. CONFIG & VERSION ---
    const SCRIPT_CONFIG = {
        VERSION: "v3.2 (Single-File Modular)",
        REPO_API_URL: "https://api.github.com/repos/hummingbird-tori/infinite-worlds-script-bookmarklet/contents/script-jsons"
    };

    // --- 2. DOM UTILITIES (from src/utils/dom.js) ---
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
            if (ta.clientHeight > 200 || (ta.value && (ta.value.includes('possibleCharacters') || ta.value.includes('descriptionRequest')))) return ta;
        }
        return document.querySelector('textarea.anvil-text-area');
    }

    function getActiveWorldJson() {
        const ta = getJsonBox();
        if (!ta || !ta.value.trim()) return null;
        try {
            return JSON.parse(ta.value);
        } catch(e) {
            return null;
        }
    }

    // --- 3. CLOUD SYNC TAB (from src/tabs/syncTab.js) ---
    function renderSyncTab(container) {
        container.innerHTML = `
            <div style="background:#1f1e26;padding:10px 12px;border-radius:6px;border:1px solid #3f3c4d;display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;color:#818cf8;font-weight:600;">Discovered Presets from GitHub (/script-jsons):</label>
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
            
            <p style="margin:0;font-size:12px;color:#9ca3af;"><b>Step 1:</b> Upload a local file, pick a preset, or paste JSON below, then click <b>Extract Data</b>.</p>
            <textarea id="iw-box" style="width:100%;height:110px;background:#111015;color:#e5e7eb;border:1px solid #3f3c4d;border-radius:6px;padding:8px;font-family:monospace;font-size:11px;box-sizing:border-box;resize:vertical;" placeholder="Paste world JSON here, upload, or load preset..."></textarea>
            
            <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;">
                <input type="file" id="iw-file-input" accept=".json,application/json" style="display:none;">
                <button id="iw-upload-btn" style="background:#374151;color:#fff;border:1px solid #4b5563;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Upload .json File</button>
                <button id="iw-extract" style="background:#4f46e5;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Extract Data</button>
            </div>
            
            <hr style="border:0;border-top:1px solid #3f3c4d;margin:2px 0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;"><b>Step 2:</b> Select items to inject. Conflicts are automatically unchecked.</p>
            <div id="iw-selection-container" style="background:#111015;border:1px solid #3f3c4d;border-radius:6px;padding:8px;max-height:160px;overflow-y:auto;font-size:12px;color:#d1d5db;"><em>No data extracted yet. Load or paste JSON and click Extract.</em></div>
            
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
                <span id="iw-status" style="font-size:11px;color:#9ca3af;"></span>
                <button id="iw-inject-selected" style="background:#059669;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;opacity:0.5;" disabled>Inject Selected Items to World</button>
            </div>
        `;

        const selectEl = container.querySelector('#iw-preset-select');

        async function discoverPresets() {
            try {
                const response = await fetch(SCRIPT_CONFIG.REPO_API_URL);
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
                if (count === 0) selectEl.innerHTML = '<option value="">-- No .json files found --</option>';
            } catch (err) {
                selectEl.innerHTML = '<option value="">-- Error loading presets --</option>';
            }
        }
        discoverPresets();

        container.querySelector('#iw-load-preset').onclick = async () => {
            const fileUrl = selectEl.value;
            if (!fileUrl) return alert('Please select a preset file first.');
            try {
                container.querySelector('#iw-status').textContent = 'Loading preset...';
                const res = await fetch(fileUrl);
                const text = await res.text();
                container.querySelector('#iw-box').value = text;
                container.querySelector('#iw-status').textContent = 'Loaded preset successfully!';
                container.querySelector('#iw-extract').click();
            } catch(err) {
                alert('Failed to load preset: ' + err.message);
            }
        };

        container.querySelector('#iw-download').onclick = () => {
            const ta = getJsonBox();
            if (!ta || !ta.value.trim()) return alert('App JSON box is empty. Click "Refresh raw JSON" first.');
            try {
                const parsed = JSON.parse(ta.value);
                const safeTitle = (parsed.title || 'infinite_worlds_export').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const blob = new Blob([JSON.stringify(parsed, null, 4)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = safeTitle + '.json';
                document.body.appendChild(a); a.click(); a.remove();
                URL.revokeObjectURL(url);
            } catch(e) {
                alert('Failed to parse current world JSON: ' + e.message);
            }
        };

        const fileInput = container.querySelector('#iw-file-input');
        container.querySelector('#iw-upload-btn').onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                container.querySelector('#iw-box').value = ev.target.result;
                container.querySelector('#iw-extract').click();
                fileInput.value = '';
            };
            reader.readAsText(file);
        };

        let extractedData = null;
        container.querySelector('#iw-extract').onclick = () => {
            try {
                const val = container.querySelector('#iw-box').value;
                if (!val.trim()) return alert('Paste JSON or load a preset first.');
                extractedData = JSON.parse(val);
                const currentWorld = getActiveWorldJson();
                const selContainer = container.querySelector('#iw-selection-container');
                selContainer.innerHTML = '';
                
                let total = 0, conflictCount = 0;

                function isDuplicateItem(arrKey, item) {
                    if (!currentWorld || !currentWorld[arrKey] || !Array.isArray(currentWorld[arrKey])) return false;
                    if (typeof item === 'string') return currentWorld[arrKey].includes(item);
                    return currentWorld[arrKey].some(ex => {
                        if (!ex || typeof ex !== 'object') return false;
                        return (
                            (item.id && ex.id === item.id) ||
                            (item.characterId && ex.characterId === item.characterId) ||
                            (item.name && ex.name === item.name) ||
                            (item.variableName && ex.variableName === item.variableName) ||
                            (item.title && ex.title === item.title)
                        );
                    });
                }

                function isDuplicateSpecialist(fieldKey) {
                    if (!currentWorld) return false;
                    return currentWorld[fieldKey] !== undefined && currentWorld[fieldKey] !== null && currentWorld[fieldKey] !== '';
                }

                function createHeader(title, color, secClass) {
                    const header = document.createElement('div');
                    header.style.cssText = `display:flex;justify-content:space-between;align-items:center;font-weight:bold;color:${color};margin-top:8px;margin-bottom:2px;font-size:12px;border-bottom:1px solid #2d2a38;padding-bottom:2px;`;
                    
                    const titleSpan = document.createElement('span');
                    titleSpan.textContent = title;
                    
                    const actions = document.createElement('div');
                    actions.style.cssText = 'display:flex;gap:6px;font-size:10px;font-weight:normal;';
                    
                    const selAll = document.createElement('a');
                    selAll.href = '#'; selAll.style.cssText = 'color:#818cf8;text-decoration:none;'; selAll.textContent = 'Select All';
                    selAll.onclick = (ev) => { ev.preventDefault(); selContainer.querySelectorAll('.' + secClass).forEach(cb => cb.checked = true); };
                    
                    const deselAll = document.createElement('a');
                    deselAll.href = '#'; deselAll.style.cssText = 'color:#9ca3af;text-decoration:none;'; deselAll.textContent = 'Deselect All';
                    deselAll.onclick = (ev) => { ev.preventDefault(); selContainer.querySelectorAll('.' + secClass).forEach(cb => cb.checked = false); };
                    
                    actions.appendChild(selAll); actions.appendChild(document.createTextNode('|')); actions.appendChild(deselAll);
                    header.appendChild(titleSpan); header.appendChild(actions);
                    selContainer.appendChild(header);
                }

                const specialistKeys = ['descriptionRequest', 'evaluationRequest', 'summaryRequest', 'videoPromptInstructions'];
                const availableSpecialists = specialistKeys.filter(k => extractedData[k] !== undefined && extractedData[k] !== null && extractedData[k] !== '');
                if (availableSpecialists.length > 0) {
                    createHeader('--- Specialist Instructions (' + availableSpecialists.length + ') ---', '#f59e0b', 'sec-specialist');
                    availableSpecialists.forEach(key => {
                        total++;
                        const isDup = isDuplicateSpecialist(key);
                        if (isDup) conflictCount++;

                        const label = document.createElement('label');
                        label.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;cursor:pointer;font-size:11px;';
                        const cb = document.createElement('input');
                        cb.type = 'checkbox'; cb.className = 'sec-specialist'; cb.checked = !isDup;
                        cb.dataset.type = 'specialist'; cb.dataset.fieldKey = key;
                        
                        label.appendChild(cb);
                        const span = document.createElement('span');
                        span.innerHTML = '[Specialist] ' + key + (isDup ? ' <span style="color:#f59e0b;font-weight:bold;">[CONFLICT]</span>' : '');
                        label.appendChild(span);
                        selContainer.appendChild(label);
                    });
                }

                const arrays = ['skills', 'possibleCharacters', 'NPCs', 'loreBookEntries', 'instructionBlocks', 'triggerEvents', 'trackedItems'];
                arrays.forEach(arrKey => {
                    if (Array.isArray(extractedData[arrKey]) && extractedData[arrKey].length > 0) {
                        const secClass = 'sec-' + arrKey;
                        createHeader('--- ' + arrKey + ' (' + extractedData[arrKey].length + ') ---', '#818cf8', secClass);
                        extractedData[arrKey].forEach((item, idx) => {
                            total++;
                            const isDup = isDuplicateItem(arrKey, item);
                            if (isDup) conflictCount++;

                            const label = document.createElement('label');
                            label.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;cursor:pointer;font-size:11px;';
                            const cb = document.createElement('input');
                            cb.type = 'checkbox'; cb.className = secClass; cb.checked = !isDup;
                            cb.dataset.type = 'array'; cb.dataset.arrayKey = arrKey; cb.dataset.itemIndex = idx;
                            
                            const nameDisplay = typeof item === 'string' ? item : (item.name || item.variableName || item.title || ('Item #' + (idx + 1)));
                            label.appendChild(cb);
                            const span = document.createElement('span');
                            span.innerHTML = '[' + arrKey + '] ' + nameDisplay + (isDup ? ' <span style="color:#f59e0b;font-weight:bold;">[CONFLICT]</span>' : '');
                            label.appendChild(span);
                            selContainer.appendChild(label);
                        });
                    }
                });

                const injectBtn = container.querySelector('#iw-inject-selected');
                if (total > 0) {
                    injectBtn.removeAttribute('disabled'); injectBtn.style.opacity = '1';
                    container.querySelector('#iw-status').textContent = `Found ${total} items. (${conflictCount} conflict(s) auto-unchecked)`;
                } else {
                    selContainer.innerHTML = '<em>No supported items found.</em>';
                    injectBtn.setAttribute('disabled', 'true'); injectBtn.style.opacity = '0.5';
                }
            } catch(e) {
                alert('Invalid JSON: ' + e.message);
            }
        };

        container.querySelector('#iw-inject-selected').onclick = () => {
            try {
                const ta = getJsonBox();
                const btn = getBtn('Import JSON to world');
                if (!ta || !btn) return alert('App JSON box or import button not found.');
                const currentWorld = JSON.parse(ta.value);
                const checkboxes = container.querySelectorAll('#iw-selection-container input[type="checkbox"]:checked');
                if (checkboxes.length === 0) return alert('No items selected.');

                checkboxes.forEach(cb => {
                    const type = cb.dataset.type;
                    if (type === 'specialist') {
                        const fieldKey = cb.dataset.fieldKey;
                        if (extractedData[fieldKey] !== undefined) currentWorld[fieldKey] = extractedData[fieldKey];
                    } else if (type === 'array') {
                        const arrKey = cb.dataset.arrayKey;
                        const idx = cb.dataset.itemIndex;
                        const newItem = extractedData[arrKey][idx];

                        if (!Array.isArray(currentWorld[arrKey])) currentWorld[arrKey] = [];
                        if (typeof newItem === '
