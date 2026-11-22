import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { DebugElement } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TestMaskComponent } from './utils/test-component.component';
import { equal, Type } from './utils/test-functions.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { vi, expect } from 'vitest';

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

    it('should change value if user star from zero separator.3 with allowNegativeNumber leadZero decimalMarker= ,', () => {
        component.mask.set('separator.3');
        component.decimalMarker.set(',');
        component.allowNegativeNumbers.set(true);
        component.leadZero.set(true);
        fixture.detectChanges();

        equal('-03', '-0,3', fixture);
        equal('-034', '-0,34', fixture);
        equal('-,3', '-0,3', fixture);
        equal('-,34', '-0,34', fixture);
        equal('-,345', '-0,345', fixture);
    });

    it('should change value if user star from zero separator.3 with allowNegativeNumber leadZero decimalMarker= ,', () => {
        component.mask.set('separator.3');
        component.decimalMarker.set('.');
        component.allowNegativeNumbers.set(true);
        component.leadZero.set(true);
        fixture.detectChanges();

        equal('-03', '-0.3', fixture);
        equal('-034', '-0.34', fixture);
        equal('-.3', '-0.3', fixture);
        equal('-.34', '-0.34', fixture);
        equal('-.345', '-0.345', fixture);
    });

    it('separator.2 thousandSeparator = . should display correct value if decimalMarker is array 12345.67', async () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set('.');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.78);
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.255,78');
    });

    it('separator.3 thousandSeparator = . should display correct value if decimalMarker is array 12345.67', async () => {
        component.mask.set('separator.3');
        component.thousandSeparator.set('.');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.78);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.255,78');
    });

    it('separator.1 thousandSeparator = . should display correct value if decimalMarker is array 12345.67', async () => {
        component.thousandSeparator.set('.');
        component.mask.set('separator.1');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.78);
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.255,7');
    });

    it('separator.2 thousandSeparator = , should display correct value if decimalMarker is array 12345.67', async () => {
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.78);
        await fixture.whenStable();

        expect(inputTarget.value).equal('1,255.78');
    });

    it('separator.3 thousandSeparator = , should display correct value if decimalMarker is array 12345.67', async () => {
        component.mask.set('separator.3');
        component.thousandSeparator.set(',');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.78);
        await fixture.whenStable();

        expect(inputTarget.value).equal('1,255.78');
    });

    it('separator.1 thousandSeparator = , should display correct value if decimalMarker is array 12345.67', async () => {
        component.mask.set('separator.1');
        component.thousandSeparator.set(',');
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.78);
        await fixture.whenStable();

        expect(inputTarget.value).equal('1,255.7');
    });

    it('separator.2 thousandSeparator = . leadZero should display correct value if decimalMarker is array 12345.67', async () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set('.');
        component.leadZero.set(true);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.78);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.255,78');
    });

    it('separator.3 thousandSeparator = . leadZero should display correct value if decimalMarker is array 12345.67', async () => {
        component.mask.set('separator.3');
        component.thousandSeparator.set('.');
        component.leadZero.set(true);

        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.78);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.255,780');
    });

    it('separator.1 thousandSeparator = . leadZero  should display correct value if decimalMarker is array 12345.67', async () => {
        component.thousandSeparator.set('.');
        component.mask.set('separator.1');
        component.leadZero.set(true);

        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(1255.7);
        await fixture.whenStable();
        expect(inputTarget.value).equal('1.255,7');
    });

    it('should work when decimalMarker have default value separator.2', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');
        fixture.detectChanges();

        equal('1', '1', fixture);
        equal('12', '12', fixture);
        equal('123', '123', fixture);
        equal('1234', '1,234', fixture);
    });

    it('should work when decimalMarker have default value separator.3', () => {
        component.mask.set('separator.3');
        component.thousandSeparator.set(',');
        fixture.detectChanges();

        equal('1', '1', fixture);
        equal('12', '12', fixture);
        equal('123', '123', fixture);
        equal('1234', '1,234', fixture);
    });

    it('should work when decimalMarker have default value separator.1', () => {
        component.mask.set('separator.3');
        component.thousandSeparator.set(',');
        fixture.detectChanges();

        equal('1', '1', fixture);
        equal('12', '12', fixture);
        equal('123', '123', fixture);
        equal('1234', '1,234', fixture);
    });

    it('should not delete decimalMarker ,', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set(',');
        const inputElement = fixture.nativeElement.querySelector('input');

        inputElement.value = '1,23';
        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        inputElement.setSelectionRange(4, 4);
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
        inputElement.value = '1,2';
        inputElement.setSelectionRange(3, 3);
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
        inputElement.value = '1,';
        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(inputElement.value).equal('1,');
    });

    it('should not delete decimalMarker .', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        const inputElement = fixture.nativeElement.querySelector('input');

        inputElement.value = '12.23';
        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        inputElement.setSelectionRange(4, 4);
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
        inputElement.value = '12.2';
        inputElement.setSelectionRange(3, 3);
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
        inputElement.value = '12.';
        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(inputElement.value).equal('12.');
    });

    it('should change position when click backspace thousandSeparator = .', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set(',');
        component.thousandSeparator.set('.');
        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.value = '1.234.567,89';

        expect(inputElement.value).equal('1.234.567,89');

        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        inputElement.setSelectionRange(2, 2);
        expect(inputElement.selectionStart).equal(2);

        const backspaceEvent = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
        });
        inputElement.dispatchEvent(backspaceEvent);

        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(inputElement.value).equal('1.234.567,89');
        expect(inputElement.selectionStart).equal(1);
    });

    it('should change position when click backspace thousandSeparator = ,', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        component.thousandSeparator.set(',');
        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.value = '1,234,567.89';

        expect(inputElement.value).equal('1,234,567.89');

        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        inputElement.setSelectionRange(2, 2);
        expect(inputElement.selectionStart).equal(2);

        const backspaceEvent = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
        });
        inputElement.dispatchEvent(backspaceEvent);

        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(inputElement.value).equal('1,234,567.89');
        expect(inputElement.selectionStart).equal(1);
    });

    it('should change position when click backspace thousandSeparator = ', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        component.thousandSeparator.set(' ');
        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.value = '1 234 567.89';

        expect(inputElement.value).equal('1 234 567.89');

        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        inputElement.setSelectionRange(2, 2);
        expect(inputElement.selectionStart).equal(2);

        const backspaceEvent = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
        });
        inputElement.dispatchEvent(backspaceEvent);

        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(inputElement.value).equal('1 234 567.89');
        expect(inputElement.selectionStart).equal(1);
    });

    it('should show correct value with separator.9', async () => {
        component.mask.set('separator.9');
        component.decimalMarker.set('.');
        component.leadZero.set(true);
        component.separatorLimit.set('10');
        fixture.detectChanges();

        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);

        equal('1', '1', fixture);
        equal('12', '12', fixture);

        component.form.setValue(10.1);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(inputTarget.value).equal('10.100000000');
    });

    it('should show correct value with separator.10', async () => {
        component.mask.set('separator.10');
        component.decimalMarker.set('.');
        component.leadZero.set(true);
        component.separatorLimit.set('10');
        fixture.detectChanges();

        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);

        equal('1', '1', fixture);
        equal('12', '12', fixture);

        component.form.setValue(10.1);
        await fixture.whenStable();
        fixture.detectChanges();
        expect(inputTarget.value).equal('10.1000000000');
    });

    it('should support big numbers with separator', () => {
        component.mask.set('separator');

        equal('12345678910111215', '12 345 678 910 111 215', fixture);
        expect(component.form.value).equal('12345678910111215');
        equal('12345678910111215.9999', '12 345 678 910 111 215.9999', fixture);
        expect(component.form.value).equal('12345678910111215.9999');
    });

    it('should support big numbers with separator 2', () => {
        component.mask.set('separator.2');

        equal('12345678910111215', '12 345 678 910 111 215', fixture);
        expect(component.form.value).equal('12345678910111215');
        equal('12345678910111215.9999', '12 345 678 910 111 215.99', fixture);
        expect(component.form.value).equal('12345678910111215.99');
    });

    it('should support big numbers with separator 2 thousand =.', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set('.');

        equal('12345678910111215', '12.345.678.910.111.215', fixture);
        expect(component.form.value).equal('12345678910111215');
        equal('12345678910111215,99', '12.345.678.910.111.215,99', fixture);
        expect(component.form.value).equal('12345678910111215.99');
    });

    it('should support big numbers with separator 2 thousand =,', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');

        equal('12345678910111215', '12,345,678,910,111,215', fixture);
        expect(component.form.value).equal('12345678910111215');
        equal('12345678910111215.9999', '12,345,678,910,111,215.99', fixture);
        expect(component.form.value).equal('12345678910111215.99');
    });

    it('should show default state after reset control separator.2', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');

        equal('1234', '1,234', fixture);
        component.form.reset();
        expect(component.form.dirty).equal(false);
        expect(component.form.pristine).equal(true);
    });

    it('should show default state after reset control separator.0', () => {
        component.mask.set('separator.0');
        component.thousandSeparator.set(',');

        equal('1234', '1,234', fixture);
        component.form.reset();
        expect(component.form.dirty).equal(false);
        expect(component.form.pristine).equal(true);
    });

    it('should show default state after reset control separator.2 and leadZero', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');
        component.leadZero.set(true);

        equal('1234', '1,234', fixture);
        component.form.reset();
        expect(component.form.dirty).equal(false);
        expect(component.form.pristine).equal(true);
    });

    it('should show correct value in model after changing thousandSeparator', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(' ');
        component.decimalMarker.set(',');
        fixture.detectChanges();

        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.value = '100000,00';
        inputElement.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.form.value).equal(100000);

        component.thousandSeparator.set('.');
        fixture.detectChanges();

        expect(component.form.value).equal(100000);

        component.thousandSeparator.set('-');
        fixture.detectChanges();

        expect(component.form.value).equal(100000);

        component.thousandSeparator.set(',');
        fixture.detectChanges();

        expect(component.form.value).equal(100000);
    });

    it('should show correct value in input after changing thousandSeparator', () => {
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();
        component.mask.set('separator.2');
        component.thousandSeparator.set(' ');
        component.decimalMarker.set(',');

        equal('123456,10', '123 456,10', fixture, false, Type);
        expect(inputTarget.value).equal('123 456,10');
        expect(component.form.value).equal(123456.1);

        component.thousandSeparator.set('.');
        fixture.detectChanges();

        equal('123456,10', '123.456,10', fixture, false, Type);
        expect(inputTarget.value).equal('123.456,10');
        expect(component.form.value).equal(123456.1);

        component.thousandSeparator.set('-');
        fixture.detectChanges();

        equal('123456,10', '123-456,10', fixture, false, Type);
        expect(inputTarget.value).equal('123-456,10');
        expect(component.form.value).equal(123456.1);

        component.thousandSeparator.set(',');
        fixture.detectChanges();

        equal('123456.10', '123,456.10', fixture, false, Type);
        expect(inputTarget.value).equal('123,456.10');
        expect(component.form.value).equal(123456.1);
    });
});
