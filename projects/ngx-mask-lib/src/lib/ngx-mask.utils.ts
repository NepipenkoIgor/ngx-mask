import { MaskExpression } from './ngx-mask-expression.enum';
import type { DecimalMarkerChar, NgxMaskConfig } from './ngx-mask.config';

/**
 * Escapes every character that has a special meaning in a regular expression. An unset
 * (null/undefined) value, e.g. from an unset dynamic config, escapes to the empty string.
 */
export function escapeRegExp(value: string | null | undefined): string {
    return (value ?? '').replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
}

/** The first index at or after `index` whose mask character is not a special character. */
export function nextFillableIndex(
    maskExpression: string,
    specialCharacters: readonly string[],
    index: number
): number {
    let maskIdx = index;
    while (
        maskIdx < maskExpression.length &&
        specialCharacters.includes(maskExpression[maskIdx] ?? '')
    ) {
        maskIdx += 1;
    }
    return maskIdx;
}

/** Returns the decimal digits of `value`, in order. */
export function digitsOf(value: string): string[] {
    return value.match(/\d/g) ?? [];
}

/** A thousandSeparator holding a digit is ignored (becomes empty); any other value passes through. */
export function ignoreDigitSeparator<T extends string | null | undefined>(separator: T): T | '' {
    return separator && digitsOf(separator).length ? '' : separator;
}

/**
 * The single rule for "which decimal marker is active": the configured marker, or - for an
 * array - the first configured marker present in `value` that is not the thousandSeparator,
 * else the first configured marker that is not the thousandSeparator (#1653).
 */
export function activeDecimalMarker(
    value: string,
    decimalMarker: NgxMaskConfig['decimalMarker'],
    thousandSeparator: string
): DecimalMarkerChar {
    if (!Array.isArray(decimalMarker)) {
        return decimalMarker;
    }
    const candidates = decimalMarker.filter((dm) => dm !== thousandSeparator);
    return candidates.find((dm) => value.includes(dm)) ?? candidates[0] ?? decimalMarker[0];
}

/** Whether `value` writes its decimals after a comma, under the configured decimalMarker. */
export function usesCommaDecimal(
    value: string,
    decimalMarker: NgxMaskConfig['decimalMarker'],
    thousandSeparator: string
): boolean {
    return activeDecimalMarker(value, decimalMarker, thousandSeparator) === ',';
}

/**
 * Turns a string already in the display format (`1.234,5` under thousandSeparator '.' and
 * decimalMarker ',') into the plain `1234.5`. Only a string holding BOTH the active
 * thousandSeparator and the active decimal marker is read that way; anything else (`1234567.5`,
 * `1.5`) keeps its dot-decimal reading.
 */
export function displayToPlainDecimal(
    value: string,
    decimalMarker: NgxMaskConfig['decimalMarker'],
    thousandSeparator: string
): string {
    const marker = activeDecimalMarker(value, decimalMarker, thousandSeparator);
    if (
        !thousandSeparator ||
        marker === thousandSeparator ||
        !value.includes(thousandSeparator) ||
        !value.includes(marker)
    ) {
        return value;
    }
    return value.split(thousandSeparator).join('').replace(marker, '.');
}

/**
 * Whether `value` holds a `*`, the symbol that stands for a hidden character. A `*` thousandSeparator
 * of a separator mask is plain grouping text there, not a hidden character.
 */
export function containsStarSymbol(
    value: string,
    maskExpression: string,
    thousandSeparator: string
): boolean {
    return (
        value.includes(MaskExpression.SYMBOL_STAR) &&
        !(
            maskExpression.startsWith(MaskExpression.SEPARATOR) &&
            thousandSeparator?.includes(MaskExpression.SYMBOL_STAR)
        )
    );
}

type SeparatorFormat = Pick<
    NgxMaskConfig,
    'thousandSeparator' | 'decimalMarker' | 'prefix' | 'suffix'
>;

/**
 * Re-expresses a separator value written with the `previous` thousandSeparator/decimalMarker in
 * the `current` ones, so reconfiguring a populated control keeps its number (`1 234.5` stays
 * 1234.5 as `1.234,5`) instead of reading the old markers with the new rules. The previous
 * prefix and suffix are set aside first: they may contain the very characters being swapped.
 */
export function retargetSeparatorValue(
    value: string,
    previous: SeparatorFormat,
    current: SeparatorFormat
): string {
    const prefix = previous.prefix && value.startsWith(previous.prefix) ? previous.prefix : '';
    const suffix =
        previous.suffix && value.length >= prefix.length + previous.suffix.length
            ? value.endsWith(previous.suffix)
                ? previous.suffix
                : ''
            : '';
    const number = value.slice(prefix.length, value.length - suffix.length);
    const previousMarker = activeDecimalMarker(
        number,
        previous.decimalMarker,
        previous.thousandSeparator ?? ''
    );
    const ungrouped = previous.thousandSeparator
        ? number.split(previous.thousandSeparator).join('')
        : number;
    const retargeted = ungrouped.replace(
        previousMarker,
        activeDecimalMarker(ungrouped, current.decimalMarker, current.thousandSeparator)
    );
    return `${prefix ? current.prefix : ''}${retargeted}${suffix ? current.suffix : ''}`;
}
