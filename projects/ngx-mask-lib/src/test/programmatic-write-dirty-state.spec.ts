import { NgForm } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import {
    SignalFormSeparatorHost,
    WrapperNgFormHost,
    WrapperUpdateOnBlurHost,
} from './utils/programmatic-write-hosts';

describe('Programmatic writes keep the form pristine (#1695)', () => {
    it('a forwarding wrapper on an updateOn blur control stays pristine through the blur', async () => {
        const fixture = TestBed.createComponent(WrapperUpdateOnBlurHost);
        fixture.detectChanges();
        const { amount } = fixture.componentInstance;

        amount.setValue('10.2');
        fixture.detectChanges();
        await fixture.whenStable();
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
        input.dispatchEvent(new Event('focus'));
        input.dispatchEvent(new Event('blur'));
        fixture.detectChanges();

        expect(input.value).toBe('10.20');
        expect(amount.value).toBe('10.20');
        expect(amount.pristine).toBe(true);
    });

    it('a forwarding wrapper in an ngForm leaves the form pristine', async () => {
        const fixture = TestBed.createComponent(WrapperNgFormHost);
        fixture.detectChanges();
        await fixture.whenStable();
        const ngForm = fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);

        fixture.componentInstance.amount.set('10.2');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.nativeElement.querySelector('input').value).toBe('10.20');
        expect(ngForm.control.get('amount')?.pristine).toBe(true);
        expect(ngForm.pristine).toBe(true);
    });

    it('a Signal Forms field on separator.2 stays pristine, typing still dirties it (#1695)', async () => {
        const fixture = TestBed.createComponent(SignalFormSeparatorHost);
        fixture.detectChanges();
        const { tree } = fixture.componentInstance;
        const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

        fixture.componentInstance.data.set({ amount: '10.2' });
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(input.value).toBe('10.2');
        expect(tree.amount().dirty()).toBe(false);
        expect(tree().dirty()).toBe(false);

        input.value = '10.25';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(tree.amount().dirty()).toBe(true);
        expect(tree().dirty()).toBe(true);
    });
});
