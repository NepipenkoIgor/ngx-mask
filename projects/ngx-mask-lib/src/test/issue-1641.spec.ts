import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestMaskComponent } from './utils/test-component.component';

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
