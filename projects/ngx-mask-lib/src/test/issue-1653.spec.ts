import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestMaskComponent } from './utils/test-component.component';
import { typeTest } from './utils/test-functions.component';

// Issue #1653: `percent.N` with `[decimalMarker]="['.', ',']"` only accepted '.', and once ','
// was accepted the model lost its decimal point ('12,5' -> '125'). Both the view and the model
// must follow the marker the user typed.
describe('Issue #1653: percent mask with an array decimalMarker', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;
    let input: HTMLInputElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        component.decimalMarker.set(['.', ',']);
        component.mask.set('percent.2');
        fixture.detectChanges();
        input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    });

    function type(value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }

    function blur(): void {
        input.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
    }

    it("keeps '.' working: view and model", () => {
        type('12.345');
        expect(input.value).toBe('12.34');
        expect(Number(component.form.value)).toBe(12.34);
    });

    it("accepts ',': view keeps the comma, model gets a dot", () => {
        type('12,345');
        expect(input.value).toBe('12,34');
        expect(String(component.form.value)).toBe('12.34');
    });

    it("accepts ',' with a suffix", () => {
        component.suffix.set('%');
        fixture.detectChanges();
        type('12,5');
        expect(input.value).toBe('12,5%');
        expect(String(component.form.value)).toBe('12.5');
    });

    it('rejects a value above 100 before the comma', () => {
        type('123,5');
        expect(input.value).toBe('12,5');
        expect(String(component.form.value)).toBe('12.5');
    });

    it("leadZero with an array marker leaves a ',' value as typed on blur (blur padding only runs for a string marker)", () => {
        component.leadZero.set(true);
        fixture.detectChanges();
        type('9,9');
        blur();
        expect(input.value).toBe('9,9');
        expect(String(component.form.value)).toBe('9.9');
    });

    it("string marker ',' is unchanged", () => {
        component.decimalMarker.set(',');
        fixture.detectChanges();
        type('12,5');
        expect(input.value).toBe('12,5');
        expect(String(component.form.value)).toBe('12.5');
    });

    // Per keystroke: one input event per character, cursor at the end.
    it.each([false, true])(
        "typing '12,345' key by key (allowNegativeNumbers=%s): view and model",
        (allowNegative) => {
            component.allowNegativeNumbers.set(allowNegative);
            fixture.detectChanges();
            expect(typeTest('12,345', fixture)).toBe('12,34');
            expect(String(component.form.value)).toBe('12.34');
        }
    );

    it.each([false, true])(
        "typing '12.345' key by key (allowNegativeNumbers=%s) is unchanged",
        (allowNegative) => {
            component.allowNegativeNumbers.set(allowNegative);
            fixture.detectChanges();
            expect(typeTest('12.345', fixture)).toBe('12.34');
            expect(String(component.form.value)).toBe('12.34');
        }
    );

    it.each([false, true])(
        "typing '12,345' key by key with a '%' suffix (allowNegativeNumbers=%s)",
        (allowNegative) => {
            component.allowNegativeNumbers.set(allowNegative);
            component.suffix.set('%');
            fixture.detectChanges();
            expect(typeTest('12,345', fixture)).toBe('12,34%');
            expect(String(component.form.value)).toBe('12.34');
        }
    );
});

describe('Issue #1653: separator with an array decimalMarker (shared marker resolution)', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        component.mask.set('separator.2');
        fixture.detectChanges();
    });

    it("thousandSeparator ',' resolves the marker to '.'", () => {
        component.decimalMarker.set(['.', ',']);
        component.thousandSeparator.set(',');
        fixture.detectChanges();
        expect(typeTest('1234.567', fixture)).toBe('1,234.56');
        expect(String(component.form.value)).toBe('1234.56');
    });

    it("thousandSeparator '.' resolves the marker to ','", () => {
        component.decimalMarker.set(['.', ',']);
        component.thousandSeparator.set('.');
        fixture.detectChanges();
        expect(typeTest('1234,567', fixture)).toBe('1.234,56');
        expect(String(component.form.value)).toBe('1234.56');
    });

    it("default config (array marker, ' ' thousand separator) trims '1234,567' to two decimals", () => {
        expect(typeTest('1234,567', fixture)).toBe('1 234,56');
        expect(String(component.form.value)).toBe('1234.56');
    });
});
