import type { OnChanges, SimpleChanges } from '@angular/core';
import {
    afterNextRender,
    Injector,
    NgZone,
    input,
    output,
    model,
    effect,
    Directive,
    inject,
    untracked,
    booleanAttribute,
    ChangeDetectorRef,
    ElementRef,
    Renderer2,
} from '@angular/core';
import type {
    AbstractControl,
    ControlValueAccessor,
    FormControl,
    ValidationErrors,
    Validator,
} from '@angular/forms';
import { NgControl } from '@angular/forms';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import type { FormValueControl } from '@angular/forms/signals';

import type { NgxMaskConfig } from './ngx-mask.config';
import { NGX_MASK_CONFIG, resolveMaskAlias, timeMasks, withoutValidation } from './ngx-mask.config';
import {
    isDateTimeMask,
    leadZeroDateTimeCaret,
    overwriteDateSlot,
    overwriteFullDateValue,
    setUserEdit,
} from './caret/date-overflow';
import { resolveKeepCharacterPositions } from './caret/keep-character-positions';
import { inferEditRange } from './caret/edit-range';
import { NgxMaskService } from './ngx-mask.service';
import { MaskExpression } from './ngx-mask-expression.enum';
import {
    containsStarSymbol,
    displayToPlainDecimal,
    escapeRegExp,
    retargetSeparatorValue,
    usesCommaDecimal,
} from './ngx-mask.utils';

const notFilled = (errors: ValidationErrors | null) => ({ errors, filled: false });

/** Index where the suffix starts in the display, or Infinity when the display carries none (hiddenInput). */
const suffixStart = (display: string, suffix: string): number =>
    suffix && display.endsWith(suffix) ? display.length - suffix.length : Infinity;

// Inputs copied verbatim onto NgxMaskService by ngOnChanges (see `_mirrorInput`).
const MIRRORED_INPUTS = [
    'instantPrefix',
    'prefix',
    'suffix',
    'decimalMarker',
    'dropSpecialCharacters',
    'shownMaskExpression',
    'clearIfNotMatch',
    'validation',
    'separatorLimit',
    'typeFromDecimals',
    'leadZeroDateTime',
    'leadZero',
    'triggerOnMaskChange',
    'inputTransformFn',
    'outputTransformFn',
    'keepCharacterPositions',
] as const satisfies readonly (keyof NgxMaskService & keyof NgxMaskDirective)[];

type MirroredInput = (typeof MIRRORED_INPUTS)[number];

@Directive({
    selector: 'input[mask], textarea[mask]',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: NgxMaskDirective,
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: NgxMaskDirective,
            multi: true,
        },
        NgxMaskService,
    ],
    exportAs: 'mask,ngxMask',
    host: {
        '(paste)': 'onPaste()',
        '(focus)': 'onFocus()',
        '(ngModelChange)': 'onModelChange($event)',
        '(input)': 'onInput($event)',
        '(compositionstart)': 'onCompositionStart()',
        '(compositionend)': 'onCompositionEnd($event)',
        '(blur)': 'onBlur($event)',
        '(click)': 'onClick($event)',
        '(keydown)': 'onKeyDown($event)',
        '(keyup)': 'onKeyUp()',
    },
})
export class NgxMaskDirective
    implements
        ControlValueAccessor,
        OnChanges,
        Validator,
        FormValueControl<string | number | null | undefined>
{
    // ===== Mask Configuration Inputs =====
    public mask = input<string | undefined | null>('');
    public specialCharacters = input<NgxMaskConfig['specialCharacters']>([]);
    public patterns = input<NgxMaskConfig['patterns']>({});
    public prefix = input<NgxMaskConfig['prefix']>('');
    public suffix = input<NgxMaskConfig['suffix']>('');
    public thousandSeparator = input<NgxMaskConfig['thousandSeparator']>(' ');
    public decimalMarker = input<NgxMaskConfig['decimalMarker']>('.');
    public dropSpecialCharacters = input<NgxMaskConfig['dropSpecialCharacters'] | null>(null);
    public hiddenInput = input<NgxMaskConfig['hiddenInput'] | null>(null);
    public showMaskTyped = input<NgxMaskConfig['showMaskTyped'] | null>(null);
    public placeHolderCharacter = input<NgxMaskConfig['placeHolderCharacter'] | null>(null);
    public shownMaskExpression = input<NgxMaskConfig['shownMaskExpression'] | null>(null);
    public clearIfNotMatch = input<NgxMaskConfig['clearIfNotMatch'] | null>(null);
    public validation = input<NgxMaskConfig['validation'] | null>(null);
    public separatorLimit = input<NgxMaskConfig['separatorLimit'] | null>('');
    public typeFromDecimals = input<NgxMaskConfig['typeFromDecimals'] | null>(null);
    public allowNegativeNumbers = input<NgxMaskConfig['allowNegativeNumbers'] | null>(null);
    public leadZeroDateTime = input<NgxMaskConfig['leadZeroDateTime'] | null>(null);
    public leadZero = input<NgxMaskConfig['leadZero'] | null>(null);
    public triggerOnMaskChange = input<NgxMaskConfig['triggerOnMaskChange'] | null>(null);
    public apm = input<NgxMaskConfig['apm'] | null>(null);
    public inputTransformFn = input<NgxMaskConfig['inputTransformFn'] | null>(null);
    public outputTransformFn = input<NgxMaskConfig['outputTransformFn'] | null>(null);
    public keepCharacterPositions = input<NgxMaskConfig['keepCharacterPositions'] | null>(null);
    public instantPrefix = input<NgxMaskConfig['instantPrefix'] | null>(null);
    // Read directly at blur time (signal is always current) and falls back to the DI
    // config, so no ngOnChanges mirroring into the service is needed (#1435).
    public defaultValueOnBlur = input<NgxMaskConfig['defaultValueOnBlur']>(null);

    /**
     * Signal Forms `FormValueControl` surface. At runtime `FormField` never drives this model
     * when the directive is bound (it prefers the `NG_VALUE_ACCESSOR` provided above, see
     * `_isCvaMode`), but the template type-checker treats any directive owning a `value` model
     * as the field's custom control and checks the bound field's value type against it (#1640).
     * The model therefore accepts exactly what `writeValue()` accepts — `string | number | null |
     * undefined` — so numeric and nullable fields (`signal({ amount: 0 })`,
     * `signal<number | null>(null)`, `signal<string | null>(null)`) compile under
     * `strictTemplates`. Values pushed back into the model are always the unmasked string (see
     * `_propagateToValueModel`), i.e. `value()` / `valueChange` are declared wider than what is
     * emitted.
     */
    public value = model<string | number | null | undefined>('');
    public disabled = input(false, { transform: booleanAttribute });
    public touched = model<boolean>(false);

    public maskFilled = output<void>();

    private _maskValue = '';
    private _inputValue = '';
    private _code = '';
    /**
     * Whether a keydown preceded the input event being handled: only then do the key code and
     * the selection it recorded describe that edit. IME, dictation, autofill and
     * `execCommand('insertText')` fire none, so they must not inherit the previous key's.
     */
    private _keydownPending = false;
    private _maskExpressionArray: string[] = [];
    private _justPasted = false;
    /** For IME composition event */
    private _isComposing = false;
    /**
     * True once Angular has driven this directive through the `ControlValueAccessor` contract
     * (`registerOnChange`). NOTE: Signal Forms' `FormField` ALSO takes this path — it prefers a
     * host-provided `NG_VALUE_ACCESSOR` over the custom-control `value` model binding (see
     * `FormField.ɵngControlCreate`), so it calls `registerOnChange`/`writeValue` too and this
     * flag is `true` in both modes. That is fine: with the flag set, the `value`-model effect
     * below is a no-op and all rendering goes through `writeValue()`. The `value` model is only
     * driven directly (flag stays `false`) when the directive is used standalone with a
     * `[(value)]` binding and no forms integration.
     */
    private _isCvaMode = false;
    /** Guards against the value effect echoing back a value we just propagated ourselves. */
    private _skipNextValueEffect = false;
    /**
     * The exact stringified value last pushed through `onChange` (view → model). Signal Forms'
     * `FormField` echoes every model update back through `writeValue()` — including updates that
     * originated from the view. Re-masking that unmasked echo is at best a redundant re-render
     * and at worst destructive for masks whose unmasked form is ambiguous (e.g. IP:
     * '192168178' cannot reconstruct the typed dots of '192.168.1.78'). `writeValue()` consumes
     * this marker to skip exactly that echo; ngOnChanges reads it to recognise a `[value]`
     * binding echo of it (#1671). `null` = no pending propagation.
     */
    private _lastPropagatedValue: string | null = null;
    /** The last non-empty value written to the control was a number (#1701). */
    private _numberWritten = false;
    /**
     * Counts the values put into the input: each `writeValue` that reached the rendering step and
     * each user edit. A write whose masked echo makes a `valueChanges` subscriber call `setValue`
     * again is superseded by that nested write; the outer one compares this counter and leaves the
     * DOM to the latest write (#1691). The deferred leadZero pass of a write compares it as well, so
     * it never re-applies the written value over a newer write or a user edit.
     */
    private _writeSequence = 0;
    /**
     * True while the directive renders a value the user did not type: a `writeValue`, its deferred
     * leadZero pass, a separator change re-rendering the number, a default applied on blur. A model
     * update the mask derives from such a write goes straight to the control without dirtying it
     * (see `_emitProgrammaticValue`).
     */
    private _programmaticWrite = false;
    /**
     * The value the edit currently handled by `onInput` pushed through `onChange`, `null` while it
     * pushed nothing. Read right after the edit to decide `maskFilled`.
     */
    private _valuePropagatedByEdit: string | null = null;
    /**
     * True once the first `ngOnChanges` pass has applied the mask configuration to the service.
     * Signal Forms' `FormField` syncs its field value through the template `ɵɵcontrol` update
     * instruction, which runs BEFORE the sibling directives' first `ngOnChanges` on the same
     * element — so the very first `writeValue()` would otherwise see an unconfigured service
     * (empty `maskExpression`, default `leadZero`/`thousandSeparator`/...) and render the raw
     * value. Until this flag is set, `writeValue()` stashes the incoming value and `ngOnChanges`
     * replays it once the configuration is in place.
     */
    private _configApplied = false;
    private _pendingInitialValue: unknown;
    private _hasPendingInitialValue = false;
    /**
     * True once the `disabled` input has ever delivered `true`. The disabled effect's very
     * first run fires with the input's default `false` even when nothing binds `[disabled]`.
     * Because effects run after Angular Forms' `setUpControl` (which calls
     * `setDisabledState(true)` for initially-disabled controls) and both DOM writes are
     * queueMicrotask-deferred in FIFO order, forwarding that default `false` would land last
     * and re-enable an initially-disabled control (#1607, #1614). An initial `false` write is
     * never needed — inputs are enabled by default — so `false` is only forwarded after the
     * input has explicitly driven the state to `true` at least once.
     */
    private _disabledEverSet = false;
    /** Ensures the multi-character placeHolderCharacter warning (#1347) is emitted only once. */
    private _warnedAboutMultiCharPlaceholder = false;

    public _maskService = inject(NgxMaskService, { self: true });
    protected _config = inject<NgxMaskConfig>(NGX_MASK_CONFIG);
    /**
     * `specialCharacters` and `decimalMarker` as bound (the config values when unbound). The
     * service derives working values from them for the current configuration (the minus
     * `allowNegativeNumbers` keeps, the markers a separator mask drops, the comma a dot
     * thousandSeparator forces), so a runtime reconfiguration starts again from these instead of
     * piling the previous configuration's reductions up.
     */
    private readonly _boundConfig: Pick<NgxMaskConfig, 'specialCharacters' | 'decimalMarker'> = {
        specialCharacters: this._config.specialCharacters,
        decimalMarker: this._config.decimalMarker,
    };
    /**
     * Under zoneless change detection, writing to the underlying FormControl programmatically
     * (e.g. `setValue`/`patchValue` from outside a signal/effect context, or from a callback
     * zone.js used to auto-flush like a deferred render callback or `queueMicrotask`) does not itself
     * trigger a CD run. Bindings that read `form.pristine`/`form.dirty`/`form.value` on the host
     * template need an explicit `markForCheck()` once the directive finishes reacting to a
     * programmatic value write, otherwise the view stays stale until something else schedules CD.
     */
    private readonly _changeDetectorRef = inject(ChangeDetectorRef);
    private readonly _elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);
    private readonly _renderer = inject(Renderer2);

    // Injector is used to lazily resolve NgControl. NgControl cannot be injected directly:
    // this directive is registered as the control's NG_VALUE_ACCESSOR, so a direct
    // inject(NgControl) would form a circular dependency. Resolving it lazily on first use
    // (after the control graph is wired) sidesteps the cycle.
    private readonly _injector = inject(Injector);
    // Render hooks run outside the Angular zone; the deferred work below re-enters it so zone.js
    // apps still get change detection for the emissions it triggers.
    private readonly _ngZone = inject(NgZone);

    private _ngControl: NgControl | null | undefined;

    /**
     * The nearest NgControl: the element's own, else the one bound to an enclosing custom control.
     * Only read from the `registerOnChange` callback, i.e. once a control was handed this
     * directive's accessor contract — directly, or forwarded by a wrapper whose control is then
     * the nearest one. A wrapper that implements the contract itself never registers with the
     * mask, so the mask never writes to that wrapper's control.
     */
    private _resolveNgControl(): NgControl | null {
        if (typeof this._ngControl === 'undefined') {
            this._ngControl = this._injector.get(NgControl, null);
        }
        return this._ngControl;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onChange = (_: unknown) => {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onTouch = () => {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private _onValidatorChange = () => {};

    public constructor() {
        // Default onChange used in Signal Forms mode, where Angular never calls registerOnChange.
        // It pushes the unmasked value into the `value` model so the `valueChange` output fires.
        // registerOnChange() overrides this to additionally invoke Angular's CVA callback.
        this._maskService.onChange = this.onChange = (value: unknown) => {
            this._propagateToValueModel(value);
        };

        // Signal Forms drives the `value` model input directly (custom-control mode).
        // In classic CVA mode `writeValue` handles rendering instead, so this effect is a no-op
        // there. We skip the pass immediately following our own onChange propagation to avoid
        // clobbering the raw `_inputValue` with the masked value echoed back from the model.
        effect(() => {
            const signalValue = this.value();
            untracked(() => {
                if (this._valueEffectWillWrite(signalValue)) {
                    this.writeValue(signalValue);
                } else {
                    this._skipNextValueEffect = false;
                }
            });
        });

        effect(() => {
            const isDisabled = this.disabled();
            untracked(() => {
                // Never force-enable on the default `false`: it would clobber Angular Forms'
                // own setDisabledState(true) for initially-disabled controls (see
                // _disabledEverSet). `false` is forwarded only after an explicit `true`.
                if (!isDisabled && !this._disabledEverSet) {
                    return;
                }
                this._disabledEverSet = true;
                this.setDisabledState(isDisabled);
            });
        });
    }

    public ngOnChanges(changes: SimpleChanges): void {
        const {
            mask,
            specialCharacters,
            patterns,
            prefix,
            suffix,
            thousandSeparator,
            decimalMarker,
            dropSpecialCharacters,
            hiddenInput,
            showMaskTyped,
            placeHolderCharacter,
            clearIfNotMatch,
            validation,
            allowNegativeNumbers,
            apm,
        } = changes;
        const previousSeparators = {
            thousandSeparator: this._maskService.thousandSeparator,
            decimalMarker: this._maskService.decimalMarker,
            prefix: this._maskService.prefix,
            suffix: this._maskService.suffix,
        };
        if (mask) {
            if (mask.currentValue !== mask.previousValue && !mask.firstChange) {
                this._maskService.maskChanged = true;
            }
            // User-defined aliases (config maskAliases) expand BEFORE any other processing,
            // including the `||` multi-mask split — an alias may expand to a multi-mask.
            const resolvedMask = this._resolvedMaskInput();
            const maskParts = resolvedMask.split(MaskExpression.OR);
            if (maskParts.length > 1) {
                this._maskExpressionArray = maskParts.sort(
                    (a: string, b: string) => a.length - b.length
                );
                this._setMask();
            } else {
                this._maskExpressionArray = [];
                this._maskValue = resolvedMask;
                this._maskService.maskExpression = this._maskValue;
            }
            this._syncNumberValue();
        }
        // A non-array value (e.g. null from an unset dynamic config) keeps the current
        // service value (config defaults) and must not abort the whole ngOnChanges pass,
        // otherwise sibling inputs changed in the same cycle would be silently ignored (#1512).
        if (Array.isArray(specialCharacters?.currentValue)) {
            this._boundConfig.specialCharacters = specialCharacters.currentValue;
            this._maskService.specialCharacters = specialCharacters.currentValue;
        }
        if (allowNegativeNumbers) {
            this._maskService.allowNegativeNumbers = allowNegativeNumbers.currentValue;
            this._keepMinusOutOfSpecialCharacters();
        }
        // Only overwrite the mask available patterns if a pattern has actually been passed in
        if (patterns?.currentValue) {
            this._maskService.patterns = patterns.currentValue;
        }
        if (apm) {
            // A falsy value (`false`) must be mirrored too, otherwise it cannot override a global
            // `apm: true` or switch the option off at runtime; `null` means "unset" -> config.
            this._maskService.apm = apm.currentValue ?? this._config.apm;
        }

        if (decimalMarker) {
            this._boundConfig.decimalMarker = decimalMarker.currentValue;
        }
        if (thousandSeparator) {
            this._maskService.thousandSeparator = thousandSeparator.currentValue;
            if (thousandSeparator.previousValue && thousandSeparator.currentValue) {
                // The marker the previous separator forced (a dot thousandSeparator turns '.'
                // into ',') is not the bound one: start from the bound marker again.
                this._maskService.decimalMarker = this._boundConfig.decimalMarker;
                if (thousandSeparator.currentValue === this._maskService.decimalMarker) {
                    this._maskService.decimalMarker =
                        thousandSeparator.currentValue === ',' ? '.' : ',';
                }
                this._maskService.writingValue = true;
            }
        }
        if (hiddenInput) {
            this._maskService.hiddenInput = hiddenInput.currentValue;
            if (hiddenInput.previousValue === true && hiddenInput.currentValue === false) {
                this._inputValue = this._maskService.actualValue;
            }
        }
        if (showMaskTyped) {
            this._maskService.showMaskTyped = showMaskTyped.currentValue;
            if (
                showMaskTyped.previousValue === false &&
                showMaskTyped.currentValue === true &&
                this._maskService._isFocused()
            ) {
                afterNextRender(
                    () => {
                        // The render hook fires before the microtask that writes the mask
                        // skeleton (formElementProperty); click after it so onClick sees it.
                        queueMicrotask(() =>
                            this._ngZone.run(() => {
                                this._maskService._elementRef?.nativeElement.click();
                            })
                        );
                    },
                    { injector: this._injector }
                );
            }
        }
        if (placeHolderCharacter) {
            // `null`/`undefined` means "no custom placeholder" (#1643): fall back to the default
            // instead of storing null, which broke every `.length` read on the service.
            this._maskService.placeHolderCharacter =
                placeHolderCharacter.currentValue ?? this._config.placeHolderCharacter;
            if (
                typeof placeHolderCharacter.currentValue === 'string' &&
                placeHolderCharacter.currentValue.length > 1 &&
                !this._warnedAboutMultiCharPlaceholder
            ) {
                this._warnedAboutMultiCharPlaceholder = true;
                // eslint-disable-next-line no-console
                console.warn(
                    'Ngx-mask: placeHolderCharacter should be a single character; behavior with multi-character values is undefined (e.g. keepCharacterPositions will not work). Current value:',
                    placeHolderCharacter.currentValue
                );
            }
        }
        const specialCharactersSources = [
            mask,
            specialCharacters,
            allowNegativeNumbers,
            thousandSeparator,
            decimalMarker,
            dropSpecialCharacters,
        ];
        // A switch to no mask is neutral: the raw-value revert of the empty mask (applyMask's
        // maskChanged branch) strips with the working set of the mask the value was produced by
        // (a separator mask keeps its markers out of it), so the rebuild from the bound values
        // waits for the next mask.
        if (
            this._maskValue &&
            specialCharactersSources.some((change) => change && !change.firstChange)
        ) {
            this._maskService.specialCharacters = this._boundConfig.specialCharacters;
            this._keepMinusOutOfSpecialCharacters();
        }
        // Pure mirrors: runs after every explicit block above (a bound decimalMarker wins over the
        // one the thousandSeparator block derives) and before `_applyMask`.
        for (const key of MIRRORED_INPUTS) {
            const change = changes[key];
            if (change) {
                this._mirrorInput(key, change.currentValue);
            }
        }
        const retargetSeparators =
            (thousandSeparator || decimalMarker) &&
            this._configApplied &&
            this._maskValue.startsWith(MaskExpression.SEPARATOR) &&
            this._inputValue;
        if (retargetSeparators) {
            // The rendered number still uses the previous markers: carry it over to the new ones
            // before the mask re-reads it, or its old decimal marker becomes a thousand separator.
            this._inputValue = retargetSeparatorValue(
                this._inputValue,
                previousSeparators,
                this._maskService
            );
            this._maskService.actualValue = this._inputValue;
            this._maskService.writingValue = true;
            // The re-render below carries the number over to the new markers: what an earlier
            // write still has deferred (the leadZero pass) holds it in the old ones.
            this._writeSequence++;
        }
        // #1671: a standalone `[(value)]` change reaches ngOnChanges BEFORE the value effect
        // writes it, so `_inputValue` still holds the PREVIOUS value here. Re-rendering it would
        // run applyMask on stale input, and whatever that emits (the showMaskTyped skeleton's
        // '', a hiddenInput / keepCharacterPositions reconstruction) flows back through onChange,
        // overwrites the freshly bound model and makes the effect skip the real write. When the
        // effect is about to render the new value via writeValue() anyway, only apply the mask
        // configuration here. The effect only runs when the `value` SIGNAL changes: a parent
        // re-binding the value we last propagated (an echo, possibly applied in a later task)
        // changes the binding but not the signal, which already holds it — that pass renders.
        const valueChange = changes['value'];
        const valueEffectWillRender =
            !!valueChange &&
            String(valueChange.currentValue) !== this._lastPropagatedValue &&
            this._valueEffectWillWrite(valueChange.currentValue);
        if (retargetSeparators && !this._maskService.maskChanged) {
            // Re-rendering the same number in the new markers is no user edit. A mask changed in
            // the same pass makes this render the triggerOnMaskChange emission instead, which
            // dirties the control like any other.
            this._writeProgrammatically(() => this._applyMask(!valueEffectWillRender));
        } else {
            this._applyMask(!valueEffectWillRender);
        }
        // `validate` reads these fields: Angular must re-run the validator, otherwise the
        // control keeps the verdict computed for the previous configuration until the next edit.
        // The first binding is skipped — the control validates itself when it is set up.
        const validationInputChanges = [
            mask,
            validation,
            patterns,
            prefix,
            suffix,
            dropSpecialCharacters,
            specialCharacters,
            clearIfNotMatch,
        ];
        // Runs after `_applyMask`: the verdict also reads state the mask pass derives
        // (`ipError`, `cpfCnpjError`), which must already describe the new configuration.
        if (validationInputChanges.some((change) => change && !change.firstChange)) {
            this._onValidatorChange();
        }
        if (!this._configApplied) {
            this._configApplied = true;
            if (this._hasPendingInitialValue) {
                // Replay the writeValue() call that arrived before this first ngOnChanges pass
                // (see _configApplied) now that the mask configuration is applied.
                this._hasPendingInitialValue = false;
                const pendingValue = this._pendingInitialValue;
                this._pendingInitialValue = null;
                this.writeValue(pendingValue);
            }
        }
    }

    /** With `allowNegativeNumbers` the minus is part of the number, never a character to drop. */
    private _keepMinusOutOfSpecialCharacters(): void {
        if (this._maskService.allowNegativeNumbers) {
            this._maskService.specialCharacters = this._maskService.specialCharacters.filter(
                (c: string) => c !== '-'
            );
        }
    }

    public validate({ value }: FormControl): ValidationErrors | null {
        return this._validateValue(value).errors;
    }

    /**
     * The validation verdict for `value`. `filled` is true when the value passed every check and
     * reached the end of the rules: a non-empty value that satisfies the mask. `maskFilled` is
     * derived from it after a user edit; the validator itself must stay side-effect free.
     */
    private _validateValue(value: FormControl['value']): {
        errors: ValidationErrors | null;
        filled: boolean;
    } {
        const processedValue: string = typeof value === 'number' ? String(value) : value;
        const maskValue = this._maskValue;

        if (!this._maskService.validation || !maskValue) {
            return notFilled(null);
        }
        // The IP / CPF verdicts are only written by their own handlers, so after a runtime mask
        // switch the last one is stale: honour it only while its mask is the active one.
        const isCpfCnpj =
            maskValue === MaskExpression.CPF_CNPJ || maskValue === MaskExpression.CPF_CNPJ_ALPHA;
        if (maskValue === MaskExpression.IP && this._maskService.ipError) {
            return notFilled(this._createValidationError(processedValue));
        }
        if (isCpfCnpj && this._maskService.cpfCnpjError) {
            return notFilled(this._createValidationError(processedValue));
        }
        if (maskValue.startsWith(MaskExpression.SEPARATOR)) {
            return notFilled(null);
        }
        if (withoutValidation.includes(maskValue)) {
            return notFilled(null);
        }
        if (this._maskService.clearIfNotMatch) {
            return notFilled(null);
        }
        if (timeMasks.includes(maskValue)) {
            return notFilled(this._validateTime(processedValue));
        }
        if (maskValue === MaskExpression.EMAIL_MASK) {
            const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;

            if (!emailPattern.test(processedValue) && processedValue) {
                return notFilled(this._createValidationError(processedValue));
            } else {
                return notFilled(null);
            }
        }
        if (processedValue && processedValue.length >= 1) {
            let counterOfOpt = 0;

            if (
                maskValue.includes(MaskExpression.CURLY_BRACKETS_LEFT) &&
                maskValue.includes(MaskExpression.CURLY_BRACKETS_RIGHT)
            ) {
                const lengthInsideCurlyBrackets = maskValue.slice(
                    maskValue.indexOf(MaskExpression.CURLY_BRACKETS_LEFT) + 1,
                    maskValue.indexOf(MaskExpression.CURLY_BRACKETS_RIGHT)
                );

                return notFilled(
                    lengthInsideCurlyBrackets === String(processedValue.length)
                        ? null
                        : this._createValidationError(processedValue)
                );
            }
            if (maskValue.startsWith(MaskExpression.PERCENT)) {
                return notFilled(null);
            }
            for (const key in this._maskService.patterns) {
                if (this._maskService.patterns[key]?.optional) {
                    if (maskValue.indexOf(key) !== maskValue.lastIndexOf(key)) {
                        const opt: string = maskValue
                            .split('')
                            .filter((i: string) => i === key)
                            .join('');
                        counterOfOpt += opt.length;
                    } else if (maskValue.indexOf(key) !== -1) {
                        counterOfOpt++;
                    }
                    const firstOptionalIndex = maskValue.indexOf(key);
                    if (firstOptionalIndex !== -1 && processedValue.length >= firstOptionalIndex) {
                        // #1515: the early "everything before the first optional token is
                        // filled" return is only sound for trailing-optional layouts. When a
                        // mandatory token follows the first optional one (e.g. `999SSS`,
                        // indexOf === 0) it used to mark EVERY value as valid.
                        const hasMandatoryAfterOptional = maskValue
                            .slice(firstOptionalIndex)
                            .split('')
                            .some(
                                (symbol: string) =>
                                    !!this._maskService.patterns[symbol] &&
                                    !this._maskService.patterns[symbol]?.optional
                            );
                        if (!hasMandatoryAfterOptional) {
                            return notFilled(null);
                        }
                        if (
                            !this._maskService.prefix &&
                            !this._maskService.suffix &&
                            this._isPlainTokenMask(maskValue)
                        ) {
                            // Position-aware check: match the value against the mask allowing
                            // optional tokens to be skipped; every mandatory token must be
                            // consumed (catches `12a` for `999SSS`, which a pure length
                            // check cannot).
                            return notFilled(
                                this._matchesMaskWithOptionalSkip(processedValue, maskValue)
                                    ? null
                                    : this._createValidationError(processedValue)
                            );
                        }
                        // Non-plain masks (prefix/suffix, exotic symbols) fall through to the
                        // legacy length check below (`maskValue.length - counterOfOpt`).
                    }
                    if (counterOfOpt === maskValue.length) {
                        return notFilled(null);
                    }
                }
            }
            if (
                (maskValue.indexOf(MaskExpression.SYMBOL_STAR) > 1 &&
                    processedValue.length < maskValue.indexOf(MaskExpression.SYMBOL_STAR)) ||
                (maskValue.indexOf(MaskExpression.SYMBOL_QUESTION) > 1 &&
                    processedValue.length < maskValue.indexOf(MaskExpression.SYMBOL_QUESTION))
            ) {
                return notFilled(this._createValidationError(processedValue));
            }
            if (
                maskValue.indexOf(MaskExpression.SYMBOL_STAR) === -1 ||
                maskValue.indexOf(MaskExpression.SYMBOL_QUESTION) === -1
            ) {
                const array = maskValue.split('*');
                const length: number = this._maskService.dropSpecialCharacters
                    ? maskValue.length -
                      this._maskService.checkDropSpecialCharAmount(maskValue) -
                      counterOfOpt
                    : this._maskService.prefix
                      ? maskValue.length + this._maskService.prefix.length - counterOfOpt
                      : maskValue.length - counterOfOpt;

                if (array.length === 1) {
                    if (processedValue.length < length) {
                        // #1583: for `||` multi-masks, a value shorter than the selected
                        // alternative can still be complete: it must stop exactly at a
                        // special-character boundary of the selected alternative and satisfy
                        // the length requirement of another (shorter) alternative.
                        if (this._isCompleteAlternativeBoundary(processedValue)) {
                            return notFilled(null);
                        }
                        return notFilled(this._createValidationError(processedValue));
                    }
                }
                if (array.length > 1) {
                    const lastIndexArray = array[array.length - 1];
                    if (
                        lastIndexArray &&
                        this._maskService.specialCharacters.includes(lastIndexArray[0] as string) &&
                        String(processedValue).includes(lastIndexArray[0] ?? '') &&
                        !this._maskService.dropSpecialCharacters
                    ) {
                        const special = processedValue.split(lastIndexArray[0] as string);
                        return notFilled(
                            special[special.length - 1]?.length === lastIndexArray.length - 1
                                ? null
                                : this._createValidationError(processedValue)
                        );
                    } else if (
                        ((lastIndexArray &&
                            !this._maskService.specialCharacters.includes(
                                lastIndexArray[0] as string
                            )) ||
                            !lastIndexArray ||
                            this._maskService.dropSpecialCharacters) &&
                        processedValue.length >= length - 1
                    ) {
                        return notFilled(null);
                    } else {
                        return notFilled(this._createValidationError(processedValue));
                    }
                }
            }
            if (
                maskValue.indexOf(MaskExpression.SYMBOL_STAR) === 1 ||
                maskValue.indexOf(MaskExpression.SYMBOL_QUESTION) === 1
            ) {
                return notFilled(null);
            }
        }
        return { errors: null, filled: !!value };
    }

    public onPaste() {
        this._justPasted = true;
    }

    public onFocus(): void {
        this._maskService._isFocused.set(true);
    }

    public onModelChange(value: unknown): void {
        // on form reset we need to update the actualValue
        if ((value ?? '') === '' && this._maskService.actualValue) {
            this._maskService.actualValue = this._maskService.getActualValue('');
        }
    }

    public onInput(e: Event): void {
        // A user edit supersedes what an earlier write still has deferred (see _writeSequence).
        this._writeSequence++;
        this._valuePropagatedByEdit = null;
        this._processInput(e);
        // `maskFilled` reports a mask completed by the user, so it is decided here, once per
        // edit, from the value this edit pushed to the model. It must not live in the validator:
        // that also runs for every programmatic write and every revalidation.
        const propagated = this._valuePropagatedByEdit;
        this._valuePropagatedByEdit = null;
        if (propagated !== null && this._validateValue(propagated).filled) {
            this.maskFilled.emit();
        }
    }

    /** `insertText`-style input event carrying more than one character (composition excluded). */
    private _isBulkInsertion(e: Event): boolean {
        const { inputType, data } = e as InputEvent;
        return (
            typeof inputType === 'string' &&
            inputType.startsWith('insert') &&
            inputType !== 'insertCompositionText' &&
            typeof data === 'string' &&
            data.length > 1
        );
    }

    // The caret of an edit that left the value without its prefix (the first character typed
    // into an empty field, or a selection that swallowed the prefix) sits before the prefix
    // that applyMask is about to prepend, so it is moved past it. An edit whose value still
    // starts with the prefix already reports the caret in display coordinates: shifting it
    // again lands a one-character prefix's index-1 edit one slot off (#1719, #1710).
    private _caretAfterPrefix(el: HTMLInputElement): number {
        const caret = el.selectionStart as number;
        const { prefix } = this._maskService;
        return caret === 1 && !el.value.startsWith(prefix) ? caret + prefix.length : caret;
    }

    /**
     * The index in the masked `display` right after the entered characters `typed` (what stood
     * before the caret). They are matched in order, so characters the mask prepended to them
     * (a lead zero) end up before the caret, not after it.
     */
    private _caretAfterTyped(display: string, typed: string): number {
        let index = this._maskService.prefix.length;
        for (const char of typed) {
            const found = display.indexOf(char, index);
            if (found === -1) {
                break;
            }
            index = found + 1;
        }
        return index;
    }

    /**
     * Whether nothing the user entered follows the caret, i.e. the edit ended the value. Only
     * the suffix and the untouched skeleton of a showMaskTyped / keepCharacterPositions field
     * (special and placeholder characters) may still follow it.
     */
    private _editEndsValue(el: HTMLInputElement): boolean {
        return !this._maskService.removeMask(el.value.slice(el.selectionEnd ?? el.value.length));
    }

    /**
     * An edit without a keydown has no recorded selection (the one kept is a previous key's).
     * It is read off the edit itself: the part of the display the inserted run replaced. Returns
     * the display before the edit, or null when the edit does not fit it and the recorded
     * selection stays.
     */
    private _inferKeylessSelection(el: HTMLInputElement, e: InputEvent): string | null {
        const svc = this._maskService;
        const { actualValue } = svc;
        const before = svc.hiddenInput ? svc.hiddenDisplay(actualValue) : actualValue;
        const range = inferEditRange(
            before,
            el.value,
            el.selectionStart ?? el.value.length,
            typeof e.data === 'string' ? e.data.length : null
        );
        if (!range) {
            return null;
        }
        svc.selStart = range.start;
        svc.selEnd = range.end;
        return before;
    }

    private _processInput(e: Event): void {
        this._maskService.isInitialized = true;
        // The value the keydown of this edit saw; `_inputValue` is overwritten with the edited one below.
        let preEditValue = this._inputValue;
        const hadKeydown = this._keydownPending;
        this._keydownPending = false;
        // Android IMEs report every keydown as key 'Unidentified' / keyCode 229, so a
        // backspace is undetectable from keydown alone and all _code()-based deletion
        // branches misfire (cursor jumps, "stuck" backspace — #1497). The input event's
        // inputType is the reliable source: derive the deletion code from it.
        const inputType: string | undefined = (e as InputEvent).inputType;
        if (inputType === 'deleteContentBackward') {
            this._code = MaskExpression.BACKSPACE;
        } else if (inputType === 'deleteContentForward') {
            this._code = MaskExpression.DELETE;
        } else if (
            inputType &&
            (!hadKeydown ||
                this._code === MaskExpression.BACKSPACE ||
                this._code === MaskExpression.DELETE)
        ) {
            // A non-delete edit that produced no meaningful keydown (IME insertion,
            // context-menu paste, dictation, insertText): drop the previous key's code so the
            // edit is not processed as that key (a backspace most of all).
            this._code = inputType;
        }
        // If IME is composing text, we wait for the composed text — but only when the mask
        // can actually accept letters. Purely numeric masks gain nothing from composition,
        // and some Android IMEs (Samsung Keyboard) deliver every keystroke as
        // insertCompositionText without firing compositionend until blur, which would leave
        // the FormControl stale for the whole edit (#1293).
        if (this._isComposing && this._maskAcceptsLetterInput()) {
            return;
        }
        const el: HTMLInputElement = (e as InputEvent).target as HTMLInputElement;

        if (!hadKeydown && typeof inputType === 'string') {
            preEditValue = this._inferKeylessSelection(el, e as InputEvent) ?? preEditValue;
        }

        const transformedValue = this._maskService.inputTransformFn
            ? this._maskService.inputTransformFn(el.value)
            : el.value;

        if (el.type !== 'number') {
            if (typeof transformedValue === 'string' || typeof transformedValue === 'number') {
                const transformedString = transformedValue.toString();
                // Only rewrite el.value when the transform actually changed it: any
                // programmatic `.value =` assignment clears the browser's "last changed
                // by a user edit" flag, which silently disables native constraint
                // validation (minlength -> validity.tooShort) even when the mask is a
                // no-op (#1379). With an empty mask the directive must stay a pure
                // passthrough for the native input.
                if (el.value !== transformedString) {
                    el.value = transformedString;
                }

                this._inputValue = el.value;
                this._setMask();

                if (!this._maskValue) {
                    this.onChange(el.value);
                    return;
                }

                // A whole string inserted by ONE edit (autofill, a drop, a speech or
                // clipboard-style IME insertion, the Browser pane's insertText) is a paste: it
                // arrives as a bare run of characters, not as a keystroke on top of the already
                // masked value, and fires no `paste` event. Only when the run ends the value,
                // though: the paste path puts the caret at the end of the value, which is wrong
                // for a run inserted (dictation, a spellcheck or predictive replacement) in the
                // middle of it — that edit keeps the keystroke path and its caret.
                if (this._isBulkInsertion(e) && this._editEndsValue(el)) {
                    this._justPasted = true;
                }

                // On paste of a raw value that does not yet carry the prefix, the caret
                // position reported by the element is prefix.length short of where it must
                // land once applyMask prepends the prefix (#1571). Captured here because the
                // applyValueChanges callback below resets the _justPasted flag.
                const pastedValueWithoutPrefix =
                    this._justPasted &&
                    !!this._maskService.prefix &&
                    !el.value.startsWith(this._maskService.prefix);

                const caret = el.selectionStart as number;
                let position: number = this._caretAfterPrefix(el);
                // A paste into the middle of a fixed mask: the applier's paste caret is the end of
                // the pasted value, so the caret is placed after what came before it instead.
                const typedBeforeCaret =
                    this._justPasted &&
                    !this._maskValue.startsWith(MaskExpression.SEPARATOR) &&
                    !this._editEndsValue(el)
                        ? this._maskService.removeMask(el.value.slice(0, caret))
                        : null;

                if (
                    this._maskService.keepCharacterPositions &&
                    this._maskService.placeHolderCharacter.length === 1 &&
                    !this._justPasted
                ) {
                    const kcp = resolveKeepCharacterPositions(this._maskService, {
                        elValue: el.value,
                        position,
                        code: this._code,
                        before: preEditValue,
                    });
                    if (kcp.actualValue !== null) {
                        this._maskService.actualValue = kcp.actualValue;
                    }
                    position = kcp.position;
                    // Whether the resolution fully rendered the display value into actualValue
                    // (applyMask then short-circuits), or the edit flows through regular masking.
                    this._maskService.keepCharacterPositionsHandled = kcp.handled;
                }

                // A literal '*' typed into the VALUE (custom pattern allowing asterisks) makes
                // the service's applyMask take its hiddenInput shadow-value branch, whose
                // equal/shorter-length cases restore the stale pre-edit actualValue and discard
                // a selection replacement (#1504). Without hiddenInput there is no shadow state
                // to preserve, so drop it and let the edited value flow through regular masking.
                if (
                    !this._maskService.hiddenInput &&
                    !this._maskService.showMaskTyped &&
                    !this._maskService.keepCharacterPositions &&
                    this._maskService.selStart !== this._maskService.selEnd &&
                    containsStarSymbol(
                        el.value,
                        this._maskService.maskExpression,
                        this._maskService.thousandSeparator
                    )
                ) {
                    this._maskService.actualValue = '';
                }

                let caretShift = 0;
                let backspaceShift = false;
                const isDeletion =
                    this._code === MaskExpression.BACKSPACE || this._code === MaskExpression.DELETE;
                if (this._code === MaskExpression.DELETE) {
                    this._maskService.deletedSpecialCharacter = true;
                }
                // A paste, a prefix, suffix, keepCharacterPositions or hiddenInput mask and any
                // typed edit overwriteDateSlot declines keep the older d0/M0/0000 overwrite.
                const keepsFullDateOverwrite =
                    this._justPasted ||
                    this._maskService.prefix ||
                    this._maskService.suffix ||
                    this._maskService.keepCharacterPositions ||
                    this._maskService.hiddenInput;
                const overwrite =
                    keepsFullDateOverwrite || isDeletion
                        ? null
                        : overwriteDateSlot(this._maskService, preEditValue, el.value, position);
                if (overwrite) {
                    el.value = overwrite.value;
                    this._inputValue = overwrite.value;
                    position = overwrite.position;
                } else if (keepsFullDateOverwrite || !isDeletion) {
                    const overwrittenDate = overwriteFullDateValue(
                        this._maskService.maskExpression,
                        this._inputValue,
                        position,
                        this._code
                    );
                    if (overwrittenDate !== null) {
                        el.value = overwrittenDate;
                    }
                }
                if (this._maskService.leadZeroDateTime) {
                    // The edit touches the characters next to the caret; a paste touches them all.
                    // A deletion that starts on a separator changes no field next to the caret, so
                    // it leaves nothing to clamp.
                    const removedChar = isDeletion ? (preEditValue[caret] ?? '') : '';
                    setUserEdit(
                        this._maskService,
                        this._maskService.specialCharacters.includes(removedChar)
                            ? null
                            : {
                                  value: el.value,
                                  start: this._justPasted ? 0 : caret - 1,
                                  end: this._justPasted
                                      ? el.value.length
                                      : (overwrite?.end ?? caret),
                              }
                    );
                    position = leadZeroDateTimeCaret(
                        this._maskService.maskExpression,
                        position,
                        el.value,
                        this._inputValue,
                        !!this._maskService.apm
                    );
                }

                this._maskService.applyValueChanges(
                    position,
                    this._justPasted,
                    isDeletion,
                    (shift: number, _backspaceShift: boolean) => {
                        this._justPasted = false;
                        caretShift = shift;
                        backspaceShift = _backspaceShift;
                    }
                );
                // The edit is masked; no later render of the same value is an edit.
                setUserEdit(this._maskService, null);
                // only set the selection if the element is active
                if (this._maskService._getActiveElement() !== el) {
                    return;
                }

                if (this._maskService.plusOnePosition) {
                    position = position + 1;
                    this._maskService.plusOnePosition = false;
                }
                // update position after applyValueChanges to prevent cursor on wrong position when it has an array of maskExpression
                if (this._maskExpressionArray.length) {
                    if (this._code === MaskExpression.BACKSPACE) {
                        const specialChartMinusOne = this._maskService.specialCharacters.includes(
                            this._maskService.actualValue.slice(position - 1, position)
                        );
                        const allowFewMaskChangeMask =
                            this._maskService.removeMask(this._inputValue)?.length ===
                            this._maskService.removeMask(this._maskService.maskExpression)?.length;

                        const specialChartPlusOne = this._maskService.specialCharacters.includes(
                            this._maskService.actualValue.slice(position, position + 1)
                        );
                        if (allowFewMaskChangeMask && !specialChartPlusOne) {
                            position = (el.selectionStart as number) + 1;
                        } else {
                            position = specialChartMinusOne ? position - 1 : position;
                        }
                    } else {
                        position = this._caretAfterPrefix(el);
                    }
                }
                let positionToApply: number =
                    position +
                    (this._code === MaskExpression.BACKSPACE && !backspaceShift ? 0 : caretShift);
                // For separator masks the applier's caret shift is computed on the raw
                // (prefix-less) value, so account for the prefix the mask just added (#1571).
                if (
                    pastedValueWithoutPrefix &&
                    this._maskValue.startsWith(MaskExpression.SEPARATOR)
                ) {
                    positionToApply += this._maskService.prefix.length;
                }
                if (typedBeforeCaret !== null) {
                    positionToApply = this._caretAfterTyped(el.value, typedBeforeCaret);
                }
                if (positionToApply > this._getActualInputLength()) {
                    // A bare decimal marker ('.' or, with a prefix, '$.') is not a number:
                    // formControlResult has just emitted null for it, which the ngModelChange
                    // reset handler treats as a form reset and clears actualValue. The plain
                    // length clamp would then land the caret BEFORE the marker — keep it right
                    // after the marker instead (#1572).
                    const decimalMarker = this._maskService.decimalMarker;
                    const prefix = this._maskService.prefix;
                    const valueWithoutPrefix = el.value.startsWith(prefix)
                        ? el.value.slice(prefix.length)
                        : el.value;
                    const isBareDecimalMarker =
                        valueWithoutPrefix.length === 1 &&
                        (Array.isArray(decimalMarker)
                            ? decimalMarker.includes(valueWithoutPrefix as '.' | ',')
                            : valueWithoutPrefix === decimalMarker);
                    positionToApply = isBareDecimalMarker
                        ? this._getActualInputLength() + 1
                        : this._getActualInputLength();
                    // A separator keystroke the mask rejected (display unchanged), typed past the
                    // value into the trailing placeholders, leaves the caret where it was typed,
                    // not at the end of the value (#1720). Typed text only: `caret - 1` is the
                    // pre-edit caret of a single character, not of a pasted run.
                    if (
                        inputType === 'insertText' &&
                        !isDeletion &&
                        el.value === preEditValue &&
                        this._maskValue.startsWith(MaskExpression.SEPARATOR)
                    ) {
                        positionToApply = caret - 1;
                    }
                }
                if (positionToApply < 0) {
                    positionToApply = 0;
                }
                if (el.selectionStart !== positionToApply || el.selectionEnd !== positionToApply) {
                    el.setSelectionRange(positionToApply, positionToApply);
                }
            } else {
                // eslint-disable-next-line no-console
                console.warn(
                    'Ngx-mask writeValue work with string | number, your current value:',
                    typeof transformedValue
                );
            }
        } else {
            if (!this._maskValue) {
                this.onChange(el.value);
                return;
            }
            this._maskService.applyValueChanges(
                el.value.length,
                this._justPasted,
                this._code === MaskExpression.BACKSPACE || this._code === MaskExpression.DELETE
            );
        }
    }

    /**
     * Whether any pattern slot of the current mask expression can accept a letter.
     * IME composition is only meaningful for such masks; for purely numeric masks
     * (digit patterns, separator, date/time, IP, CPF_CNPJ) waiting for compositionend
     * only delays the model sync — and Samsung Keyboard may never fire it until blur
     * (#1293). Unknown/letterless probe failures fall back to `false` (process live).
     */
    private _maskAcceptsLetterInput(): boolean {
        for (const symbol of this._maskService.maskExpression) {
            if (
                this._maskService._checkSymbolMask('a', symbol) ||
                this._maskService._checkSymbolMask('A', symbol)
            ) {
                return true;
            }
        }
        return false;
    }

    // IME starts
    public onCompositionStart(): void {
        this._isComposing = true;
    }

    // IME completes
    public onCompositionEnd(e: Event): void {
        this._isComposing = false;
        if (!this._maskAcceptsLetterInput()) {
            // For letterless masks every edit was already processed live in onInput
            // (#1293); reprocessing the same value through the paste path would
            // double-apply the mask.
            return;
        }
        this._justPasted = true;
        this.onInput(e);
    }

    public onBlur(e: Event): void {
        this._keydownPending = false;
        if (this._maskValue) {
            const el: HTMLInputElement = (e as FocusEvent).target as HTMLInputElement;
            if (this._applyDefaultValueOnBlur(el)) {
                // Padding or clearing the default is part of that programmatic write: it must not
                // dirty the control either. Blur still touches it (onTouch below).
                this._writeProgrammatically(() => this._formatOnBlur(el));
                this._changeDetectorRef.markForCheck();
            } else {
                this._formatOnBlur(el);
            }
        }
        this._maskService._isFocused.set(false);
        this.onTouch();
    }

    /** The blur-time leadZero padding and clearIfNotMatch pass. */
    private _formatOnBlur(el: HTMLInputElement): void {
        if (
            this._maskService.leadZero &&
            el.value.length > 0 &&
            typeof this._maskService.decimalMarker === 'string'
        ) {
            const maskExpression = this._maskService.maskExpression;
            const decimalMarker = this._maskService.decimalMarker as string;
            const suffix = this._maskService.suffix;
            const precision = Number(
                this._maskService.maskExpression.slice(
                    maskExpression.length - 1,
                    maskExpression.length
                )
            );

            if (precision > 0) {
                const unsuffixedValue = suffix ? el.value.split(suffix).join('') : el.value;
                const decimalPart = unsuffixedValue.split(decimalMarker)[1] as string;

                const paddedValue = unsuffixedValue.includes(decimalMarker)
                    ? unsuffixedValue + '0'.repeat(precision - (decimalPart?.length || 0)) + suffix
                    : unsuffixedValue + decimalMarker + '0'.repeat(precision) + suffix;
                // Only a blur that really pads the text is an edit: re-emitting the same
                // text would dirty the control and fire a duplicate valueChanges for a plain
                // focus + blur of a prefilled field.
                if (paddedValue !== el.value) {
                    el.value = paddedValue;
                    this._maskService.actualValue = el.value;
                    // #1634: propagate through the regular formControlResult pipeline (not a
                    // raw onChange) so outputTransformFn runs on this blur-time reformat, same
                    // as every typing-time emission. A raw onChange here sent the masked
                    // display string straight to the model, bypassing outputTransformFn.
                    this._maskService.formControlResult(this._maskService.actualValue);
                }
            }
        }
        this._maskService.clearIfNotMatchFn();
    }

    /**
     * Issue #1435 (defaultValueOnBlur): when configured — via the directive input or the
     * DI config — and the control's unmasked value is empty on blur (covers '', a bare
     * prefix/suffix and the showMaskTyped skeleton), writes the default through the
     * regular mask pipeline: applyMask renders the masked display and emits the usual
     * model output (dropSpecialCharacters/outputTransformFn applied) via formControlResult.
     * The default is no user edit, so it does not dirty the control. Returns whether a default
     * was applied.
     */
    private _applyDefaultValueOnBlur(el: HTMLInputElement): boolean {
        const defaultValue = this.defaultValueOnBlur() ?? this._config.defaultValueOnBlur;
        if (!defaultValue || this._maskService.removeMask(el.value)) {
            return false;
        }
        const displayValue = this._writeProgrammatically(() =>
            this._maskService.applyMask(defaultValue, this._maskService.maskExpression)
        );
        el.value = displayValue;
        this._inputValue = displayValue;
        return true;
    }

    public onClick(e: Event): void {
        if (!this._maskValue) {
            return;
        }

        const el: HTMLInputElement = (e as MouseEvent).target as HTMLInputElement;

        if (
            el !== null &&
            el.selectionStart !== null &&
            el.selectionStart === el.selectionEnd &&
            el.selectionStart > this._maskService.prefix.length
        ) {
            if (this._maskService.showMaskTyped && !this._maskService.keepCharacterPositions) {
                // We are showing the mask in the input
                this._maskService.maskIsShown = this._maskService.showMaskInInput();
                if (
                    el.setSelectionRange &&
                    this._maskService.prefix + this._maskService.maskIsShown === el.value
                ) {
                    // the input ONLY contains the mask, so position the cursor at the start
                    el.focus();
                    el.setSelectionRange(0, 0);
                } else {
                    // the input contains some characters already
                    if (el.selectionStart > this._maskService.actualValue.length) {
                        // if the user clicked beyond our value's length, position the cursor at the end of our value
                        el.setSelectionRange(
                            this._maskService.actualValue.length,
                            this._maskService.actualValue.length
                        );
                    }
                }
            }
        }
        const nextValue: string | null =
            el &&
            (el.value === this._maskService.prefix
                ? this._maskService.prefix + this._maskService.maskIsShown
                : el.value);

        /** Fix of cursor position jumping to end in most browsers no matter where cursor is inserted onFocus */
        if (el && el.value !== nextValue) {
            el.value = nextValue;
        }
        /** fix of cursor position with prefix when mouse click occur */
        if (
            el &&
            el.type !== 'number' &&
            ((el.selectionStart as number) || (el.selectionEnd as number)) <=
                this._maskService.prefix.length
        ) {
            const specialCharactersAtTheStart =
                this._maskService.maskExpression.match(
                    new RegExp(
                        `^[${this._maskService.specialCharacters.map((c) => escapeRegExp(c)).join('')}]+`
                    )
                )?.[0].length || 0;

            el.selectionStart = this._maskService.prefix.length + specialCharactersAtTheStart;
            return;
        }
        /** select only inserted text */
        if (el && (el.selectionEnd as number) > this._getActualInputLength()) {
            el.selectionEnd = this._getActualInputLength();
        }
    }

    public onKeyUp(): void {
        this._keydownPending = false;
    }

    public onKeyDown(event: Event): void {
        const e = event as KeyboardEvent;
        if (!this._maskValue) {
            return;
        }
        this._keydownPending = true;

        if (this._isComposing) {
            // User finalize their choice from IME composition, so trigger onInput() for the composed text.
            if (e.key === 'Enter') {
                this.onCompositionEnd(event);
                return;
            }
            // Android IMEs can keep a single composition open across many keystrokes
            // (#1293): still capture the pre-edit value and selection that onInput
            // relies on when it processes edits during composition.
            const composingEl = e.target as HTMLInputElement;
            this._inputValue = composingEl.value;
            this._maskService.selStart = composingEl.selectionStart;
            this._maskService.selEnd = composingEl.selectionEnd;
            return;
        }

        this._code = e.code ? e.code : e.key;
        const el: HTMLInputElement = e.target as HTMLInputElement;
        this._inputValue = el.value;
        this._setMask();

        const isTextarea = el.tagName.toLowerCase() === 'textarea';

        if (el.type !== 'number') {
            if (this._insertNumpadDecimalMarker(e, el)) {
                return;
            }
            if (e.key === MaskExpression.ARROW_UP && !isTextarea) {
                e.preventDefault();
            }
            if (
                e.key === MaskExpression.ARROW_LEFT ||
                e.key === MaskExpression.BACKSPACE ||
                e.key === MaskExpression.DELETE
            ) {
                if (e.key === MaskExpression.BACKSPACE && el.value.length === 0) {
                    el.selectionStart = el.selectionEnd;
                }
                if (e.key === MaskExpression.BACKSPACE && (el.selectionStart as number) !== 0) {
                    const prefixLength = this._maskService.prefix.length;
                    // Use the service value: it holds the config defaults when the input is not
                    // bound and the bound value otherwise, so an explicitly bound empty array is
                    // respected instead of silently falling back to the defaults (#1512).
                    const specialCharacters = this._maskService.specialCharacters;

                    if (prefixLength > 1 && (el.selectionStart as number) <= prefixLength) {
                        el.setSelectionRange(prefixLength, el.selectionEnd);
                    } else {
                        if (
                            this._inputValue.length !== (el.selectionStart as number) &&
                            (el.selectionStart as number) !== 1
                        ) {
                            const collapsedCaret = el.selectionStart === el.selectionEnd;
                            const hopFrom = el.selectionStart;
                            while (
                                specialCharacters.includes(
                                    (
                                        this._inputValue[(el.selectionStart as number) - 1] ?? ''
                                    ).toString()
                                ) &&
                                ((prefixLength >= 1 &&
                                    (el.selectionStart as number) > prefixLength) ||
                                    prefixLength === 0)
                            ) {
                                el.setSelectionRange(
                                    (el.selectionStart as number) - 1,
                                    el.selectionEnd
                                );
                            }
                            // keepCharacterPositions: take the digit in front of the separators
                            // along, so the default delete blanks it instead of only moving the caret
                            if (
                                this._maskService.keepCharacterPositions &&
                                collapsedCaret &&
                                el.selectionStart !== hopFrom &&
                                (el.selectionStart as number) > prefixLength &&
                                // a caret inside the suffix hops over its leading space only
                                (hopFrom as number) <=
                                    suffixStart(this._inputValue, this._maskService.suffix)
                            ) {
                                el.setSelectionRange(
                                    (el.selectionStart as number) - 1,
                                    el.selectionEnd
                                );
                            }
                        }
                    }
                }
                const { prefix, suffix, maskExpression, specialCharacters } = this._maskService;
                // Number masks keep their own caret handling around a prefix or suffix.
                const numberMask =
                    maskExpression.startsWith(MaskExpression.SEPARATOR) ||
                    maskExpression.startsWith(MaskExpression.PERCENT);
                // The clamp below pulls a caret inside the prefix up to its end, so remember the
                // one sitting exactly in front of the first digit: Delete may act there. Only for
                // a mask that starts with a digit slot after a prefix of two or more characters:
                // a caret at 1 is the first-character case of onInput, which shifts it by the
                // prefix length and so lands the edit one slot off.
                const deleteAtFirstSlot =
                    e.key === MaskExpression.DELETE &&
                    el.selectionStart === el.selectionEnd &&
                    el.selectionStart === prefix.length &&
                    prefix.length > 1 &&
                    el.value.startsWith(prefix) &&
                    !numberMask &&
                    // a date field cannot lose its first digit without scrambling the others
                    !isDateTimeMask(maskExpression) &&
                    !specialCharacters.includes(maskExpression.charAt(0));
                this.checkSelectionOnDeletion(el);
                if (
                    prefix.length &&
                    !deleteAtFirstSlot &&
                    (el.selectionStart as number) <= prefix.length &&
                    (el.selectionEnd as number) <= prefix.length
                ) {
                    e.preventDefault();
                }
                // Nothing editable follows the caret at the end of the digits, and the clamp
                // above put it right in front of the suffix: Delete would eat its first char.
                // Skipped when the display carries no suffix (hiddenInput) and for number masks.
                if (
                    e.key === MaskExpression.DELETE &&
                    suffix &&
                    !numberMask &&
                    el.selectionStart === el.selectionEnd &&
                    (el.selectionStart as number) >=
                        suffixStart(this._inputValue, this._maskService.suffix)
                ) {
                    e.preventDefault();
                }
                const cursorStart: number | null = el.selectionStart;
                if (
                    e.key === MaskExpression.BACKSPACE &&
                    !el.readOnly &&
                    cursorStart === 0 &&
                    el.selectionEnd === el.value.length &&
                    el.value.length !== 0
                ) {
                    // Handle the clear fully here instead of emitting the model change and
                    // relying on the browser's default deletion + input event to update the
                    // view: Firefox can drop the default action after the emission below
                    // triggers change detection (DOM churn around the input), leaving the
                    // model empty but the view untouched until a second Backspace (#1350).
                    e.preventDefault();
                    // The default action (and its input event) is suppressed, so the
                    // inputTransformFn would never see the cleared value; run it here (#1651).
                    const transformedEmpty = this._maskService.inputTransformFn
                        ? this._maskService.inputTransformFn('')
                        : '';
                    const clearedValue =
                        typeof transformedEmpty === 'string' || typeof transformedEmpty === 'number'
                            ? String(transformedEmpty)
                            : '';
                    const displayValue = this._maskService.applyMask(
                        clearedValue,
                        this._maskService.maskExpression,
                        0,
                        false,
                        true
                    );
                    el.value = displayValue;
                    this._inputValue = displayValue;
                    const caret = Math.min(this._maskService.prefix.length, displayValue.length);
                    el.setSelectionRange(caret, caret);
                }
            }
            if (
                !!this._maskService.suffix &&
                this._maskService.suffix.length > 1 &&
                this._inputValue.length - this._maskService.suffix.length <
                    (el.selectionStart as number)
            ) {
                el.setSelectionRange(
                    this._inputValue.length - this._maskService.suffix.length,
                    this._inputValue.length
                );
            } else if (
                (e.code === 'KeyA' && e.ctrlKey) ||
                (e.code === 'KeyA' && e.metaKey) // Cmd + A (Mac)
            ) {
                el.setSelectionRange(0, this._getActualInputLength());
                e.preventDefault();
            }
            this._maskService.selStart = el.selectionStart;
            this._maskService.selEnd = el.selectionEnd;
        }
    }

    /**
     * #1641: on layouts whose decimal separator is a comma, the numeric keypad still emits
     * a period, which a separator mask configured with a comma decimal marker rejects. The
     * keypad decimal key (`key: 'Decimal'`, or a `.` from `code: 'NumpadDecimal'`) is
     * therefore turned into the configured marker. Only the keypad key is intercepted: a
     * period typed on the main keyboard keeps its normal behavior (e.g. as a thousand
     * separator). Returns true when the key press was handled.
     */
    private _insertNumpadDecimalMarker(e: KeyboardEvent, el: HTMLInputElement): boolean {
        const isNumpadDecimal =
            e.key === MaskExpression.NUMPAD_DECIMAL ||
            (e.code === MaskExpression.NUMPAD_DECIMAL_CODE && e.key === '.');
        if (
            !isNumpadDecimal ||
            e.ctrlKey ||
            e.metaKey ||
            e.altKey ||
            el.readOnly ||
            !this._maskValue.startsWith(MaskExpression.SEPARATOR)
        ) {
            return false;
        }
        const configuredMarker = this._maskService.decimalMarker;
        const marker = Array.isArray(configuredMarker)
            ? configuredMarker.find((item) => item !== this._maskService.thousandSeparator)
            : configuredMarker;
        if (marker !== ',') {
            return false;
        }
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? start;
        e.preventDefault();
        this._code = MaskExpression.NUMPAD_DECIMAL_CODE;
        this._inputValue = el.value;
        this._maskService.selStart = start;
        this._maskService.selEnd = end;
        el.value = `${el.value.slice(0, start)}${marker}${el.value.slice(end)}`;
        el.setSelectionRange(start + 1, start + 1);
        el.dispatchEvent(
            new InputEvent('input', { inputType: 'insertText', data: marker, bubbles: true })
        );
        return true;
    }

    /**
     * Runs `write` as a programmatic write: the model updates it causes do not dirty the control
     * (see `_programmaticWrite`). Nested writes keep the flag of the enclosing one.
     */
    private _writeProgrammatically<T>(write: () => T): T {
        const enclosingWrite = this._programmaticWrite;
        this._programmaticWrite = true;
        try {
            return write();
        } finally {
            this._programmaticWrite = enclosingWrite;
        }
    }

    /**
     * Passes a model value the mask derived from a programmatic write on to the control, without
     * dirtying it.
     *
     * When the directive is the bound control's own accessor, `fn` is Angular's `updateControl`
     * callback: the value goes the way its view-change pipeline takes it (`setValue` without a
     * view echo, then `viewToModelUpdate`, which emits `ngModelChange`), minus `markAsDirty()`,
     * so the control and its ancestors keep the dirty and touched state they had. In every other
     * case (a wrapper forwarding the accessor, which transforms the value or reacts to it
     * itself; Signal Forms; no control) `fn` is the contract the caller registered and is called;
     * the control and its ancestors then get back the pristine and untouched state they had
     * before the call.
     */
    private _emitProgrammaticValue(fn: (value: unknown) => void, value: unknown): void {
        const ngControl = this._resolveNgControl();
        const control = ngControl?.control;
        if (
            ngControl?.valueAccessor === this &&
            control &&
            typeof control.setValue === 'function'
        ) {
            control.setValue(value, { emitModelToViewChange: false });
            ngControl.viewToModelUpdate(value);
            return;
        }
        // The control and its ancestors: `fn` dirties and touches the whole chain (a group is
        // dirty as soon as one child is), while an updateOn blur/submit control only queues the
        // dirt (`_pendingDirty`) and applies it later at blur or submit.
        const chain: AbstractControl[] = [];
        for (let c = control; c; c = c.parent) {
            chain.push(c);
        }
        const wasPristine = chain.filter((c) => c.pristine);
        const wasUntouched = chain.filter((c) => c.untouched);
        // Signal Forms: the field is no AbstractControl, and its parents derive their state from it
        // (like NgControl, FORM_FIELD resolves through NgValueAccessor, so it is looked up lazily)
        const field = this._injector.get(FORM_FIELD, null, { self: true })?.state();
        const fieldWasPristine = field && !field.dirty();
        const fieldWasTouched = field?.touched();
        fn(value);
        if (fieldWasPristine && field.dirty()) {
            // reset() drops dirty and touched without changing the value; only dirty may go
            field.reset();
            if (fieldWasTouched) {
                field.markAsTouched();
            }
        }
        for (const c of wasPristine) {
            // markAsPristine also drops the queued dirt, which `dirty` does not show yet
            if (c === control || c.dirty) {
                c.markAsPristine?.({ onlySelf: true });
            }
        }
        for (const c of wasUntouched) {
            if (c.touched) {
                c.markAsUntouched?.({ onlySelf: true });
            }
        }
    }

    /**
     * Whether the model takes numbers: a separator mask always does, any other mask only after a
     * number was written. Derived again on every write and mask change, so a runtime mask switch
     * emits the type a fresh mount with that mask would (#1701).
     */
    private _syncNumberValue(): void {
        this._maskService.isNumberValue =
            this._numberWritten || this._maskValue.startsWith(MaskExpression.SEPARATOR);
    }

    /** It writes the value in the input */
    public writeValue(controlValue: unknown): void {
        if (!this._configApplied && this.mask()) {
            // Called before the first ngOnChanges pass configured the mask service (happens with
            // Signal Forms' [formField], whose control-sync instruction runs before sibling
            // directives' ngOnChanges). Defer and replay once the configuration is applied.
            this._pendingInitialValue = controlValue;
            this._hasPendingInitialValue = true;
            return;
        }
        // Skip the model echo of a value we just propagated ourselves (see the
        // _lastPropagatedValue doc). Empty writes are never skipped: form reset('') must
        // always clear the display and the currentValue/previousValue service state below.
        const lastPropagated = this._lastPropagatedValue;
        this._lastPropagatedValue = null;
        if (
            lastPropagated !== null &&
            lastPropagated !== '' &&
            (typeof controlValue === 'string' || typeof controlValue === 'number') &&
            String(controlValue) === lastPropagated
        ) {
            return;
        }
        const writeSequence = ++this._writeSequence;
        let value = controlValue;
        const inputTransformFn = this._maskService.inputTransformFn;
        if (typeof value === 'object' && value !== null && 'value' in value) {
            if ('disable' in value) {
                this.setDisabledState(Boolean(value.disable));
            }

            value = value.value;
        }
        if (value !== null) {
            value = inputTransformFn ? inputTransformFn(value) : value;
        }
        // Empty writes (reset, null, '') carry no type information and keep the last one.
        if (typeof value === 'number') {
            this._numberWritten = true;
        } else if (typeof value === 'string' && value !== '') {
            this._numberWritten = false;
        }
        if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            value === null ||
            typeof value === 'undefined'
        ) {
            if ((value ?? '') === '') {
                this._maskService.currentValue = '';
                this._maskService.previousValue = '';
            }

            let inputValue: string | number | null | undefined = value;
            if (
                typeof inputValue === 'number' ||
                this._maskValue.startsWith(MaskExpression.SEPARATOR)
            ) {
                inputValue = displayToPlainDecimal(
                    String(inputValue),
                    this._maskService.decimalMarker,
                    this._maskService.thousandSeparator
                );
                const localeDecimalMarker = this._maskService.currentLocaleDecimalMarker();
                if (!Array.isArray(this._maskService.decimalMarker)) {
                    inputValue =
                        this._maskService.decimalMarker !== localeDecimalMarker
                            ? inputValue.replace(
                                  localeDecimalMarker,
                                  this._maskService.decimalMarker
                              )
                            : inputValue;
                }

                // Read before the precision pass rewrites the decimals with a dot.
                const commaDecimal = usesCommaDecimal(
                    inputValue,
                    this._maskService.decimalMarker,
                    this._maskService.thousandSeparator
                );
                if (
                    this._maskService.leadZero &&
                    inputValue &&
                    this.mask() &&
                    this._maskService.dropSpecialCharacters !== false
                ) {
                    inputValue = this._maskService._checkPrecision(
                        this._maskService.maskExpression,
                        inputValue as string
                    );
                }

                if (commaDecimal) {
                    inputValue = inputValue.toString().replace('.', ',');
                }
                if (
                    this._resolvedMaskInput().startsWith(MaskExpression.SEPARATOR) &&
                    this._maskService.leadZero
                ) {
                    const isFirstWrite = !this._maskService.isInitialized;
                    afterNextRender(
                        () => {
                            if (writeSequence !== this._writeSequence) {
                                // A later write or a user edit superseded this one: this stale
                                // value must not be re-applied over it (#1691).
                                return;
                            }
                            this._ngZone.run(() => {
                                // On initial load, temporarily set isInitialized to false
                                // so formControlResult returns early and doesn't mark form as dirty.
                                // On later writeValue-driven writes, leave isInitialized as-is: this pass
                                // may legitimately need to push a leadZero-normalized value (e.g.
                                // '10.2' -> '10.20') back to the FormControl, as a programmatic write that
                                // does not dirty it — see the `should change formValue` unit tests, which
                                // assert the normalized value lands in `form.value` after a programmatic
                                // setValue.
                                if (isFirstWrite) {
                                    this._maskService.isInitialized = false;
                                }
                                this._writeProgrammatically(() =>
                                    this._maskService.applyMask(
                                        inputValue?.toString() ?? '',
                                        this._maskService.maskExpression
                                    )
                                );
                                if (isFirstWrite) {
                                    this._maskService.isInitialized = true;
                                }
                                // Zoneless CD does not auto-flush after a deferred callback; request
                                // a check so form.pristine/form.value bindings reflect the new state.
                                this._changeDetectorRef.markForCheck();
                            });
                        },
                        { injector: this._injector }
                    );
                }
            }
            this._syncNumberValue();

            if (typeof inputValue !== 'string' || (value ?? null) === null) {
                inputValue = '';
            }

            this._inputValue = inputValue;
            this._setMask();

            if (
                (inputValue && this._maskService.maskExpression) ||
                (this._maskService.maskExpression &&
                    (this._maskService.prefix || this._maskService.showMaskTyped))
            ) {
                // Let the service we know we are writing value so that triggering onChange function won't happen during applyMask
                this._maskService.writingValue = true;

                // The raw control value: a boxed `{value, disable}` write never equals the plain value
                // the mask emits, so its echo still replaces the box in the control.
                this._maskService.writtenValue = { value: controlValue };
                let displayValue: string;
                try {
                    displayValue = this._writeProgrammatically(() =>
                        this._maskedOrVerbatim(inputValue)
                    );
                } finally {
                    this._maskService.writtenValue = null;
                }
                // A nested write (setValue inside a valueChanges subscriber) already rendered its own,
                // newer value: do not overwrite it with this stale one.
                if (writeSequence === this._writeSequence) {
                    this._maskService.formElementProperty = ['value', displayValue];
                    this._writeElementValueSync(displayValue);
                }
                // Let the service know we've finished writing value
                this._maskService.writingValue = false;
                this._maskService.isInitialized = true;
            } else {
                this._maskService.formElementProperty = ['value', inputValue];
                this._writeElementValueSync(inputValue);
                this._maskService.isInitialized = true;
            }
            // Programmatic writes (setValue/patchValue called outside a signal/effect context)
            // don't schedule CD under zoneless change detection. Request a check so bindings
            // reading form.pristine/form.dirty/form.value on the host template stay in sync.
            this._changeDetectorRef.markForCheck();
        } else {
            // eslint-disable-next-line no-console
            console.warn(
                'Ngx-mask writeValue work with string | number, your current value:',
                typeof value
            );
        }
    }

    /**
     * Mirrors a writeValue-driven render into the DOM synchronously, in the same
     * change-detection pass (#1305). The service's `formElementProperty` setter defers all
     * writes via queueMicrotask (to keep FIFO ordering with config-driven re-renders and
     * dodge ExpressionChanged issues), but consumers that read `nativeElement.value` DURING
     * the CD pass — Angular Material's floating label (`MatInput.empty`), CDK autofill —
     * never see a value that only lands in a later microtask. The deferred write still runs
     * afterwards and re-applies the same final value, so ordering guarantees are preserved.
     *
     * Skipped while a mask reconfiguration is pending (`mask()` input changed but
     * `ngOnChanges` has not applied it yet — e.g. `mask.set(...)` + `setValue(...)` before
     * the next CD pass): the value just computed used the STALE mask config, and rendering
     * it synchronously would expose an intermediate state that the deferred pipeline is
     * about to supersede. Multi-masks (`||`) resolve `_maskValue` to one alternative and
     * therefore also fall back to the deferred-only path.
     */
    private _writeElementValueSync(value: string): void {
        if (this._resolvedMaskInput() !== this._maskValue) {
            return;
        }
        this._renderer.setProperty(this._elementRef.nativeElement, 'value', value);
    }

    /** The `mask` input with a user-defined alias (config maskAliases) expanded, if any. */
    private _resolvedMaskInput(): string {
        return resolveMaskAlias(this.mask(), this._config.maskAliases);
    }

    public registerOnChange(fn: typeof this.onChange): void {
        // Angular only calls this in classic ControlValueAccessor mode (reactive/template forms).
        // Its invocation is therefore our reliable signal that we are NOT in Signal Forms mode.
        this._isCvaMode = true;
        const originalFn = fn;
        this._maskService.onChange = this.onChange = (value: unknown) => {
            if (!this._maskService.isWrittenEcho(value)) {
                if (this._programmaticWrite) {
                    this._emitProgrammaticValue(originalFn, value);
                } else {
                    // Angular's callback marks the control dirty: it receives the user edits.
                    originalFn(value);
                }
            }
            this._propagateToValueModel(value);
        };
    }

    public registerOnValidatorChange(fn: () => void): void {
        this._onValidatorChange = fn;
    }

    public registerOnTouched(fn: typeof this.onTouch): void {
        this.onTouch = () => {
            fn();
            if (!this.touched()) {
                this.touched.set(true);
            }
        };
    }

    /**
     * Pushes the current unmasked value into the `value` model input. In Signal Forms mode this
     * fires the `valueChange` output that Angular listens to; in CVA mode it is a harmless write
     * to a model nobody reads. We flag `_skipNextValueEffect` so the resulting model change does
     * not bounce back through the value effect and overwrite the raw `_inputValue`.
     */
    private _propagateToValueModel(value: unknown): void {
        const stringValue = String(value ?? '');
        this._lastPropagatedValue = stringValue;
        this._valuePropagatedByEdit = stringValue;
        untracked(() => {
            if (String(this.value()) !== stringValue) {
                this._skipNextValueEffect = true;
                this.value.set(stringValue);
            }
        });
    }

    /**
     * Whether the `value`-model effect will render `value` itself via writeValue(): only in
     * standalone `[(value)]` / Signal Forms mode (Angular's writeValue owns rendering in CVA mode), not for
     * the model echo of our own onChange propagation (`_skipNextValueEffect`), and only when it
     * differs from what is already rendered. Shared with ngOnChanges (#1671), which must leave
     * exactly that render to the effect.
     */
    private _valueEffectWillWrite(value: unknown): boolean {
        return (
            !this._isCvaMode &&
            !this._skipNextValueEffect &&
            String(value) !== String(this._inputValue)
        );
    }

    /**
     * Focus the input element.
     * Required by FormValueControl interface for Signal Forms.
     */
    public focus(): void {
        this._maskService._elementRef?.nativeElement?.focus();
    }

    public checkSelectionOnDeletion(el: HTMLInputElement): void {
        const prefixLength = this._maskService.prefix.length;
        const suffixLength = this._maskService.suffix.length;
        const inputValueLength = this._inputValue.length;

        el.selectionStart = Math.min(
            Math.max(prefixLength, el.selectionStart as number),
            inputValueLength - suffixLength
        );
        el.selectionEnd = Math.min(
            Math.max(prefixLength, el.selectionEnd as number),
            inputValueLength - suffixLength
        );
    }

    /**
     * It disables the input element.
     *
     * Mirrors `_writeElementValueSync` (#1305): the service's `formElementProperty` setter
     * defers ALL DOM writes via `queueMicrotask` to dodge ExpressionChangedAfterItHasBeenChecked
     * and keep FIFO ordering with config-driven re-renders. For `disabled` specifically, that
     * deferral leaves `nativeElement.disabled` stale for at least one microtask after Angular
     * Forms' `setUpControl` calls this method synchronously during init — long enough for a
     * consumer reading the DOM property in the same synchronous phase (or another deferred write
     * racing in FIFO order) to observe the wrong value, e.g. an initially-disabled FormControl
     * whose native input briefly (or, depending on interleaving, persistently) reports
     * `disabled === false` (#1633). Writing synchronously here closes that gap; the deferred
     * write below still runs afterwards and re-applies the same final value, preserving the
     * existing ordering guarantees other call sites rely on.
     */
    public setDisabledState(isDisabled: boolean): void {
        this._renderer.setProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
        this._maskService.formElementProperty = ['disabled', isDisabled];
    }

    private _mirrorInput<K extends MirroredInput>(key: K, value: NgxMaskService[K]): void {
        this._maskService[key] = value;
    }

    private _applyMask(renderInputValue: boolean): void {
        this._maskService.maskExpression = this._maskService._repeatPatternSymbols(
            this._maskValue || ''
        );
        if (!renderInputValue) {
            // Consume the one-shot flags ngOnChanges set for THIS render, as applyMask would:
            // writingValue (thousandSeparator change) and maskChanged (mask change). Nothing
            // else clears them when the following writeValue() takes its no-applyMask branch.
            this._maskService.writingValue = false;
            this._maskService._clearMaskChangedUnlessTriggered();
            return;
        }
        this._maskService.formElementProperty = ['value', this._maskedOrVerbatim(this._inputValue)];
        // The skeleton render of an empty value returns before the service consumes them, and a
        // one-shot flag left set swallows the first edit that follows.
        this._maskService.writingValue = false;
        this._maskService._clearMaskChangedUnlessTriggered();
    }

    /**
     * Renders `inputValue` through the mask, falling back to the raw value verbatim when the
     * mask cannot process ANY of it (#1615, e.g. a sentinel like 'ONGOING' written into a
     * digits-only control). Values that PARTIALLY match keep regular masking.
     *
     * Shared by writeValue() and _applyMask() (called from every ngOnChanges pass, including
     * ones triggered by an UNRELATED input like `disabled`) so the verbatim verdict for a
     * value written once via writeValue() is not lost on a later re-render that replays the
     * same raw `inputValue` outside of writeValue — which would otherwise re-run regular
     * masking, produce an empty result, and emit it through onChange, clobbering the model.
     *
     * Excludes an actual mask RECONFIGURATION (`maskChanged`): when the mask itself just
     * changed, a value that no longer matches must clear through the regular path (see
     * trigger-on-mask-change.spec.ts) — verbatim passthrough only covers re-renders of the
     * SAME mask.
     */
    private _maskedOrVerbatim(inputValue: string): string {
        // Snapshot before applyMask(): it resets maskChanged internally as part of emitting
        // (or skipping) the change, so it must be read before the call, not after.
        const wasMaskChanged = this._maskService.maskChanged;
        const maskedResult = this._maskService.applyMask(
            inputValue,
            this._maskService.maskExpression
        );
        return !maskedResult &&
            inputValue &&
            !wasMaskChanged &&
            this._maskService.removeMask(inputValue)
            ? inputValue
            : maskedResult;
    }

    private _validateTime(value: string): ValidationErrors | null {
        const rowMaskLen: number = this._maskValue
            .split('')
            .filter((s: string) => s !== ':').length;
        if (!value) {
            return null; // Don't validate empty values to allow for optional form control
        }

        if (
            (+(value[value.length - 1] ?? -1) === 0 && value.length < rowMaskLen) ||
            value.length <= rowMaskLen - 2
        ) {
            return this._createValidationError(value);
        }

        return null;
    }

    private _getActualInputLength() {
        return (
            this._maskService.actualValue.length ||
            this._maskService.actualValue.length + this._maskService.prefix.length
        );
    }

    /**
     * For `||` multi-masks only (#1583): a value shorter than the currently selected
     * alternative is still valid when it is a pattern-valid prefix of that alternative
     * ending exactly at a special-character boundary (e.g. `0` for `0,N`) and it meets
     * the length requirement of at least one alternative (e.g. `1`). Values stopping
     * mid-pattern-block (e.g. `112A` for `000SS`) remain invalid.
     */
    private _isCompleteAlternativeBoundary(processedValue: string): boolean {
        const alternatives = this._maskExpressionArray;
        if (!alternatives.length) {
            return false;
        }
        const maskValue = this._maskValue;
        const cleanValue = this._maskService.removeMask(processedValue);
        const cleanMask = this._maskService.removeMask(maskValue);
        const isPatternPrefix = cleanValue
            .split('')
            .every((character, index) =>
                this._maskService._checkSymbolMask(character, cleanMask.charAt(index))
            );
        if (!isPatternPrefix) {
            return false;
        }
        let patternCount = 0;
        let boundaryCharacter = '';
        for (const maskCharacter of maskValue) {
            if (patternCount === cleanValue.length) {
                boundaryCharacter = maskCharacter;
                break;
            }
            if (!this._maskService.specialCharacters.includes(maskCharacter)) {
                patternCount++;
            }
        }
        if (
            !boundaryCharacter ||
            !this._maskService.specialCharacters.includes(boundaryCharacter)
        ) {
            return false;
        }
        return alternatives.some((alternative) => {
            const requiredLength = this._maskService.dropSpecialCharacters
                ? alternative.length - this._maskService.checkDropSpecialCharAmount(alternative)
                : this._maskService.prefix
                  ? alternative.length + this._maskService.prefix.length
                  : alternative.length;
            // Exact match, not `>=`: a longer value must not pass on the strength of a
            // shorter alternative it has already outgrown (#1645, 7 digits vs `00000 9`).
            return processedValue.length === requiredLength;
        });
    }

    /**
     * True when every character of the mask expression is either a pattern token or a
     * special character — i.e. the mask has no quantifiers (`*`, `?`), curly-bracket
     * repetitions or other constructs the position-aware matcher does not model.
     */
    private _isPlainTokenMask(mask: string): boolean {
        return mask
            .split('')
            .every(
                (symbol: string) =>
                    !!this._maskService.patterns[symbol] ||
                    this._maskService.specialCharacters.includes(symbol)
            );
    }

    /**
     * Backtracking match of a value against a mask mixing optional and mandatory pattern
     * tokens (#1515, e.g. `999SSS`). Optional tokens may be left unfilled; special
     * characters may be absent from the value (dropSpecialCharacters). The value is valid
     * when it is fully consumed and every remaining mask token is optional or special.
     */
    private _matchesMaskWithOptionalSkip(value: string, mask: string): boolean {
        const patterns = this._maskService.patterns;
        // Optional tokens branch twice (consume or skip), so the same (maskIndex, valueIndex)
        // state is reached through many paths: remember the ones that already failed.
        const failed = new Set<number>();
        const match = (maskIndex: number, valueIndex: number): boolean => {
            const state = maskIndex * (value.length + 1) + valueIndex;
            if (failed.has(state)) {
                return false;
            }
            const matched = matchFrom(maskIndex, valueIndex);
            if (!matched) {
                failed.add(state);
            }
            return matched;
        };
        const matchFrom = (maskIndex: number, valueIndex: number): boolean => {
            if (valueIndex === value.length) {
                return mask
                    .slice(maskIndex)
                    .split('')
                    .every((symbol: string) => !patterns[symbol] || !!patterns[symbol]?.optional);
            }
            if (maskIndex === mask.length) {
                return false;
            }
            const maskSymbol = mask[maskIndex] as string;
            const valueSymbol = value[valueIndex] as string;
            const pattern = patterns[maskSymbol];
            if (pattern) {
                if (
                    this._maskService._checkSymbolMask(valueSymbol, maskSymbol) &&
                    match(maskIndex + 1, valueIndex + 1)
                ) {
                    return true;
                }
                return !!pattern.optional && match(maskIndex + 1, valueIndex);
            }
            // Special character: consume it when present in the value, otherwise treat it
            // as dropped (dropSpecialCharacters).
            if (valueSymbol === maskSymbol && match(maskIndex + 1, valueIndex + 1)) {
                return true;
            }
            return match(maskIndex + 1, valueIndex);
        };
        return match(0, 0);
    }

    private _createValidationError(actualValue: string): ValidationErrors {
        return {
            mask: {
                requiredMask: this._maskValue,
                actualValue,
            },
        };
    }

    private _setMask() {
        this._maskExpressionArray.some((mask): boolean | void => {
            const specialChart: boolean = mask
                .split('')
                .some((char) => this._maskService.specialCharacters.includes(char));
            if (
                (specialChart &&
                    this._inputValue &&
                    this._areAllCharactersInEachStringSame(this._maskExpressionArray)) ||
                mask.includes(MaskExpression.CURLY_BRACKETS_LEFT)
            ) {
                const test =
                    this._maskService.removeMask(this._inputValue)?.length <=
                    this._maskService.removeMask(mask)?.length;
                if (test) {
                    const maskValue = mask.includes(MaskExpression.CURLY_BRACKETS_LEFT)
                        ? this._maskService._repeatPatternSymbols(mask)
                        : mask;
                    this._maskValue = maskValue;
                    this._maskService.maskExpression = maskValue;
                    return test;
                } else {
                    const expression =
                        this._maskExpressionArray[this._maskExpressionArray.length - 1] ?? '';

                    const maskValue = expression.includes(MaskExpression.CURLY_BRACKETS_LEFT)
                        ? this._maskService._repeatPatternSymbols(expression)
                        : expression;
                    this._maskValue = maskValue;
                    this._maskService.maskExpression = maskValue;
                }
            } else {
                const cleanMask = this._maskService.removeMask(mask);
                const check: boolean = this._maskService
                    .removeMask(this._inputValue)
                    ?.split('')
                    .every((character, index) => {
                        const indexMask = cleanMask.charAt(index);
                        return this._maskService._checkSymbolMask(character, indexMask);
                    });

                if (check || this._justPasted) {
                    this._maskValue = mask;
                    this._maskService.maskExpression = mask;
                    return check;
                }
            }
        });
    }

    private _areAllCharactersInEachStringSame(array: string[]): boolean {
        const specialCharacters = this._maskService.specialCharacters;

        function removeSpecialCharacters(str: string): string {
            const regex = new RegExp(
                `[${specialCharacters.map((ch) => escapeRegExp(ch)).join('')}]`,
                'g'
            );
            return str.replace(regex, '');
        }

        const processedArr = array.map(removeSpecialCharacters);

        return processedArr.every((str) => {
            const uniqueCharacters = new Set(str);
            return uniqueCharacters.size === 1;
        });
    }
}
