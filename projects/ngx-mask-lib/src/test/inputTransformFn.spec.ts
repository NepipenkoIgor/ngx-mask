import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { TestMaskComponent } from './utils/test-component.component';
import { equal } from './utils/test-functions.component';
import { provideNgxMask, NgxMaskDirective } from 'ngx-mask';
import { expect } from 'vitest';

describe('Directive: Mask', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('inputTransformFn should return value toUpperCase', () => {
        component.mask.set('S*');
        component.inputTransformFn.set((value: unknown): string => String(value).toUpperCase());

        equal('a', 'A', fixture);
        equal('an', 'AN', fixture);
        equal('and', 'AND', fixture);
        equal('andr', 'ANDR', fixture);
        equal('andre', 'ANDRE', fixture);
        equal('andrey', 'ANDREY', fixture);
    });

    it('inputTransformFn should return value formValue toUpperCase', () => {
        component.mask.set('S*');
        component.outputTransformFn.set((value: string | number | undefined | null): string =>
            String(value).toUpperCase()
        );

        equal('a', 'a', fixture);
        equal('an', 'an', fixture);
        equal('and', 'and', fixture);
        equal('andr', 'andr', fixture);
        equal('andre', 'andre', fixture);
        equal('andrey', 'andrey', fixture);
        expect(component.form.value).equal('ANDREY');
    });

    it('inputTransformFn should return value formValue toUpperCase but input value to lowerCase', () => {
        component.mask.set('S*');
        component.outputTransformFn.set((value: string | number | undefined | null): string =>
            String(value).toUpperCase()
        );
        component.inputTransformFn.set((value: unknown): string => String(value).toLowerCase());

        equal('A', 'a', fixture);
        equal('AN', 'an', fixture);
        equal('AND', 'and', fixture);
        equal('ANDR', 'andr', fixture);
        equal('ANDRE', 'andre', fixture);
        equal('ANDREY', 'andrey', fixture);
        expect(component.form.value).equal('ANDREY');
    });

    it('separator.2 should replace dot in model', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        component.outputTransformFn.set((value: string | number | undefined | null): string => {
            if (String(value).includes('.')) {
                return String(value).replace('.', ',');
            }
            return String(value);
        });

        equal('10.2', '10.2', fixture);
        expect(component.form.value).equal('10,2');

        equal('109.2', '109.2', fixture);
        expect(component.form.value).equal('109,2');

        equal('1000.2', '1 000.2', fixture);
        expect(component.form.value).equal('1000,2');
    });

    it('separator.3 should toFixed value in model and return Number', () => {
        component.mask.set('separator.3');
        component.decimalMarker.set('.');
        component.outputTransformFn.set((value: string | number | undefined | null): number => {
            if (String(value).includes('.')) {
                const numberValue = parseFloat(String(value));
                const formattedValue = Number(numberValue.toFixed(2));
                return formattedValue;
            }
            return Number(value);
        });

        equal('237.356', '237.356', fixture);
        expect(component.form.value).equal(237.36);

        equal('11.123', '11.123', fixture);
        expect(component.form.value).equal(11.12);

        equal('1234.356', '1 234.356', fixture);
        expect(component.form.value).equal(1234.36);
    });

    it('mask 000.00 should replace dot in model', () => {
        component.mask.set('000.00');
        component.dropSpecialCharacters.set(false);
        component.outputTransformFn.set((value: string | number | undefined | null): string => {
            if (String(value).includes('.')) {
                return String(value).replace('.', ',');
            }
            return String(value);
        });

        equal('100.22', '100.22', fixture);
        expect(component.form.value).equal('100,22');

        equal('12', '12', fixture);
        expect(component.form.value).equal('12');
    });

    it('mask separator.1 should return number', () => {
        component.mask.set('separator.1');
        component.decimalMarker.set(',');
        component.outputTransformFn.set((value: string | number | undefined | null): number =>
            Number(value)
        );

        equal('123,2', '123,2', fixture);
        expect(component.form.value).equal(123.2);

        equal('10,2', '10,2', fixture);
        expect(component.form.value).equal(10.2);

        equal('1,1', '1,1', fixture);
        expect(component.form.value).equal(1.1);

        equal('1000,2', '1 000,2', fixture);
        expect(component.form.value).equal(1000.2);
    });

    it('mask separator.1 should return number decimalMarker dot', () => {
        component.mask.set('separator.1');
        component.decimalMarker.set('.');
        component.outputTransformFn.set((value: string | number | undefined | null): number =>
            Number(value)
        );

        equal('123.4', '123.4', fixture);
        expect(component.form.value).equal(123.4);

        equal('12.2', '12.2', fixture);
        expect(component.form.value).equal(12.2);

        equal('1.1', '1.1', fixture);
        expect(component.form.value).equal(1.1);

        equal('1000.2', '1 000.2', fixture);
        expect(component.form.value).equal(1000.2);
    });

    it('mask percent should replace dot in model', () => {
        component.mask.set('percent.2');
        component.outputTransformFn.set((value: string | number | undefined | null): string => {
            if (String(value).includes('.')) {
                return String(value).replace('.', ',');
            }
            return String(value);
        });
        equal('1.2', '1.2', fixture);
        expect(component.form.value).equal('1,2');

        equal('12.2', '12.2', fixture);
        expect(component.form.value).equal('12,2');

        equal('34.34', '34.34', fixture);
        expect(component.form.value).equal('34,34');
    });

    it('mask percent should replace dot in model', () => {
        component.mask.set('Hh:m0');
        component.showMaskTyped.set(true);
        component.dropSpecialCharacters.set(false);
        component.leadZeroDateTime.set(true);
        component.outputTransformFn.set((value: string | number | undefined | null) => {
            if (value) {
                const fetch = new Date();
                const values = String(value).split(':');
                if (values.length >= 2) {
                    const hour = Number(values[0]);
                    const minuts = Number(values[1]);
                    fetch.setHours(hour);
                    fetch.setMinutes(minuts);
                }
                fetch.setSeconds(0);
                return fetch.toString();
            }
            return;
        });
        const date = new Date();
        component.inputTransformFn.set((value: unknown): string => {
            if (typeof value !== 'object') {
                return String(value);
            }
            return `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(
                2,
                '0'
            )}`;
        });
        component.form.setValue(new Date().toString());
        expect(component.form.value).equal(date.toString());
    });

    it('#1634: leadZero blur reformat should go through outputTransformFn, not raw string', () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        component.decimalMarker.set('.');
        component.inputTransformFn.set((value: unknown): string => String(value));
        component.outputTransformFn.set((value: string | number | undefined | null): number =>
            Number(String(value).replace(',', '.'))
        );

        equal('9', '9', fixture);
        expect(component.form.value).equal(9);

        const input = fixture.nativeElement.querySelector('input');
        input.dispatchEvent(new Event('blur'));
        fixture.detectChanges();

        // leadZero pads the display to "9.00" on blur; the emitted model value must still be
        // the numeric type produced by outputTransformFn, not the raw masked string "9.00".
        expect(input.value).equal('9.00');
        expect(component.form.value).equal(9);
        expect(typeof component.form.value).equal('number');
    });
});

// Issue #1651: separator mask + inputTransformFn that turns an empty value into '0'.
// Selecting the whole value and pressing Backspace updated the model to 0 but left the
// DOM input blank (worked in 21.0.1); deleting character by character worked.
describe('Issue #1651: select-all + Backspace with inputTransformFn on separator.2', () => {
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
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');
        component.inputTransformFn.set((value: unknown) =>
            value === '' ? '0' : (value as string)
        );
        fixture.detectChanges();
        input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    });

    function type(value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }

    async function selectAllAndBackspace(): Promise<void> {
        input.focus();
        input.setSelectionRange(0, input.value.length);
        const keydown = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            cancelable: true,
        });
        input.dispatchEvent(keydown);
        // Like a browser: no default deletion (and no input event) when keydown was cancelled.
        if (!keydown.defaultPrevented) {
            input.value = '';
            input.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward' }));
        }
        fixture.detectChanges();
        await fixture.whenStable();
    }

    it('shows 0 in the DOM after select-all + Backspace', async () => {
        type('1234.5');
        expect(input.value).toBe('1,234.5');

        await selectAllAndBackspace();

        expect(input.value).toBe('0');
        expect(Number(component.form.value)).toBe(0);
    });

    it('shows 0 after deleting the last remaining character', async () => {
        type('7');
        await selectAllAndBackspace();

        expect(input.value).toBe('0');
    });
});
