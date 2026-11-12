(function() {
    if (document.getElementById('iw-modal')) return;

    // --- CONFIGURATION & VERSION ---
    const SCRIPT_VERSION = "v3.8";
    const REPO_API_URL = "https://api.github.com/repos/hummingbird-tori/infinite-worlds-script-bookmarklet/contents/script-jsons";

    // --- SUPPORTED ARRAYS LIST ---
    const SUPPORTED_ARRAYS = ['skills', 'possibleCharacters', 'NPCs', 'loreBookEntries', 'instructionBlocks', 'triggerEvents', 'trackedItems'];

    // --- DOM UTILITIES ---
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
        if (!ta || !ta.value || !ta.value.trim()) {
            return null;
        }
        try {
            return JSON.parse(ta.value);
        } catch(e) {
            return null;
        }
    }

    // --- CLOUD SYNC TAB ---
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
            try {
                const currentWorld = getActiveWorldJson();
                if (!currentWorld) throw new Error('Active world JSON container not found or empty.');
                const safeTitle = (currentWorld.title || 'infinite_worlds_export').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const blob = new Blob([JSON.stringify(currentWorld, null, 4)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = safeTitle + '.json';
                document.body.appendChild(a); a.click(); a.remove();
                URL.revokeObjectURL(url);
            } catch(e) {
                alert(e.message);
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
                if (!currentWorld) throw new Error('Active world JSON container not found or empty.');
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

                SUPPORTED_ARRAYS.forEach(arrKey => {
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
                alert('Extract Error: ' + e.message);
            }
        };

        container.querySelector('#iw-inject-selected').onclick = () => {
            try {
                const ta = getJsonBox();
                const btn = getBtn('Import JSON to world');
                if (!ta || !btn) return alert('App JSON box or import button not found.');
                const currentWorld = getActiveWorldJson();
                if (!currentWorld) throw new Error('Active world JSON container not found or empty.');
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
                        if (typeof newItem === 'string') {
                            if (!currentWorld[arrKey].includes(newItem)) currentWorld[arrKey].push(newItem);
                        } else {
                            const existingIdx = currentWorld[arrKey].findIndex(ex => 
                                (newItem.id && ex.id === newItem.id) || 
                                (newItem.characterId && ex.characterId === newItem.characterId) ||
                                (newItem.name && ex.name === newItem.name) || 
                                (newItem.variableName && ex.variableName === newItem.variableName) ||
                                (newItem.title && ex.title === newItem.title)
                            );
                            if (existingIdx >= 0) currentWorld[arrKey][existingIdx] = newItem;
                            else currentWorld[arrKey].push(newItem);
                        }
                    }
                });

                currentWorld.enableAISpecificInstructionBlocks = true;

                ta.value = JSON.stringify(currentWorld, null, 4);
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
                btn.click();
                alert('Selected items successfully injected and imported!');
            } catch(e) {
                alert('Injection Error: ' + e.message);
            }
        };
    }

    // --- JSON WORKBENCH TAB ---
    function renderEditorTab(container) {
        container.innerHTML = `
            <div style="background:#1f1e26;padding:10px 12px;border-radius:6px;border:1px solid #3f3c4d;display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h4 style="margin:0;color:#818cf8;font-size:13px;">Targeted Array Staging & Reorder</h4>
                    <div style="display:flex;gap:6px;">
                        <button id="iw-edit-load" style="background:#4f46e5;color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Load Arrays</button>
                        <button id="iw-edit-save" style="background:#059669;color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;opacity:0.5;" disabled>Save & Import Changes</button>
                    </div>
                </div>
                <p style="margin:0;font-size:11px;color:#9ca3af;">Edit, reorder (by typing new position numbers), or remove items locally, then click Save & Import.</p>
            </div>
            
            <div id="iw-editor-output" style="background:#111015;border:1px solid #3f3c4d;border-radius:6px;padding:8px;max-height:280px;overflow-y:auto;font-size:11px;color:#d1d5db;">
                <em>Click "Load Arrays" above to begin staging changes.</em>
            </div>
        `;

        let stagedWorld = null;
        const out = container.querySelector('#iw-editor-output');
        const saveBtn = container.querySelector('#iw-edit-save');

        function renderArraysView() {
            out.innerHTML = '';
            SUPPORTED_ARRAYS.forEach(arrKey => {
                if (!Array.isArray(stagedWorld[arrKey])) stagedWorld[arrKey] = [];
                const arr = stagedWorld[arrKey];

                const section = document.createElement('div');
                section.style.cssText = 'margin-bottom:10px;padding:8px;background:#17161c;border-radius:4px;border:1px solid #2d2a38;';
                
                const header = document.createElement('div');
                header.style.cssText = 'font-weight:bold;color:#f59e0b;font-size:12px;margin-bottom:6px;border-bottom:1px solid #222;padding-bottom:4px;';
                header.textContent = `${arrKey} (${arr.length} items)`;
                section.appendChild(header);

                if (arr.length === 0) {
                    const empty = document.createElement('div');
                    empty.style.cssText = 'font-size:11px;color:#6b7280;font-style:italic;padding:2px 0;';
                    empty.textContent = 'No items in this array.';
                    section.appendChild(empty);
                } else {
                    const list = document.createElement('div');
                    list.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

                    arr.forEach((item, idx) => {
                        const row = document.createElement('div');
                        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:4px 6px;background:#111015;border-radius:4px;border:1px solid #222;font-size:11px;';
                        
                        const name = typeof item === 'string' ? item : (item.name || item.variableName || item.title || `Item #${idx + 1}`);
                        const nameSpan = document.createElement('span');
                        nameSpan.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:270px;color:#e5e7eb;';
                        nameSpan.textContent = `${idx + 1}. ${name}`;
                        row.appendChild(nameSpan);

                        const controls = document.createElement('div');
                        controls.style.cssText = 'display:flex;gap:6px;align-items:center;';

                        const posLabel = document.createElement('span');
                        posLabel.style.cssText = 'font-size:10px;color:#9ca3af;';
                        posLabel.textContent = 'Pos:';

                        const posInput = document.createElement('input');
                        posInput.type = 'number';
                        posInput.min = '1';
                        posInput.max = arr.length;
                        posInput.value = idx + 1;
                        posInput.style.cssText = 'width:36px;background:#1f1e26;color:#fff;border:1px solid #3f3c4d;border-radius:3px;text-align:center;font-size:10px;padding:2px;';
                        
                        posInput.onchange = () => {
                            let newPos = parseInt(posInput.value);
                            if (isNaN(newPos)) return;
                            newPos = Math.max(1, Math.min(arr.length, newPos));
                            const targetIdx = newPos - 1;
                            if (targetIdx === idx) return;

                            const [movedItem] = arr.splice(idx, 1);
                            arr.splice(targetIdx, 0, movedItem);
                            renderArraysView();
                        };

                        const delBtn = document.createElement('button');
                        delBtn.textContent = '✕';
                        delBtn.style.cssText = 'background:#7f1d1d;color:#fca5a5;border:none;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;';
                        delBtn.onclick = () => {
                            arr.splice(idx, 1);
                            renderArraysView();
                        };

                        controls.appendChild(posLabel);
                        controls.appendChild(posInput);
                        controls.appendChild(delBtn);
                        row.appendChild(controls);
                        list.appendChild(row);
                    });
                    section.appendChild(list);
                }

                out.appendChild(section);
            });
            saveBtn.removeAttribute('disabled');
            saveBtn.style.opacity = '1';
        }

        container.querySelector('#iw-edit-load').onclick = () => {
            try {
                const world = getActiveWorldJson();
                if (!world) throw new Error('Active world JSON container not found. Please follow the setup instructions below.');
                stagedWorld = JSON.parse(JSON.stringify(world));
                renderArraysView();
            } catch(e) {
                out.innerHTML = `<span style="color:#ef4444;">${e.message}</span>`;
                saveBtn.setAttribute('disabled', 'true');
                saveBtn.style.opacity = '0.5';
            }
        };

        saveBtn.onclick = () => {
            if (!stagedWorld) return;
            const ta = getJsonBox();
            const btn = getBtn('Import JSON to world');
            if (!ta || !btn) {
                alert('App JSON box or import button not found.');
                return;
            }
            try {
                stagedWorld.enableAISpecificInstructionBlock = true;
                ta.value = JSON.stringify(stagedWorld, null, 4);
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
                btn.click();
                alert('Staged changes successfully saved and imported to world!');
            } catch(e) {
                alert('Save Error: ' + e.message);
            }
        };
    }

    // --- BOOTUP VALIDATION & MAIN MODAL CREATION ---
    const testWorld = getActiveWorldJson();

    const modal = document.createElement('div');
    modal.id = 'iw-modal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:760px;max-height:85vh;background:#17161c;color:#f3f4f6;border:1px solid #3f3c4d;border-radius:10px;z-index:99999;font-family:sans-serif;display:flex;flex-direction:column;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    
    if (!testWorld) {
        // Warning view if raw JSON container is not active/open
        modal.innerHTML = `
            <div style="padding:12px 16px;background:#1f1e26;border-bottom:1px solid #3f3c4d;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;font-size:15px;color:#ef4444;">⚠️ Infinite Worlds Workbench - Setup Required</h3>
                <button id="iw-close" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer;">&times;</button>
            </div>
            <div style="padding:20px;display:flex;flex-direction:column;gap:12px;font-size:13px;color:#d1d5db;line-height:1.5;">
                <p style="margin:0;">This bookmarklet only works inside the <b>Infinite Worlds world editor</b> with the raw JSON view open and loaded.</p>
                <div style="background:#111015;padding:12px;border-radius:6px;border:1px solid #3f3c4d;display:flex;flex-direction:column;gap:6px;">
                    <b style="color:#818cf8;">How to open the required JSON view:</b>
                    <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px;">
                        <li>Open your world in the <b>Infinite Worlds World Editor</b>.</li>
                        <li>Check <b>"Shop optional features"</b>.</li>
                        <li>Click <b>"Misc advanced features (experimental)"</b>.</li>
                        <li>Select <b>"Show Raw Json"</b> and click <b>"Refresh raw JSON"</b>.</li>
                    </ol>
                </div>
                <p style="margin:0;color:#9ca3af;font-size:11px;">Once the raw JSON box is visible on your screen, click your bookmarklet again!</p>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#iw-close').onclick = () => modal.remove();
        return;
    }

    // Normal multi-tab workbench UI
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

    function switchTab(tabName) {
        contentArea.innerHTML = '';
        if (tabName === 'sync') {
            syncBtn.style.background = '#4f46e5';
            syncBtn.style.color = '#fff';
            editorBtn.style.background = 'transparent';
            editorBtn.style.color = '#9ca3af';
            renderSyncTab(contentArea);
        } else if (tabName === 'editor') {
            editorBtn.style.background = '#4f46e5';
            editorBtn.style.color = '#fff';
            syncBtn.style.background = 'transparent';
            syncBtn.style.color = '#9ca3af';
            renderEditorTab(contentArea);
        }
    }

    syncBtn.onclick = () => switchTab('sync');
    editorBtn.onclick = () => switchTab('editor');

    // Default load Cloud Sync tab
    switchTab('sync');
})();
