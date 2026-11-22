import type { MaskHandlerFn } from './mask-handler.types';

/** PERCENT handler (moved verbatim from applyMask). startsWith(PERCENT); terminal —
 *  produces the final `result`, no fallthrough. */
export const percentHandler: MaskHandlerFn = function (state, params) {
    const { backspaced } = params;
    const { cursor } = state;
    let processedValue = state.processedValue;
    if (
        processedValue.match('[a-z]|[A-Z]') ||
        // eslint-disable-next-line no-useless-escape
        (processedValue.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,\/.]/) && !backspaced)
    ) {
        processedValue = this._stripToDecimal(processedValue);
        const precision: number = this.getPrecision(state.maskExpression);

        processedValue = this.checkInputPrecision(processedValue, precision);
    }
    const decimalMarker = this._activeDecimalMarker(processedValue);
    const markerIndex = processedValue.indexOf(decimalMarker);
    if (markerIndex > 0 && !this.percentage(processedValue.substring(0, markerIndex))) {
        let base: string = processedValue.substring(0, markerIndex - 1);
        if (
            this.allowNegativeNumbers &&
            processedValue.slice(cursor, cursor + 1) === '-' &&
            !backspaced
        ) {
            base = processedValue.substring(0, markerIndex);
        }

        processedValue = base + processedValue.substring(markerIndex);
    }
    const value =
        this.allowNegativeNumbers && processedValue.slice(cursor, cursor + 1) === '-'
            ? `-${processedValue.slice(cursor + 1, cursor + processedValue.length)}`
            : processedValue;
    if (this.percentage(value)) {
        state.result = this._splitPercentZero(processedValue);
    } else {
        state.result = this._splitPercentZero(
            processedValue.substring(0, processedValue.length - 1)
        );
    }
    state.processedValue = processedValue;
    return state;
};
