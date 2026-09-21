import { MaskExpression } from '../ngx-mask-expression.enum';
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
    if (
        processedValue.indexOf(decimalMarker) > 0 &&
        !this.percentage(processedValue.substring(0, processedValue.indexOf(decimalMarker)))
    ) {
        let base: string = processedValue.substring(0, processedValue.indexOf(decimalMarker) - 1);
        if (
            this.allowNegativeNumbers &&
            processedValue.slice(cursor, cursor + 1) === MaskExpression.MINUS &&
            !backspaced
        ) {
            base = processedValue.substring(0, processedValue.indexOf(decimalMarker));
        }

        processedValue = `${base}${processedValue.substring(
            processedValue.indexOf(decimalMarker),
            processedValue.length
        )}`;
    }
    let value: string;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.allowNegativeNumbers && processedValue.slice(cursor, cursor + 1) === MaskExpression.MINUS
        ? (value = `${MaskExpression.MINUS}${processedValue.slice(cursor + 1, cursor + processedValue.length)}`)
        : (value = processedValue);
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
