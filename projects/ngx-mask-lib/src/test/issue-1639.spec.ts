import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestMaskComponent } from './utils/test-component.component';

// Issue #1639: typing 1 and blurring shows "1,000". The repro config (percent.3, decimal marker
// ',', leadZero) is inferred from the linked Stackblitz, not confirmed by the reporter.
// With that config this is the documented leadZero behavior, not a bug: leadZero pads the
// decimal part to the mask precision on blur, and with a comma decimal marker "1,000" is the
// number 1 with three zero decimals (not one thousand); the model is the dot-decimal '1.000'.
// Pinned here so a change is deliberate.
describe('Issue #1639: leadZero pads decimals on blur (works as designed)', () => {
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
        component.decimalMarker.set(',');
        component.leadZero.set(true);
        fixture.detectChanges();
        input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    });

    function typeAndBlur(value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        input.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
    }

    it('percent.3: "1" becomes "1,000" (one, three zero decimals)', () => {
        component.mask.set('percent.3');
        typeAndBlur('1');
        expect(input.value).toBe('1,000');
        expect(component.form.value).toBe('1.000');
    });

    it('separator.3 behaves identically', () => {
        component.mask.set('separator.3');
        typeAndBlur('1');
        expect(input.value).toBe('1,000');
    });

    it('without leadZero nothing is padded', () => {
        component.leadZero.set(false);
        component.mask.set('percent.3');
        typeAndBlur('1');
        expect(input.value).toBe('1');
        expect(component.form.value).toBe('1');
    });
});
