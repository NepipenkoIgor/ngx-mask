import { MaskExpression } from '../ngx-mask-expression.enum';
import { nextFillableIndex } from '../ngx-mask.utils';

// #1488: a date/time field located within `maskExpression` for the generalized
// caret-shift-past-separator fix (see `findDateTimeFieldAt`/`isFieldOverflowing`).
export type DateTimeField = {
    token: 'd' | 'M' | 'H' | 'h' | 'm' | 's';
    start: number; // index of the field's first char in maskExpression
    end: number; // index one past the field's digit run (start of separator/next field)
};

/**
 * #1488: locates the date/time field (DAY/MONTH/HOURS/HOUR/MINUTE/SECOND) that
 * `position` falls within, scanning `maskExpression` left-to-right. A field spans
 * its token plus its digit-pair companion — `0` for DAY/MONTH/MINUTE/SECOND (e.g.
 * `d0`, `M0`, `m0`, `s0`), or `HOUR` for the combined `Hh` hour field. Matches any
 * position from the field's first char up to and including its end (separator index),
 * so both a still-mid-typing caret and the just-completed field are covered — the
 * precise overflow decision (single first digit vs. completed 2-digit value) happens
 * in `isFieldOverflowing`. Returns null for non-date/time masks, a no-op for the caller.
 */
export function findDateTimeFieldAt(
    maskExpression: string,
    position: number
): DateTimeField | null {
    const dateTimeTokens: readonly string[] = [
        MaskExpression.DAY,
        MaskExpression.MONTH,
        MaskExpression.HOURS,
        MaskExpression.HOUR,
        MaskExpression.MINUTE,
        MaskExpression.SECOND,
    ];
    let index = 0;
    while (index < maskExpression.length) {
        const token = maskExpression[index] ?? '';
        if (dateTimeTokens.includes(token)) {
            const next = maskExpression[index + 1];
            const isCombinedHour =
                (token === MaskExpression.HOURS || token === MaskExpression.HOUR) &&
                next === MaskExpression.HOUR;
            const end = next === '0' || isCombinedHour ? index + 2 : index + 1;
            if (position >= index && position <= end) {
                return {
                    token: token as DateTimeField['token'],
                    start: index,
                    end,
                };
            }
            index = end;
            continue;
        }
        index++;
    }
    return null;
}

/** Whether the mask has a day, month, hour, minute or second field. */
export function isDateTimeMask(maskExpression: string): boolean {
    for (let position = 0; position < maskExpression.length; position++) {
        if (findDateTimeFieldAt(maskExpression, position)) {
            return true;
        }
    }
    return false;
}

/**
 * Per-token overflow thresholds, mirroring the ones `generic-pattern.handler.ts`
 * already establishes (day 31, month 12, hour 23/12 w/ apm, minute/second 59) — kept
 * as a small local table rather than importing from the handler (see design's
 * Rejected Alternatives: the directive and the handler stay on separate sides of the
 * display/parse boundary).
 *
 * Two overflow shapes are checked, mirroring how the handler itself decides mid-type:
 * - `firstDigitValue`: when `position` is exactly one char past the field's start (the
 *   just-typed char is the field's first digit), an out-of-range first digit alone
 *   (e.g. month digit `3`, day digit `4`) already triggers the handler's own leadZero
 *   pad within this same keystroke — `el.value` hasn't caught up yet at this point in
 *   the pipeline, so the raw typed digit (`inputValue`) must be read instead.
 * - `fieldValue`: once both digits of the field are present in `el.value`, an
 *   out-of-range 2-digit value (e.g. day `33`, month `13`) triggers the shift directly.
 */
export function isFieldOverflowing(
    field: DateTimeField,
    position: number,
    elValue: string,
    inputValue: string,
    apm: boolean
): boolean {
    const fieldValue = Number(elValue.slice(field.start, field.end));
    const isFirstDigitOfField = position === field.start + 1;
    const firstDigitValue = isFirstDigitOfField
        ? Number(inputValue.slice(position - 1, position))
        : NaN;
    switch (field.token) {
        case MaskExpression.DAY:
            return (fieldValue > 31 && fieldValue < 40) || firstDigitValue > 3;
        case MaskExpression.MONTH:
            return fieldValue > 12 || firstDigitValue > 1;
        case MaskExpression.HOURS:
            return apm
                ? fieldValue > 12 || firstDigitValue > 9
                : fieldValue > 23 || firstDigitValue > 2;
        case MaskExpression.HOUR:
            return apm ? fieldValue > 12 : fieldValue > 23;
        case MaskExpression.MINUTE:
        case MaskExpression.SECOND:
            return fieldValue > 59 || firstDigitValue > 5;
        default:
            return false;
    }
}

/**
 * The caret of a leadZeroDateTime mask: moved two chars on when the field at `position`
 * overflows, as the handler pads a zero in front of it and adds the separator.
 */
export function leadZeroDateTimeCaret(
    maskExpression: string,
    position: number,
    elValue: string,
    inputValue: string,
    apm: boolean
): number {
    const field = findDateTimeFieldAt(maskExpression, position);
    return field && isFieldOverflowing(field, position, elValue, inputValue, apm)
        ? position + 2
        : position;
}

/**
 * The element value of a `d0/M0/0000` mask whose raw value already has its full length: the
 * character after the caret is dropped, so the typed one overwrites it. Returns null when the
 * edit does not meet that shape and the value stays. Kept for the edits `overwriteDateSlot` does
 * not take: a paste, and prefix, suffix and keepCharacterPositions masks.
 */
export function overwriteFullDateValue(
    maskExpression: string,
    inputValue: string,
    position: number,
    code: string
): string | null {
    if (
        inputValue.length >= maskExpression.length - 1 &&
        code !== MaskExpression.BACKSPACE &&
        code !== MaskExpression.DELETE &&
        maskExpression === MaskExpression.DAYS_MONTHS_YEARS &&
        position < 10
    ) {
        const inputSymbol = inputValue.slice(position - 1, position);
        return inputValue.slice(0, position - 1) + inputSymbol + inputValue.slice(position + 1);
    }
    return null;
}

/** The edit `overwriteDateSlot` made: the value, the caret after it and the last index it touches. */
export type DateOverwrite = { value: string; position: number; end: number };

/**
 * What `overwriteDateSlot` reads from the mask service. Structural, not a `Pick` of the service:
 * importing the service type here reorders unions in the emitted d.ts (see `userEdits`).
 */
export type DateSlotMask = {
    maskExpression: string;
    specialCharacters: string[] | readonly string[];
    leadZeroDateTime: boolean;
    apm: boolean;
    _checkSymbolMask: (inputSymbol: string, maskSymbol: string) => boolean;
};

const FIELD_MAX: Readonly<Record<DateTimeField['token'], number>> = {
    d: 31,
    M: 12,
    H: 23,
    h: 23,
    m: 59,
    s: 59,
};

/** The highest value of a date or time field. */
const fieldMax = (field: DateTimeField, apm: boolean): number =>
    apm && /[Hh]/.test(field.token) ? 12 : FIELD_MAX[field.token];

/** The field of fillable slot `target`; at a boundary of a separator-less mask, the next one. */
function dateFieldAtSlot(maskExpression: string, target: number): DateTimeField | null {
    const slot = findDateTimeFieldAt(maskExpression, target);
    return slot?.end === target ? findDateTimeFieldAt(maskExpression, target + 1) : slot;
}

/** Whether the field of slot `slotIdx` in `display` is above its maximum or a 00 day or month. */
export function isFieldOutOfRange(
    svc: Pick<DateSlotMask, 'maskExpression' | 'apm'>,
    display: string,
    slotIdx: number
): boolean {
    const field = dateFieldAtSlot(svc.maskExpression, slotIdx);
    if (!field) {
        return false;
    }
    const digits = display.slice(field.start, field.end);
    const n = Number(digits);
    return (
        /^\d+$/.test(digits) && (n > fieldMax(field, svc.apm) || (!n && /[dM]/.test(field.token)))
    );
}

/**
 * A character typed into a full-length date display overwrites the next digit slot, so the digits
 * that follow never shift. A digit that would push its field out of range, or replaces a whole
 * selected field, is repaired (`3` over `15` is `30`, `4` is `04`, or `4` without leadZeroDateTime).
 * Null leaves the edit to the caller. `before` is the display the keydown saw.
 */
export function overwriteDateSlot(
    svc: DateSlotMask,
    before: string,
    elValue: string,
    position: number
): DateOverwrite | null {
    const mask = svc.maskExpression;
    const start = position - 1;
    // A value longer than the mask is read as one character typed at the caret of a full display.
    const display =
        elValue.length > mask.length ? elValue.slice(0, start) + elValue.slice(position) : before;
    // The end of the span the typed character replaced in `display` (a caret replaces nothing).
    const selEnd = display.length - elValue.length + position;
    const typed = elValue.charAt(start);
    const target = nextFillableIndex(mask, svc.specialCharacters, start);
    const field = dateFieldAtSlot(mask, target);
    if (
        !/[dM]/.test(mask) ||
        display.length !== mask.length ||
        // under showMaskTyped a placeholder slot takes the digit in sequence, not in place
        !/\d/.test(display.charAt(target)) ||
        // a pair inserted into a short display is no typed digit (#1714)
        [...mask].some((c, i) => svc.specialCharacters.includes(c) && display.charAt(i) !== c) ||
        // a stale `before` (the keydown of the edit never fired): not the display of the selection
        elValue !== display.slice(0, start) + typed + display.slice(selEnd) ||
        // a selection stays within one field
        selEnd > (field?.end ?? target + 1)
    ) {
        return null;
    }
    if (!svc._checkSymbolMask(typed, mask.charAt(target))) {
        // A key the slot rejects changes nothing, a selection included: `end` -1 touches no index.
        return { value: display, position: start, end: -1 };
    }
    let value = display.slice(0, target) + typed + display.slice(target + 1);
    let caret = target + 1;
    if (field) {
        // A selection past the slot is a whole field.
        if (isFieldOutOfRange(svc, value, target) || selEnd > caret) {
            // a lone 0 without leadZeroDateTime waits for its mate
            if (!svc.leadZeroDateTime && typed === '0') {
                return null;
            }
            // a tens digit keeps its slot and zero-fills (`3` over `15` is `30`)
            const tens = target === field.start && Number(typed) * 10 <= fieldMax(field, svc.apm);
            const whole = tens ? typed + '0' : svc.leadZeroDateTime ? '0' + typed : typed;
            value = display.slice(0, field.start) + whole + display.slice(field.end);
            caret = tens ? caret : field.start + whole.length;
        }
    }
    return { value, position: caret, end: caret };
}

/** The span of `value` that the user's last edit (keystroke, deletion, paste) changed. */
export type UserEdit = { value: string; start: number; end: number };

// Keyed by the mask service, kept outside it so the published API carries no field for it. The key
// is typed `object`: importing the service type here reorders unions in the emitted d.ts.
const userEdits = new WeakMap<object, UserEdit>();

/**
 * Records the edit the directive is about to mask, `null` for an edit that changed no field. Only an
 * edit may turn a typed `00` day, month or 12-hour hour into `01` (leadZeroDateTime): a render of any
 * other value, e.g. a write or a re-render, has none.
 */
export function setUserEdit(service: object, edit: UserEdit | null): void {
    if (edit) {
        userEdits.set(service, edit);
    } else {
        userEdits.delete(service);
    }
}

/** The recorded edit when `inputValue` is the value it produced, else null. */
export function userEditFor(service: object, inputValue: string): UserEdit | null {
    const edit = userEdits.get(service);
    return edit?.value === inputValue ? edit : null;
}
