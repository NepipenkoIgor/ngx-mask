import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import type { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { expect, vi } from 'vitest';

import { TestMaskComponent } from './utils/test-component.component';
import { typeTest } from './utils/test-functions.component';
import { provideNgxMask, NgxMaskDirective } from 'ngx-mask';

describe('Directive: Mask (selection editing)', () => {
    let fixture: ComponentFixture<TestMaskComponent>;
    let component: TestMaskComponent;
    let debugElement: DebugElement;
    let inputTarget: HTMLInputElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, NgxMaskDirective, TestMaskComponent],
            providers: [provideNgxMask()],
        });
        fixture = TestBed.createComponent(TestMaskComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        debugElement = fixture.debugElement.query(By.css('input'));
        inputTarget = debugElement.nativeElement as HTMLInputElement;
        vi.spyOn(document, 'activeElement', 'get').mockReturnValue(inputTarget);
    });

    // Simulates a real browser edit while a range [start, end) is selected:
    // keydown fires with the selection still present, then — unless the handler
    // prevented the default action — the browser replaces/deletes the selection
    // and the input event fires.
    function editSelection(start: number, end: number, key: string | null): void {
        inputTarget.setSelectionRange(start, end);
        let defaultPrevented = false;
        debugElement.triggerEventHandler('keydown', {
            code: key === null ? 'Backspace' : `Key${key.toUpperCase()}`,
            key: key === null ? 'Backspace' : key,
            target: inputTarget,
            preventDefault: () => {
                defaultPrevented = true;
            },
        });
        if (defaultPrevented) {
            fixture.detectChanges();
            return;
        }
        const insert = key ?? '';
        inputTarget.value =
            inputTarget.value.slice(0, start) + insert + inputTarget.value.slice(end);
        const caret = start + insert.length;
        inputTarget.setSelectionRange(caret, caret);
        debugElement.triggerEventHandler('input', { target: inputTarget });
        fixture.detectChanges();
    }

    describe('literal asterisk in the value (#1504)', () => {
        beforeEach(() => {
            component.mask.set('VVVV');
            component.patterns.set({ V: { pattern: /[\w\-*]/, optional: true } });
            fixture.detectChanges();
        });

        it('should replace a selected character when the value contains *', () => {
            typeTest('123*', fixture);
            expect(inputTarget.value).toBe('123*');

            // select the '3' and type '2' over it
            editSelection(2, 3, '2');

            expect(inputTarget.value).toBe('122*');
            expect(component.form.value).toBe('122*');
        });

        it('should delete a selected character when the value contains *', () => {
            typeTest('123*', fixture);

            // select the '3' and press Backspace
            editSelection(2, 3, null);

            expect(inputTarget.value).toBe('12*');
            expect(component.form.value).toBe('12*');
        });

        it('should replace a multi-character selection when the value contains *', () => {
            typeTest('123*', fixture);

            // select '23' and type '9' over it
            editSelection(1, 3, '9');

            expect(inputTarget.value).toBe('19*');
            expect(component.form.value).toBe('19*');
        });
    });

    describe('select-all + single Backspace clears display and model (#1350)', () => {
        it('should clear both view and model with one backspace', () => {
            component.mask.set('000');
            fixture.detectChanges();
            typeTest('444', fixture);
            expect(inputTarget.value).toBe('444');

            editSelection(0, inputTarget.value.length, null);

            expect(inputTarget.value).toBe('');
            expect(component.form.value === '' || component.form.value === null).toBe(true);
        });

        it('should clear both view and model with one backspace with a prefix', () => {
            component.mask.set('000');
            component.prefix.set('$');
            fixture.detectChanges();
            typeTest('444', fixture);
            expect(inputTarget.value).toBe('$444');

            editSelection(0, inputTarget.value.length, null);

            expect(inputTarget.value).toBe('');
            expect(component.form.value === '' || component.form.value === null).toBe(true);
        });
    });

    describe('one-character prefix, edit with the caret at 1 (#1719)', () => {
        it('should type the next digit into the slot a delete freed after the prefix', () => {
            component.mask.set('0000');
            component.prefix.set('$');
            fixture.detectChanges();
            typeTest('1234', fixture);
            expect(inputTarget.value).toBe('$1234');

            editSelection(1, 2, null);
            expect(inputTarget.value).toBe('$234');
            // The next key lands where the delete left the caret, not where the test puts it.
            const caret = inputTarget.selectionStart as number;
            editSelection(caret, caret, '5');

            expect(inputTarget.value).toBe('$5234');
        });
    });
});
