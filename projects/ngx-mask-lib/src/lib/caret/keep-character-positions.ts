import { MaskExpression } from '../ngx-mask-expression.enum';
import type { NgxMaskService } from '../ngx-mask.service';
import { nextFillableIndex } from '../ngx-mask.utils';

/** The mask service state the resolution reads; plain property reads, nothing is written back. */
export type KeepCharacterPositionsState = Readonly<
    Pick<
        NgxMaskService,
        | 'prefix'
        | 'suffix'
        | 'showMaskTyped'
        | 'maskExpression'
        | 'maskIsShown'
        | 'placeHolderCharacter'
        | 'specialCharacters'
        | 'selStart'
        | 'selEnd'
        | 'actualValue'
        | '_checkSymbolMask'
    >
>;

/** The edit being resolved. */
export type KeepCharacterPositionsEdit = {
    /** The value of the element after the edit. */
    elValue: string;
    /** The caret of the element after the edit, already shifted by the prefix for a first character. */
    position: number;
    /** The key code of the edit. */
    code: string;
    /** The display value before the edit. */
    before: string;
};

export type KeepCharacterPositionsResult = {
    /** The resolved display value, or null when the current actualValue stays as it is. */
    actualValue: string | null;
    position: number;
    /**
     * Whether the edit was fully resolved into `actualValue`: applyMask then renders it as-is.
     * When false it flows through regular masking (e.g. appending at the end, clearing it all).
     */
    handled: boolean;
};

/**
 * Resolves one edit of a `keepCharacterPositions` mask: the layout of the mask is kept, so a
 * deleted character leaves a placeholder behind and a typed one overwrites the next fillable slot.
 */
export function resolveKeepCharacterPositions(
    svc: KeepCharacterPositionsState,
    edit: KeepCharacterPositionsEdit
): KeepCharacterPositionsResult {
    const {
        prefix,
        suffix,
        showMaskTyped,
        maskExpression,
        placeHolderCharacter,
        specialCharacters,
        selStart: selStartRaw,
        selEnd: selEndRaw,
    } = svc;
    const { elValue } = edit;
    let position = edit.position;
    let actualValue: string | null = null;
    const inputSymbol = elValue.slice(position - 1, position);
    const prefixLength = prefix.length;
    // Placeholder skeleton of the mask (special chars kept, fillable slots
    // replaced by the placeholder character). With showMaskTyped the service
    // renders it as maskIsShown; without showMaskTyped it is derived locally so
    // keepCharacterPositions works on its own (#1545, #1543).
    const maskSkeleton: string = svc.maskIsShown.length
        ? svc.maskIsShown
        : maskExpression.replace(/\w/g, placeHolderCharacter);

    const hasSelection: boolean = selStartRaw !== selEndRaw;
    const selStartAbs = Number(selStartRaw);
    const selEndAbs = Number(selEndRaw);
    const selStart = selStartAbs - prefixLength;
    const selEnd = selEndAbs - prefixLength;
    // The display before the edit, when the element still holds the part before the selection
    // and has the length it had before the edit; null when `before` cannot be trusted, or when
    // the field is still empty (its display is a bare skeleton that regular masking fills).
    const restoreBefore = (preEditLength: number): string | null =>
        svc.actualValue &&
        edit.before.length === preEditLength &&
        edit.before.startsWith(elValue.slice(0, selStartAbs))
            ? edit.before
            : null;

    // Without showMaskTyped the suffix follows the last digit, so the end of the mask part is read
    // from the display before the edit, not from the skeleton, and a selection blanks no more of
    // the skeleton than the mask part of that display.
    const maskEndOf = (preEditLength: number): number => preEditLength - suffix.length;
    const blankEndOf = (preEditLength: number): number =>
        Math.max(Math.min(selEndAbs, maskEndOf(preEditLength)) - prefixLength, 0);

    const backspaceOrDelete =
        edit.code === MaskExpression.BACKSPACE || edit.code === MaskExpression.DELETE;

    let handled = true;
    // Where the mask part ends once a selection delete trimmed its trailing gaps: with a suffix
    // the caret must not land in it.
    let trimmedBodyEnd: number | null = null;

    if (backspaceOrDelete) {
        if (hasSelection) {
            const preEditLength = elValue.length + (selEndAbs - selStartAbs);
            const maskEndAbs = maskEndOf(preEditLength);
            const blankEnd = blankEndOf(preEditLength);
            // What follows the selection: the display before the edit, which still carries the
            // skeleton tail of a value written through the control (its actualValue is bare).
            const displayBefore = restoreBefore(preEditLength) ?? svc.actualValue;
            if (!showMaskTyped && selStartAbs <= prefixLength && selEndAbs >= preEditLength) {
                // The whole value was selected and deleted: clear through the
                // regular path instead of showing a placeholder skeleton.
                handled = false;
            } else if (selStartRaw === prefixLength) {
                // A selection that reaches into the suffix took part of it out of the element.
                const rest = selEndAbs > maskEndAbs ? suffix : elValue.split(prefix).join('');
                actualValue = `${prefix}${maskSkeleton.slice(0, blankEnd)}${rest}`;
            } else if (selStartRaw === maskSkeleton.length + prefixLength) {
                actualValue = `${elValue}${maskSkeleton.slice(selStart, selEnd)}`;
            } else {
                actualValue = `${prefix}${elValue
                    .split(prefix)
                    .join('')
                    .slice(
                        0,
                        selStart
                    )}${maskSkeleton.slice(selStart, blankEnd)}${displayBefore.slice(
                    selEndAbs,
                    maskEndAbs
                )}${suffix}`;
            }
            if (!showMaskTyped && actualValue !== null && selEndAbs >= maskEndAbs) {
                // The selection reached the end of the mask part: nothing follows its placeholders
                // and separators, drop them (leading and middle gaps stay).
                const bodyEnd = actualValue.endsWith(suffix)
                    ? actualValue.length - suffix.length
                    : actualValue.length;
                let end = bodyEnd;
                while (
                    end > prefixLength &&
                    (actualValue.charAt(end - 1) === placeHolderCharacter ||
                        specialCharacters.includes(actualValue.charAt(end - 1)))
                ) {
                    end--;
                }
                actualValue = `${actualValue.slice(0, end)}${actualValue.slice(bodyEnd)}`;
                trimmedBodyEnd = end;
            }
        } else if (
            !specialCharacters.includes(
                maskExpression.slice(position - prefixLength, position + 1 - prefixLength)
            )
        ) {
            if (!showMaskTyped && position >= elValue.length) {
                // Deleting the last character: no gap needs to be kept.
                handled = false;
            } else if (selStart === 1 && prefix) {
                actualValue = `${prefix}${placeHolderCharacter}${elValue
                    .split(prefix)
                    .join('')
                    .split(suffix)
                    .join('')}${suffix}`;
            } else {
                const part1 = elValue.substring(0, position);
                const part2 = elValue.substring(position);
                actualValue = `${part1}${placeHolderCharacter}${part2}`;
            }
        }
        // A collapsed Delete steps past the blank it leaves; a deleted selection leaves the caret
        // on its first blank, like Backspace, so the next digit fills it.
        position = edit.code === MaskExpression.DELETE && !hasSelection ? position + 1 : position;
        if (trimmedBodyEnd !== null && suffix) {
            position = Math.min(position, trimmedBodyEnd);
        }
    } else if (hasSelection) {
        // A selected range was replaced by the typed symbol. Keep the layout:
        // blank the selection to the mask skeleton and put the typed symbol
        // into the first fillable slot of the selection (#1527, #1489).
        const preEditLength = elValue.length - 1 + (selEndAbs - selStartAbs);
        // The symbol replaced the selection, so it sits at the selection start; `position` is
        // shifted by the prefix for a first character and would point at the next one.
        const typedSymbol = elValue.charAt(selStartAbs);
        if (!showMaskTyped && selStartAbs <= prefixLength && selEndAbs >= preEditLength) {
            // The whole value was replaced: mask it through the regular path.
            handled = false;
        } else {
            const maskIdx = nextFillableIndex(
                maskExpression,
                specialCharacters,
                Math.max(selStart, 0)
            );
            // A selection that reaches into the prefix or the suffix took part of them out of the
            // element: restore those from the service instead of reading the damaged fragments.
            const head = selStartAbs < prefixLength ? prefix : elValue.slice(0, selStartAbs);
            const maskEndAbs = maskEndOf(preEditLength);
            // The rest of a prefix that the selection ended inside follows the symbol: skip it.
            const prefixLeft = Math.max(prefixLength - selEndAbs, 0);
            const tail =
                selEndAbs > maskEndAbs ? suffix : elValue.slice(selStartAbs + 1 + prefixLeft);
            const blankEnd = blankEndOf(preEditLength);
            const blanked = `${head}${maskSkeleton.slice(Math.max(selStart, 0), blankEnd)}${tail}`;
            const targetAbs = maskIdx + prefixLength;
            if (
                targetAbs < blanked.length - suffix.length &&
                svc._checkSymbolMask(
                    typedSymbol,
                    maskExpression[maskIdx] ?? MaskExpression.EMPTY_STRING
                )
            ) {
                actualValue = `${blanked.slice(0, targetAbs)}${typedSymbol}${blanked.slice(targetAbs + 1)}`;
                position = targetAbs + 1;
            } else {
                // Rejected symbol: keep the display from before the key, else the blanked one.
                actualValue = restoreBefore(preEditLength) ?? blanked;
                position = Math.max(selStartAbs, prefixLength);
            }
        }
    } else {
        // Single-caret insert (overwrite mode): the typed symbol lands in the
        // first fillable mask slot at or after the caret, skipping any number
        // of special characters (#1544, #1489).
        const oldDisplay = `${elValue.slice(0, position - 1)}${elValue.slice(position)}`;
        const oldDisplayNoSuffix = suffix ? oldDisplay.split(suffix).join('') : oldDisplay;
        if (position - 1 - prefixLength < 0) {
            // Typed inside the prefix: reject the symbol.
            actualValue = restoreBefore(elValue.length - 1);
            position = position - 1;
        } else {
            const maskIdx = nextFillableIndex(
                maskExpression,
                specialCharacters,
                position - 1 - prefixLength
            );
            const targetAbs = maskIdx + prefixLength;
            if (targetAbs >= oldDisplayNoSuffix.length) {
                if (oldDisplayNoSuffix.length <= prefixLength || !showMaskTyped) {
                    // First symbol, or appending at the end without
                    // showMaskTyped: regular masking handles it (including
                    // leadZeroDateTime insertions).
                    handled = false;
                } else {
                    // All slots of the rendered mask are already consumed.
                    actualValue = restoreBefore(elValue.length - 1);
                    position = position - 1;
                }
            } else if (
                svc._checkSymbolMask(
                    inputSymbol,
                    maskExpression[maskIdx] ?? MaskExpression.EMPTY_STRING
                )
            ) {
                actualValue = `${oldDisplayNoSuffix.slice(0, targetAbs)}${inputSymbol}${oldDisplayNoSuffix.slice(targetAbs + 1)}${suffix}`;
                position = targetAbs + 1;
            } else {
                // Rejected symbol: keep the current display.
                actualValue = restoreBefore(elValue.length - 1);
                position = position - 1;
            }
        }
    }
    return { actualValue, position, handled };
}
