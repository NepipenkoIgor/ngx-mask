import { inject, Injectable } from '@angular/core';
import type { DecimalMarkerChar, NgxMaskConfig } from './ngx-mask.config';
import { NGX_MASK_CONFIG } from './ngx-mask.config';
import { MaskExpression } from './ngx-mask-expression.enum';
import { dispatchMaskHandler } from './mask-handlers/mask-handlers.registry';
import type { MaskHandlerState } from './mask-handlers/mask-handler.types';

@Injectable()
export class NgxMaskApplierService {
    protected _config = inject<NgxMaskConfig>(NGX_MASK_CONFIG);

    public dropSpecialCharacters: NgxMaskConfig['dropSpecialCharacters'] =
        this._config.dropSpecialCharacters;

    public hiddenInput: NgxMaskConfig['hiddenInput'] = this._config.hiddenInput;

    public clearIfNotMatch: NgxMaskConfig['clearIfNotMatch'] = this._config.clearIfNotMatch;

    public specialCharacters: NgxMaskConfig['specialCharacters'] = this._config.specialCharacters;

    public patterns: NgxMaskConfig['patterns'] = this._config.patterns;

    public prefix: NgxMaskConfig['prefix'] = this._config.prefix;

    public suffix: NgxMaskConfig['suffix'] = this._config.suffix;

    public thousandSeparator: NgxMaskConfig['thousandSeparator'] = this._config.thousandSeparator;

    public decimalMarker: NgxMaskConfig['decimalMarker'] = this._config.decimalMarker;

    public customPattern!: NgxMaskConfig['patterns'];

    public showMaskTyped: NgxMaskConfig['showMaskTyped'] = this._config.showMaskTyped;

    public placeHolderCharacter: NgxMaskConfig['placeHolderCharacter'] =
        this._config.placeHolderCharacter;

    public validation: NgxMaskConfig['validation'] = this._config.validation;

    public separatorLimit: NgxMaskConfig['separatorLimit'] = this._config.separatorLimit;

    public allowNegativeNumbers: NgxMaskConfig['allowNegativeNumbers'] =
        this._config.allowNegativeNumbers;

    public leadZeroDateTime: NgxMaskConfig['leadZeroDateTime'] = this._config.leadZeroDateTime;

    public leadZero: NgxMaskConfig['leadZero'] = this._config.leadZero;

    public typeFromDecimals: NgxMaskConfig['typeFromDecimals'] = this._config.typeFromDecimals;

    public apm: NgxMaskConfig['apm'] = this._config.apm;

    public inputTransformFn: NgxMaskConfig['inputTransformFn'] | null =
        this._config.inputTransformFn;

    public outputTransformFn: NgxMaskConfig['outputTransformFn'] | null =
        this._config.outputTransformFn;

    public keepCharacterPositions: NgxMaskConfig['keepCharacterPositions'] =
        this._config.keepCharacterPositions;

    public instantPrefix: NgxMaskConfig['instantPrefix'] = this._config.instantPrefix;

    public triggerOnMaskChange: NgxMaskConfig['triggerOnMaskChange'] =
        this._config.triggerOnMaskChange;

    protected _shift = new Set<number>();

    public plusOnePosition = false;

    public maskExpression = '';

    public actualValue = '';

    public showKeepCharacterExp = '';

    public shownMaskExpression: NgxMaskConfig['shownMaskExpression'] =
        this._config.shownMaskExpression;

    public deletedSpecialCharacter = false;

    /**
     * Whether we are currently in writeValue function, in this case when applying the mask we don't want to trigger onChange function,
     * since writeValue should be a one way only process of writing the DOM value based on the Angular model value.
     */
    public writingValue = false;

    public ipError?: boolean;

    public cpfCnpjError?: boolean;

    public applyMask(
        inputValue: string | object | boolean | null | undefined,
        maskExpression: string,
        position = 0,
        justPasted = false,
        backspaced = false,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        cb: (actualShift: number, backspaceShift: boolean) => void = () => {}
    ): string {
        if (!maskExpression || typeof inputValue !== 'string') {
            return MaskExpression.EMPTY_STRING;
        }
        let cursor = 0;
        let result = '';
        const multi = false;
        let backspaceShift = false;
        let shift = 1;
        let stepBack = false;
        let processedValue = inputValue;
        let processedPosition = position;

        const startsWithPrefix = processedValue.slice(0, this.prefix.length) === this.prefix;
        // On paste with showMaskTyped, NgxMaskService.applyMask has already removed the
        // prefix via removeMask() before delegating here (unless the value consisted of
        // the prefix alone, in which case the raw value falls through). Stripping again
        // would eat leading characters that merely look like the prefix (#1551).
        const prefixAlreadyRemovedByCaller =
            justPasted &&
            this.showMaskTyped &&
            this.placeHolderCharacter.length === 1 &&
            !this.leadZeroDateTime &&
            processedValue !== this.prefix;

        if (startsWithPrefix && !prefixAlreadyRemovedByCaller) {
            processedValue = processedValue.slice(this.prefix.length);
        }
        if (!!this.suffix && processedValue.length > 0) {
            processedValue = this.checkAndRemoveSuffix(processedValue);
        }
        if (processedValue === '(' && this.prefix) {
            processedValue = '';
        }
        const inputArray: string[] = processedValue.toString().split(MaskExpression.EMPTY_STRING);
        if (
            this.allowNegativeNumbers &&
            processedValue.slice(cursor, cursor + 1) === MaskExpression.MINUS
        ) {
            result += processedValue.slice(cursor, cursor + 1);
        }
        const arr: string[] = [];
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < processedValue.length; i++) {
            if (processedValue[i]?.match('\\d')) {
                arr.push(processedValue[i] ?? MaskExpression.EMPTY_STRING);
            }
        }

        // Per-mask-type dispatch (IP/CPF_CNPJ pre-processors → generic loop; PERCENT and
        // SEPARATOR terminal handlers; generic pattern loop as fallback). See
        // ./mask-handlers/mask-handlers.registry.ts.
        const state: MaskHandlerState = {
            processedValue,
            processedPosition,
            cursor,
            result,
            multi,
            backspaceShift,
            shift,
            stepBack,
            maskExpression,
        };
        const resolved = dispatchMaskHandler(this, state, {
            inputValue,
            position,
            justPasted,
            backspaced,
            cb,
            inputArray,
            arr,
            startsWithPrefix,
            prefixAlreadyRemovedByCaller,
        });
        if (typeof resolved.earlyReturn === 'string') {
            return resolved.earlyReturn;
        }
        processedValue = resolved.processedValue;
        processedPosition = resolved.processedPosition;
        cursor = resolved.cursor;
        result = resolved.result;
        backspaceShift = resolved.backspaceShift;
        shift = resolved.shift;
        stepBack = resolved.stepBack;
        // eslint-disable-next-line no-param-reassign
        maskExpression = resolved.maskExpression;
        if (
            result[processedPosition - 1] &&
            result.length + 1 === maskExpression.length &&
            this.specialCharacters.indexOf(
                maskExpression[maskExpression.length - 1] ?? MaskExpression.EMPTY_STRING
            ) !== -1
        ) {
            result += maskExpression[maskExpression.length - 1];
        }
        let newPosition: number = processedPosition + 1;

        while (this._shift.has(newPosition)) {
            shift++;
            newPosition++;
        }

        let actualShift: number =
            justPasted && !maskExpression.startsWith(MaskExpression.SEPARATOR)
                ? cursor
                : this._shift.has(processedPosition)
                  ? shift
                  : 0;
        if (stepBack) {
            actualShift--;
        }

        cb(actualShift, backspaceShift);
        if (shift < 0) {
            this._shift.clear();
        }
        let onlySpecial = false;
        if (backspaced) {
            onlySpecial = inputArray.every((char) => this.specialCharacters.includes(char));
        }

        let res = `${this.prefix}${onlySpecial ? MaskExpression.EMPTY_STRING : result}${
            this.showMaskTyped ? '' : this.suffix
        }`;

        if (result.length === 0) {
            res = this.instantPrefix ? `${this.prefix}${result}` : `${result}`;
        }

        const isSpecialCharacterMaskFirstSymbol =
            processedValue.length === 1 &&
            this.specialCharacters.includes(maskExpression[0] as string) &&
            processedValue !== maskExpression[0];

        if (isSpecialCharacterMaskFirstSymbol) {
            // The mask may start with several literal special characters in a row
            // (e.g. '+(000) 000-0000'). A single typed character must be checked
            // against the first PATTERN position of the mask, not literally against
            // index 1 — otherwise a valid digit is rejected and the leading literals
            // are never auto-filled (#1498).
            let firstPatternIndex = 1;
            while (
                firstPatternIndex < maskExpression.length &&
                this.specialCharacters.includes(maskExpression[firstPatternIndex] as string)
            ) {
                firstPatternIndex++;
            }
            if (
                !this._checkSymbolMask(
                    processedValue,
                    maskExpression[firstPatternIndex] ?? MaskExpression.EMPTY_STRING
                )
            ) {
                return '';
            }
        }

        if (result.includes(MaskExpression.MINUS) && this.prefix && this.allowNegativeNumbers) {
            if (backspaced && result === MaskExpression.MINUS) {
                return '';
            }
            res = `${MaskExpression.MINUS}${this.prefix}${result
                .split(MaskExpression.MINUS)
                .join(MaskExpression.EMPTY_STRING)}${this.suffix}`;
        }
        return res;
    }

    public _findDropSpecialChar(inputSymbol: string): undefined | string {
        if (Array.isArray(this.dropSpecialCharacters)) {
            return this.dropSpecialCharacters.find((val: string) => val === inputSymbol);
        }
        return this._findSpecialChar(inputSymbol);
    }

    public _findSpecialChar(inputSymbol: string): undefined | string {
        return this.specialCharacters.find((val: string) => val === inputSymbol);
    }

    public _checkSymbolMask(inputSymbol: string, maskSymbol: string): boolean {
        this.patterns = this.customPattern ? this.customPattern : this.patterns;
        return (
            (this.patterns[maskSymbol]?.pattern &&
                this.patterns[maskSymbol]?.pattern.test(inputSymbol)) ??
            false
        );
    }

    protected _formatWithSeparators = (
        str: string,
        thousandSeparatorChar: string,
        decimalChars: string | string[],
        precision: number
    ) => {
        let x: string[];
        let decimalChar: string;

        if (Array.isArray(decimalChars)) {
            const regExp = new RegExp(
                decimalChars.map((v) => ('[\\^$.|?*+()'.indexOf(v) >= 0 ? `\\${v}` : v)).join('|')
            );
            x = str.split(regExp);
            decimalChar = str.match(regExp)?.[0] ?? MaskExpression.EMPTY_STRING;
        } else {
            x = str.split(decimalChars);
            decimalChar = decimalChars;
        }
        const decimals: string =
            x.length > 1 ? `${decimalChar}${x[1]}` : MaskExpression.EMPTY_STRING;
        let res: string = x[0] ?? MaskExpression.EMPTY_STRING;
        const separatorLimit: string = this.separatorLimit.replace(
            /\s/g,
            MaskExpression.EMPTY_STRING
        );
        if (separatorLimit && +separatorLimit) {
            if (res[0] === MaskExpression.MINUS) {
                res = `-${res.slice(1, res.length).slice(0, separatorLimit.length)}`;
            } else {
                res = res.slice(0, separatorLimit.length);
            }
        }
        res = this._applyThousandGrouping(res, thousandSeparatorChar);

        if (typeof precision === 'undefined') {
            return res + decimals;
        } else if (precision === 0) {
            return res;
        }
        return res + decimals.substring(0, precision + 1);
    };

    /**
     * Formats a value for the `typeFromDecimals` mode: every digit of the raw value is
     * read as one integer that is then split `precision` digits from the right
     * (ATM/calculator style). Non-digit characters are ignored, so plain typing,
     * mid-string edits and backspace all reduce to "digits shifted through the
     * decimal marker".
     */
    protected _formatFromDecimals(value: string, precision: number, decimalMarker: string): string {
        const negative = this.allowNegativeNumbers && value.startsWith(MaskExpression.MINUS);
        let digits = value.replace(/\D+/g, MaskExpression.EMPTY_STRING).replace(/^0+/, '');
        if (!digits) {
            return negative ? MaskExpression.MINUS : MaskExpression.EMPTY_STRING;
        }
        const separatorLimit: string = this.separatorLimit.replace(
            /\s/g,
            MaskExpression.EMPTY_STRING
        );
        if (separatorLimit && +separatorLimit) {
            // Dropping the overflow from the right rejects the most recently typed
            // digits once the integer part has reached the configured limit.
            digits = digits.slice(0, separatorLimit.length + precision);
        }
        digits = digits.padStart(precision + 1, MaskExpression.NUMBER_ZERO);
        const integerPart = this._applyThousandGrouping(
            digits.slice(0, digits.length - precision),
            this.thousandSeparator
        );
        const decimalPart = digits.slice(digits.length - precision);
        return `${negative ? MaskExpression.MINUS : MaskExpression.EMPTY_STRING}${integerPart}${decimalMarker}${decimalPart}`;
    }

    /** Inserts `separator` between every 3-digit group of an integer-digit string. */
    private _applyThousandGrouping(digits: string, separator: string): string {
        const rgx = /(\d+)(\d{3})/;
        let grouped = digits;
        while (separator && rgx.test(grouped)) {
            grouped = grouped.replace(rgx, '$1' + separator + '$2');
        }
        return grouped;
    }

    protected percentage = (str: string): boolean => {
        const sanitizedStr = str.replace(',', '.');
        const value = Number(
            this.allowNegativeNumbers && str.includes(MaskExpression.MINUS)
                ? sanitizedStr.slice(1, str.length)
                : sanitizedStr
        );

        return !isNaN(value) && value >= 0 && value <= 100;
    };

    public getPrecision = (maskExpression: string): number => {
        const x: string[] = maskExpression.split(MaskExpression.DOT);
        if (x.length > 1) {
            return Number(x[x.length - 1]);
        }

        return Infinity;
    };

    private checkAndRemoveSuffix = (inputValue: string): string => {
        for (let i = this.suffix?.length - 1; i >= 0; i--) {
            const substr = this.suffix.substring(i, this.suffix?.length);
            if (
                inputValue.endsWith(substr) &&
                i !== this.suffix?.length - 1 &&
                // A partial suffix tail (i > 0) that makes up the WHOLE value is a
                // leftover of the displayed suffix only when the previous rendered
                // value ended with the suffix AND the edit shrank the value to (or
                // below) the old value-part length, i.e. it was a deletion of the
                // suffix head. Otherwise it is fresh user input that merely collides
                // with the suffix text and must be kept (#1495).
                (i === 0 ||
                    inputValue.length > substr.length ||
                    (this.actualValue.endsWith(this.suffix) &&
                        inputValue.length <= this.actualValue.length - this.suffix.length)) &&
                (i - 1 < 0 ||
                    !inputValue.endsWith(this.suffix.substring(i - 1, this.suffix?.length)))
            ) {
                return inputValue.slice(0, inputValue.length - substr.length);
            }
        }
        return inputValue;
    };

    protected checkInputPrecision = (inputValue: string, precision: number): string => {
        let processedInputValue = inputValue;

        if (precision < Infinity) {
            const decimalMarker = this._activeDecimalMarker(inputValue);
            const precisionRegEx = new RegExp(
                this._charToRegExpExpression(decimalMarker) + `\\d{${precision}}.*$`
            );
            const precisionMatch: RegExpMatchArray | null =
                processedInputValue.match(precisionRegEx);
            const precisionMatchLength: number = (precisionMatch && precisionMatch[0]?.length) ?? 0;
            if (precisionMatchLength - 1 > precision) {
                const diff = precisionMatchLength - 1 - precision;

                processedInputValue = processedInputValue.substring(
                    0,
                    processedInputValue.length - diff
                );
            }
            if (
                precision === 0 &&
                this._compareOrIncludes(
                    processedInputValue[processedInputValue.length - 1],
                    decimalMarker,
                    this.thousandSeparator
                )
            ) {
                processedInputValue = processedInputValue.substring(
                    0,
                    processedInputValue.length - 1
                );
            }
        }
        return processedInputValue;
    };

    protected _stripToDecimal(str: string): string {
        const isDecimalMarkerChar = (char: string): char is DecimalMarkerChar =>
            char === MaskExpression.DOT || char === MaskExpression.COMMA;

        return str
            .split(MaskExpression.EMPTY_STRING)
            .filter((i: string, idx: number) => {
                const isDecimalMarker =
                    typeof this.decimalMarker === 'string'
                        ? i === this.decimalMarker
                        : isDecimalMarkerChar(i) && this.decimalMarker.includes(i);
                return (
                    i.match('^-?\\d') ||
                    i === this.thousandSeparator ||
                    isDecimalMarker ||
                    (i === MaskExpression.MINUS && idx === 0 && this.allowNegativeNumbers)
                );
            })
            .join(MaskExpression.EMPTY_STRING);
    }

    protected _charToRegExpExpression(char: string): string {
        // if (Array.isArray(char)) {
        // 	return char.map((v) => ('[\\^$.|?*+()'.indexOf(v) >= 0 ? `\\${v}` : v)).join('|');
        // }
        if (char) {
            const charsToEscape = '[\\^$.|?*+()';
            return char === ' ' ? '\\s' : charsToEscape.indexOf(char) >= 0 ? `\\${char}` : char;
        }
        return char;
    }

    protected _shiftStep(cursor: number) {
        this._shift.add(cursor + this.prefix.length || 0);
    }

    protected _compareOrIncludes<T>(value: T, comparedValue: T | T[], excludedValue: T): boolean {
        return Array.isArray(comparedValue)
            ? comparedValue.filter((v) => v !== excludedValue).includes(value)
            : value === comparedValue;
    }

    protected _validIP(valuesIP: string[]): boolean {
        return !(
            valuesIP.length === 4 &&
            !valuesIP.some((value: string, index: number) => {
                if (valuesIP.length !== index + 1) {
                    return value === MaskExpression.EMPTY_STRING || Number(value) > 255;
                }
                return value === MaskExpression.EMPTY_STRING || Number(value.substring(0, 3)) > 255;
            })
        );
    }

    /**
     * The single rule for "which decimal marker is active": the configured marker, or — for an
     * array — the first configured marker present in `value` that is not the thousandSeparator,
     * else the first configured marker that is not the thousandSeparator (#1653).
     */
    protected _activeDecimalMarker(value: string): DecimalMarkerChar {
        if (!Array.isArray(this.decimalMarker)) {
            return this.decimalMarker;
        }
        const candidates = this.decimalMarker.filter((dm) => dm !== this.thousandSeparator);
        return (
            candidates.find((dm) => value.includes(dm)) ?? candidates[0] ?? this.decimalMarker[0]
        );
    }

    protected _splitPercentZero(value: string): string {
        if (value === MaskExpression.MINUS && this.allowNegativeNumbers) {
            return value;
        }
        const decimal = this._activeDecimalMarker(value);
        const decimalIndex = value.indexOf(decimal);
        const emptyOrMinus =
            this.allowNegativeNumbers && value.includes(MaskExpression.MINUS) ? '-' : '';
        if (decimalIndex === -1) {
            const parsedValue = parseInt(emptyOrMinus ? value.slice(1, value.length) : value, 10);
            return isNaN(parsedValue)
                ? MaskExpression.EMPTY_STRING
                : `${emptyOrMinus}${parsedValue}`;
        } else {
            const integerPart = parseInt(value.replace('-', '').substring(0, decimalIndex), 10);
            const decimalPart = value.substring(decimalIndex + 1);
            const integerString = isNaN(integerPart) ? '' : integerPart.toString();

            return integerString === MaskExpression.EMPTY_STRING
                ? MaskExpression.EMPTY_STRING
                : `${emptyOrMinus}${integerString}${decimal}${decimalPart}`;
        }
    }

    protected _findFirstNonZeroAndDecimalIndex(inputString: string, decimalMarker: '.' | ',') {
        let decimalMarkerIndex: number | null = null;
        let nonZeroIndex: number | null = null;

        for (let i = 0; i < inputString.length; i++) {
            const char = inputString[i];

            if (char === decimalMarker && decimalMarkerIndex === null) {
                decimalMarkerIndex = i;
            }

            if (char && char >= '1' && char <= '9' && nonZeroIndex === null) {
                nonZeroIndex = i;
            }

            if (decimalMarkerIndex !== null && nonZeroIndex !== null) {
                break;
            }
        }

        return {
            decimalMarkerIndex,
            nonZeroIndex,
        };
    }
}
