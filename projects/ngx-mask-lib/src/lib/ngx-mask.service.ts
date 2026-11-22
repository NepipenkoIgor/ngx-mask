import { ElementRef, inject, Injectable, Renderer2, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import type { NgxMaskConfig } from './ngx-mask.config';
import { NGX_MASK_CONFIG } from './ngx-mask.config';
import { NgxMaskApplierService } from './ngx-mask-applier.service';
import { MaskExpression } from './ngx-mask-expression.enum';
import { containsStarSymbol, digitsOf, escapeRegExp, usesCommaDecimal } from './ngx-mask.utils';

@Injectable()
export class NgxMaskService extends NgxMaskApplierService {
    public isNumberValue = false;
    public maskIsShown = '';
    public selStart: number | null = null;
    public selEnd: number | null = null;
    public maskChanged = false;
    public previousValue = '';
    public currentValue = '';
    // `writingValue` is declared on NgxMaskApplierService: applyMask needs it to
    // distinguish the writeValue flow from keystroke flows (#1611).
    public isInitialized = false;
    /**
     * The raw control value `writeValue` is currently applying, `null` outside a write. The mask's
     * own `onChange` echo is skipped when it carries exactly this value (the mask left it
     * unchanged); an echo that differs (a normalised or re-typed value) still reaches the form.
     */
    public writtenValue: { value: unknown } | null = null;
    /** Whether `value` is exactly the raw value `writeValue` is currently applying. */
    public isWrittenEcho(value: unknown): boolean {
        return !!this.writtenValue && Object.is(this.writtenValue.value, value);
    }
    /**
     * Set by the directive's keepCharacterPositions handling for the current edit:
     * true — the directive fully resolved the resulting display value into actualValue,
     * so applyMask must short-circuit and render actualValue as-is;
     * false — the edit must flow through regular masking (no short-circuit);
     * null — the directive was not involved in this applyMask call (legacy behavior).
     * Consumed and reset by applyMask. This lets keepCharacterPositions work without
     * showMaskTyped (#1545, #1543).
     */
    public keepCharacterPositionsHandled: boolean | null = null;

    public _isFocused = signal<boolean>(false);

    private _emitValue = false;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onChange = (_: unknown) => {};

    public readonly _elementRef = inject(ElementRef, { optional: true });

    private readonly document = inject(DOCUMENT);

    protected override _config = inject<NgxMaskConfig>(NGX_MASK_CONFIG);

    private readonly _renderer = inject(Renderer2, { optional: true });

    /**
     * Applies the mask to the input value.
     * @param inputValue The input value to be masked.
     * @param maskExpression The mask expression to apply.
     * @param position The position in the input value.
     * @param justPasted Whether the value was just pasted.
     * @param backspaced Whether the value was backspaced.
     * @param cb Callback function.
     * @returns The masked value.
     */
    public override applyMask(
        inputValue: string,
        maskExpression: string,
        position = 0,
        justPasted = false,
        backspaced = false,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        cb: (actualShift: number, backspaceShift: boolean) => void = () => {}
    ): string {
        // Consume the directive's keepCharacterPositions verdict for this edit (see the
        // keepCharacterPositionsHandled doc). Reset immediately so it never leaks into
        // applyMask calls that do not originate from the directive's input handling.
        const kcpHandled = this.keepCharacterPositionsHandled;
        this.keepCharacterPositionsHandled = null;

        // If no mask expression, return the input value or the actual value
        if (!maskExpression) {
            // A RECONFIGURATION to an empty mask (mask was non-empty, now swapped to '') must
            // revert the display/model to the raw unmasked value, not the stale masked
            // `actualValue` from the mask that no longer applies (#1616: mask signal set to ''
            // on a populated control left the masked display/FormControl unchanged forever,
            // since this early return short-circuited before the `maskChanged`/emit logic
            // below ever ran). Only strip when a mask genuinely changed — a directive with no
            // mask ever configured must keep returning verbatim `actualValue`/`inputValue`.
            if (this.maskChanged) {
                const rawValue = this.removeMask(inputValue);
                this.previousValue = this.currentValue;
                this.currentValue = rawValue;
                this.actualValue = rawValue;
                this._emitValue = this.previousValue !== this.currentValue;
                if (this._emitValue && this.triggerOnMaskChange) {
                    this.formControlResult(rawValue);
                }
                this._clearMaskChangedUnlessTriggered();
                return rawValue;
            }
            return inputValue !== this.actualValue ? this.actualValue : inputValue;
        }

        // #1492: a numeric FormControl value like 0.0000007 or 1e21 stringifies to
        // exponential notation ('7e-7'); separator masking would strip the 'e'/'-' and
        // render garbage ('77'). Expand scientific notation to plain decimal form before
        // masking. Covers writeValue-driven flows and the pipe; a keystroke value can
        // never match, since separator masking never lets a letter through.
        if (
            maskExpression.startsWith(MaskExpression.SEPARATOR) &&
            inputValue &&
            /\d[eE][+-]?\d/.test(inputValue)
        ) {
            const expandedNumber = Number(this._replaceDecimalMarkerToDot(inputValue));
            if (!Number.isNaN(expandedNumber)) {
                // eslint-disable-next-line no-param-reassign
                inputValue = this._toPlainDecimalString(expandedNumber);
                if (
                    this.decimalMarker === ',' ||
                    (Array.isArray(this.decimalMarker) && this.thousandSeparator === '.')
                ) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue = inputValue.replace('.', ',');
                }
            }
        }

        // Show mask in input if required
        this.maskIsShown = this.showMaskTyped ? this.showMaskInInput() : '';

        // Handle specific mask expressions
        if (this.isIpOrCpfCnpjMask() && this.showMaskTyped) {
            this.maskIsShown = this.showMaskInInput(inputValue || MaskExpression.HASH);
        }

        // Handle empty input value with mask typed
        if (!inputValue && this.showMaskTyped) {
            // #1590: only a USER-driven clear may propagate back to the model. When this
            // skeleton render originates from writeValue() (writingValue), emitting '' here
            // would be a view->model write inside a model->view sync — with nested CVA
            // wrappers the real initial value arrives in a LATER microtask than the initial
            // null write, and this echo overwrote it before it ever reached the view.
            if (!this.writingValue) {
                this.formControlResult(this.prefix);
            }
            // The field is now empty: record it, or retyping the previous value in one
            // input event (autofill, undo) would match the stale currentValue and never emit.
            this.previousValue = this.currentValue;
            this.currentValue = '';
            return `${this.prefix}${this.maskIsShown}${this.suffix}`;
        }

        const getSymbol: string =
            !!inputValue && typeof this.selStart === 'number'
                ? (inputValue[this.selStart] ?? '')
                : '';
        let newInputValue = '';
        let newPosition = position;

        // Handle hidden input or input with asterisk symbol
        if (
            (this.hiddenInput ||
                (inputValue &&
                    containsStarSymbol(inputValue, this.maskExpression, this.thousandSeparator))) &&
            !this.writingValue
        ) {
            // Seed from the raw input only when the user typed the FIRST character (the
            // single char is the raw symbol, actualValue is empty/stale). On backspace a
            // length-1 value is the remaining masked display (e.g. '*'), so the hidden
            // characters must come from actualValue or the deletion destroys both (#1612).
            let actualResult: string[] =
                inputValue && inputValue.length === 1 && !backspaced
                    ? inputValue.split('')
                    : this.actualValue.split('');

            // Handle backspace
            if (backspaced) {
                actualResult = actualResult
                    .slice(0, position)
                    .concat(actualResult.slice(position + 1));
            }

            // Remove mask if showMaskTyped is true
            if (this.showMaskTyped) {
                // eslint-disable-next-line no-param-reassign
                inputValue = this.removeMask(inputValue);
                actualResult = this.removeMask(actualResult.join('')).split('');
            }

            // Handle selection start and end
            if (typeof this.selStart === 'object' && typeof this.selEnd === 'object') {
                this.selStart = Number(this.selStart);
                this.selEnd = Number(this.selEnd);
            } else {
                if (inputValue !== '' && actualResult.length) {
                    if (typeof this.selStart === 'number' && typeof this.selEnd === 'number') {
                        if (inputValue.length > actualResult.length) {
                            actualResult.splice(this.selStart, 0, getSymbol);
                        } else if (inputValue.length < actualResult.length) {
                            if (actualResult.length - inputValue.length === 1) {
                                if (backspaced) {
                                    actualResult.splice(this.selStart - 1, 1);
                                } else {
                                    actualResult.splice(inputValue.length - 1, 1);
                                }
                            } else {
                                actualResult.splice(this.selStart, this.selEnd - this.selStart);
                            }
                        }
                    }
                } else {
                    actualResult = [];
                }
            }

            // Handle actual value length
            if (this.actualValue.length) {
                if (actualResult.length < inputValue.length) {
                    newInputValue = this.shiftTypedSymbols(actualResult.join(''));
                } else if (actualResult.length === inputValue.length) {
                    newInputValue = actualResult.join('');
                } else {
                    newInputValue = inputValue;
                }
            } else {
                newInputValue = inputValue;
            }
        }

        // Handle just pasted input
        if (justPasted) {
            newInputValue = this._pastedIntoHiddenValue(inputValue) ?? inputValue;
        }

        // Handle backspace with special characters
        if (
            backspaced &&
            this.specialCharacters.includes(this.maskExpression[newPosition] ?? '') &&
            this.showMaskTyped &&
            !this.prefix
        ) {
            newInputValue = this.currentValue;
        }

        // Handle deleted special character
        if (this.deletedSpecialCharacter && newPosition) {
            if (
                this.specialCharacters.includes(
                    this.actualValue.slice(newPosition, newPosition + 1)
                )
            ) {
                newPosition = newPosition + 1;
            } else if (
                maskExpression.slice(newPosition - 1, newPosition + 1) !== MaskExpression.MONTHS
            ) {
                newPosition = newPosition - 2;
            }

            this.deletedSpecialCharacter = false;
        }

        // Remove mask if showMaskTyped is true and placeHolderCharacter length is 1
        if (
            this.showMaskTyped &&
            this.placeHolderCharacter.length === 1 &&
            !this.leadZeroDateTime
        ) {
            newInputValue = this.removeMask(newInputValue);
        }

        // Handle mask changed
        newInputValue = this.maskChanged ? inputValue : newInputValue || inputValue;

        // Handle keepCharacterPositions: when the directive resolved the display for this
        // edit (kcpHandled === true), or legacily whenever showMaskTyped is on and the
        // directive gave no explicit verdict, render actualValue as-is.
        if (
            (kcpHandled ?? this.showMaskTyped) &&
            this.keepCharacterPositions &&
            this.actualValue &&
            !justPasted &&
            !this.writingValue
        ) {
            const value = this.dropSpecialCharacters
                ? this.removeMask(this.actualValue)
                : this.actualValue;
            // The edit is rendered as it stands, so it becomes the value the next one is compared
            // with (else a later edit that restores the previous value emits nothing), and an
            // edit that left the value as it was emits nothing either.
            const changed =
                this.removeMask(this.actualValue) !== this.removeMask(this.currentValue);
            this.previousValue = this.currentValue;
            this.currentValue = this.actualValue;
            if (changed) {
                this.formControlResult(value);
            }
            return this.actualValue
                ? this.actualValue
                : `${this.prefix}${this.maskIsShown}${this.suffix}`;
        }

        // Apply the mask using the parent class method
        const result: string = super.applyMask(
            newInputValue,
            maskExpression,
            newPosition,
            justPasted,
            backspaced,
            cb
        );

        // #1615: a value the mask cannot process AT ALL (masking leaves nothing of it) is
        // rendered verbatim instead of being destroyed, and must not reach formControlResult
        // — the empty remnant would clobber the model that holds the sentinel (e.g.
        // setValue('ONGOING') on a digits mask). Values that PARTIALLY match keep regular
        // masking. Two cases reach this:
        // 1. this.writingValue: the originating writeValue() call itself.
        // 2. currentValue === inputValue (and the mask didn't just change): a LATER re-render
        //    replaying the exact same already-verbatim value outside of writeValue (e.g.
        //    ngOnChanges re-running applyMask via the directive's _applyMask() when an
        //    UNRELATED input like `disabled` changes) — without this, that pass would fall
        //    through to regular masking, emit the empty result via onChange, and clobber the
        //    model even though the DOM would still show the sentinel correctly.
        if (
            (this.writingValue || (!this.maskChanged && inputValue === this.currentValue)) &&
            inputValue &&
            !result &&
            this.removeMask(inputValue)
        ) {
            this.actualValue = inputValue;
            this.previousValue = this.currentValue;
            this.currentValue = inputValue;
            return inputValue;
        }

        this.actualValue = this.getActualValue(result);

        // handle some separator implications:
        // a.) adjust decimalMarker default (. -> ,) if thousandSeparator is a dot
        if (this.thousandSeparator === '.' && this.decimalMarker === '.') {
            this.decimalMarker = ',';
        }
        // b) remove decimal marker from list of special characters to mask
        if (
            this.maskExpression.startsWith(MaskExpression.SEPARATOR) &&
            this.dropSpecialCharacters === true
        ) {
            this.specialCharacters = this.specialCharacters.filter(
                (item: string) =>
                    !this._compareOrIncludes(item, this.decimalMarker, this.thousandSeparator) //item !== this.decimalMarker, // !
            );
        }

        // Update previous and current values
        this.previousValue = this.currentValue;
        this.currentValue = result;
        this._emitValue = this.previousValue !== this.currentValue || justPasted;

        // Propagate the input value back to the Angular model
        // Only emit if:
        // 1. _emitValue is true (value changed), AND
        // 2. Either mask didn't change, OR triggerOnMaskChange is true
        const shouldEmit = this._emitValue && (!this.maskChanged || this.triggerOnMaskChange);
        if (shouldEmit) {
            this.formControlResult(result);
        }
        // Reset maskChanged flag even if we didn't emit
        this._clearMaskChangedUnlessTriggered();

        // Handle hidden input and showMaskTyped
        if (!this.showMaskTyped || this.hiddenInput) {
            if (this.hiddenInput) {
                return this.hiddenDisplay(result);
            }
            return result;
        }

        const resLen: number = result.length;
        const prefNmask = `${this.prefix}${this.maskIsShown}${this.suffix}`;

        // Handle specific mask expressions
        // NOTE: IP/CPF_CNPJ/CPF_CNPJ_ALPHA are checked via exact equality BEFORE the HOURS
        // substring check below, because MaskExpression.HOURS is the single character 'H' and
        // 'CPF_CNPJ_ALPHA' contains 'H' (from "ALPHA"), which previously caused CPF_CNPJ_ALPHA
        // to be misrouted into the HOURS branch instead of its own branch.
        if (this.isIpOrCpfCnpjMask()) {
            return `${result}${prefNmask}`;
        } else if (this.maskExpression.includes(MaskExpression.HOURS)) {
            const countSkipedSymbol = this._numberSkipedSymbols(result);
            return `${result}${prefNmask.slice(resLen + countSkipedSymbol)}`;
        }

        return `${result}${prefNmask.slice(resLen)}`;
    }

    private isIpOrCpfCnpjMask(): boolean {
        return (
            this.maskExpression === MaskExpression.IP ||
            this.maskExpression === MaskExpression.CPF_CNPJ ||
            this.maskExpression === MaskExpression.CPF_CNPJ_ALPHA
        );
    }

    // get the number of characters that were shifted
    private _numberSkipedSymbols(value: string): number {
        return (value.match(/(^|\D)(\d\D)/g) ?? []).length;
    }

    public applyValueChanges(
        position: number,
        justPasted: boolean,
        backspaced: boolean,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        cb: (actualShift: number, backspaceShift: boolean) => void = () => {}
    ): void {
        const formElement = this._elementRef?.nativeElement;
        if (!formElement) {
            return;
        }

        const typedValue = formElement.value;
        const maskedValue = this.applyMask(
            typedValue,
            this.maskExpression,
            position,
            justPasted,
            backspaced,
            cb
        );
        // Assigning an identical value still resets the native caret/undo state in some browsers.
        // An element that no longer holds what was typed was rewritten while the mask ran (a
        // `setValue` inside a `valueChanges` subscriber): that newer write wins (#1691).
        if (formElement.value === typedValue && formElement.value !== maskedValue) {
            formElement.value = maskedValue;
        }
        if (formElement === this._getActiveElement()) {
            return;
        }
        this.clearIfNotMatchFn();
    }

    /**
     * A hiddenInput display only holds the hidden characters, so a paste into it is spliced into the
     * real value (`actualValue`, aligned 1:1 with the display) at the selection that was replaced.
     * Returns null when there is nothing to splice into or the display does not fit that edit.
     */
    private _pastedIntoHiddenValue(display: string): string | null {
        if (
            !this.hiddenInput ||
            !this.actualValue ||
            typeof this.selStart !== 'number' ||
            typeof this.selEnd !== 'number'
        ) {
            return null;
        }
        const before = this.hiddenDisplay(this.actualValue);
        const insertedLength = display.length - (before.length - (this.selEnd - this.selStart));
        const end = this.selStart + insertedLength;
        return insertedLength > 0 && display.slice(end) === before.slice(this.selEnd)
            ? `${this.actualValue.slice(0, this.selStart)}${display.slice(this.selStart, end)}${this.actualValue.slice(this.selEnd)}`
            : null;
    }

    /** The hiddenInput display of `value`: its hidden characters plus the rest of the shown mask. */
    public hiddenDisplay(value: string): string {
        return `${this.hideInput(value, this.maskExpression)}${this.maskIsShown.slice(value.length)}`;
    }

    public hideInput(inputValue: string, maskExpression: string): string {
        return inputValue
            .split('')
            .map((curr: string, index: number) => {
                const maskChar = maskExpression[index] ?? '';
                const pattern = this.patterns?.[maskChar];
                if (pattern?.symbol) {
                    return pattern.symbol;
                }
                // #1574: a '0' immediately following a concealed DAY/MONTH token
                // is that field's second digit (d0/M0) — conceal it too so the
                // whole 2-digit field is hidden, not just its first character.
                // Display-only: does not touch maskExpression/processedValue, so
                // date validation/leadZero clamping in generic-pattern.handler.ts
                // is unaffected.
                const prevMaskChar = maskExpression[index - 1];
                const prevPattern = prevMaskChar ? this.patterns?.[prevMaskChar] : null;
                if (
                    maskChar === '0' &&
                    (prevMaskChar === MaskExpression.DAY ||
                        prevMaskChar === MaskExpression.MONTH) &&
                    prevPattern?.symbol
                ) {
                    return prevPattern.symbol;
                }
                return curr;
            })
            .join('');
    }

    // this function is not necessary, it checks result against maskExpression
    public getActualValue(res: string): string {
        return res;
    }

    public shiftTypedSymbols(inputValue: string): string {
        let symbolToReplace = '';
        const newInputValue: (string | undefined)[] =
            (inputValue &&
                inputValue.split('').map((currSymbol: string, index: number) => {
                    if (
                        this.specialCharacters.includes(inputValue[index + 1] ?? '') &&
                        inputValue[index + 1] !== this.maskExpression[index + 1]
                    ) {
                        symbolToReplace = currSymbol;
                        return inputValue[index + 1];
                    }
                    if (symbolToReplace.length) {
                        const replaceSymbol: string = symbolToReplace;
                        symbolToReplace = '';
                        return replaceSymbol;
                    }
                    return currSymbol;
                })) ||
            [];
        return newInputValue.join('');
    }

    /**
     * Convert number value to string
     * 3.1415 -> '3.1415'
     * 1e-7 -> '0.0000001'
     */
    public numberToString(value: number | string): string {
        if (
            (!value && value !== 0) ||
            (this.maskExpression.startsWith(MaskExpression.SEPARATOR) &&
                (this.leadZero || !this.dropSpecialCharacters)) ||
            (this.maskExpression.startsWith(MaskExpression.SEPARATOR) &&
                this.separatorLimit.length > 14 &&
                String(value).length > 14)
        ) {
            return String(value);
        }
        // #1573: toLocaleString('fullwide', ...) is NOT locale-independent — 'fullwide' is
        // not a real locale tag, so Intl silently falls back to the runtime DEFAULT locale
        // (e.g. de-AT on Edge with Austrian regional format emits '0,5'). Expand exponential
        // notation with pure string math instead; the decimal marker is always '.'.
        return this._toPlainDecimalString(Number(value));
    }

    /**
     * Locale-independent replacement for toLocaleString('fullwide', { useGrouping: false,
     * maximumFractionDigits: 20 }) (#1573): expands exponential notation ('7e-7', '1e+21')
     * to plain decimal form using '.' as decimal marker, regardless of the runtime locale.
     */
    private _toPlainDecimalString(value: number): string {
        const stringValue = String(value);
        const match = /^(-?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(stringValue);
        if (!match) {
            return stringValue;
        }
        const [, sign, integerPart, fractionPart = '', exponentPart] = match;
        const exponent = Number(exponentPart);
        const digits = `${integerPart}${fractionPart}`;
        const pointIndex = (integerPart as string).length + exponent;
        if (pointIndex <= 0) {
            return `${sign}0.${'0'.repeat(-pointIndex)}${digits}`;
        }
        if (pointIndex >= digits.length) {
            return `${sign}${digits}${'0'.repeat(pointIndex - digits.length)}`;
        }
        return `${sign}${digits.slice(0, pointIndex)}.${digits.slice(pointIndex)}`;
    }

    public showMaskInInput(inputVal?: string): string {
        if (this.showMaskTyped && !!this.shownMaskExpression) {
            if (this.maskExpression.length !== this.shownMaskExpression.length) {
                throw new Error('Mask expression must match mask placeholder length');
            } else {
                return this.shownMaskExpression;
            }
        } else if (this.showMaskTyped) {
            if (inputVal) {
                if (this.maskExpression === MaskExpression.IP) {
                    return this._checkForIp(inputVal);
                }
                if (
                    this.maskExpression === MaskExpression.CPF_CNPJ ||
                    this.maskExpression === MaskExpression.CPF_CNPJ_ALPHA
                ) {
                    return this._checkForCpfCnpj(inputVal);
                }
            }
            if (this.placeHolderCharacter.length === this.maskExpression.length) {
                return this.placeHolderCharacter;
            }
            return this.maskExpression.replace(/\w/g, this.placeHolderCharacter);
        }
        return '';
    }

    public clearIfNotMatchFn(): void {
        const formElement = this._elementRef?.nativeElement;
        if (!formElement) {
            return;
        }
        if (
            this.clearIfNotMatch &&
            this.prefix.length + this.maskExpression.length + this.suffix.length !==
                formElement.value.replace(this.placeHolderCharacter, '').length
        ) {
            this.formElementProperty = ['value', ''];
            this.applyMask('', this.maskExpression);
        }
    }

    public set formElementProperty([name, value]: [string, string | boolean]) {
        if (!this._renderer || !this._elementRef) {
            return;
        }
        // Use queueMicrotask to defer DOM updates to next microtask.
        // This prevents ExpressionChangedAfterItHasBeenCheckedError
        // and ensures proper timing with Angular's change detection.
        queueMicrotask(() => {
            const element = this._elementRef?.nativeElement;
            if (element && Reflect.get(element, name) !== value) {
                this._renderer?.setProperty(element, name, value);
            }
        });
    }

    public checkDropSpecialCharAmount(mask: string): number {
        return mask.split('').filter((item: string) => this._findDropSpecialChar(item)).length;
    }

    /**
     * Consumes a pending `maskChanged` once a render has handled the reconfiguration, unless
     * `triggerOnMaskChange` still needs it to emit the re-masked value (formControlResult clears
     * it then).
     */
    public _clearMaskChangedUnlessTriggered(): void {
        if (!this.triggerOnMaskChange) {
            this.maskChanged = false;
        }
    }

    public removeMask(inputValue: string): string {
        return this._removeMask(
            this._removeSuffix(this._removePrefix(inputValue)),
            this.specialCharacters.concat('_').concat(this.placeHolderCharacter)
        );
    }

    private _checkForIp(inputVal: string): string {
        const p = this.placeHolderCharacter;
        if (inputVal === MaskExpression.HASH) {
            return `${p}.${p}.${p}.${p}`;
        }
        const count = digitsOf(inputVal).length;
        return count <= 3 ? `${p}.${p}.${p}` : count <= 6 ? `${p}.${p}` : count <= 9 ? p : '';
    }

    private _checkForCpfCnpj(inputVal: string): string {
        const p = this.placeHolderCharacter;
        const cpf = `${p.repeat(3)}.${p.repeat(3)}.${p.repeat(3)}-${p.repeat(2)}`;
        const cnpj = `${p.repeat(2)}.${p.repeat(3)}.${p.repeat(3)}/${p.repeat(4)}-${p.repeat(2)}`;

        if (inputVal === MaskExpression.HASH) {
            return cpf;
        }

        const isCpfCnpjAlpha = this.maskExpression === MaskExpression.CPF_CNPJ_ALPHA;
        const count = this._countCpfCnpjTypedChars(inputVal, isCpfCnpjAlpha).length;
        // Separators sit between the typed-character groups, so the placeholder slice offset grows by
        // one for every group boundary `result` has already passed. CNPJ_ALPHA ("AA.AAA.AAA/AAAA-00")
        // has its boundaries after the 2nd, 5th, 8th and 12th character, CPF after the 3rd, 6th, 9th.
        const passed = (boundaries: number[]) => boundaries.filter((b) => count > b).length;
        if (isCpfCnpjAlpha && /[a-zA-Z]/.test(inputVal)) {
            return cnpj.slice(count + passed([2, 5, 8, 12]));
        }
        if (count < 11) {
            return cpf.slice(count + passed([3, 6, 9]));
        }
        if (count === 12) {
            return cnpj.slice(inputVal.length === 17 ? 16 : 15);
        }
        return count > 12 && count <= 14 ? cnpj.slice(count + 4) : '';
    }

    /** Collects the characters counted as "typed" for CPF/CNPJ progress tracking: digits only
     *  for the numeric mask, alphanumerics for CPF_CNPJ_ALPHA. */
    private _countCpfCnpjTypedChars(inputVal: string, isCpfCnpjAlpha: boolean): string[] {
        return isCpfCnpjAlpha ? (inputVal.match(/[a-zA-Z0-9]/g) ?? []) : digitsOf(inputVal);
    }

    /**
     * Recursively determine the current active element by navigating the Shadow DOM until the Active Element is found.
     */
    public _getActiveElement(document: DocumentOrShadowRoot = this.document): Element | null {
        const shadowRootEl = document?.activeElement?.shadowRoot;
        if (!shadowRootEl?.activeElement) {
            return document.activeElement;
        } else {
            return this._getActiveElement(shadowRootEl);
        }
    }

    /**
     * Propogates the input value back to the Angular model by triggering the onChange function. It won't do this if writingValue
     * is true. If that is true it means we are currently in the writeValue function, which is supposed to only update the actual
     * DOM element based on the Angular model value. It should be a one way process, i.e. writeValue should not be modifying the Angular
     * model value too. Therefore, we don't trigger onChange in this scenario.
     * @param inputValue the current form input value
     */
    public formControlResult(inputValue: string): void {
        // The echo of a write the mask left unchanged is the written model value itself: it is
        // already in model space, so it skips the transform (which would otherwise make the model
        // differ by when the write is applied, see `writtenValue`).
        this.writingValue = false;
        this.maskChanged = false;

        if (!this.isInitialized && this._emitValue) {
            return;
        }

        // #1519: a non-special placeHolderCharacter (e.g. 'X') is never something the user
        // typed — it's the showMaskTyped fill character for unfilled slots — so it must never
        // reach the model, regardless of dropSpecialCharacters. The default '_' placeholder is
        // already covered by specialCharacters/removeMask; a custom single-char placeholder
        // that isn't a special character is not, since none of the branches below include it
        // in their removal set.
        if (
            this.showMaskTyped &&
            this.placeHolderCharacter.length === 1 &&
            !this.specialCharacters.includes(this.placeHolderCharacter)
        ) {
            // eslint-disable-next-line no-param-reassign
            inputValue = inputValue.split(this.placeHolderCharacter).join('');
        }

        // #1668: an email address is meaningless without its '@' and '.', so the built-in
        // email mask always reports the full address, whatever dropSpecialCharacters says.
        const keepSpecialCharacters = this.maskExpression === MaskExpression.EMAIL_MASK;

        let stripped: ReturnType<typeof this._checkSymbols> = inputValue;
        if (!keepSpecialCharacters && (this.dropSpecialCharacters || this.prefix === inputValue)) {
            const bare = this._removeSuffix(this._removePrefix(inputValue));
            stripped = this._checkSymbols(
                Array.isArray(this.dropSpecialCharacters)
                    ? this._removeMask(bare, this.dropSpecialCharacters)
                    : bare
            );
        }
        const result = this._toNumber(stripped);
        this.onChange(
            this.outputTransformFn && !this.isWrittenEcho(result)
                ? this.outputTransformFn(result as never)
                : result
        );
    }

    private _toNumber(value: string | number | undefined | null) {
        if (!this.isNumberValue || value === '') {
            return value;
        }
        if (
            this.maskExpression.startsWith(MaskExpression.SEPARATOR) &&
            (this.leadZero || !this.dropSpecialCharacters)
        ) {
            return value;
        }

        if (String(value).length > 14 && this.maskExpression.startsWith(MaskExpression.SEPARATOR)) {
            return String(value);
        }

        const num = Number(value);
        if (this.maskExpression.startsWith(MaskExpression.SEPARATOR) && Number.isNaN(num)) {
            const val = String(value).replace(',', '.');
            return Number(val);
        }

        return Number.isNaN(num) ? value : num;
    }

    private _removeMask(value: string, specialCharactersForRemove: string[]): string {
        if (
            this.maskExpression.startsWith(MaskExpression.PERCENT) &&
            (value.includes('.') ||
                (Array.isArray(this.decimalMarker) &&
                    value.includes(',') &&
                    this._activeDecimalMarker(value) === ','))
        ) {
            return value;
        }

        return value ? value.replace(this._regExpForRemove(specialCharactersForRemove), '') : value;
    }

    private _removePrefix(value: string): string {
        return this.prefix && value ? value.replace(this.prefix, '') : value;
    }

    private _removeSuffix(value: string): string {
        return this.suffix && value ? value.replace(this.suffix, '') : value;
    }

    private _retrieveSeparatorValue(result: string): string {
        let specialCharacters = Array.isArray(this.dropSpecialCharacters)
            ? this.specialCharacters.filter((v) =>
                  (this.dropSpecialCharacters as string[]).includes(v)
              )
            : this.specialCharacters;
        if (
            !this.deletedSpecialCharacter &&
            this._checkPatternForSpace() &&
            result.includes(MaskExpression.WHITE_SPACE) &&
            this.maskExpression.includes(MaskExpression.SYMBOL_STAR)
        ) {
            specialCharacters = specialCharacters.filter(
                (char) => char !== MaskExpression.WHITE_SPACE
            );
        }

        // A separator mask groups with the configured thousandSeparator, which need not be one of
        // the specialCharacters (`$`, `*`, `^`, `|`...). It is never part of the number, so strip it
        // like the default ' ' and ',' unless the caller listed what to drop explicitly.
        if (
            !Array.isArray(this.dropSpecialCharacters) &&
            this.maskExpression.startsWith(MaskExpression.SEPARATOR) &&
            this.thousandSeparator &&
            !specialCharacters.includes(this.thousandSeparator)
        ) {
            specialCharacters = [...specialCharacters, this.thousandSeparator];
        }

        return this._removeMask(result, specialCharacters as string[]);
    }

    private _regExpForRemove(specialCharactersForRemove: string[]): RegExp {
        return new RegExp(
            specialCharactersForRemove.map((item: string) => escapeRegExp(item)).join('|'),
            'gi'
        );
    }

    private _replaceDecimalMarkerToDot(value: string): string {
        const markers = Array.isArray(this.decimalMarker)
            ? this.decimalMarker
            : [this.decimalMarker];

        return value.replace(this._regExpForRemove(markers), '.');
    }

    public _checkSymbols(result: string): string | number | undefined | null {
        let processedResult = result;

        if (processedResult === '') {
            return processedResult;
        }

        if (
            this.maskExpression.startsWith(MaskExpression.PERCENT) &&
            this._activeDecimalMarker(processedResult) === ','
        ) {
            processedResult = processedResult.replace(',', '.');
        }
        const separatorPrecision: number | null = this._retrieveSeparatorPrecision(
            this.maskExpression
        );

        const separatorValue: string =
            this.specialCharacters.length === 0
                ? this._retrieveSeparatorValue(processedResult)
                : this._replaceDecimalMarkerToDot(this._retrieveSeparatorValue(processedResult));

        if (!this.isNumberValue) {
            return separatorValue;
        }
        if (!separatorPrecision) {
            return separatorValue;
        }
        if (processedResult === this.decimalMarker) {
            return null;
        }
        return separatorValue.length > 14
            ? separatorValue
            : this._checkPrecision(this.maskExpression, separatorValue);
    }

    private _checkPatternForSpace(): boolean {
        return Object.values(this.patterns).some(
            (item) =>
                item?.pattern?.toString().includes(MaskExpression.WHITE_SPACE) &&
                this._testPattern(item.pattern, this.maskExpression)
        );
    }

    private _retrieveSeparatorPrecision(maskExpression: string): number | null {
        const matcher: RegExpMatchArray | null = maskExpression.match(
            new RegExp(`^separator\\.([^d]*)`)
        );
        return matcher ? Number(matcher[1]) : null;
    }

    public _checkPrecision(separatorExpression: string, separatorValue: string): number | string {
        const separatorPrecision = this.getPrecision(separatorExpression);
        let value = separatorValue;

        if (
            (separatorExpression.indexOf('2') > 0 && !this._isFocused()) ||
            (this.leadZero &&
                !this._isFocused() &&
                Number(separatorPrecision) > 0 &&
                Number.isFinite(separatorPrecision))
        ) {
            if (
                this.leadZero &&
                usesCommaDecimal(value, this.decimalMarker, this.thousandSeparator)
            ) {
                value = value.replace(',', '.');
            }
            if (Number.isNaN(Number(value))) {
                // Not a number the padding can read: show it unpadded rather than as 'NaN'.
                return separatorValue;
            }
            const precision = this.leadZero ? Number(separatorPrecision) : 2;
            // #1567: Number(value).toFixed() corrupts values with more significant digits
            // than an IEEE-754 double can hold (e.g. '999999999999999.99' becomes
            // '1000000000000000.00'). Round such values textually instead; safe-range
            // values keep the original toFixed() semantics.
            if (this._exceedsDoublePrecision(value)) {
                return this._stringToFixed(value, precision);
            }
            return Number(value).toFixed(precision);
        }
        return this.numberToString(value);
    }

    /**
     * True when the plain decimal string carries more significant digits than an IEEE-754
     * double can represent exactly (15 is the guaranteed round-trip digit count), meaning a
     * Number() round-trip would corrupt it (#1567).
     */
    private _exceedsDoublePrecision(value: string): boolean {
        if (!/^-?\d+(\.\d+)?$/.test(value)) {
            return false;
        }
        const significantDigits = value.replace(/\D/g, '').replace(/^0+/, '');
        return significantDigits.length > 15;
    }

    /**
     * Exact string-based equivalent of Number.prototype.toFixed (round half away from zero)
     * for plain decimal strings beyond double precision (#1567).
     */
    private _stringToFixed(value: string, precision: number): string {
        const isNegative = value.startsWith('-');
        const absValue = isNegative ? value.slice(1) : value;
        const [integerPart = '0', fractionPart = ''] = absValue.split('.');
        const paddedFraction = fractionPart.padEnd(precision + 1, '0');
        const keptFraction = paddedFraction.slice(0, precision);
        const shouldRoundUp = (paddedFraction.charCodeAt(precision) || 0) >= 53; // '5'
        let scaled = BigInt(integerPart + keptFraction);
        if (shouldRoundUp) {
            scaled += 1n;
        }
        const digits = scaled.toString().padStart(precision + 1, '0');
        const sign = isNegative && scaled > 0n ? '-' : '';
        return precision > 0
            ? `${sign}${digits.slice(0, -precision)}.${digits.slice(-precision)}`
            : `${sign}${digits}`;
    }

    public _repeatPatternSymbols(maskExp: string): string {
        let start = 0;
        return (
            (maskExp.match(/{[0-9]+}/) &&
                maskExp
                    .split('')
                    .reduce((accum: string, currVal: string, index: number): string => {
                        start = currVal === MaskExpression.CURLY_BRACKETS_LEFT ? index : start;
                        if (currVal !== MaskExpression.CURLY_BRACKETS_RIGHT) {
                            return this._findSpecialChar(currVal) ? accum + currVal : accum;
                        }
                        const repeatNumber = Number(maskExp.slice(start + 1, index));
                        const replaceWith: string = new Array(repeatNumber + 1).join(
                            maskExp[start - 1]
                        );
                        if (
                            maskExp.slice(0, start).length > 1 &&
                            maskExp.includes(MaskExpression.LETTER_S)
                        ) {
                            const symbols = maskExp.slice(0, start - 1);
                            return symbols.includes(MaskExpression.CURLY_BRACKETS_LEFT)
                                ? accum + replaceWith
                                : symbols + accum + replaceWith;
                        } else {
                            return accum + replaceWith;
                        }
                    }, '')) ||
            maskExp
        );
    }

    /**
     * Decimal marker of the value being normalized in writeValue/pipe flows.
     *
     * #1573: this used to return the RUNTIME default locale's decimal marker
     * ((1.1).toLocaleString().substring(1, 2)), which made mask behavior depend on the
     * OS/browser regional format: under a comma-decimal locale (e.g. Edge + Austrian
     * regional settings) a preformatted value like '10,000' (thousandSeparator ',')
     * had its ',' replaced by the configured '.' decimalMarker, corrupting the value
     * 1000x. JS number stringification (String(n)) always uses '.', and string values
     * are expected to use the configured markers — the runtime locale is never the
     * right source, so this is always '.'.
     */
    public currentLocaleDecimalMarker(): string {
        return '.';
    }
}
