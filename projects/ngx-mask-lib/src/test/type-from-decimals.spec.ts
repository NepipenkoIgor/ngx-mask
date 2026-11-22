import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { DebugElement } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { TestMaskComponent } from './utils/test-component.component';
import { equal, typeTest, Paste } from './utils/test-functions.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { expect, vi } from 'vitest';

// Issues #733/#1414/#1315: opt-in "banking" typing mode for separator masks —
// typed digits fill the value from the decimal end, ATM/calculator style.
describe('Directive: Mask (typeFromDecimals)', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    const backspace = (inputTarget: HTMLInputElement, debugElement: DebugElement): void => {
        // Mirror the delete.spec.ts pattern: the harness sets the post-deletion
        // value and caret, then replays the Backspace keydown + input events.
        inputTarget.value = inputTarget.value.slice(0, -1);
        inputTarget.selectionStart = inputTarget.value.length;
        inputTarget.selectionEnd = inputTarget.value.length;
        debugElement.triggerEventHandler('keydown', {
            code: 'Backspace',
            key: 'Backspace',
            keyCode: 8,
            target: inputTarget,
        });
        debugElement.triggerEventHandler('input', { target: inputTarget });
    };

    describe('option enabled', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
                providers: [provideNgxMask({ typeFromDecimals: true })],
            });
            fixture = TestBed.createComponent(TestMaskComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should build the value from the decimal end while typing (precision 2)', () => {
            component.mask.set('separator.2');

            expect(typeTest('5', fixture)).toBe('0.05');
            expect(typeTest('57', fixture)).toBe('0.57');
            expect(typeTest('573', fixture)).toBe('5.73');
            expect(typeTest('5730', fixture)).toBe('57.30');
        });

        it('should build the value from the decimal end while typing (precision 3)', () => {
            component.mask.set('separator.3');

            expect(typeTest('5', fixture)).toBe('0.005');
            expect(typeTest('1234', fixture)).toBe('1.234');
            expect(typeTest('12345', fixture)).toBe('12.345');
        });

        it('should ignore a leading zero and typed decimal markers', () => {
            component.mask.set('separator.2');

            expect(typeTest('0', fixture)).toBe('');
            expect(typeTest('05', fixture)).toBe('0.05');
            expect(typeTest('5.73', fixture)).toBe('5.73');
        });

        it('should add thousand separators as the integer part grows', () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set(',');

            expect(typeTest('123456', fixture)).toBe('1,234.56');
            expect(typeTest('123456789', fixture)).toBe('1,234,567.89');
        });

        it('should respect custom thousandSeparator and decimalMarker', () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set('.');
            component.decimalMarker.set(',');

            expect(typeTest('123456', fixture)).toBe('1.234,56');
        });

        it('should shift digits back to the right on backspace', () => {
            component.mask.set('separator.2');
            const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
            const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
            fixture.detectChanges();

            typeTest('573', fixture);
            expect(inputTarget.value).toBe('5.73');

            backspace(inputTarget, debugElement);
            expect(inputTarget.value).toBe('0.57');

            backspace(inputTarget, debugElement);
            expect(inputTarget.value).toBe('0.05');

            backspace(inputTarget, debugElement);
            expect(inputTarget.value).toBe('');
        });

        it('should shift digits back through a thousand separator on backspace', () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set(',');
            const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
            const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
            vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
            fixture.detectChanges();

            typeTest('123456', fixture);
            expect(inputTarget.value).toBe('1,234.56');

            backspace(inputTarget, debugElement);
            expect(inputTarget.value).toBe('123.45');
        });

        it('should format a pasted value normally (not shifted)', () => {
            component.mask.set('separator.2');
            equal('1234.5', '1 234.5', fixture, false, Paste);
        });

        it('should format a model-written value normally (writeValue path)', async () => {
            component.mask.set('separator.2');
            fixture.detectChanges();
            component.form.setValue(1234.56);
            await fixture.whenStable();

            const inputTarget: HTMLInputElement = fixture.debugElement.query(By.css('input'))
                .nativeElement as HTMLInputElement;
            expect(inputTarget.value).toBe('1 234.56');
        });

        it('should keep the prefix while typing from decimals', () => {
            component.mask.set('separator.2');
            component.prefix.set('$');

            expect(typeTest('5', fixture)).toBe('$0.05');
            expect(typeTest('573', fixture)).toBe('$5.73');
        });

        it('should keep the suffix while typing from decimals', () => {
            component.mask.set('separator.2');
            component.suffix.set('€');

            expect(typeTest('573', fixture)).toBe('5.73€');
        });

        it('should handle the minus sign with allowNegativeNumbers', () => {
            component.mask.set('separator.2');
            component.allowNegativeNumbers.set(true);

            expect(typeTest('-5', fixture)).toBe('-0.05');
            expect(typeTest('-573', fixture)).toBe('-5.73');
        });

        it('should respect separatorLimit by rejecting overflow digits', () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set(',');
            component.separatorLimit.set('1000');

            expect(typeTest('123456', fixture)).toBe('1,234.56');
            expect(typeTest('1234567', fixture)).toBe('1,234.56');
        });

        it('should not affect separator masks without precision', () => {
            component.mask.set('separator');
            equal('1234', '1 234', fixture);
        });

        it('should emit the numeric value to the form control', () => {
            component.mask.set('separator.2');
            typeTest('573', fixture);
            expect(component.form.value).toBe(5.73);
        });

        it('should stay inert for separator.0 (zero precision — regular typing behavior)', () => {
            component.mask.set('separator.0');
            component.thousandSeparator.set(',');

            expect(typeTest('1234', fixture)).toBe('1,234');
            expect(typeTest('5', fixture)).toBe('5');
        });

        it('should stay inert for a bare separator mask (no precision — regular typing behavior)', () => {
            component.mask.set('separator');

            expect(typeTest('1234', fixture)).toBe('1 234');
            expect(typeTest('1234.5', fixture)).toBe('1 234.5');
        });

        it('should not double-pad on blur with leadZero (display already carries full precision)', () => {
            component.mask.set('separator.2');
            component.leadZero.set(true);
            const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
            const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;

            expect(typeTest('573', fixture)).toBe('5.73');

            debugElement.triggerEventHandler('blur', { target: inputTarget });
            fixture.detectChanges();

            expect(inputTarget.value).toBe('5.73');
            expect(component.form.value).toBe('5.73');
        });

        it('should give the model the displayed value with dropSpecialCharacters: false', () => {
            component.mask.set('separator.2');
            component.thousandSeparator.set(',');
            component.dropSpecialCharacters.set(false);

            expect(typeTest('123456', fixture)).toBe('1,234.56');
            expect(component.form.value).toBe('1,234.56');
        });

        it('should ignore typed letters and extra decimal markers (digits only)', () => {
            component.mask.set('separator.2');

            expect(typeTest('a5b7c', fixture)).toBe('0.57');
            expect(typeTest('5..7', fixture)).toBe('0.57');
        });

        it('should survive a garbage paste without crashing (regular paste semantics)', () => {
            component.mask.set('separator.2');

            equal('abc', '', fixture, false, Paste);
            equal('1.2.3', '12.3', fixture, false, Paste);
        });
    });

    describe('directive input (no provider config)', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
                providers: [provideNgxMask()],
            });
            fixture = TestBed.createComponent(TestMaskComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should activate the mode via the [typeFromDecimals] input alone', () => {
            component.mask.set('separator.2');
            component.typeFromDecimals.set(true);

            expect(typeTest('5', fixture)).toBe('0.05');
            expect(typeTest('573', fixture)).toBe('5.73');
        });

        it('should combine the input with thousandSeparator', () => {
            component.mask.set('separator.2');
            component.typeFromDecimals.set(true);
            component.thousandSeparator.set(',');

            expect(typeTest('123456', fixture)).toBe('1,234.56');
        });

        it('should keep regular typing when the input stays at the config default (false)', () => {
            component.mask.set('separator.2');

            expect(typeTest('1234.56', fixture)).toBe('1 234.56');
        });
    });

    describe('directive input overrides provider config', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
                providers: [provideNgxMask({ typeFromDecimals: true })],
            });
            fixture = TestBed.createComponent(TestMaskComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should disable the mode with [typeFromDecimals]="false" over config true', () => {
            component.mask.set('separator.2');
            component.typeFromDecimals.set(false);

            expect(typeTest('1234.56', fixture)).toBe('1 234.56');
            expect(typeTest('5', fixture)).toBe('5');
        });
    });

    describe('option disabled (default)', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
                providers: [provideNgxMask()],
            });
            fixture = TestBed.createComponent(TestMaskComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should keep the default separator typing behavior', () => {
            component.mask.set('separator.2');
            equal('1234.56', '1 234.56', fixture);
            equal('5', '5', fixture);
            equal('573', '573', fixture);
        });
    });
});
