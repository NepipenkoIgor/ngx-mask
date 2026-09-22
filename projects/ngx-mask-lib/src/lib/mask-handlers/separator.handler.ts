import { MaskExpression } from '../ngx-mask-expression.enum';
import type { MaskHandlerFn } from './mask-handler.types';

/**
 * SEPARATOR handler (moved verbatim from applyMask, original lines 219-580).
 * Discriminator: `maskExpression.startsWith(MaskExpression.SEPARATOR)`. Produces the
 * final `result` for this call.
 *
 * Two sequential zero-handling stages are preserved together, in original relative
 * order (CODEBASE_NOTES.md #13): the `if (backspaced)` guard block and the
 * precision-0 leading-zero stripper.
 *
 * The `typeFromDecimals` sub-case (#733/#1414/#1315) early-returns the final string
 * via `state.earlyReturn` after calling `cb()` — this must bypass the shared
 * post-processing in `applyMask` exactly, or the caret-pin `cb()` contract breaks.
 */
export const separatorHandler: MaskHandlerFn = function (state, params) {
    const {
        backspaced,
        justPasted,
        startsWithPrefix,
        prefixAlreadyRemovedByCaller,
        cb,
        inputValue,
    } = params;
    let { processedValue, processedPosition, backspaceShift, shift, stepBack } = state;
    let result: string;

    if (
        processedValue.match('[wа-яА-Я]') ||
        processedValue.match('[ЁёА-я]') ||
        processedValue.match('[a-z]|[A-Z]') ||
        processedValue.match(/[-@#!$%\\^&*()_£¬'+|~=`{}\]:";<>.?/]/) ||
        processedValue.match('[^A-Za-z0-9,]')
    ) {
        processedValue = this._stripToDecimal(processedValue);
    }

    const precision: number = this.getPrecision(state.maskExpression);
    let decimalMarker = this.decimalMarker;

    if (Array.isArray(this.decimalMarker)) {
        decimalMarker = this._activeDecimalMarker(this.actualValue);
    }

    // Issues #733/#1414/#1315: opt-in "banking" typing mode — typed digits fill
    // the value from the decimal end, ATM/calculator style (5 -> 0.05 -> 0.57
    // -> 5.73); backspace shifts digits back to the right. Only keystroke and
    // backspace flows are reinterpreted; paste and writeValue keep the regular
    // separator formatting. The early return leaves every existing separator
    // path byte-identical when the option is off.
    if (
        this.typeFromDecimals &&
        Number.isFinite(precision) &&
        precision > 0 &&
        !justPasted &&
        !this.writingValue
    ) {
        result = this._formatFromDecimals(processedValue, precision, decimalMarker as string);
        this._shift.clear();
        const res =
            result.includes(MaskExpression.MINUS) && this.prefix && this.allowNegativeNumbers
                ? `${MaskExpression.MINUS}${this.prefix}${result
                      .split(MaskExpression.MINUS)
                      .join(MaskExpression.EMPTY_STRING)}${this.suffix}`
                : result.length
                  ? `${this.prefix}${result}${this.suffix}`
                  : this.instantPrefix
                    ? this.prefix
                    : MaskExpression.EMPTY_STRING;
        // Pin the caret to the end of the value part: every keystroke reshapes
        // the whole string, so the in-place caret position is meaningless here.
        cb(res.length - this.suffix.length - processedPosition, true);
        state.earlyReturn = res;
        return state;
    }

    // Issue #1250: typing an additional decimal marker into a value that
    // already contains one must be a no-op — otherwise everything after the
    // new marker is re-parsed as a fresh decimal part and the value is
    // mangled (15.000,53 + ',' typed after the '1' -> 1,5). Remove the newly
    // typed marker (the char right before the caret) and step the caret back.
    // Paste keeps its own semantics (#1547 below: last marker wins), and
    // backspace/writeValue flows cannot introduce a new marker.
    if (!justPasted && !backspaced && !this.writingValue) {
        const isDecimalMarkerChar = (char: string | undefined): boolean =>
            !!char &&
            char !== this.thousandSeparator &&
            (Array.isArray(this.decimalMarker)
                ? this.decimalMarker.includes(char as MaskExpression.COMMA | MaskExpression.DOT)
                : char === this.decimalMarker);
        const prefixOffset =
            startsWithPrefix && !prefixAlreadyRemovedByCaller ? this.prefix.length : 0;
        const typedMarkerIndex = processedPosition - prefixOffset - 1;
        if (typedMarkerIndex >= 0 && isDecimalMarkerChar(processedValue[typedMarkerIndex])) {
            let markerCount = 0;
            for (const char of processedValue) {
                if (isDecimalMarkerChar(char)) {
                    markerCount++;
                }
            }
            if (markerCount > 1) {
                processedValue =
                    processedValue.slice(0, typedMarkerIndex) +
                    processedValue.slice(typedMarkerIndex + 1);
                stepBack = true;
            }
        }
    }

    // Issue #1547: a pasted value may contain grouping separators that are
    // also configured decimal markers (default decimalMarker is ['.', ',']),
    // e.g. '1,234.56'. Only the last marker character can actually be the
    // decimal marker — treat the earlier ones as thousand separators and
    // strip them, otherwise formatting cuts the value off at the first one.
    if (justPasted && Array.isArray(this.decimalMarker)) {
        const markerPositions: number[] = [];
        for (let i = 0; i < processedValue.length; i++) {
            const char = processedValue[i] as string;
            if (
                char !== this.thousandSeparator &&
                this.decimalMarker.includes(char as MaskExpression.COMMA | MaskExpression.DOT)
            ) {
                markerPositions.push(i);
            }
        }
        if (markerPositions.length > 1) {
            const lastMarkerPosition = markerPositions[markerPositions.length - 1];
            processedValue = processedValue
                .split(MaskExpression.EMPTY_STRING)
                .filter(
                    (_, index) => index === lastMarkerPosition || !markerPositions.includes(index)
                )
                .join(MaskExpression.EMPTY_STRING);
        }
    }

    if (backspaced) {
        const { decimalMarkerIndex, nonZeroIndex } = this._findFirstNonZeroAndDecimalIndex(
            processedValue,
            decimalMarker as '.' | ','
        );
        const zeroIndexMinus = processedValue[0] === MaskExpression.MINUS;
        const zeroIndexDecimalMarker = processedValue[0] === decimalMarker;
        const firstIndexDecimalMarker = processedValue[1] === decimalMarker;

        // Issues #1355/#1578: an all-zero remainder (e.g. '00' from '500', '00,000'
        // from '100,000') must keep its zeros, matching the ',000,000' case.
        // Only collapse when nothing but a bare decimal marker (or '-.') remains.
        if (
            (zeroIndexDecimalMarker && !nonZeroIndex) ||
            (zeroIndexMinus && firstIndexDecimalMarker && !nonZeroIndex)
        ) {
            processedValue = MaskExpression.NUMBER_ZERO;
        }

        if (decimalMarkerIndex && nonZeroIndex && zeroIndexMinus && processedPosition === 1) {
            if (decimalMarkerIndex < nonZeroIndex || decimalMarkerIndex > nonZeroIndex) {
                processedValue = MaskExpression.MINUS + processedValue.slice(nonZeroIndex);
            }
        }

        // Issue #1516: decimalMarkerIndex is 0 when the remainder starts with
        // the decimal marker (',34' after deleting the integer part) — a truthy
        // check would treat it as "no decimal marker" and slice the marker off.
        if (decimalMarkerIndex === null && nonZeroIndex && processedValue.length > nonZeroIndex) {
            processedValue = zeroIndexMinus
                ? MaskExpression.MINUS + processedValue.slice(nonZeroIndex)
                : processedValue.slice(nonZeroIndex);
        }

        if (decimalMarkerIndex && nonZeroIndex && processedPosition === 0) {
            if (decimalMarkerIndex < nonZeroIndex) {
                processedValue = processedValue.slice(decimalMarkerIndex - 1);
            }
            if (decimalMarkerIndex > nonZeroIndex) {
                processedValue = processedValue.slice(nonZeroIndex);
            }
        }
    }

    // Leading-zero stripping is a typing-time rule ('05' -> '5'). When backspaced,
    // leading zeros before a non-zero digit were already removed above, and an
    // all-zero remainder must keep its zeros (issues #1355/#1578).
    if (precision === 0 && !backspaced) {
        processedValue = this.allowNegativeNumbers
            ? processedValue.length > 2 &&
              processedValue[0] === MaskExpression.MINUS &&
              processedValue[1] === MaskExpression.NUMBER_ZERO &&
              processedValue[2] !== this.thousandSeparator &&
              processedValue[2] !== MaskExpression.COMMA &&
              processedValue[2] !== MaskExpression.DOT
                ? '-' + processedValue.slice(2, processedValue.length)
                : processedValue[0] === MaskExpression.NUMBER_ZERO &&
                    processedValue.length > 1 &&
                    processedValue[1] !== this.thousandSeparator &&
                    processedValue[1] !== MaskExpression.COMMA &&
                    processedValue[1] !== MaskExpression.DOT
                  ? processedValue.slice(1, processedValue.length)
                  : processedValue
            : processedValue.length > 1 &&
                processedValue[0] === MaskExpression.NUMBER_ZERO &&
                processedValue[1] !== this.thousandSeparator &&
                processedValue[1] !== MaskExpression.COMMA &&
                processedValue[1] !== MaskExpression.DOT
              ? processedValue.slice(1, processedValue.length)
              : processedValue;
    } else {
        if (processedValue[0] === decimalMarker && processedValue.length > 1 && !backspaced) {
            processedValue =
                MaskExpression.NUMBER_ZERO + processedValue.slice(0, processedValue.length + 1);
            this.plusOnePosition = true;
        }
        if (
            processedValue[0] === MaskExpression.NUMBER_ZERO &&
            processedValue[1] !== decimalMarker &&
            processedValue[1] !== this.thousandSeparator &&
            !backspaced
        ) {
            processedValue =
                processedValue.length > 1
                    ? processedValue.slice(0, 1) +
                      decimalMarker +
                      processedValue.slice(1, processedValue.length + 1)
                    : processedValue;
            this.plusOnePosition = true;
        }
        if (
            this.allowNegativeNumbers &&
            !backspaced &&
            processedValue[0] === MaskExpression.MINUS &&
            (processedValue[1] === decimalMarker ||
                processedValue[1] === MaskExpression.NUMBER_ZERO)
        ) {
            processedValue =
                processedValue[1] === decimalMarker && processedValue.length > 2
                    ? processedValue.slice(0, 1) +
                      MaskExpression.NUMBER_ZERO +
                      processedValue.slice(1, processedValue.length)
                    : processedValue[1] === MaskExpression.NUMBER_ZERO &&
                        processedValue.length > 2 &&
                        processedValue[2] !== decimalMarker
                      ? processedValue.slice(0, 2) +
                        decimalMarker +
                        processedValue.slice(2, processedValue.length)
                      : processedValue;
            this.plusOnePosition = true;
        }
    }

    // Historical note: pre-refactor code used different allowed-character regexes
    // per config (plain separator: no COMMA; dot thousand-sep: no SPACE, COMMA OK;
    // comma thousand-sep: no SPACE, COMMA OK). The unified regex below removes
    // exactly the active thousandSeparator + decimalMarker(s) from the invalid set,
    // so each config already accepts its own chars and rejects the others —
    // verified by the "unified invalidChars regex" cases in separator.spec.ts.
    const thousandSeparatorCharEscaped: string = this._charToRegExpExpression(
        this.thousandSeparator
    );
    let invalidChars: string = '@#!$%^&*()_+|~=`{}\\[\\]:\\s,\\.";<>?\\/'.replace(
        thousandSeparatorCharEscaped,
        ''
    );
    //.replace(decimalMarkerEscaped, '');
    if (Array.isArray(this.decimalMarker)) {
        for (const marker of this.decimalMarker) {
            invalidChars = invalidChars.replace(
                this._charToRegExpExpression(marker),
                MaskExpression.EMPTY_STRING
            );
        }
    } else {
        invalidChars = invalidChars.replace(this._charToRegExpExpression(this.decimalMarker), '');
    }

    const invalidCharRegexp = new RegExp('[' + invalidChars + ']');
    if (processedValue.match(invalidCharRegexp)) {
        processedValue = processedValue.substring(0, processedValue.length - 1);
    }

    processedValue = this.checkInputPrecision(processedValue, precision);
    const strForSep: string = processedValue.replace(
        new RegExp(thousandSeparatorCharEscaped, 'g'),
        ''
    );

    result = this._formatWithSeparators(
        strForSep,
        this.thousandSeparator,
        this.decimalMarker,
        precision
    );

    const commaShift: number =
        result.indexOf(MaskExpression.COMMA) - processedValue.indexOf(MaskExpression.COMMA);
    const shiftStep: number = result.length - processedValue.length;
    const backspacedDecimalMarkerWithSeparatorLimit =
        backspaced && result.length < inputValue.length - this.suffix.length && this.separatorLimit;

    if (
        (result[processedPosition - 1] === this.thousandSeparator ||
            result[processedPosition - this.prefix.length]) &&
        this.prefix &&
        backspaced
    ) {
        processedPosition = processedPosition - 1;
    } else if (
        (shiftStep > 0 && result[processedPosition] !== this.thousandSeparator) ||
        backspacedDecimalMarkerWithSeparatorLimit
    ) {
        backspaceShift = true;
        let _shift = 0;
        do {
            this._shift.add(processedPosition + _shift);
            _shift++;
        } while (_shift < shiftStep);
    } else if (
        result[processedPosition - 1] === this.thousandSeparator ||
        shiftStep === -4 ||
        shiftStep === -3 ||
        result[processedPosition] === this.thousandSeparator
    ) {
        this._shift.clear();
        this._shift.add(processedPosition - 1);
    } else if (
        (commaShift !== 0 &&
            processedPosition > 0 &&
            !(
                result.indexOf(MaskExpression.COMMA) >= processedPosition && processedPosition > 3
            )) ||
        (!(result.indexOf(MaskExpression.DOT) >= processedPosition && processedPosition > 3) &&
            shiftStep <= 0)
    ) {
        this._shift.clear();
        backspaceShift = true;
        shift = shiftStep;

        processedPosition += shiftStep;
        this._shift.add(processedPosition);
    } else {
        this._shift.clear();
    }

    state.processedValue = processedValue;
    state.processedPosition = processedPosition;
    state.result = result;
    state.backspaceShift = backspaceShift;
    state.shift = shift;
    state.stepBack = stepBack;
    return state;
};
