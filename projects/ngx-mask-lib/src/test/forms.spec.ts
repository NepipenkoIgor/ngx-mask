import {
    Component,
    Injector,
    inject,
    runInInjectionContext,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import type { Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { form, FormField, schema, disabled, required, pattern } from '@angular/forms/signals';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { expect, expectTypeOf } from 'vitest';
import { typeTest } from './utils/test-functions.component';

@Component({
    selector: 'ngxd-open-source-test',
    imports: [ReactiveFormsModule, NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="separator.2" thousandSeparator="," [formControl]="control" />`,
})
class InitialSeparatorValueComponent {
    public control = new FormControl(1500);
}

@Component({
    selector: 'ngxd-open-source-digit-test',
    imports: [ReactiveFormsModule, NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [formControl]="control" />`,
})
class InitialDigitValueComponent {
    public control = new FormControl('3333');
}

@Component({
    selector: 'ngxd-issue-1640-number-field',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input type="number" mask="0*" [formField]="signalForm.amount" />`,
})
class NumberFieldComponent {
    private injector = inject(Injector);
    public model = signal({ amount: 42 });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-issue-1640-nullable-number-field',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input type="number" mask="0*" [formField]="signalForm.amount" />`,
})
class NullableNumberFieldComponent {
    private injector = inject(Injector);
    public model = signal<{ amount: number | null }>({ amount: null });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-issue-1640-nullable-string-field',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [formField]="signalForm.value" />`,
})
class NullableStringFieldComponent {
    private injector = inject(Injector);
    public model = signal<{ value: string | null }>({ value: null });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-issue-1640-string-consumer',
    imports: [NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [(value)]="text" />`,
})
class StringConsumerComponent {
    public text = signal<string>('');
}

@Component({
    selector: 'ngxd-open-source-test',
    imports: [ReactiveFormsModule, NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [formControl]="form" />`,
})
class TestMaskComponent {
    public form: FormControl = new FormControl('');
}

@Component({
    selector: 'ngxd-phone-test',
    imports: [FormsModule, NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <form #phoneForm="ngForm">
            <input
                name="phoneNumber"
                [(ngModel)]="phoneNumber"
                [pattern]="phoneValidationPattern"
                [dropSpecialCharacters]="false"
                [mask]="phoneMask" />
        </form>
    `,
})
class TestPhoneMaskComponent {
    public phoneValidationPattern =
        /^\(?([2-9][0-8][0-9])\)?[-. ]*([2-9][0-9]{2})[-. ]*([0-9]{4})$/;
    public phoneMask = '(000) 000-0000';
    public phoneNumber = '3333333333';
}

@Component({
    selector: 'ngxd-signal-mask-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [formField]="signalForm.value" />`,
})
class TestSignalMaskComponent {
    private injector = inject(Injector);
    public model = signal({ value: '3333' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-initially-disabled-test',
    imports: [ReactiveFormsModule, NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [formControl]="form" />`,
})
class TestInitiallyDisabledMaskComponent {
    public form: FormControl = new FormControl({ value: '123', disabled: true });
}

// External signal read inside the schema logic function so tests can flip it per-case.
const disabledFieldSignal = signal(false);

const disabledSchema = schema<{ value: string }>((path) => {
    disabled(path.value, () => disabledFieldSignal());
});

@Component({
    selector: 'ngxd-signal-mask-disabled-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [formField]="signalForm.value" />`,
})
class TestSignalMaskDisabledComponent {
    private injector = inject(Injector);
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () =>
        form(this.model, disabledSchema)
    );
}

@Component({
    selector: 'ngxd-signal-mask-dynamic-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input [mask]="mask()" [formField]="signalForm.value" />`,
})
class TestSignalMaskDynamicComponent {
    private injector = inject(Injector);
    public mask = signal('000000');
    public model = signal({ value: '123456' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-signal-mask-drop-special-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input
        mask="000-000"
        [dropSpecialCharacters]="false"
        [formField]="signalForm.value" />`,
})
class TestSignalMaskDropSpecialComponent {
    private injector = inject(Injector);
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-signal-mask-separator-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input
        mask="separator.2"
        [leadZero]="true"
        [thousandSeparator]="thousandSeparator()"
        [formField]="signalForm.value" />`,
})
class TestSignalMaskSeparatorComponent {
    private injector = inject(Injector);
    public thousandSeparator = signal(' ');
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

const requiredPatternSchema = schema<{ value: string }>((path) => {
    required(path.value);
    pattern(path.value, /^\d{4}$/);
});

@Component({
    selector: 'ngxd-signal-mask-validation-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [validation]="true" [formField]="signalForm.value" />`,
})
class TestSignalMaskValidationComponent {
    private injector = inject(Injector);
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () =>
        form(this.model, requiredPatternSchema)
    );
}

@Component({
    selector: 'ngxd-signal-mask-or-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="(00) 00000000||+00 (00) 00000000" [formField]="signalForm.value" />`,
})
class TestSignalMaskOrComponent {
    private injector = inject(Injector);
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-signal-mask-date-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="d0/M0/0000" [formField]="signalForm.value" />`,
})
class TestSignalMaskDateComponent {
    private injector = inject(Injector);
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-signal-mask-time-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="Hh:m0:s0" [formField]="signalForm.value" />`,
})
class TestSignalMaskTimeComponent {
    private injector = inject(Injector);
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-signal-mask-percent-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="percent" [formField]="signalForm.value" />`,
})
class TestSignalMaskPercentComponent {
    private injector = inject(Injector);
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

@Component({
    selector: 'ngxd-signal-mask-prefix-suffix-test',
    imports: [NgxMaskDirective, FormField],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" prefix="$ " suffix=" USD" [formField]="signalForm.value" />`,
})
class TestSignalMaskPrefixSuffixComponent {
    private injector = inject(Injector);
    public model = signal({ value: '' });
    public signalForm = runInInjectionContext(this.injector, () => form(this.model));
}

describe('Directive: Forms', () => {
    let fixture: ComponentFixture<TestMaskComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        fixture.detectChanges();
    });

    it('should not mark form as dirty on initial load with initial value', () => {
        const testBed = TestBed.createComponent(TestPhoneMaskComponent);
        const phoneComponent = testBed.componentInstance;
        phoneComponent.phoneNumber = '3333333333';
        testBed.detectChanges();

        // Get the form element and check if it's not dirty
        const formElement = testBed.nativeElement.querySelector('form');
        const inputElement = testBed.nativeElement.querySelector('input');

        // Check that the form is not dirty on initial load
        expect(formElement.classList.contains('ng-dirty')).equal(false);
        expect(inputElement.classList.contains('ng-dirty')).equal(false);
    });

    // The disabled DOM write is deferred via queueMicrotask (formElementProperty setter),
    // so every assertion needs a microtask flush + change detection round.
    const flushDisabledWrites = async (testBed: ComponentFixture<unknown>): Promise<void> => {
        testBed.detectChanges();
        await testBed.whenStable();
        testBed.detectChanges();
        await Promise.resolve();
        testBed.detectChanges();
    };

    it('should keep an initially-disabled FormControl disabled after init (#1614)', async () => {
        const testBed = TestBed.createComponent(TestInitiallyDisabledMaskComponent);
        await flushDisabledWrites(testBed);

        const inputElement: HTMLInputElement = testBed.nativeElement.querySelector('input');

        expect(inputElement.disabled).equal(true);
        expect(inputElement.value).equal('123');
    });

    it('should respect FormControl.disable() and enable() after init (#1607)', async () => {
        const testBed = TestBed.createComponent(TestMaskComponent);
        const component = testBed.componentInstance;
        await flushDisabledWrites(testBed);

        const inputElement: HTMLInputElement = testBed.nativeElement.querySelector('input');
        expect(inputElement.disabled).equal(false);

        component.form.disable();
        await flushDisabledWrites(testBed);
        expect(inputElement.disabled).equal(true);

        component.form.enable();
        await flushDisabledWrites(testBed);
        expect(inputElement.disabled).equal(false);
    });

    it('should keep a FormControl disabled when disable() is called right after creation (#1607)', async () => {
        const testBed = TestBed.createComponent(TestMaskComponent);
        const component = testBed.componentInstance;
        component.form.disable();
        await flushDisabledWrites(testBed);

        const inputElement: HTMLInputElement = testBed.nativeElement.querySelector('input');
        expect(inputElement.disabled).equal(true);
    });

    // #1633: setDisabledState's own DOM write used to go only through the deferred
    // (queueMicrotask) formElementProperty setter, so nativeElement.disabled stayed stale for at
    // least one microtask after Angular Forms called setDisabledState(true) synchronously during
    // init — long enough for the deferred write to lose a FIFO race against another queued write
    // and leave the native input's disabled property out of sync with FormControl.disabled even
    // after the app settles. Assert the SYNCHRONOUS state right after detectChanges(), with no
    // microtask flush at all.
    it('should synchronously reflect an initially-disabled FormControl on the native input, with no microtask flush (#1633)', () => {
        const testBed = TestBed.createComponent(TestInitiallyDisabledMaskComponent);
        testBed.detectChanges();

        const inputElement: HTMLInputElement = testBed.nativeElement.querySelector('input');
        expect(inputElement.disabled).equal(true);
        expect(testBed.componentInstance.form.disabled).equal(true);
    });

    it('should not disable the native input synchronously when the FormControl is not disabled (#1633)', () => {
        const testBed = TestBed.createComponent(TestMaskComponent);
        testBed.detectChanges();

        const inputElement: HTMLInputElement = testBed.nativeElement.querySelector('input');
        expect(inputElement.disabled).equal(false);
        expect(testBed.componentInstance.form.disabled).equal(false);
    });
});

// Issue #1305 (dup #1264): Material's floating label does not float for initial values.
// Root cause: the directive rendered writeValue() through the service's
// `formElementProperty` setter, which defers the DOM write via queueMicrotask. MatInput
// decides emptiness (`shouldLabelFloat`) by reading `nativeElement.value` DURING the
// change-detection pass — a value that only lands in a later microtask is invisible to
// it, so the label stays down until something else (focus/CD) re-checks.
// The contract asserted here: after a writeValue-driven render, the native input value
// must be populated SYNCHRONOUSLY — before any microtask flush — so that consumers
// reading the native value inside the same CD pass (Angular Material, CDK autofill,
// autosize) observe it.
describe('Directive: Forms: initial value renders synchronously (#1305)', () => {
    it('should render the initial separator value in the same CD pass (no microtask)', () => {
        TestBed.configureTestingModule({
            imports: [InitialSeparatorValueComponent],
            providers: [provideNgxMask()],
        });
        const fixture: ComponentFixture<InitialSeparatorValueComponent> = TestBed.createComponent(
            InitialSeparatorValueComponent
        );
        fixture.detectChanges();

        // Deliberately NO await / whenStable here: Material reads the native value
        // synchronously during this very CD pass.
        const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(el.value).toBe('1,500');
    });

    it('should render the initial digit value in the same CD pass (no microtask)', () => {
        TestBed.configureTestingModule({
            imports: [InitialDigitValueComponent],
            providers: [provideNgxMask()],
        });
        const fixture: ComponentFixture<InitialDigitValueComponent> = TestBed.createComponent(
            InitialDigitValueComponent
        );
        fixture.detectChanges();

        const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(el.value).toBe('3333');
    });

    it('should render a later programmatic setValue synchronously as well', async () => {
        TestBed.configureTestingModule({
            imports: [InitialSeparatorValueComponent],
            providers: [provideNgxMask()],
        });
        const fixture: ComponentFixture<InitialSeparatorValueComponent> = TestBed.createComponent(
            InitialSeparatorValueComponent
        );
        const component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();

        component.control.setValue(2500);
        const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
        expect(el.value).toBe('2,500');

        // And the deferred write must not clobber it afterwards.
        await fixture.whenStable();
        fixture.detectChanges();
        expect(el.value).toBe('2,500');
    });
});

describe('Directive: Signal Forms', () => {
    it('should format the initial signal value with the mask on render', async () => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
        const testFixture = TestBed.createComponent(TestSignalMaskComponent);
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        expect(inputElement.value).equal('3333');
    });

    it('should update the underlying signal with the raw unmasked value on input', () => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
        const testFixture = TestBed.createComponent(TestSignalMaskComponent);
        const component = testFixture.componentInstance;
        component.model.set({ value: '' });
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '1234';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();

        expect(inputElement.value).equal('1234');
        expect(component.signalForm.value().value()).equal('1234');
    });

    it('should mark touched to true on blur, matching reactive/template-driven behavior', () => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
        const testFixture = TestBed.createComponent(TestSignalMaskComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();

        expect(component.signalForm.value().touched()).equal(false);

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');
        inputElement.dispatchEvent(new Event('blur'));
        testFixture.detectChanges();

        expect(component.signalForm.value().touched()).equal(true);
    });

    it('should disable the native input when the signal form field is disabled via schema', async () => {
        disabledFieldSignal.set(false);
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
        const testFixture = TestBed.createComponent(TestSignalMaskDisabledComponent);
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        expect(inputElement.disabled).equal(false);

        disabledFieldSignal.set(true);
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        expect(inputElement.disabled).equal(true);

        // reset shared signal so other tests are not affected
        disabledFieldSignal.set(false);
    });

    it('should re-apply formatting to the current signal value when the mask changes at runtime', async () => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
        const testFixture = TestBed.createComponent(TestSignalMaskDynamicComponent);
        const component = testFixture.componentInstance;
        component.model.set({ value: '' });
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '123456';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        expect(inputElement.value).equal('123456');

        component.mask.set('00-00-00');
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        expect(inputElement.value).equal('12-34-56');
    });

    it('should keep special characters in the displayed value while unmasking the signal value when dropSpecialCharacters is false', () => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
        const testFixture = TestBed.createComponent(TestSignalMaskDropSpecialComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '123456';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();

        expect(inputElement.value).equal('123-456');
        expect(component.signalForm.value().value()).equal('123-456');
    });

    // Issue #1640: binding `[formField]` to a NUMERIC signal-form field (`<input type="number">`,
    // `signal({ amount: 0 })`) failed at compile time with
    // `TS2322: Type 'number' is not assignable to type 'string'`, while the same setup works with
    // Reactive Forms. Angular's template type-checker treats any co-located directive that owns a
    // `value` model as the field's custom `FormValueControl` and checks the field's value type
    // against that model's type — and the directive's model was pinned to `string`. Nullable
    // fields (`number | null`, `string | null`) hit the same wall. At runtime nothing was wrong:
    // `FormField` prefers the directive's `NG_VALUE_ACCESSOR`, so values flow through
    // `writeValue()`, which has always accepted `string | number | null | undefined`.
    //
    // The model now accepts that same union. These hosts are the regression: on the old typing this
    // file does not compile. The last host pins the other direction — the standalone `[(value)]`
    // two-way binding on a `string` signal must keep compiling and working.
    describe('non-string field types via [formField] (#1640)', () => {
        async function createFixture<T>(component: Type<T>): Promise<ComponentFixture<T>> {
            TestBed.configureTestingModule({
                imports: [component],
                providers: [provideNgxMask()],
            });
            const fixture = TestBed.createComponent(component);
            fixture.detectChanges();
            await Promise.resolve();
            fixture.detectChanges();
            return fixture;
        }

        function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
            return fixture.nativeElement.querySelector('input') as HTMLInputElement;
        }

        function typeInto(fixture: ComponentFixture<unknown>, value: string): string {
            const input = getInput(fixture);
            input.value = value;
            input.dispatchEvent(new Event('input'));
            fixture.detectChanges();
            return input.value;
        }

        it('should accept the same value types as writeValue()', () => {
            expectTypeOf<Parameters<NgxMaskDirective['value']['set']>[0]>().toEqualTypeOf<
                string | number | null | undefined
            >();
        });

        it('should render a numeric initial value on a type="number" input', async () => {
            const fixture = await createFixture(NumberFieldComponent);

            expect(getInput(fixture).value).toBe('42');
        });

        it('should push typed digits into a numeric field', async () => {
            const fixture = await createFixture(NumberFieldComponent);

            expect(typeInto(fixture, '123')).toBe('123');
            expect(fixture.componentInstance.signalForm.amount().value()).toBe(123);
        });

        it('should render an empty input for a null numeric field', async () => {
            const fixture = await createFixture(NullableNumberFieldComponent);

            expect(getInput(fixture).value).toBe('');
        });

        it('should push typed digits into a nullable numeric field', async () => {
            const fixture = await createFixture(NullableNumberFieldComponent);

            expect(typeInto(fixture, '7')).toBe('7');
            // Emitted as the unmasked string: the directive only switches to numeric emission
            // after a numeric writeValue() (`isNumberValue`), and the initial write here was
            // `null`. Same as a Reactive Forms `FormControl<number | null>`; `outputTransformFn`
            // is the documented way to coerce.
            expect(fixture.componentInstance.signalForm.amount().value()).toBe('7');
        });

        it('should render an empty input for a null string field', async () => {
            const fixture = await createFixture(NullableStringFieldComponent);

            expect(getInput(fixture).value).toBe('');
        });

        it('should push the masked value into a nullable string field', async () => {
            const fixture = await createFixture(NullableStringFieldComponent);

            expect(typeInto(fixture, '12345')).toBe('1234');
            expect(fixture.componentInstance.signalForm.value().value()).toBe('1234');
        });

        it('should keep the standalone [(value)] two-way binding on a string signal working', async () => {
            const fixture = await createFixture(StringConsumerComponent);

            expect(typeInto(fixture, '12')).toBe('12');
            expect(fixture.componentInstance.text()).toBe('12');
        });
    });
});

describe('Directive: Signal Forms (separator.2 decimal reflow)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
    });

    it('should reflow a raw decimal into a leadZero-padded display on initial render, matching Reactive Forms output for the same input', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskSeparatorComponent);
        const component = testFixture.componentInstance;
        component.model.set({ value: '10.2' });
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();
        // separator + leadZero writes defer the leadZero-normalized applyMask() call to a
        // afterNextRender callback (see ngx-mask.directive.ts writeValue()), matching the
        // wait pattern used by separator-3.spec.ts's Reactive Forms equivalent tests.
        await testFixture.whenStable();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        // Cross-checked against separator-2.spec.ts: reactive form.setValue('10.2') with
        // leadZero => '10.20' for the same separator.2 mask. The initial write echoes the
        // normalised value back to the model, as ngModel does (#1754), without dirtying it.
        expect(inputElement.value).equal('10.20');
        expect(component.signalForm.value().value()).equal('10.20');
    });

    it('should insert the thousand separator while reformatting on signal value change, matching Reactive Forms output for the same input', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskSeparatorComponent);
        const component = testFixture.componentInstance;
        component.model.set({ value: '' });
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        component.model.set({ value: '1234.5' });
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();
        // separator + leadZero writes defer the leadZero-normalized applyMask() call to a
        // afterNextRender callback (see ngx-mask.directive.ts writeValue()).
        await testFixture.whenStable();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        // Cross-checked against separator.spec.ts: reactive '1234.50' with default space
        // thousandSeparator formats as '1 234.50'. The model holds the UNMASKED value
        // (dropSpecialCharacters defaults to true) — thousand separators are dropped, the
        // leadZero-normalized decimal part is kept — same as reactive form.value.
        expect(inputElement.value).equal('1 234.50');
        expect(component.signalForm.value().value()).equal('1234.50');
    });

    it('should not desync the echoed signal value while typing triggers active reformatting (_skipNextValueEffect guard)', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskSeparatorComponent);
        const component = testFixture.componentInstance;
        component.model.set({ value: '' });
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        // Simulate real per-character typing (with cursor tracking), the same way
        // Reactive Forms separator specs exercise the mid-typing reformatting path.
        typeTest('1234500', testFixture);
        await Promise.resolve();
        testFixture.detectChanges();

        // Parity with Reactive Forms: while typing, the DISPLAY keeps the typed reflow —
        // leadZero pads only the propagated MODEL value (formControlResult → _checkPrecision)
        // plus the display on blur. The FormField model echo of the just-propagated value is
        // skipped (see _lastPropagatedValue in ngx-mask.directive.ts), so the display is no
        // longer rewritten to '1 234 500.00' mid-typing — the exact same split Reactive Forms
        // shows (form.value '1234500.00', display '1 234 500').
        expect(inputElement.value).equal('1 234 500');
        expect(component.signalForm.value().value()).equal('1234500.00');
    });

    it('should apply a custom thousandSeparator while reflowing the signal value', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskSeparatorComponent);
        const component = testFixture.componentInstance;
        component.thousandSeparator.set('.');
        component.model.set({ value: '' });
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        component.model.set({ value: '1000000.00' });
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        // When thousandSeparator is '.', the service auto-switches the decimal marker to ','
        // to avoid ambiguity with the thousand separator (same behavior as Reactive Forms).
        expect(inputElement.value).equal('1.000.000,00');
    });
});

describe('Directive: Signal Forms (validation / schema)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask({ validation: true })],
        });
    });

    it('should report the field as invalid via the Signal Forms schema when the masked value does not satisfy the schema pattern, independent of NgxMaskDirective.validate()', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskValidationComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '12';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        expect(inputElement.value).equal('12');
        expect(component.signalForm.value().valid()).equal(false);
        expect(component.signalForm.value().errors().length).toBeGreaterThan(0);
    });

    it('should report the field as valid via the Signal Forms schema once the masked value satisfies the schema pattern', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskValidationComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '1234';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        expect(inputElement.value).equal('1234');
        expect(component.signalForm.value().valid()).equal(true);
        expect(component.signalForm.value().errors().length).equal(0);
    });

    it('should report the field as invalid via the Signal Forms `required` schema logic when the value is empty, even with [validation]=true on the directive', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskValidationComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        expect(component.signalForm.value().valid()).equal(false);

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');
        expect(inputElement.value).equal('');
    });
});

describe('Directive: Signal Forms (dynamic OR-masks)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
    });

    it('should match the first alternative of an OR-mask expression through the signal value effect', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskOrComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '5549362216';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        // Cross-checked against dynamic.spec.ts: reactive typing '5549362216' into
        // '(00) 00000000||+00 (00) 00000000' formats as '(55) 49362216'.
        expect(inputElement.value).equal('(55) 49362216');
        expect(component.signalForm.value().value()).equal('5549362216');
    });

    it('should switch to the second alternative of the OR-mask expression once the value grows beyond the first alternative capacity', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskOrComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '55493622168';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        // Cross-checked against dynamic.spec.ts: reactive typing an 11-digit value into the same
        // OR-mask expression formats as '+55 (49) 3622168'.
        expect(inputElement.value).equal('+55 (49) 3622168');
        expect(component.signalForm.value().value()).equal('55493622168');
    });
});

describe('Directive: Signal Forms (date / time masks)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
    });

    it('should auto-insert date separators while typing through the signal value effect without echo-guard interference', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskDateComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        // Type character-by-character (with cursor tracking), matching how
        // custom-date.spec.ts / time-mask.spec.ts exercise the same mid-typing
        // separator auto-insertion logic via typeTest().
        typeTest('25121999', testFixture);
        await Promise.resolve();
        testFixture.detectChanges();

        // Cross-checked against custom-date.spec.ts / time-mask.spec.ts: reactive typing
        // '25121999' into 'd0/M0/0000' formats as '25/12/1999'.
        expect(inputElement.value).equal('25/12/1999');
        // Model holds the unmasked digits (dropSpecialCharacters defaults to true),
        // same as reactive form.value for the same mask.
        expect(component.signalForm.value().value()).equal('25121999');
    });

    it('should auto-insert time separators while typing through the signal value effect without echo-guard interference', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskTimeComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        // Type character-by-character (with cursor tracking), matching how
        // time-mask.spec.ts exercises the same mid-typing separator auto-insertion
        // logic via typeTest().
        typeTest('235959', testFixture);
        await Promise.resolve();
        testFixture.detectChanges();

        // Cross-checked against time-mask.spec.ts: reactive typing '235959' into 'Hh:m0:s0'
        // formats as '23:59:59'.
        expect(inputElement.value).equal('23:59:59');
        // Model holds the unmasked digits (dropSpecialCharacters defaults to true),
        // same as reactive form.value for the same mask.
        expect(component.signalForm.value().value()).equal('235959');
    });
});

describe('Directive: Signal Forms (percent, prefix/suffix)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
    });

    it('should clamp typed input to a valid percent value through the signal value effect', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskPercentComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '150';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        // Cross-checked against percent.spec.ts: reactive typing '150' into 'percent' clamps to '15'.
        expect(inputElement.value).equal('15');
        expect(component.signalForm.value().value()).equal('15');
    });

    it('should apply prefix and suffix around the masked value through the signal value effect', async () => {
        const testFixture = TestBed.createComponent(TestSignalMaskPrefixSuffixComponent);
        const component = testFixture.componentInstance;
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        const inputElement: HTMLInputElement = testFixture.nativeElement.querySelector('input');

        inputElement.value = '1234';
        inputElement.dispatchEvent(new Event('input'));
        testFixture.detectChanges();
        await Promise.resolve();
        testFixture.detectChanges();

        expect(inputElement.value).equal('$ 1234 USD');
        expect(component.signalForm.value().value()).equal('1234');
    });
});

@Component({
    selector: 'ngxd-open-source-emitted-type-test',
    imports: [ReactiveFormsModule, NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input mask="0000" [formControl]="control" />`,
})
class EmittedTypeComponent {
    public control = new FormControl<string | number | null>(null);
}

describe('Directive: Forms (emitted type follows the last concrete write)', () => {
    let fixture: ComponentFixture<EmittedTypeComponent>;
    let control: FormControl<string | number | null>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxMaskDirective],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(EmittedTypeComponent);
        control = fixture.componentInstance.control;
        fixture.detectChanges();
    });

    it('emits numbers after a numeric write', () => {
        control.setValue(5);
        fixture.detectChanges();

        typeTest('123', fixture);

        expect(control.value).toBe(123);
    });

    it('emits strings again once a string is written after a number', () => {
        control.setValue(5);
        control.setValue('007');
        fixture.detectChanges();

        typeTest('123', fixture);

        expect(control.value).toBe('123');
    });

    it('keeps emitting numbers after reset() to an empty value', () => {
        control.setValue(5);
        control.reset();
        fixture.detectChanges();

        typeTest('123', fixture);

        expect(control.value).toBe(123);
    });

    it('keeps emitting numbers after an empty string is written', () => {
        control.setValue(5);
        control.setValue('');
        fixture.detectChanges();

        typeTest('123', fixture);

        expect(control.value).toBe(123);
    });
});
