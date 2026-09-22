import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { equal } from './utils/test-functions.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { TestMaskComponent } from './utils/test-component.component';
import { expect } from 'vitest';
describe('Directive: Mask (Validation)', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask({ validation: true })],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be marked as not valid if not valid and validation attribute true', () => {
        component.mask.set('0000');
        component.form.addValidators(Validators.required);

        equal('12', '12', fixture);
        expect(component.form.valid).equal(false);
        expect(component.form.hasError('mask')).equal(true);
    });

    it('should be marked as valid if not valid and validation attribute false', () => {
        component.validation.set(false);
        component.form.addValidators(Validators.required);

        equal('12', '12', fixture);
        expect(component.form.valid).equal(true);
    });

    it('should be marked as valid if valid and validation attribute true', () => {
        component.mask.set('0000');
        component.form.addValidators(Validators.required);

        equal('1234', '1234', fixture);
        expect(component.form.valid).equal(true);
    });

    it('should be marked as valid if not valid and validation attribute false', () => {
        component.validation.set(false);
        component.mask.set('0000');
        component.form.addValidators(Validators.required);

        equal('12', '12', fixture);
        expect(component.form.valid).equal(true);
    });

    it('should be not valid email mask A*@A*.SSS', () => {
        component.mask.set('A*@A*.SSS');
        component.dropSpecialCharacters.set(false);
        component.form.addValidators(Validators.required);

        equal('a', 'a', fixture);
        expect(component.form.valid).equal(false);
        equal('as', 'as', fixture);
        expect(component.form.valid).equal(false);
        equal('asd', 'asd', fixture);
        expect(component.form.valid).equal(false);
        equal('andr', 'andr', fixture);
        expect(component.form.valid).equal(false);
        equal('testing', 'testing', fixture);
        expect(component.form.valid).equal(false);
        equal('testing@', 'testing@', fixture);
        expect(component.form.valid).equal(false);
        equal('testing@a', 'testing@a', fixture);
        expect(component.form.valid).equal(false);
        equal('testing@aa', 'testing@aa', fixture);
        expect(component.form.valid).equal(false);
        equal('testing@gmail', 'testing@gmail', fixture);
        expect(component.form.valid).equal(false);
        equal('testing@gmail.', 'testing@gmail.', fixture);
        expect(component.form.valid).equal(false);
        equal('testing@gmail.c', 'testing@gmail.c', fixture);
        expect(component.form.valid).equal(false);
        equal('testing@email.ua', 'testing@email.ua', fixture);
        expect(component.form.valid).equal(false);
    });

    it('should valid email mask A*@A*.SSS', () => {
        component.mask.set('A*@A*.SSS');
        component.dropSpecialCharacters.set(false);
        component.form.addValidators(Validators.required);

        equal('testing@gmail.com', 'testing@gmail.com', fixture);
        expect(component.form.valid).equal(true);
    });

    it('should be not valid mask A*@A*.SS', () => {
        component.mask.set('A*@A*.SS');
        component.dropSpecialCharacters.set(false);
        component.form.addValidators(Validators.required);

        equal('d', 'd', fixture);
        expect(component.form.valid).equal(false);
        equal('dd', 'dd', fixture);
        expect(component.form.valid).equal(false);
        equal('ddd', 'ddd', fixture);
        expect(component.form.valid).equal(false);
        equal('dddd', 'dddd', fixture);
        expect(component.form.valid).equal(false);
        equal('andre', 'andre', fixture);
        expect(component.form.valid).equal(false);
        equal('andrey', 'andrey', fixture);
        expect(component.form.valid).equal(false);
        equal('andrey@', 'andrey@', fixture);
        expect(component.form.valid).equal(false);
        equal('andrey@a', 'andrey@a', fixture);
        expect(component.form.valid).equal(false);
        equal('andrey@te', 'andrey@te', fixture);
        expect(component.form.valid).equal(false);
        equal('andrey@test', 'andrey@test', fixture);
        expect(component.form.valid).equal(false);
        equal('andrey@test.c', 'andrey@test.c', fixture);
        expect(component.form.valid).equal(false);
    });

    it('should valid email mask', () => {
        component.mask.set('A*@A*.SS');
        component.dropSpecialCharacters.set(false);
        component.form.addValidators(Validators.required);

        equal('testing@some.ua', 'testing@some.ua', fixture);
        expect(component.form.valid).equal(true);
    });

    it('should valid from one digit mask 0*', () => {
        component.mask.set('0*');
        component.form.setValidators([Validators.required, Validators.min(1)]);
        component.form.updateValueAndValidity();

        equal('', '', fixture);
        expect(component.form.valid).equal(false);
        equal('0', '0', fixture);
        expect(component.form.valid).equal(false);
        equal('00', '00', fixture);
        expect(component.form.valid).equal(false);
        equal('1', '1', fixture);
        expect(component.form.valid).equal(true);
        equal('01', '01', fixture);
        expect(component.form.valid).equal(true);
    });

    it('should valid from one digit mask S*', () => {
        component.mask.set('S*');
        component.form.setValidators([Validators.required, Validators.min(1)]);
        component.form.updateValueAndValidity();

        equal('', '', fixture);
        expect(component.form.valid).equal(false);
        equal('d', 'd', fixture);
        expect(component.form.valid).equal(true);
    });

    it('should valid from one digit mask A*', () => {
        component.mask.set('A*');
        component.form.setValidators([Validators.required, Validators.min(1)]);
        component.form.updateValueAndValidity();

        equal('', '', fixture);
        expect(component.form.valid).equal(false);
        equal('d', 'd', fixture);
        expect(component.form.valid).equal(true);
        equal('1', '1', fixture);
        expect(component.form.valid).equal(true);
    });

    it('mask with number value should work as expected mask 0*', () => {
        component.mask.set('0*');
        component.form.setValidators([Validators.required, Validators.min(1)]);
        component.form.updateValueAndValidity();

        equal('44', '44', fixture);
        expect(component.form.valid).equal(true);
        expect(component.form.value).equal('44');

        equal('', '', fixture);
        expect(component.form.invalid).equal(true);
        expect(component.form.value).equal('');

        equal('1', '1', fixture);
        expect(component.form.valid).equal(true);
        expect(component.form.value).equal('1');
    });

    it('mask with number value should work as expected mask 000.00', () => {
        component.mask.set('000.00');
        component.form.addValidators(Validators.required);
        component.form.setValue('');

        equal('', '', fixture);
        expect(component.form.invalid).equal(true);
        expect(component.form.value).equal('');

        equal('44', '44', fixture);
        expect(component.form.invalid).equal(true);
        expect(component.form.value).equal('44');

        equal('1', '1', fixture);
        expect(component.form.invalid).equal(true);
        expect(component.form.value).equal('1');

        equal('444', '444', fixture);
        expect(component.form.invalid).equal(true);
        expect(component.form.value).equal('444');

        equal('444.3', '444.3', fixture);
        expect(component.form.invalid).equal(true);
        expect(component.form.value).equal('4443');

        equal('444.31', '444.31', fixture);
        expect(component.form.valid).equal(true);
        expect(component.form.value).equal('44431');
    });

    it('dropSpecialCharacters is different from specialCharacters', () => {
        component.mask.set('+000');
        component.specialCharacters.set(['+', ' ']);
        component.dropSpecialCharacters.set([' ']);
        component.form.addValidators(Validators.required);

        equal('+37', '+37', fixture);
        expect(component.form.valid).equal(false);

        equal('+373', '+373', fixture);
        expect(component.form.valid).equal(true);

        component.mask.set('+000 000 00 000');

        equal('+3736000000', '+373 600 00 00', fixture);
        expect(component.form.valid).equal(false);

        equal('+37360000000', '+373 600 00 000', fixture);
        expect(component.form.valid).equal(true);
    });

    it('email Mask should validated correct', () => {
        component.mask.set('A*@A*.A*');
        component.dropSpecialCharacters.set(false);
        component.form.addValidators(Validators.required);

        equal('validate', 'validate', fixture);
        expect(component.form.valid).equal(false);

        equal('validate@', 'validate@', fixture);
        expect(component.form.valid).equal(false);

        equal('validate@some', 'validate@some', fixture);
        expect(component.form.valid).equal(false);

        equal('validate@some.', 'validate@some.', fixture);
        expect(component.form.valid).equal(false);

        equal('validate@some.e', 'validate@some.e', fixture);
        expect(component.form.valid).equal(true);

        equal('validate@some.eu', 'validate@some.eu', fixture);
        expect(component.form.valid).equal(true);

        equal('validate@some.com', 'validate@some.com', fixture);
        expect(component.form.valid).equal(true);
    });
});

describe('Issue #1645: multi mask with different lengths validates by length', () => {
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
        component.mask.set('00000 9||00 00000 0');
        component.validation.set(true);
        fixture.detectChanges();
        input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    });

    function valid(value: string): boolean {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        return component.form.valid;
    }

    it.each([
        ['1234', false],
        ['12345', true],
        ['123456', true],
        ['1234567', false],
        ['12345678', true],
        // The mask truncates the ninth digit, so the control holds a valid 8-digit value.
        ['123456789', true],
    ])('#1645: %s -> valid=%s', (value, expected) => {
        expect(valid(value)).toBe(expected);
    });
});
