import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { DebugElement } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TestMaskComponent } from './utils/test-component.component';
import { equal, typeTest } from './utils/test-functions.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { By } from '@angular/platform-browser';
import { expect, vi } from 'vitest';

// FR locale uses comma as decimal marker
describe('Separator: Mask with FR locale', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask(), { provide: LOCALE_ID, useValue: 'fr' }],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Should work right when reset decimalMarker', () => {
        component.mask.set('separator.2');
        component.decimalMarker.set('.');
        equal('1000000.00', '1 000 000.00', fixture);
    });

    it('separator precision 2 with thousandSeparator (.) decimalMarker (,) for 12345.67', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');
        component.decimalMarker.set('.');
        equal('12,345.67', '12,345.67', fixture);
    });

    it('separator precision 2 with thousandSeparator (.) decimalMarker (,) for 12345.67', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(',');
        component.decimalMarker.set('.');
        equal('12345.67', '12,345.67', fixture);
    });

    it('check formControl value to be number when decimalMarker is dot', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(' ');
        component.decimalMarker.set('.');

        typeTest('12 345.67', fixture);
        expect(component.form.value).equal(12345.67);
    });

    it('check formControl value to be number when decimalMarker is array', () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(' ');
        component.decimalMarker.set(['.', ',']);

        typeTest('12 345,67', fixture);
        expect(component.form.value).equal(12345.67);

        typeTest('123 456.78', fixture);
        expect(component.form.value).equal(123456.78);
    });

    it('should show - at input', async () => {
        component.mask.set('separator.2');
        component.thousandSeparator.set(' ');
        component.decimalMarker.set(',');
        component.allowNegativeNumbers.set(true);
        const debugElement: DebugElement = fixture.debugElement.query(By.css('input'));
        const inputTarget: HTMLInputElement = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
        fixture.detectChanges();

        component.form.setValue(-78);
        await fixture.whenStable();
        expect(inputTarget.value).equal('-78');
        equal('-78', '-78', fixture);
    });
});
