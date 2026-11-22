/**
 * Infers which part of the display an edit replaced when no keydown recorded the selection
 * (IME, dictation, autofill, `execCommand('insertText')`): the part of `before` from `start` to
 * `end` became the run of `after` from `start` to `caret`. `insertedLength` is the length of the
 * inserted run when the input event reports it, null otherwise (the shared leading characters
 * then bound the run). Null when `after` is not `before` with that one run swapped in, so the
 * caller keeps what it knows.
 */
export function inferEditRange(
    before: string,
    after: string,
    caret: number,
    insertedLength: number | null
): { start: number; end: number } | null {
    let start = insertedLength === null ? 0 : caret - insertedLength;
    if (insertedLength === null) {
        while (start < caret && before[start] === after[start]) {
            start++;
        }
    }
    const end = before.length - (after.length - caret);
    return start >= 0 &&
        end >= start &&
        after.startsWith(before.slice(0, start)) &&
        after.slice(caret) === before.slice(end)
        ? { start, end }
        : null;
}
