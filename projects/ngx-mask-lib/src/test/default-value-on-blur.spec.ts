import { Component, ChangeDetectionStrategy } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { expect } from 'vitest';

import { TestMaskComponent } from './utils/test-component.component';
import { createTriModeFixture, TRI_MODES } from './utils/tri-mode-harness';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

// Issue #1435: defaultValueOnBlur — when the control's unmasked value is empty on blur,
// the configured default is written through the regular mask pipeline (masked display +
// model propagation) while keeping the control's pristine state.
describe.each(TRI_MODES)('defaultValueOnBlur — %s mode', (mode) => {
    it('should apply the default to display and model on blur of an empty input', async () => {
        const harness = await createTriModeFixture(mode, {
            mask: '0000',
            providerOptions: { defaultValueOnBlur: '7' },
        });
        await harness.blur();
        expect(harness.getInput().value).toBe('7');
        expect(harness.getBoundValue()).toBe('7');
    });

    it('should keep the control non-dirty when the default is applied on a pristine control', async () => {
        const harness = await createTriModeFixture(mode, {
            mask: '0000',
            providerOptions: { defaultValueOnBlur: '7' },
        });
        await harness.blur();
        if (mode === 'signal') {
            // Signal Forms have no dirty/pristine concept in the harness; blur itself
            // legitimately marks the field touched (same as without the feature), so only
            // the value propagation is asserted for this mode.
            expect(harness.getBoundValue()).toBe('7');
        } else {
            expect(harness.isUserInteracted()).toBe(false);
        }
    });

    it('should not overwrite a user-typed value on blur', async () => {
        const harness = await createTriModeFixture(mode, {
            mask: '0000',
            providerOptions: { defaultValueOnBlur: '7' },
        });
        await harness.typeValue('1234');
        await harness.blur();
        expect(harness.getInput().value).toBe('1234');
        expect(harness.getBoundValue()).toBe('1234');
    });

    it('should apply the default after the user clears the value and keep the control dirty', async () => {
        const harness = await createTriModeFixture(mode, {
            mask: '0000',
            providerOptions: { defaultValueOnBlur: '7' },
        });
        await harness.typeValue('12');
        await harness.typeValue('');
        await harness.blur();
        expect(harness.getInput().value).toBe('7');
        expect(harness.getBoundValue()).toBe('7');
        // The user DID interact — the blur-time default write must not reset dirtiness.
        expect(harness.isUserInteracted()).toBe(true);
    });

    it('should keep current behavior byte-identical when the option is absent', async () => {
        const harness = await createTriModeFixture(mode, { mask: '0000' });
        await harness.blur();
        expect(harness.getInput().value).toBe('');
        expect(harness.getBoundValue()).toBe('');
    });

    it('should render the default with prefix and suffix', async () => {
        const harness = await createTriModeFixture(mode, {
            mask: '000',
            prefix: '+',
            suffix: ' $',
            providerOptions: { defaultValueOnBlur: '5' },
        });
        await harness.blur();
        expect(harness.getInput().value).toBe('+5 $');
        expect(harness.getBoundValue()).toBe('5');
    });

    it('should fill the first slot and keep the skeleton with showMaskTyped', async () => {
        // Pinned interplay: the default wins over the empty skeleton — the masked default
        // occupies the leading slots and the placeholder skeleton covers the rest.
        const harness = await createTriModeFixture(mode, {
            mask: '0000',
            showMaskTyped: true,
            providerOptions: { defaultValueOnBlur: '9' },
        });
        await harness.blur();
        expect(harness.getInput().value).toBe('9___');
        expect(harness.getBoundValue()).toBe('9');
    });

    it('should apply a multi-character default through the mask', async () => {
        const harness = await createTriModeFixture(mode, {
            mask: '00-00',
            providerOptions: { defaultValueOnBlur: '0000' },
        });
        await harness.blur();
        expect(harness.getInput().value).toBe('00-00');
        expect(harness.getBoundValue()).toBe('0000');
    });
});

describe('defaultValueOnBlur — interplay pins (reactive mode)', () => {
    it('should let clearIfNotMatch clear a default that does not fill the mask', async () => {
        // Pinned interplay: the default is written first, then clearIfNotMatchFn runs on
        // the same blur pass. A default shorter than the mask fails the length match and
        // is cleared again — clearIfNotMatch wins. Weird-but-harmless: the net effect is
        // "no default"; misconfiguration (short default + clearIfNotMatch) fails closed.
        const harness = await createTriModeFixture('reactive', {
            mask: '0000',
            providerOptions: { defaultValueOnBlur: '7', clearIfNotMatch: true },
        });
        await harness.blur();
        expect(harness.getInput().value).toBe('');
        expect(harness.getBoundValue()).toBe('');
    });

    it('should keep a default that fully fills the mask despite clearIfNotMatch', async () => {
        const harness = await createTriModeFixture('reactive', {
            mask: '0000',
            providerOptions: { defaultValueOnBlur: '1234', clearIfNotMatch: true },
        });
        await harness.blur();
        expect(harness.getInput().value).toBe('1234');
        expect(harness.getBoundValue()).toBe('1234');
    });

    it('should not apply the default when the user leaves a partial value', async () => {
        const harness = await createTriModeFixture('reactive', {
            mask: '0000',
            providerOptions: { defaultValueOnBlur: '7777' },
        });
        await harness.typeValue('12');
        await harness.blur();
        expect(harness.getInput().value).toBe('12');
        expect(harness.getBoundValue()).toBe('12');
    });

    it('should not crash when the default does not fit the mask (letters on separator)', async () => {
        // Pinned: 'abc' has no digit the separator mask can consume — applyMask renders
        // nothing, so blur leaves the input and model empty. No crash, no loop.
        const harness = await createTriModeFixture('reactive', {
            mask: 'separator.2',
            providerOptions: { defaultValueOnBlur: 'abc' },
        });
        await harness.blur();
        expect(harness.getInput().value).toBe('');
        expect(harness.getBoundValue()).toBe('');
    });
});

@Component({
    selector: 'ngxd-default-value-input-test',
    imports: [ReactiveFormsModule, NgxMaskDirective],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input id="mask" mask="0000" [defaultValueOnBlur]="'9'" [formControl]="form" />`,
})
class DefaultValueInputComponent {
    public readonly form = new FormControl<string | null>('');
}

describe('defaultValueOnBlur — directive input precedence', () => {
    it('should prefer the directive input over the DI config value', async () => {
        TestBed.configureTestingModule({
            imports: [DefaultValueInputComponent],
            providers: [provideNgxMask({ defaultValueOnBlur: '1' })],
        });
        const fixture = TestBed.createComponent(DefaultValueInputComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        input.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe('9');
        expect(fixture.componentInstance.form.value).toBe('9');
        expect(fixture.componentInstance.form.pristine).toBe(true);
    });
});

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
