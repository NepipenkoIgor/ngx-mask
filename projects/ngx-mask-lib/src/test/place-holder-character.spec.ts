import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { TestMaskComponent } from './utils/test-component.component';
import { equal, typeTest } from './utils/test-functions.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { afterEach, expect, vi } from 'vitest';

describe('Directive: Mask (Placeholder character)', () => {
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

    it('should display the default placeholder when not configured', () => {
        component.mask.set('(000) 000-0000');
        component.showMaskTyped.set(true);
        equal('', '(___) ___-____', fixture);
        equal('2345678', '(234) 567-8___', fixture);

        component.prefix.set('+7');
        component.showMaskTyped.set(true);
        equal('', '+7(___) ___-____', fixture);
        equal('2345678', '+7(234) 567-8___', fixture);

        component.mask.set('IP');
        component.prefix.set('');
        component.showMaskTyped.set(true);
        equal('', '_._._._', fixture);
        equal('1921681', '192.168.1_', fixture);

        component.mask.set('CPF_CNPJ');
        component.prefix.set('');
        component.showMaskTyped.set(true);
        equal('', '___.___.___-__', fixture);
        equal('1', '1__.___.___-__', fixture);
        equal('12', '12_.___.___-__', fixture);
        equal('123', '123.___.___-__', fixture);
        equal('1234', '123.4__.___-__', fixture);
        equal('12345', '123.45_.___-__', fixture);
        equal('123456', '123.456.___-__', fixture);
        equal('1234567', '123.456.7__-__', fixture);
        equal('12345678', '123.456.78_-__', fixture);
        equal('123456789', '123.456.789-__', fixture);
        equal('1234567890', '123.456.789-0_', fixture);
        equal('12345678901', '123.456.789-01', fixture);
        equal('123456789012', '12.345.678/9012-__', fixture);
        equal('1234567890123', '12.345.678/9012-3_', fixture);
        equal('12345678901234', '12.345.678/9012-34', fixture);

        component.mask.set('CPF_CNPJ_ALPHA');
        component.prefix.set('');
        component.showMaskTyped.set(true);
        equal('', '___.___.___-__', fixture);
        equal('A', 'A_.___.___/____-__', fixture);
        equal('AB', 'AB.___.___/____-__', fixture);
        equal('ABC', 'AB.C__.___/____-__', fixture);
        equal('ABCD', 'AB.CD_.___/____-__', fixture);
        equal('ABCDE', 'AB.CDE.___/____-__', fixture);
        equal('ABCDEF', 'AB.CDE.F__/____-__', fixture);
        equal('ABCDEF0', 'AB.CDE.F0_/____-__', fixture);
        equal('ABCDEF01', 'AB.CDE.F01/____-__', fixture);
        equal('ABCDEF012', 'AB.CDE.F01/2___-__', fixture);
        equal('ABCDEF0123', 'AB.CDE.F01/23__-__', fixture);
        equal('ABCDEF01234', 'AB.CDE.F01/234_-__', fixture);
        equal('ABCDEF012345', 'AB.CDE.F01/2345-__', fixture);
        equal('ABCDEF0123456', 'AB.CDE.F01/2345-6_', fixture);
        equal('ABCDEF01234567', 'AB.CDE.F01/2345-67', fixture);

        component.mask.set('000.000.000-00||00.000.000/0000-00');
        component.prefix.set('');
        component.showMaskTyped.set(true);
        equal('1', '1__.___.___-__', fixture);
        equal('12', '12_.___.___-__', fixture);
        equal('123', '123.___.___-__', fixture);
        equal('1234', '123.4__.___-__', fixture);
        equal('12345', '123.45_.___-__', fixture);
        equal('123456', '123.456.___-__', fixture);
        equal('1234567', '123.456.7__-__', fixture);
        equal('12345678', '123.456.78_-__', fixture);
        equal('123456789', '123.456.789-__', fixture);
        equal('1234567890', '123.456.789-0_', fixture);
        equal('12345678901', '123.456.789-01', fixture);
        equal('123456789012', '12.345.678/9012-__', fixture);
        equal('1234567890123', '12.345.678/9012-3_', fixture);
        equal('12345678901234', '12.345.678/9012-34', fixture);

        component.mask.set('(00) 0000-0000||(00) 0 0000-0000');
        component.prefix.set('');
        component.showMaskTyped.set(true);
        equal('1', '(1_) ____-____', fixture);
        equal('12', '(12) ____-____', fixture);
        equal('123', '(12) 3___-____', fixture);
        equal('1234', '(12) 34__-____', fixture);
        equal('12345', '(12) 345_-____', fixture);
        equal('123456', '(12) 3456-____', fixture);
        equal('1234567', '(12) 3456-7___', fixture);
        equal('12345678', '(12) 3456-78__', fixture);
        equal('123456789', '(12) 3456-789_', fixture);
        equal('1234567890', '(12) 3456-7890', fixture);
        equal('12345678901', '(12) 3 4567-8901', fixture);
        equal('(1', '(1_) ____-____', fixture);
        equal('(12', '(12) ____-____', fixture);
        equal('(12)', '(12) ____-____', fixture);
        equal('(12) 3', '(12) 3___-____', fixture);
        equal('(12) 34', '(12) 34__-____', fixture);
        equal('(12) 345', '(12) 345_-____', fixture);
        equal('(12) 3456', '(12) 3456-____', fixture);
        equal('(12) 3456-7', '(12) 3456-7___', fixture);
        equal('(12) 3456-78', '(12) 3456-78__', fixture);
        equal('(12) 3456-789', '(12) 3456-789_', fixture);
        equal('(12) 3456-7890', '(12) 3456-7890', fixture);
        equal('(12) 3 4567-8901', '(12) 3 4567-8901', fixture);
    });

    it('should display the modified placeholder when configured', () => {
        component.mask.set('(000) 000-0000');
        component.showMaskTyped.set(true);
        component.placeHolderCharacter.set('*');
        equal('', '(***) ***-****', fixture);
        equal('2345678', '(234) 567-8***', fixture);

        component.prefix.set('+7');
        component.showMaskTyped.set(true);
        equal('', '+7(***) ***-****', fixture);
        equal('2345678', '+7(234) 567-8***', fixture);

        component.mask.set('IP');
        component.prefix.set('');
        component.showMaskTyped.set(true);
        equal('', '*.*.*.*', fixture);
        equal('1921681', '192.168.1*', fixture);

        component.mask.set('CPF_CNPJ');
        component.prefix.set('');
        component.showMaskTyped.set(true);
        equal('', '***.***.***-**', fixture);
        equal('1', '1**.***.***-**', fixture);
        equal('12', '12*.***.***-**', fixture);
        equal('123', '123.***.***-**', fixture);
        equal('1234', '123.4**.***-**', fixture);
        equal('12345', '123.45*.***-**', fixture);
        equal('123456', '123.456.***-**', fixture);
        equal('1234567', '123.456.7**-**', fixture);
        equal('12345678', '123.456.78*-**', fixture);
        equal('123456789', '123.456.789-**', fixture);
        equal('1234567890', '123.456.789-0*', fixture);
        equal('12345678901', '123.456.789-01', fixture);
        equal('123456789012', '12.345.678/9012-**', fixture);
        equal('1234567890123', '12.345.678/9012-3*', fixture);
        equal('12345678901234', '12.345.678/9012-34', fixture);
    });

    describe('multi-character placeHolderCharacter (#1347)', () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should warn once when a multi-character placeHolderCharacter is configured with keepCharacterPositions', () => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            component.mask.set('dd-mm-yyyy');
            component.showMaskTyped.set(true);
            component.keepCharacterPositions.set(true);
            component.placeHolderCharacter.set('dd-mm-yyyy');
            fixture.detectChanges();

            expect(warnSpy).toHaveBeenCalledTimes(1);
            expect(warnSpy.mock.calls[0]?.[0]).toContain(
                'placeHolderCharacter should be a single character'
            );

            // Setting the same value again must not re-warn.
            component.placeHolderCharacter.set('dd-mm-yyyy');
            fixture.detectChanges();
            expect(warnSpy).toHaveBeenCalledTimes(1);
        });

        it('should not warn for a single-character placeHolderCharacter', () => {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            component.mask.set('(000) 000-0000');
            component.showMaskTyped.set(true);
            component.placeHolderCharacter.set('*');
            fixture.detectChanges();

            expect(warnSpy).not.toHaveBeenCalled();
        });
    });

    describe('non-special placeHolderCharacter must never leak into the model (#1519)', () => {
        it('should not include a partially-typed non-special placeholder character in the model', () => {
            component.mask.set('(000) 000-0000');
            component.showMaskTyped.set(true);
            component.placeHolderCharacter.set('X');
            fixture.detectChanges();

            typeTest('234', fixture);

            expect(component.form.value).toEqual('234');
        });

        it('should not include the placeholder character in the model when nothing was typed', () => {
            component.mask.set('(000) 000-0000');
            component.showMaskTyped.set(true);
            component.placeHolderCharacter.set('X');
            fixture.detectChanges();

            typeTest('', fixture);

            expect(component.form.value).toEqual('');
        });

        it('should still drop the default underscore placeholder from the model (no regression)', () => {
            component.mask.set('(000) 000-0000');
            component.showMaskTyped.set(true);
            fixture.detectChanges();

            typeTest('234', fixture);

            expect(component.form.value).toEqual('234');
        });
    });
});

// Issue #1643: `[placeHolderCharacter]="null"` threw once a character was typed.
describe('Issue #1643: null placeHolderCharacter', () => {
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

    it('does not throw and formats the value', () => {
        component.mask.set('0000SS');
        component.placeHolderCharacter.set(null);
        expect(() => equal('1234AB', '1234AB', fixture)).not.toThrow();
    });

    it('formats partial input', () => {
        component.mask.set('0000SS');
        component.placeHolderCharacter.set(null);
        equal('12', '12', fixture);
    });

    it('works with showMaskTyped', () => {
        component.mask.set('0000SS');
        component.placeHolderCharacter.set(null);
        component.showMaskTyped.set(true);
        expect(() => equal('12', '12____', fixture)).not.toThrow();
    });
});
