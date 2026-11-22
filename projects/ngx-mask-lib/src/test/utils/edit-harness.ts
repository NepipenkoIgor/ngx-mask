/**
 * Splices `data` over the selection as a browser does and fires `input` (`paste` first for a
 * paste). With `keydown` (a typed key) the keydown goes out first and the selection is read
 * after it, so the directive's keydown selection clamp (suffix guard) applies as in a real
 * browser; without it the edit is keyless (IME, dictation, execCommand, context-menu paste).
 */
export function edit(el: HTMLInputElement, data: string, inputType: string, keydown = false): void {
    if (keydown) {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: data, code: data, bubbles: true }));
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    if (inputType === 'insertFromPaste') {
        el.dispatchEvent(new Event('paste'));
    }
    el.value = el.value.slice(0, start) + data + el.value.slice(end);
    el.setSelectionRange(start + data.length, start + data.length);
    el.dispatchEvent(
        new InputEvent('input', { inputType, data: inputType === 'insertText' ? data : null })
    );
}
