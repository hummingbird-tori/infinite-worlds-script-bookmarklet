(function() {
    if (document.getElementById('iw-modal')) return;

    // --- CONFIGURATION & VERSION ---
    const SCRIPT_VERSION = "v4.2";
    const REPO_API_URL = "https://api.github.com/repos/hummingbird-tori/infinite-worlds-script-bookmarklet/contents/script-jsons";

    // --- SUPPORTED ARRAYS LIST ---
    const SUPPORTED_ARRAYS = ['skills', 'possibleCharacters', 'NPCs', 'loreBookEntries', 'instructionBlocks', 'triggerEvents', 'trackedItems'];

    // --- THEMES PALETTE ---
    const THEMES = {
        dark: { bg: '#17161c', surface: '#1f1e26', card: '#111015', text: '#f3f4f6', subtext: '#9ca3af', border: '#3f3c4d', accent: '#4f46e5', inputBg: '#1f1e26' },
        light: { bg: '#f3f4f6', surface: '#ffffff', card: '#f8fafc', text: '#1f2937', subtext: '#4b5563', border: '#cbd5e1', accent: '#4f46e5', inputBg: '#ffffff' },
        cyber: { bg: '#09090b', surface: '#18181b', card: '#27272a', text: '#fafafa', subtext: '#a1a1aa', border: '#3f3f46', accent: '#06b6d4', inputBg: '#18181b' }
    };

    let currentTheme = 'dark';

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
        const t = THEMES[currentTheme];
        container.innerHTML = `
            <div style="background:${t.surface};padding:10px 12px;border-radius:6px;border:1px solid ${t.border};display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;color:${t.accent};font-weight:600;">Discovered Presets from GitHub (/script-jsons):</label>
                <div style="display:flex;gap:8px;">
                    <select id="iw-preset-select" style="background:${t.inputBg};color:${t.text};border:1px solid ${t.border};border-radius:4px;padding:6px;font-size:12px;flex-grow:1;">
                        <option value="">-- Loading discovered presets... --</option>
                    </select>
                    <button id="iw-load-preset" style="background:${t.accent};color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Load Preset</button>
                </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;background:${t.surface};padding:8px 12px;border-radius:6px;border:1px solid ${t.border};">
                <span style="font-size:12px;color:${t.text};"><b>Backup Current World:</b> Save active JSON to file</span>
                <button id="iw-download" style="background:#0284c7;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Download World .json</button>
            </div>
            
            <p style="margin:0;font-size:12px;color:${t.subtext};"><b>Step 1:</b> Upload a local file, pick a preset, or paste JSON below, then click <b>Extract Data</b>.</p>
            <textarea id="iw-box" style="width:100%;height:110px;background:${t.inputBg};color:${t.text};border:1px solid ${t.border};border-radius:6px;padding:8px;font-family:monospace;font-size:11px;box-sizing:border-box;resize:vertical;" placeholder="Paste world JSON here, upload, or load preset..."></textarea>
            
            <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;">
                <input type="file" id="iw-file-input" accept=".json,application/json" style="display:none;">
                <button id="iw-upload-btn" style="background:${t.card};color:${t.text};border:1px solid ${t.border};padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Upload .json File</button>
                <button id="iw-extract" style="background:${t.accent};color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;">Extract Data</button>
            </div>
            
            <hr style="border:0;border-top:1px solid ${t.border};margin:2px 0;">
            <p style="margin:0;font-size:12px;color:${t.subtext};"><b>Step 2:</b> Select items to inject. Conflicts are automatically unchecked.</p>
            <div id="iw-selection-container" style="background:${t.card};border:1px solid ${t.border};border-radius:6px;padding:8px;max-height:160px;overflow-y:auto;font-size:12px;color:${t.text};"><em>No data extracted yet. Load or paste JSON and click Extract.</em></div>
            
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
                <span id="iw-status" style="font-size:11px;color:${t.subtext};"></span>
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
                    header.style.cssText = `display:flex;justify-content:space-between;align-items:center;font-weight:bold;color:${color};margin-top:8px;margin-bottom:2px;font-size:12px;border-bottom:1px solid ${t.border};padding-bottom:2px;`;
                    
                    const titleSpan = document.createElement('span');
                    titleSpan.textContent = title;
                    
                    const actions = document.createElement('div');
                    actions.style.cssText = 'display:flex;gap:6px;font-size:10px;font-weight:normal;';
                    
                    const selAll = document.createElement('a');
                    selAll.href = '#'; selAll.style.cssText = `color:${t.accent};text-decoration:none;`; selAll.textContent = 'Select All';
                    selAll.onclick = (ev) => { ev.preventDefault(); selContainer.querySelectorAll('.' + secClass).forEach(cb => cb.checked = true); };
                    
                    const deselAll = document.createElement('a');
                    deselAll.href = '#'; deselAll.style.cssText = `color:${t.subtext};text-decoration:none;`; deselAll.textContent = 'Deselect All';
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
                                (newItem.name && ex.name === item.name) || 
                                (newItem.variableName && ex.variableName === item.variableName) ||
                                (newItem.title && ex.title === item.title)
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

    // --- JSON WORKBENCH TAB (v4.2: Live Validation, Beautifier, & Editable JSON) ---
    function renderEditorTab(container) {
        const t = THEMES[currentTheme];
        container.innerHTML = `
            <div style="background:${t.surface};padding:10px 12px;border-radius:6px;border:1px solid ${t.border};display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h4 style="margin:0;color:${t.accent};font-size:13px;">Targeted Array Workbench & Live JSON Validator</h4>
                    <div style="display:flex;gap:6px;">
                        <button id="iw-edit-load" style="background:${t.accent};color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Load Arrays</button>
                        <button id="iw-edit-save" style="background:#059669;color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;opacity:0.5;" disabled>Save & Import Changes</button>
                    </div>
                </div>
                <p style="margin:0;font-size:11px;color:${t.subtext};">Click any item to edit raw JSON with live syntax checking, beautify/format, reorder, or add new objects.</p>
            </div>
            
            <div id="iw-editor-output" style="background:${t.card};border:1px solid ${t.border};border-radius:6px;padding:8px;max-height:320px;overflow-y:auto;font-size:11px;color:${t.text};">
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
                section.style.cssText = `margin-bottom:10px;padding:8px;background:${t.card};border-radius:4px;border:1px solid ${t.border};`;
                
                const header = document.createElement('div');
                header.style.cssText = `display:flex;justify-content:space-between;align-items:center;font-weight:bold;color:#f59e0b;font-size:12px;margin-bottom:6px;border-bottom:1px solid ${t.border};padding-bottom:4px;`;
                
                const titleSpan = document.createElement('span');
                titleSpan.textContent = `${arrKey} (${arr.length} items)`;
                
                const addToggleBtn = document.createElement('button');
                addToggleBtn.textContent = '+ Add New';
                addToggleBtn.style.cssText = `background:${t.accent};color:#fff;border:none;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:10px;`;
                
                header.appendChild(titleSpan);
                header.appendChild(addToggleBtn);
                section.appendChild(header);

                const addDrawer = document.createElement('div');
                addDrawer.style.cssText = `display:none;flex-direction:column;gap:6px;margin-bottom:8px;padding:6px;background:${t.surface};border-radius:4px;border:1px solid ${t.border};`;
                addDrawer.innerHTML = `
                    <div style="font-size:10px;color:${t.accent};font-weight:bold;">Insert New Object into ${arrKey}:</div>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <span style="font-size:10px;color:${t.subtext};">Insert at Pos:</span>
                        <input type="number" class="iw-new-pos" min="1" max="${arr.length + 1}" value="${arr.length + 1}" style="width:40px;background:${t.inputBg};color:${t.text};border:1px solid ${t.border};border-radius:3px;text-align:center;font-size:10px;padding:2px;">
                    </div>
                    <textarea class="iw-new-json" placeholder="Paste valid JSON object here..." style="width:100%;height:60px;background:${t.inputBg};color:${t.text};border:1px solid ${t.border};border-radius:3px;font-family:monospace;font-size:10px;box-sizing:border-box;resize:vertical;"></textarea>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="iw-new-val-status" style="font-size:9px;color:${t.subtext};"></span>
                        <button class="iw-new-submit" style="background:#059669;color:#fff;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:10px;font-weight:bold;">Insert Object</button>
                    </div>
                `;
                section.appendChild(addDrawer);

                // Live validation for New Item textarea
                const newTa = addDrawer.querySelector('.iw-new-json');
                const newStatus = addDrawer.querySelector('.iw-new-val-status');
                newTa.oninput = () => {
                    const val = newTa.value.trim();
                    if (!val) { newStatus.textContent = ''; return; }
                    try {
                        JSON.parse(val);
                        newStatus.textContent = '✓ Valid JSON';
                        newStatus.style.color = '#10b981';
                    } catch(e) {
                        newStatus.textContent = '✕ Syntax Error: ' + e.message;
                        newStatus.style.color = '#ef4444';
                    }
                };

                addToggleBtn.onclick = () => {
                    addDrawer.style.display = addDrawer.style.display === 'flex' ? 'none' : 'flex';
                };

                addDrawer.querySelector('.iw-new-submit').onclick = () => {
                    const rawJson = newTa.value.trim();
                    let targetPos = parseInt(addDrawer.querySelector('.iw-new-pos').value);
                    if (!rawJson) return alert('Please paste JSON for the new item.');
                    try {
                        const parsedObj = JSON.parse(rawJson);
                        targetPos = isNaN(targetPos) ? arr.length + 1 : Math.max(1, Math.min(arr.length + 1, targetPos));
                        arr.splice(targetPos - 1, 0, parsedObj);
                        renderArraysView();
                    } catch(e) {
                        alert('Invalid JSON: ' + e.message);
                    }
                };

                if (arr.length === 0) {
                    const empty = document.createElement('div');
                    empty.style.cssText = `font-size:11px;color:${t.subtext};font-style:italic;padding:2px 0;`;
                    empty.textContent = 'No items in this array.';
                    section.appendChild(empty);
                } else {
                    const list = document.createElement('div');
                    list.style.cssText = 'display:flex;flex-direction:column;gap:4px;';

                    arr.forEach((item, idx) => {
                        const itemWrapper = document.createElement('div');
                        itemWrapper.style.cssText = `display:flex;flex-direction:column;background:${t.surface};border-radius:4px;border:1px solid ${t.border};font-size:11px;overflow:hidden;`;

                        const row = document.createElement('div');
                        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:5px 6px;cursor:pointer;';
                        
                        const name = typeof item === 'string' ? item : (item.name || item.variableName || item.title || `Item #${idx + 1}`);
                        const nameSpan = document.createElement('span');
                        nameSpan.style.cssText = `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;color:${t.text};font-weight:500;`;
                        nameSpan.textContent = `${idx + 1}. ${name} (Click to edit raw JSON)`;
                        row.appendChild(nameSpan);

                        const controls = document.createElement('div');
                        controls.style.cssText = 'display:flex;gap:6px;align-items:center;';

                        const posLabel = document.createElement('span');
                        posLabel.style.cssText = `font-size:10px;color:${t.subtext};`;
                        posLabel.textContent = 'Pos:';

                        const posInput = document.createElement('input');
                        posInput.type = 'number';
                        posInput.min = '1';
                        posInput.max = arr.length;
                        posInput.value = idx + 1;
                        posInput.style.cssText = `width:36px;background:${t.inputBg};color:${t.text};border:1px solid ${t.border};border-radius:3px;text-align:center;font-size:10px;padding:2px;`;
                        
                        posInput.onchange = (ev) => {
                            ev.stopPropagation();
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
                        delBtn.onclick = (ev) => {
                            ev.stopPropagation();
                            arr.splice(idx, 1);
                            renderArraysView();
                        };

                        controls.appendChild(posLabel);
                        controls.appendChild(posInput);
                        controls.appendChild(delBtn);
                        row.appendChild(controls);
                        itemWrapper.appendChild(row);

                        // Expandable JSON Editor Drawer with Live Validation & Beautifier
                        const editorDrawer = document.createElement('div');
                        editorDrawer.style.cssText = `display:none;flex-direction:column;gap:6px;padding:8px;background:${t.card};border-top:1px solid ${t.border};`;
                        
                        const jsonTa = document.createElement('textarea');
                        jsonTa.style.cssText = `width:100%;height:110px;background:${t.inputBg};color:${t.text};border:1px solid ${t.border};border-radius:3px;font-family:monospace;font-size:10px;box-sizing:border-box;resize:vertical;`;
                        jsonTa.value = typeof item === 'string' ? item : JSON.stringify(item, null, 4);

                        const drawerFooter = document.createElement('div');
                        drawerFooter.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

                        const valStatus = document.createElement('span');
                        valStatus.style.cssText = 'font-size:9px;color:#10b981;';
                        valStatus.textContent = '✓ Valid JSON';

                        const btnGroup = document.createElement('div');
                        btnGroup.style.cssText = 'display:flex;gap:6px;';

                        const formatBtn = document.createElement('button');
                        formatBtn.textContent = 'Beautify';
                        formatBtn.style.cssText = `background:${t.surface};color:${t.text};border:1px solid ${t.border};padding:3px 8px;border-radius:3px;cursor:pointer;font-size:10px;`;
                        formatBtn.onclick = () => {
                            try {
                                const parsed = JSON.parse(jsonTa.value);
                                jsonTa.value = JSON.stringify(parsed, null, 4);
                                valStatus.textContent = '✓ Valid JSON (Beautified)';
                                valStatus.style.color = '#10b981';
                            } catch(e) {
                                alert('Cannot beautify due to syntax error: ' + e.message);
                            }
                        };

                        const minifyBtn = document.createElement('button');
                        minifyBtn.textContent = 'Minify';
                        minifyBtn.style.cssText = `background:${t.surface};color:${t.text};border:1px solid ${t.border};padding:3px 8px;border-radius:3px;cursor:pointer;font-size:10px;`;
                        minifyBtn.onclick = () => {
                            try {
                                const parsed = JSON.parse(jsonTa.value);
                                jsonTa.value = JSON.stringify(parsed);
                                valStatus.textContent = '✓ Valid JSON (Minified)';
                                valStatus.style.color = '#10b981';
                            } catch(e) {
                                alert('Cannot minify due to syntax error: ' + e.message);
                            }
                        };

                        const applyJsonBtn = document.createElement('button');
                        applyJsonBtn.textContent = 'Apply';
                        applyJsonBtn.style.cssText = `background:${t.accent};color:#fff;border:none;padding:3px 10px;border-radius:3px;cursor:pointer;font-size:10px;font-weight:bold;`;
                        
                        applyJsonBtn.onclick = () => {
                            try {
                                const val = jsonTa.value.trim();
                                arr[idx] = val.startsWith('{') || val.startsWith('[') ? JSON.parse(val) : val;
                                renderArraysView();
                            } catch(e) {
                                alert('Invalid JSON format: ' + e.message);
                            }
                        };

                        // Live validation listener on item textarea
                        jsonTa.oninput = () => {
                            try {
                                JSON.parse(jsonTa.value);
                                valStatus.textContent = '✓ Valid JSON';
                                valStatus.style.color = '#10b981';
                            } catch(e) {
                                valStatus.textContent = '✕ Syntax Error: ' + e.message;
                                valStatus.style.color = '#ef4444';
                            }
                        };

                        btnGroup.appendChild(formatBtn);
                        btnGroup.appendChild(minifyBtn);
                        btnGroup.appendChild(applyJsonBtn);

                        drawerFooter.appendChild(valStatus);
                        drawerFooter.appendChild(btnGroup);

                        editorDrawer.appendChild(jsonTa);
                        editorDrawer.appendChild(drawerFooter);
                        itemWrapper.appendChild(editorDrawer);

                        row.onclick = () => {
                            editorDrawer.style.display = editorDrawer.style.display === 'flex' ? 'none' : 'flex';
                        };

                        list.appendChild(itemWrapper);
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
                if (!world) throw new Error('Active world JSON container not found.');
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
                stagedWorld.enableAISpecificInstructionBlocks = true;
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
    
    const layouts = {
        float: 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:82vh;max-height:85vh;resize:both;overflow:hidden;',
        sidebar: 'position:fixed;top:0;right:0;width:500px;height:100vh;transform:none;border-radius:0;border-left:1px solid;',
        bottom: 'position:fixed;bottom:0;left:0;width:100vw;height:45vh;transform:none;border-radius:12px 12px 0 0;border-top:1px solid;',
        max: 'position:fixed;top:0;left:0;width:100vw;height:100vh;transform:none;border-radius:0;'
    };

    let currentLayout = 'float';

    function applyModalStyles() {
        const t = THEMES[currentTheme];
        modal.style.cssText = `background:${t.bg};color:${t.text};border:1px solid ${t.border};border-radius:10px;z-index:99999;font-family:sans-serif;display:flex;flex-direction:column;box-shadow:0 10px 25px rgba(0,0,0,0.5);${layouts[currentLayout]}`;
        
        modal.querySelectorAll('.iw-layout-btn').forEach(b => {
            b.style.background = b.dataset.mode === currentLayout ? t.accent : t.card;
            b.style.color = b.dataset.mode === currentLayout ? '#fff' : t.subtext;
            b.style.border = `1px solid ${t.border}`;
        });

        modal.querySelectorAll('.iw-theme-btn').forEach(b => {
            b.style.background = b.dataset.theme === currentTheme ? t.accent : t.card;
            b.style.color = b.dataset.theme === currentTheme ? '#fff' : t.subtext;
            b.style.border = `1px solid ${t.border}`;
        });
    }

    applyModalStyles();

    if (!testWorld) {
        modal.innerHTML = `
            <div id="iw-header" style="padding:12px 16px;background:${THEMES[currentTheme].surface};border-bottom:1px solid ${THEMES[currentTheme].border};display:flex;justify-content:space-between;align-items:center;cursor:move;">
                <h3 style="margin:0;font-size:15px;color:#ef4444;">⚠️ Infinite Worlds Workbench - Setup Required</h3>
                <button id="iw-close" style="background:none;border:none;color:${THEMES[currentTheme].subtext};font-size:18px;cursor:pointer;">&times;</button>
            </div>
            <div style="padding:20px;display:flex;flex-direction:column;gap:12px;font-size:13px;color:${THEMES[currentTheme].text};line-height:1.5;">
                <p style="margin:0;">This bookmarklet only works inside the <b>Infinite Worlds world editor</b> with the raw JSON view open and loaded.</p>
                <div style="background:${THEMES[currentTheme].card};padding:12px;border-radius:6px;border:1px solid ${THEMES[currentTheme].border};display:flex;flex-direction:column;gap:6px;">
                    <b style="color:${THEMES[currentTheme].accent};">How to open the required JSON view:</b>
                    <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px;">
                        <li>Open your world in the <b>Infinite Worlds World Editor</b>.</li>
                        <li>Check <b>"Shop optional features"</b>.</li>
                        <li>Click <b>"Misc advanced features (experimental)"</b>.</li>
                        <li>Select <b>"Show Raw Json"</b> and click <b>"Refresh raw JSON"</b>.</li>
                    </ol>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#iw-close').onclick = () => modal.remove();
        return;
    }

    const t = THEMES[currentTheme];
    modal.innerHTML = `
        <div id="iw-header" style="padding:10px 16px;background:${t.surface};border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;cursor:move;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <h3 style="margin:0;font-size:14px;color:${t.text};">IW Workbench</h3>
                <div style="display:flex;gap:3px;background:${t.card};padding:2px;border-radius:6px;border:1px solid ${t.border};">
                    <button id="iw-tab-sync-btn" style="background:${t.accent};color:#fff;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Cloud Sync</button>
                    <button id="iw-tab-editor-btn" style="background:transparent;color:${t.subtext};border:none;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">JSON Workbench</button>
                </div>
                <div style="display:flex;gap:2px;background:${t.card};padding:2px;border-radius:6px;border:1px solid ${t.border};">
                    <button class="iw-layout-btn" data-mode="float" style="padding:3px 5px;border-radius:3px;cursor:pointer;font-size:9px;">Float</button>
                    <button class="iw-layout-btn" data-mode="sidebar" style="padding:3px 5px;border-radius:3px;cursor:pointer;font-size:9px;">Sidebar</button>
                    <button class="iw-layout-btn" data-mode="bottom" style="padding:3px 5px;border-radius:3px;cursor:pointer;font-size:9px;">Bottom</button>
                    <button class="iw-layout-btn" data-mode="max" style="padding:3px 5px;border-radius:3px;cursor:pointer;font-size:9px;">Max</button>
                </div>
                <div style="display:flex;gap:2px;background:${t.card};padding:2px;border-radius:6px;border:1px solid ${t.border};">
                    <button class="iw-theme-btn" data-theme="dark" style="padding:3px 5px;border-radius:3px;cursor:pointer;font-size:9px;">Dark</button>
                    <button class="iw-theme-btn" data-theme="light" style="padding:3px 5px;border-radius:3px;cursor:pointer;font-size:9px;">Light</button>
                    <button class="iw-theme-btn" data-theme="cyber" style="padding:3px 5px;border-radius:3px;cursor:pointer;font-size:9px;">Cyber</button>
                </div>
                <span style="background:${t.card};color:${t.subtext};padding:2px 5px;border-radius:4px;font-size:9px;font-weight:600;border:1px solid ${t.border};">${SCRIPT_VERSION}</span>
            </div>
            <button id="iw-close" style="background:none;border:none;color:${t.subtext};font-size:18px;cursor:pointer;padding:0 4px;">&times;</button>
        </div>
        <div id="iw-tab-content" style="padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;flex-grow:1;"></div>
    `;
    document.body.appendChild(modal);

    // --- DRAG TO MOVE LOGIC ---
    const header = modal.querySelector('#iw-header');
    let isDragging = false, startX, startY;

    header.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || currentLayout !== 'float') return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = modal.getBoundingClientRect();
        modal.style.transform = 'none';
        modal.style.left = rect.left + 'px';
        modal.style.top = rect.top + 'px';

        document.onmousemove = (em) => {
            if (!isDragging) return;
            modal.style.left = (rect.left + (em.clientX - startX)) + 'px';
            modal.style.top = (rect.top + (em.clientY - startY)) + 'px';
        };

        document.onmouseup = () => {
            isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };

    // --- LAYOUT & THEME SWITCHING ---
    modal.querySelectorAll('.iw-layout-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            currentLayout = btn.dataset.mode;
            applyModalStyles();
        };
    });

    modal.querySelectorAll('.iw-theme-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            currentTheme = btn.dataset.theme;
            applyModalStyles();
            // Re-render active tab with new theme colors
            const activeTab = syncBtn.style.background !== 'transparent' ? 'sync' : 'editor';
            switchTab(activeTab);
        };
    });

    modal.querySelector('#iw-close').onclick = () => modal.remove();

    const contentArea = modal.querySelector('#iw-tab-content');
    const syncBtn = modal.querySelector('#iw-tab-sync-btn');
    const editorBtn = modal.querySelector('#iw-tab-editor-btn');

    function switchTab(tabName) {
        const ct = THEMES[currentTheme];
        contentArea.innerHTML = '';
        if (tabName === 'sync') {
            syncBtn.style.background = ct.accent;
            syncBtn.style.color = '#fff';
            editorBtn.style.background = 'transparent';
            editorBtn.style.color = ct.subtext;
            renderSyncTab(contentArea);
        } else if (tabName === 'editor') {
            editorBtn.style.background = ct.accent;
            editorBtn.style.color = '#fff';
            syncBtn.style.background = 'transparent';
            syncBtn.style.color = ct.subtext;
            renderEditorTab(contentArea);
        }
    }

    syncBtn.onclick = () => switchTab('sync');
    editorBtn.onclick = () => switchTab('editor');

    // Default load Cloud Sync tab
    switchTab('sync');
})();
