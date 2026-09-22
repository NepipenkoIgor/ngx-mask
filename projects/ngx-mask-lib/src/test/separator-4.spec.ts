import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { DebugElement } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TestMaskComponent } from './utils/test-component.component';
import { equal, typeTest } from './utils/test-functions.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { expect, vi } from 'vitest';

describe('Separator: Mask', () => {
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

    it('cursor should move forward if the input starts with -, or 0, or 0.0, or 0.00, or 0.0000000', () => {
        component.mask.set('separator.8');
        component.specialCharacters.set([',', '.']);
        component.allowNegativeNumbers.set(true);
        component.form.setValue(0.723);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        inputTarget.value = '0';
        inputTarget.selectionStart = 1;
        inputTarget.selectionEnd = 1;
        debugElement.triggerEventHandler('input', { target: inputTarget });

        expect(inputTarget.value).equal('0');
        expect(inputTarget.selectionStart).equal(1);

        inputTarget.value = '-';
        inputTarget.selectionStart = 1;
        inputTarget.selectionEnd = 1;
        debugElement.triggerEventHandler('input', { target: inputTarget });

        expect(inputTarget.value).equal('-');
        expect(inputTarget.selectionStart).equal(1);

        inputTarget.value = '0.0';
        inputTarget.selectionStart = 3;
        inputTarget.selectionEnd = 3;
        debugElement.triggerEventHandler('input', { target: inputTarget });

        expect(inputTarget.value).equal('0.0');
        expect(inputTarget.selectionStart).equal(3);
    });

    it('Should work right when reset decimalMarker', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set(',');
        equal('1000000,00', '1 000 000,00', fixture);
    });

    it('separator precision 2 with thousandSeparator (.) decimalMarker (,) for 12345.67', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set('.');
        component.decimalMarker.set(',');
        equal('12.345,67', '12.345,67', fixture);
    });

    it('separator precision 2 with thousandSeparator (.) decimalMarker (,) for 12345.67', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set('.');
        component.decimalMarker.set(',');
        equal('12345,67', '12.345,67', fixture);
    });

    it('check formControl value to be number when decimalMarker is comma', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(' ');
        component.decimalMarker.set(',');

        typeTest('12 345,67', fixture);
        expect(component.form.value).equal('12345.67');
    });

    it('check formControl value to be number when decimalMarker is array', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(' ');
        component.decimalMarker.set(['.', ',']);

        typeTest('12 345,67', fixture);
        expect(component.form.value).equal('12345.67');

        typeTest('123 456.78', fixture);
        expect(component.form.value).equal('123456.78');
    });

    it('right handle character after first 0 value', () => {
        component.mask.set('separator');
        component.decimalMarker.set(',');
        equal('0', '0', fixture);
        equal('0,', '0,', fixture);
        equal('0 ', '0', fixture);
        equal('01', '0,1', fixture);
        equal('0s', '0', fixture);
        equal('0@', '0', fixture);
        // decimalMarker is ',' here, so '.' is neither the configured marker nor
        // the thousandSeparator (' ') and is stripped by _stripToDecimal, same as '0@'.
        equal('0.', '0', fixture);
        component.decimalMarker.set('.');
        equal('0', '0', fixture);
        equal('0.', '0.', fixture);
        equal('0 ', '0', fixture);
        equal('01', '0.1', fixture);
        equal('0s', '0', fixture);
        equal('0@', '0', fixture);
        equal('0,', '0.', fixture);
        component.decimalMarker.set(['.', ',']);
        equal('0', '0', fixture);
        equal('0.', '0.', fixture);
        equal('0,', '0.', fixture);
        equal('0 ', '0', fixture);
        equal('01', '0.1', fixture);
        equal('0s', '0', fixture);
        equal('0@', '0', fixture);
    });

    it('should add trailing zero when separator.1 and leadZero = true', async () => {
        component.mask.set('separator.1');
        component.leadZero.set(true);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(0);
        await fixture.whenStable();
        expect(inputTarget.value).equal('0.0');

        component.form.setValue(1);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.0');

        component.form.setValue(88);
        await fixture.whenStable();
        expect(inputTarget.value).equal('88.0');

        component.form.setValue(99);
        await fixture.whenStable();
        expect(inputTarget.value).equal('99.0');
    });

    it('should not modify value with one decimal when separator.1 and leadZero = true', async () => {
        component.mask.set('separator.1');
        component.leadZero.set(true);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(0.0);
        await fixture.whenStable();
        expect(inputTarget.value).equal('0.0');

        component.form.setValue(1.0);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.0');

        component.form.setValue(88.0);
        await fixture.whenStable();
        expect(inputTarget.value).equal('88.0');

        component.form.setValue(99.9);
        await fixture.whenStable();
        expect(inputTarget.value).equal('99.9');
    });

    it('should display zeros at the end separator2', async () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.00');

        component.form.setValue(10);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10.00');

        component.form.setValue(100);
        await fixture.whenStable();
        expect(inputTarget.value).equal('100.00');

        component.form.setValue(1000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1 000.00');

        component.form.setValue(1000.1);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1 000.10');

        component.form.setValue(1000.11);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1 000.11');

        component.form.setValue(11000.11);
        await fixture.whenStable();
        expect(inputTarget.value).equal('11 000.11');

        await equal('0', '0', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('0.00');

        await equal('1', '1', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('1.00');

        await equal('10', '10', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('10.00');

        await equal('10', '10', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('10.00');

        await equal('120', '120', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('120.00');

        await equal('1220', '1 220', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('1220.00');

        await equal('12340', '12 340', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('12340.00');

        await equal('12340.1', '12 340.1', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('12340.10');

        await equal('12340.12', '12 340.12', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('12340.12');
    });

    it('should display zeros at the end separator2', async () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        component.thousandSeparator.set(',');
        component.decimalMarker.set('.');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1,000.00');

        component.form.setValue(100);
        await fixture.whenStable();
        expect(inputTarget.value).equal('100.00');

        component.form.setValue(10000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10,000.00');

        component.form.setValue(120000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('120,000.00');

        component.form.setValue(10);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10.00');

        await equal('12340.12', '12,340.12', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('12340.12');

        await equal('12340', '12,340', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('12340.00');

        await equal('1234.1', '1,234.1', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('1234.10');

        await equal('122340.1', '122,340.1', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('122340.10');
    });

    it('should display zeros at the end separator3', async () => {
        component.mask.set('separator.3');
        component.leadZero.set(true);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(2);
        await fixture.whenStable();
        expect(inputTarget.value).equal('2.000');

        component.form.setValue(20);
        await fixture.whenStable();
        expect(inputTarget.value).equal('20.000');

        component.form.setValue(200);
        await fixture.whenStable();
        expect(inputTarget.value).equal('200.000');

        component.form.setValue(2000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('2 000.000');

        component.form.setValue(2000.1);
        await fixture.whenStable();
        expect(inputTarget.value).equal('2 000.100');

        component.form.setValue(2000.11);
        await fixture.whenStable();
        expect(inputTarget.value).equal('2 000.110');

        component.form.setValue(2000.112);
        await fixture.whenStable();
        expect(inputTarget.value).equal('2 000.112');

        component.form.setValue(22000.11);
        await fixture.whenStable();
        expect(inputTarget.value).equal('22 000.110');

        await equal('1', '1', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('1.000');

        await equal('30', '30', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('30.000');

        await equal('300', '300', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('300.000');

        await equal('1234', '1 234', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('1234.000');

        await equal('12345', '12 345', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('12345.000');

        await equal('12340.1', '12 340.1', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('12340.100');

        await equal('12340.12', '12 340.12', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('12340.120');
    });

    it('should display zeros at the end separator3', async () => {
        component.mask.set('separator.3');
        component.leadZero.set(true);
        component.thousandSeparator.set(',');
        component.decimalMarker.set('.');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1,000.000');

        component.form.setValue(100);
        await fixture.whenStable();
        expect(inputTarget.value).equal('100.000');

        component.form.setValue(10000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10,000.000');

        component.form.setValue(120000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('120,000.000');

        component.form.setValue(10);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10.000');

        await equal('12340.12', '12,340.12', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('12340.120');

        await equal('12340', '12,340', fixture, true);
        await fixture.whenStable();
        expect(component.form.value).equal('12340.000');

        await equal('1234.1', '1,234.1', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('1234.100');

        await equal('122340.1', '122,340.1', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('122340.100');
    });

    it('should display zeros at the end separator2', async () => {
        component.mask.set('separator.2');
        component.leadZero.set(true);
        component.thousandSeparator.set('.');
        component.decimalMarker.set(',');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.000,00');

        component.form.setValue(100);
        await fixture.whenStable();
        expect(inputTarget.value).equal('100,00');

        component.form.setValue(10000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10.000,00');

        component.form.setValue(120000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('120.000,00');

        component.form.setValue(10);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10,00');

        await equal('12340,12', '12.340,12', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('12340.12');

        await equal('12340', '12.340', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('12340.00');

        await equal('1234,1', '1.234,1', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('1234.10');

        await equal('122340,1', '122.340,1', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('122340.10');
    });

    it('should display zeros at the end separator3', async () => {
        component.mask.set('separator.3');
        component.leadZero.set(true);
        component.thousandSeparator.set('.');
        component.decimalMarker.set(',');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.000,000');

        component.form.setValue(100);
        await fixture.whenStable();
        expect(inputTarget.value).equal('100,000');

        component.form.setValue(10000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10.000,000');

        component.form.setValue(120000);
        await fixture.whenStable();
        expect(inputTarget.value).equal('120.000,000');

        component.form.setValue(10);
        await fixture.whenStable();
        expect(inputTarget.value).equal('10,000');

        await equal('12340,12', '12.340,12', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('12340.120');

        await equal('12340', '12.340', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('12340.000');

        await equal('1234,1', '1.234,1', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('1234.100');

        await equal('122340,1', '122.340,1', fixture, true);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.form.value).equal('122340.100');
    });

    it('should display only 9 separator.2', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');
        component.decimalMarker.set('.');

        equal('999999999999999', '999,999,999,999,999', fixture);
        expect(component.form.value).equal('999999999999999');

        equal('999999999999999.9', '999,999,999,999,999.9', fixture);
        expect(component.form.value).equal('999999999999999.9');

        equal('999999999999999.99', '999,999,999,999,999.99', fixture);
        expect(component.form.value).equal('999999999999999.99');
    });

    it('should display only 9 separator.3', () => {
        component.mask.set('separator.3');
        component.thousandSeparator.set(',');
        component.decimalMarker.set('.');

        equal('999999999999999', '999,999,999,999,999', fixture);
        expect(component.form.value).equal('999999999999999');

        equal('999999999999999.9', '999,999,999,999,999.9', fixture);
        expect(component.form.value).equal('999999999999999.9');

        equal('999999999999999.99', '999,999,999,999,999.99', fixture);
        expect(component.form.value).equal('999999999999999.99');

        equal('999999999999999.999', '999,999,999,999,999.999', fixture);
        expect(component.form.value).equal('999999999999999.999');
    });
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

// Issue #1641: with decimalMarker ',' the numeric keypad's '.' must insert the decimal marker.
describe('Issue #1641: numeric keypad decimal key with a comma decimal marker', () => {
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
        component.decimalMarker.set(',');
        component.thousandSeparator.set('.');
        fixture.detectChanges();
        input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    });

    function type(value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }

    function press(init: KeyboardEventInit): KeyboardEvent {
        const event = new KeyboardEvent('keydown', { cancelable: true, bubbles: true, ...init });
        input.dispatchEvent(event);
        fixture.detectChanges();
        return event;
    }

    function typeChar(char: string): void {
        const start = input.selectionStart ?? input.value.length;
        input.value = input.value.slice(0, start) + char + input.value.slice(start);
        input.setSelectionRange(start + 1, start + 1);
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }

    it("turns the keypad '.' (code NumpadDecimal) into the comma marker", () => {
        type('12');
        input.setSelectionRange(2, 2);

        const event = press({ key: '.', code: 'NumpadDecimal' });
        expect(event.defaultPrevented).toBe(true);
        expect(input.value).toBe('12,');

        typeChar('5');
        expect(input.value).toBe('12,5');
        expect(Number(component.form.value)).toBe(12.5);
    });

    it("turns key 'Decimal' into the comma marker", () => {
        type('7');
        input.setSelectionRange(1, 1);

        press({ key: 'Decimal', code: 'NumpadDecimal' });

        expect(input.value).toBe('7,');
    });

    it('does not intercept a period typed on the main keyboard', () => {
        type('1');
        input.setSelectionRange(1, 1);

        const event = press({ key: '.', code: 'Period' });

        expect(event.defaultPrevented).toBe(false);
    });

    it('does not intercept the keypad key when the decimal marker is a period', () => {
        component.decimalMarker.set('.');
        component.thousandSeparator.set(',');
        fixture.detectChanges();
        type('1');
        input.setSelectionRange(1, 1);

        const event = press({ key: '.', code: 'NumpadDecimal' });

        expect(event.defaultPrevented).toBe(false);
    });

    it('keeps typing a thousand-separator period working', () => {
        type('1.000');
        expect(input.value).toBe('1.000');
    });
});
