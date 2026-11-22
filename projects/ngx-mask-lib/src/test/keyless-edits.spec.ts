import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { edit as editInput } from './utils/edit-harness';
import { TestMaskComponent } from './utils/test-component.component';
import { provideNgxMask, NgxMaskDirective } from 'ngx-mask';

// Edits that arrive without a keydown (IME, dictation, autofill, execCommand, a context-menu
// paste) must not reuse the previous key's code or selection (#1709), a paste in the middle of
// a fixed mask leaves the caret after the pasted run (#1703) and a hiddenInput paste is added
// to the real value, not to the asterisks (#1702). Browser twin: keyless-edits.browser-spec.ts.
describe('Directive: Mask (keyless edits)', () => {
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

    const input = (): HTMLInputElement => fixture.nativeElement.querySelector('input');

    function edit(data: string, inputType: string, keydown = false): void {
        editInput(input(), data, inputType, keydown);
        fixture.detectChanges();
    }

    function keyDown(key: string): void {
        input().dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }));
    }

    async function setup(config: (c: TestMaskComponent) => void, value: string): Promise<void> {
        config(component);
        fixture.detectChanges();
        component.form.setValue(value);
        fixture.detectChanges();
        await fixture.whenStable();
        input().focus();
    }

    it('#1709 inserts over a selection without reusing the last key (kCP, no smt)', async () => {
        await setup((c) => {
            c.mask.set('000-000');
            c.keepCharacterPositions.set(true);
        }, '123456');
        const el = input();
        el.setSelectionRange(3, 7);
        keyDown('Backspace');
        el.value = '123';
        el.setSelectionRange(3, 3);
        el.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward' }));
        fixture.detectChanges();
        input().dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', bubbles: true }));
        edit('9', 'insertText');

        expect(el.value).toBe('123-9');
        expect(component.form.value).toBe('1239');
    });

    it('#1709 replaces a selection with an insertText edit (kCP, smt)', async () => {
        await setup((c) => {
            c.mask.set('(000) 000-0000');
            c.keepCharacterPositions.set(true);
            c.showMaskTyped.set(true);
        }, '0123456789');
        const el = input();
        expect(el.value).toBe('(012) 345-6789');
        el.setSelectionRange(1, 3);
        edit('5', 'insertText');

        expect(el.value).toBe('(5_2) 345-6789');
        expect(el.selectionStart).toBe(2);
    });

    it('#1709 treats an edit after a keydown whose keyup never came (blur) as keyless', async () => {
        await setup((c) => {
            c.mask.set('(000) 000-0000');
            c.keepCharacterPositions.set(true);
            c.showMaskTyped.set(true);
        }, '0123456789');
        const el = input();
        keyDown('Backspace');
        el.dispatchEvent(new FocusEvent('blur'));
        el.focus();
        el.setSelectionRange(1, 3);
        edit('5', 'insertText');

        expect(el.value).toBe('(5_2) 345-6789');
    });

    it('#1703 leaves the caret after a paste in the middle of a fixed mask', async () => {
        await setup((c) => c.mask.set('0000-0000'), '12345');
        const el = input();
        expect(el.value).toBe('1234-5');
        el.setSelectionRange(1, 1);
        edit('99', 'insertFromPaste');

        expect(el.value).toBe('1992-345');
        expect(component.form.value).toBe('1992345');
        expect(el.selectionStart).toBe(3);
    });

    it('#1702 adds a hiddenInput paste to the real value', async () => {
        component.mask.set('XXX-XX-0000');
        component.hiddenInput.set(true);
        fixture.detectChanges();
        const el = input();
        el.focus();
        for (const c of '12') {
            keyDown(c);
            edit(c, 'insertText');
        }
        edit('345', 'insertFromPaste');

        expect(component.form.value).toBe('12345');
        expect(el.value).toBe('***-**');
    });

    it('#1702 keeps every digit of a bulk insertion after three typed characters', () => {
        component.mask.set('XXX-XX-0000');
        component.hiddenInput.set(true);
        fixture.detectChanges();
        const el = input();
        el.focus();
        for (const c of '123') {
            edit(c, 'insertText');
        }
        edit('456789', 'insertText');

        expect(component.form.value).toBe('123456789');
    });
});
