import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { edit as editInput } from './utils/edit-harness';
import { TestMaskComponent } from './utils/test-component.component';
import { provideNgxMask, NgxMaskDirective } from 'ngx-mask';

// A rejected key keeps the caret (#1746), a keyless insert keeps the showMaskTyped suffix
// (#1749), a hiddenInput selection edit and paste splice the real value (#1750, #1752).
// Browser twin: input-edits.browser-spec.ts.
describe('Directive: Mask (input edits)', () => {
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

    async function setup(config: (c: TestMaskComponent) => void, value: string): Promise<void> {
        config(component);
        fixture.detectChanges();
        component.form.setValue(value);
        fixture.detectChanges();
        await fixture.whenStable();
        input().focus();
    }

    function typeHidden(digits: string): void {
        component.mask.set('XXX-XX-0000');
        component.hiddenInput.set(true);
        fixture.detectChanges();
        input().focus();
        for (const c of digits) {
            edit(c, 'insertText', true);
        }
    }

    it('#1746 keeps the caret after a rejected letter on a non-separator mask', async () => {
        await setup((c) => c.mask.set('000-000'), '123456');
        const el = input();
        el.setSelectionRange(2, 2);
        edit('a', 'insertText', true);

        expect(el.value).toBe('123-456');
        expect(el.selectionStart).toBe(2);
    });

    it('#1749 keeps the suffix after a keyless insert with showMaskTyped', async () => {
        await setup((c) => {
            c.mask.set('0 000');
            c.suffix.set('$');
            c.showMaskTyped.set(true);
            c.keepCharacterPositions.set(true);
        }, '1234');
        const el = input();
        expect(el.value).toBe('1 234$');
        el.setSelectionRange(6, 6);
        edit('9', 'insertText');

        expect(el.value).toBe('1 234$');
    });

    it('#1749 keeps the suffix after a keyless insert into the placeholders', async () => {
        await setup((c) => {
            c.mask.set('0 000');
            c.suffix.set('$');
            c.showMaskTyped.set(true);
            c.keepCharacterPositions.set(true);
        }, '12');
        const el = input();
        expect(el.value).toBe('1 2__$');
        el.setSelectionRange(5, 5);
        edit('9', 'insertText');

        expect(el.value.endsWith('$')).toBe(true);
    });

    it('#1750 replaces the selection of a hiddenInput on a keyless edit', () => {
        typeHidden('12345');
        const el = input();
        el.setSelectionRange(1, 3);
        edit('9', 'insertText');

        expect(component.form.value).toBe('1945');
    });

    it('#1750 replaces the selection of a hiddenInput on a typed key', () => {
        typeHidden('12345');
        const el = input();
        el.setSelectionRange(0, 2);
        edit('9', 'insertText', true);

        expect(component.form.value).toBe('9345');
    });

    it('#1752 adds a hiddenInput + showMaskTyped paste to the real value', () => {
        component.showMaskTyped.set(true);
        typeHidden('12');
        edit('345', 'insertFromPaste');

        expect(component.form.value).toBe('12345');
        expect(input().value).not.toContain('3');
    });
});
