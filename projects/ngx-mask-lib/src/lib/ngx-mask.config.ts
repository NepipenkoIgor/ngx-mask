import { EventEmitter, InjectionToken } from '@angular/core';
import { MaskExpression } from './ngx-mask-expression.enum';

export type InputTransformFn = (value: unknown) => string | number;

export type OutputTransformFn = (value: string | number | undefined | null) => unknown;

/** Single decimal marker character accepted when `decimalMarker` is given as an array. */
export type DecimalMarkerChar = '.' | ',';

export type NgxMaskConfig = {
    suffix: string;
    prefix: string;
    thousandSeparator: string;
    decimalMarker: DecimalMarkerChar | [DecimalMarkerChar, DecimalMarkerChar];
    clearIfNotMatch: boolean;
    showMaskTyped: boolean;
    placeHolderCharacter: string;
    shownMaskExpression: string;
    specialCharacters: string[] | readonly string[];
    dropSpecialCharacters: boolean | string[] | readonly string[];
    hiddenInput: boolean;
    validation: boolean;
    instantPrefix: boolean;
    separatorLimit: string;
    apm: boolean;
    allowNegativeNumbers: boolean;
    leadZeroDateTime: boolean;
    leadZero: boolean;
    /**
     * Opt-in "banking" typing mode for separator masks with a fixed precision
     * (`separator.N`, N > 0): typed digits fill the value from the decimal end,
     * ATM/calculator style (5 -> 0.05 -> 0.57 -> 5.73); backspace shifts digits
     * back to the right. Pasted and model-written values keep the regular
     * separator formatting. Config-only option (provideNgxMask / pipe config) —
     * it has no directive input.
     */
    typeFromDecimals: boolean;
    triggerOnMaskChange: boolean;
    keepCharacterPositions: boolean;
    inputTransformFn: InputTransformFn;
    outputTransformFn: OutputTransformFn;
    maskFilled: EventEmitter<void>;
    /**
     * User-defined named mask aliases resolved at the DI-config level (static per injector).
     * When the `mask` input (or pipe mask argument) exactly matches an alias key, the aliased
     * expression is substituted before any other mask processing (including `||` multi-masks).
     * Alias keys must not shadow built-in tokens (IP, CPF_CNPJ, CPF_CNPJ_ALPHA, ...) — such
     * aliases are ignored with a one-time console warning.
     */
    maskAliases: Record<string, string>;
    /**
     * When set, this raw value is written through the regular mask pipeline on blur
     * whenever the control's unmasked value is empty (covers '', a bare prefix/suffix and
     * the showMaskTyped skeleton): the display shows the masked default and the model
     * receives the usual output (dropSpecialCharacters/outputTransformFn applied). The
     * write keeps the control's pristine state. `null` (default) keeps current behavior.
     */
    defaultValueOnBlur: string | null;
    patterns: Record<
        string,
        {
            pattern: RegExp;
            optional?: boolean;
            symbol?: string;
        }
    >;
};

export type NgxMaskOptions = Partial<NgxMaskConfig>;
export const NGX_MASK_CONFIG = new InjectionToken<NgxMaskConfig>('ngx-mask config');
export const NEW_CONFIG = new InjectionToken<NgxMaskConfig>('new ngx-mask config');
export const INITIAL_CONFIG = new InjectionToken<NgxMaskConfig>('initial ngx-mask config');

export const initialConfig: NgxMaskConfig = {
    suffix: '',
    prefix: '',
    thousandSeparator: ' ',
    decimalMarker: ['.', ','],
    clearIfNotMatch: false,
    showMaskTyped: false,
    instantPrefix: false,
    placeHolderCharacter: '_',
    dropSpecialCharacters: true,
    hiddenInput: false,
    shownMaskExpression: '',
    separatorLimit: '',
    allowNegativeNumbers: false,
    validation: true,
    specialCharacters: ['-', '/', '(', ')', '.', ':', ' ', '+', ',', '@', '[', ']', '"', "'"],
    leadZeroDateTime: false,
    apm: false,
    leadZero: false,
    typeFromDecimals: false,
    keepCharacterPositions: false,
    triggerOnMaskChange: false,
    inputTransformFn: (value: unknown) => value as string | number,
    outputTransformFn: (value: string | number | undefined | null) => value,
    maskFilled: new EventEmitter<void>(),
    maskAliases: {},
    defaultValueOnBlur: null,
    patterns: {
        '0': {
            pattern: /\d/,
        },
        '9': {
            pattern: /\d/,
            optional: true,
        },
        X: {
            pattern: /\d/,
            symbol: '*',
        },
        A: {
            pattern: /[a-zA-Z0-9]/,
        },
        S: {
            pattern: /[a-zA-Z]/,
        },
        U: {
            pattern: /[A-Z]/,
        },
        L: {
            pattern: /[a-z]/,
        },
        d: {
            pattern: /\d/,
            symbol: '*',
        },
        m: {
            pattern: /\d/,
        },
        M: {
            pattern: /\d/,
            symbol: '*',
        },
        H: {
            pattern: /\d/,
        },
        h: {
            pattern: /\d/,
        },
        s: {
            pattern: /\d/,
        },
    },
};

/**
 * Built-in mask tokens dispatched by exact equality (IP, CPF_CNPJ, CPF_CNPJ_ALPHA, email)
 * or by a reserved prefix (separator, percent) inside the mask pipeline. User-defined
 * aliases must not shadow them — substituting e.g. 'IP' early would break the built-in
 * exact-equality dispatch deep in the applier.
 */
const RESERVED_MASK_TOKENS: ReadonlySet<string> = new Set([
    MaskExpression.IP,
    MaskExpression.CPF_CNPJ,
    MaskExpression.CPF_CNPJ_ALPHA,
    MaskExpression.EMAIL_MASK,
    MaskExpression.SEPARATOR,
    MaskExpression.PERCENT,
]);

/** Tracks alias keys already warned about, so the shadowing warning fires once per key. */
const warnedShadowedAliases = new Set<string>();

/**
 * Resolves a user-defined mask alias to its mask expression. Returns the input expression
 * unchanged when no alias matches or when the alias key shadows a built-in token (in which
 * case a console warning is emitted once per key and the built-in wins).
 */
export function resolveMaskAlias(
    maskExpression: string | null | undefined,
    maskAliases: Record<string, string> | undefined
): string {
    const expression = maskExpression ?? '';
    if (!expression || !maskAliases) {
        return expression;
    }
    const aliased = maskAliases[expression];
    if (typeof aliased !== 'string') {
        return expression;
    }
    if (RESERVED_MASK_TOKENS.has(expression)) {
        if (!warnedShadowedAliases.has(expression)) {
            warnedShadowedAliases.add(expression);
            // eslint-disable-next-line no-console
            console.warn(
                `ngx-mask: mask alias "${expression}" shadows a built-in mask token and is ignored. Rename the alias.`
            );
        }
        return expression;
    }
    return aliased;
}

export const timeMasks: string[] = [
    MaskExpression.HOURS_MINUTES_SECONDS,
    MaskExpression.HOURS_MINUTES,
    MaskExpression.MINUTES_SECONDS,
];

export const withoutValidation: string[] = [
    MaskExpression.PERCENT,
    MaskExpression.HOURS_HOUR,
    MaskExpression.SECONDS,
    MaskExpression.MINUTES,
    MaskExpression.SEPARATOR,
    MaskExpression.DAYS_MONTHS_YEARS,
    MaskExpression.DAYS_MONTHS,
    MaskExpression.DAYS,
    MaskExpression.MONTHS,
];
