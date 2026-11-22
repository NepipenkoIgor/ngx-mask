import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { expect } from 'vitest';
import { TestMaskComponent } from './utils/test-component.component';
import { pasteTest, typeTest } from './utils/test-functions.component';

describe('Separator: decimalMarker array overlapping the thousandSeparator', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    const inputValue = (): string => fixture.nativeElement.querySelector('input').value;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        component.mask.set('separator.2');
        component.decimalMarker.set(['.', ',']);
        fixture.detectChanges();
    });

    describe('thousandSeparator " " (#1745)', () => {
        beforeEach(() => {
            component.thousandSeparator.set(' ');
            fixture.detectChanges();
        });

        it('keeps every digit of a model value with grouping commas and a decimal dot', () => {
            component.form.setValue('1,234.5');
            fixture.detectChanges();

            expect(inputValue()).equal('1 234.5');
        });

        it('keeps every digit of a model value with grouping dots and a decimal comma', () => {
            component.form.setValue('1.234,5');
            fixture.detectChanges();

            expect(inputValue()).equal('1 234,5');
        });

        it('formats a pasted value the same way', () => {
            expect(pasteTest('1,234.5', fixture)).equal('1 234.5');
        });
    });

    describe('thousandSeparator "," (#1744)', () => {
        beforeEach(() => {
            component.thousandSeparator.set(',');
            fixture.detectChanges();
        });

        it('treats a typed comma as grouping, the same as a pasted or written one', () => {
            expect(typeTest('1,5', fixture)).equal('15');
            expect(pasteTest('1,5', fixture)).equal('15');
            component.form.setValue('1,5');
            fixture.detectChanges();
            expect(inputValue()).equal('15');
        });

        it('takes the dot as the decimal marker', () => {
            expect(typeTest('1234.5', fixture)).equal('1,234.5');
            expect(typeTest('1,234.5', fixture)).equal('1,234.5');
        });
    });

    describe('a single (non-array) decimalMarker is untouched by the model-write branch', () => {
        it('keeps a "," decimalMarker with "." thousandSeparator', () => {
            component.thousandSeparator.set('.');
            component.decimalMarker.set(',');
            fixture.detectChanges();

            component.form.setValue('1.234,5');
            fixture.detectChanges();
            expect(inputValue()).equal('1.234,5');

            component.form.setValue(1234.5);
            fixture.detectChanges();
            expect(inputValue()).equal('1.234,5');
        });

        it('keeps a "." decimalMarker with "," thousandSeparator', () => {
            component.thousandSeparator.set(',');
            component.decimalMarker.set('.');
            fixture.detectChanges();

            component.form.setValue('1234.5');
            fixture.detectChanges();
            expect(inputValue()).equal('1,234.5');
        });
    });

    it('formats a plain array-marker model write with no grouping marker', () => {
        component.thousandSeparator.set(' ');
        fixture.detectChanges();

        component.form.setValue('1234.5');
        fixture.detectChanges();
        expect(inputValue()).equal('1 234.5');
    });
});
