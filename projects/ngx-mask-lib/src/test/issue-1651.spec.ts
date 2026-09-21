import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestMaskComponent } from './utils/test-component.component';

// Issue #1651: separator mask + inputTransformFn that turns an empty value into '0'.
// Selecting the whole value and pressing Backspace updated the model to 0 but left the
// DOM input blank (worked in 21.0.1); deleting character by character worked.
describe('Issue #1651: select-all + Backspace with inputTransformFn on separator.2', () => {
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
        component.thousandSeparator.set(',');
        component.inputTransformFn.set((value: unknown) =>
            value === '' ? '0' : (value as string)
        );
        fixture.detectChanges();
        input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    });

    function type(value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    }

    async function selectAllAndBackspace(): Promise<void> {
        input.focus();
        input.setSelectionRange(0, input.value.length);
        const keydown = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            cancelable: true,
        });
        input.dispatchEvent(keydown);
        // Like a browser: no default deletion (and no input event) when keydown was cancelled.
        if (!keydown.defaultPrevented) {
            input.value = '';
            input.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward' }));
        }
        fixture.detectChanges();
        await fixture.whenStable();
    }

    it('shows 0 in the DOM after select-all + Backspace', async () => {
        type('1234.5');
        expect(input.value).toBe('1,234.5');

        await selectAllAndBackspace();

        expect(input.value).toBe('0');
        expect(Number(component.form.value)).toBe(0);
    });

    it('shows 0 after deleting the last remaining character', async () => {
        type('7');
        await selectAllAndBackspace();

        expect(input.value).toBe('0');
    });
});
