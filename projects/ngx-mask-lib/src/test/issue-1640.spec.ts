import {
    ChangeDetectionStrategy,
    Component,
    Injector,
    inject,
    runInInjectionContext,
    signal,
} from '@angular/core';
import type { Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { describe, expect, expectTypeOf, it } from 'vitest';

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

describe('Issue #1640: signal forms [formField] with non-string field types', () => {
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
