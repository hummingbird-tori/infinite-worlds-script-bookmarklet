export function getBtn(t) {
    for (let b of document.querySelectorAll('button')) {
        if (b.textContent && b.textContent.includes(t)) return b;
    }
    return null;
}

export function getJsonBox() {
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

export function getActiveWorldJson() {
    const ta = getJsonBox();
    if (!ta || !ta.value.trim()) return null;
    try {
        return JSON.parse(ta.value);
    } catch(e) {
        return null;
    }
}