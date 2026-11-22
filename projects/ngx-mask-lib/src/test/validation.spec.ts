import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { equal, Paste, typeTest } from './utils/test-functions.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { TestMaskComponent } from './utils/test-component.component';
import { By } from '@angular/platform-browser';
import { expect, vi } from 'vitest';
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

    // #1668: the built-in email mask must accept the characters real addresses carry
    // ('.', '_', '-', '+' in the local part, '-' and extra labels in the domain), both
    // typed and pasted, and the model value must hold the full address.
    describe('email mask A*@A*.A*', () => {
        const addresses = [
            'otto.shmidt@example.com',
            'otto_shmidt@example.com',
            'otto-shmidt@example.com',
            'o.t-t_tag@example.com',
            'a+tag@x.com',
            'a@my-site.com',
            'a@mail.example.com',
            'validate@some.e',
        ];

        for (const dropSpecialCharacters of [true, false]) {
            for (const address of addresses) {
                it(`keeps ${address} typed (dropSpecialCharacters=${dropSpecialCharacters})`, () => {
                    component.mask.set('A*@A*.A*');
                    component.dropSpecialCharacters.set(dropSpecialCharacters);
                    component.form.addValidators(Validators.required);

                    equal(address, address, fixture);
                    expect(component.form.value).equal(address);
                    expect(component.form.valid).equal(true);
                });

                it(`keeps ${address} pasted (dropSpecialCharacters=${dropSpecialCharacters})`, () => {
                    component.mask.set('A*@A*.A*');
                    component.dropSpecialCharacters.set(dropSpecialCharacters);
                    component.form.addValidators(Validators.required);

                    equal(address, address, fixture, false, Paste);
                    expect(component.form.value).equal(address);
                    expect(component.form.valid).equal(true);
                });
            }
        }

        it('still rejects a second @ and characters outside the email set', () => {
            component.mask.set('A*@A*.A*');

            equal('a@b@c.d', 'a@bc.d', fixture);
            equal('a b#c@d.e', 'abc@d.e', fixture);

            equal('.a@b.c', 'a@b.c', fixture);
            expect(component.form.value).equal('a@b.c');

            equal('a..b@c.d', 'a.b@c.d', fixture);
            expect(component.form.value).equal('a.b@c.d');
        });
    });

    // Validation half of #1515. validate() used to short-circuit to `null` whenever
    // `processedValue.length >= maskValue.indexOf(<optional key>)`; with leading
    // optional tokens indexOf() is 0, so every value passed validation even when
    // mandatory tokens were unfilled. Fixed: the early return is restricted to
    // trailing-optional layouts, and leading-optional plain-token masks are matched
    // position-aware (optional tokens skippable, mandatory tokens must be consumed).
    describe('optional tokens before mandatory ones, validation (#1515)', () => {
        it('SSS999 (trailing optional) validates correctly — control', () => {
            component.mask.set('SSS999');
            equal('ab', 'ab', fixture);
            expect(component.form.valid).equal(false);

            fixture = TestBed.createComponent(TestMaskComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            component.mask.set('SSS999');
            equal('abc', 'abc', fixture);
            expect(component.form.valid).equal(true);
        });

        it('999SSS with complete mandatory letters is valid', () => {
            component.mask.set('999SSS');
            equal('abc', 'abc', fixture);
            expect(component.form.valid).equal(true);
        });

        it('999SSS with unfilled mandatory letters is invalid', () => {
            component.mask.set('999SSS');
            equal('a', 'a', fixture);
            expect(component.form.valid).equal(false);

            fixture = TestBed.createComponent(TestMaskComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            component.mask.set('999SSS');
            equal('12a', '12a', fixture);
            expect(component.form.valid).equal(false);
        });

        it('999SSS position-aware boundaries: 12ab invalid, 12abc valid, 123abc valid', () => {
            component.mask.set('999SSS');
            equal('12ab', '12ab', fixture);
            expect(component.form.valid).equal(false);

            fixture = TestBed.createComponent(TestMaskComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            component.mask.set('999SSS');
            equal('12abc', '12abc', fixture);
            expect(component.form.valid).equal(true);

            fixture = TestBed.createComponent(TestMaskComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            component.mask.set('999SSS');
            equal('123abc', '123abc', fixture);
            expect(component.form.valid).equal(true);
        });

        describe('optional-skip matcher stays polynomial', () => {
            type OptionalSkipMatcher = {
                _matchesMaskWithOptionalSkip(value: string, mask: string): boolean;
            };
            const matcher = (): OptionalSkipMatcher =>
                fixture.debugElement
                    .query(By.directive(NgxMaskDirective))
                    .injector.get(NgxMaskDirective) as unknown as OptionalSkipMatcher;

            it('rejects a non-matching tail behind 30 optional tokens quickly', () => {
                const mask = `${'9'.repeat(30)}A`;
                const started = performance.now();
                const verdict = matcher()._matchesMaskWithOptionalSkip(`${'1'.repeat(30)}!`, mask);
                const elapsed = performance.now() - started;

                expect(verdict).toBe(false);
                expect(elapsed).toBeLessThan(50);
            });

            it('accepts a matching value behind 30 optional tokens quickly', () => {
                const mask = `${'9'.repeat(30)}A`;
                const started = performance.now();
                const verdict = matcher()._matchesMaskWithOptionalSkip(`${'1'.repeat(29)}a`, mask);
                const elapsed = performance.now() - started;

                expect(verdict).toBe(true);
                expect(elapsed).toBeLessThan(50);
            });

            it.each([
                ['999SSS', 'abc', true],
                ['999SSS', 'a', false],
                ['999SSS', '12a', false],
                ['999SSS', '12ab', false],
                ['999SSS', '12abc', true],
                ['999SSS', '123abc', true],
                ['999SSS', '1234abc', false],
            ])('keeps the %s verdict for %s -> %s', (mask, value, expected) => {
                expect(matcher()._matchesMaskWithOptionalSkip(value, mask)).toBe(expected);
            });
        });
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

describe('Directive: Mask (Validation of numeric control values)', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask({ validation: true })],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        component.mask.set('0*.00');
        component.dropSpecialCharacters.set(false);
        fixture.detectChanges();
    });

    it('does not throw for a numeric control value and agrees with the string value', () => {
        const validator = component.form.validator as (c: FormControl) => unknown;
        const numeric = new FormControl(12.5);
        const text = new FormControl('12.5');

        expect(() => validator(numeric)).not.toThrow();
        expect(validator(numeric)).toEqual(validator(text));
    });
});

describe('Directive: Mask (Validation re-runs when the mask configuration changes)', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask({ validation: true })],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
    });

    it('does not emit status changes while the inputs are bound for the first time', () => {
        component.mask.set('0000');
        const statusChanges = vi.fn();
        component.form.statusChanges.subscribe(statusChanges);

        fixture.detectChanges();

        expect(statusChanges).not.toHaveBeenCalled();
    });

    it('revalidates a filled control when [mask] becomes shorter, without typing', () => {
        component.mask.set('0000');
        fixture.detectChanges();
        equal('12', '12', fixture);
        expect(component.form.hasError('mask')).equal(true);

        component.mask.set('00');
        fixture.detectChanges();

        expect(component.form.errors).toBeNull();
    });

    it('revalidates a filled control when [mask] becomes longer, without typing', () => {
        component.mask.set('00');
        fixture.detectChanges();
        equal('12', '12', fixture);
        expect(component.form.errors).toBeNull();

        component.mask.set('0000');
        fixture.detectChanges();

        expect(component.form.hasError('mask')).equal(true);
    });

    it('revalidates against the state the new mask derives (IP verdict), not the previous one', () => {
        component.mask.set('0000');
        fixture.detectChanges();
        equal('1234', '1234', fixture);
        expect(component.form.errors).toBeNull();

        component.mask.set('IP');
        fixture.detectChanges();

        expect(component.form.errors).toEqual({
            mask: { requiredMask: 'IP', actualValue: '1234' },
        });
    });

    it('drops the sticky IP verdict when [mask] is switched to a mask the value satisfies', () => {
        component.mask.set('IP');
        fixture.detectChanges();
        typeTest('1234', fixture);
        expect(component.form.hasError('mask')).equal(true);

        component.mask.set('0000');
        fixture.detectChanges();

        expect(component.form.errors).toBeNull();
    });

    it('drops the sticky CPF/CNPJ verdict when [mask] is switched to a mask the value satisfies', () => {
        component.mask.set('CPF_CNPJ');
        fixture.detectChanges();
        equal('123', '123', fixture);
        expect(component.form.hasError('mask')).equal(true);

        component.mask.set('000');
        fixture.detectChanges();

        expect(component.form.errors).toBeNull();
    });

    it('revalidates when [validation] is switched off', () => {
        component.mask.set('0000');
        fixture.detectChanges();
        equal('12', '12', fixture);
        expect(component.form.hasError('mask')).equal(true);

        component.validation.set(false);
        fixture.detectChanges();

        expect(component.form.errors).toBeNull();
    });

    // #1763: the email verdict used a backtracking regex (polynomial ReDoS); it is now a split check.
    describe('email mask validator (#1763)', () => {
        const validate = (value: unknown): unknown => {
            component.mask.set('A*@A*.A*');
            fixture.detectChanges();
            const directive = fixture.debugElement
                .query(By.directive(NgxMaskDirective))
                .injector.get(NgxMaskDirective);

            return directive.validate({ value } as FormControl);
        };

        it('accepts a well-formed address and an empty value', () => {
            expect(validate('a@b.c')).toBeNull();
            expect(validate('')).toBeNull();
            expect(validate(null as unknown as string)).toBeNull();
        });

        it.each(['a@.bc', 'a@bc.', 'a@b@c.d', '@b.c', 'ab.c'])('rejects %s', (value) => {
            expect(validate(value)).not.toBeNull();
        });

        it('coerces a non-string truthy value like the old regex did (no throw, invalid)', () => {
            expect(validate(123)).not.toBeNull();
            expect(validate(new Event('input'))).not.toBeNull();
            expect(validate({ toString: () => 'a@b.c' })).toBeNull();
        });

        it('validates a pathological "@......" value without hanging', () => {
            const start = performance.now();

            expect(validate('@' + '.'.repeat(50000))).not.toBeNull();
            expect(performance.now() - start).toBeLessThan(1000);
        });
    });
});
