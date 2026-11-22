import { userEvent } from 'vitest/browser';
import { copyToClipboard, mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

// The directive binds its DOM listeners through `host: {}`; these specs drive every one of them with
// real browser events (real keyboard, focus, click) and read what the user sees.
describe('Directive: host listeners (real browser events)', () => {
    describe('input', () => {
        it('masks each typed character and keeps the caret after it', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '(000) 000-0000' });

            await m.type('#masked', '12312');

            expect(m.get('#masked').value).toBe('(123) 12');
            expect(m.get('#masked').selectionStart).toBe(8);
            expect(m.text('#pre1')).toBe('12312');
        });

        it('ignores characters the mask does not accept', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '00-00' });

            await m.type('#masked', '1a2b3c4');

            expect(m.get('#masked').value).toBe('12-34');
        });
    });

    describe('keydown', () => {
        it('Backspace removes a trailing literal and then digits one at a time', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '00/00/0000' });

            await m.type('#masked', '1234');
            expect(m.get('#masked').value).toBe('12/34');
            await m.type('#masked', '{Backspace}');
            expect(m.get('#masked').value).toBe('12/3');
            await m.type('#masked', '{Backspace}');
            expect(m.get('#masked').value).toBe('12/');
            await m.type('#masked', '{Backspace}');
            expect(m.get('#masked').value).toBe('12');
            await m.type('#masked', '{Backspace}');

            expect(m.get('#masked').value).toBe('1');
        });

        it('Delete removes the digit after the caret', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '000-000' });

            await m.type('#masked', '123456');
            m.select('#masked', 0, 0);
            await m.type('#masked', '{Delete}');

            expect(m.get('#masked').value).toBe('234-56');
            expect(m.text('#pre1')).toBe('23456');
        });

        it('Delete in the middle keeps the remaining digits aligned to the mask', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '00/00/0000' });

            await m.type('#masked', '12345678');
            m.select('#masked', 3, 3);
            await m.type('#masked', '{Delete}');

            expect(m.get('#masked').value).toBe('12/45/678');
        });

        it('ArrowLeft moves the caret without changing the value', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '00-00' });

            await m.type('#masked', '1234');
            await m.type('#masked', '{ArrowLeft}{ArrowLeft}');

            expect(m.get('#masked').value).toBe('12-34');
            expect(m.get('#masked').selectionStart).toBe(3);
            expect(m.text('#pre1')).toBe('1234');
        });

        it('ArrowLeft then typing inserts at the caret and re-applies the mask', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '00-00' });

            await m.type('#masked', '123');
            await m.type('#masked', '{ArrowLeft}{ArrowLeft}9');

            expect(m.get('#masked').value).toBe('12-93');
        });

        it('ArrowRight at the end keeps the value and the caret in place', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '00-00' });

            await m.type('#masked', '1234');
            await m.type('#masked', '{ArrowRight}');

            expect(m.get('#masked').value).toBe('12-34');
            expect(m.get('#masked').selectionStart).toBe(5);
        });
    });

    describe('click', () => {
        it('places the caret after the leading literal of an empty showMaskTyped field', async () => {
            const m = await mount(MaskHarnessComponent, {
                mask: '(000) 000-0000',
                showMaskTyped: true,
            });

            await m.click('#masked');

            expect(m.get('#masked').value).toBe('(___) ___-____');
            expect(m.get('#masked').selectionStart).toBe(1);
        });

        it('places the caret after a prefix when an empty field is clicked', async () => {
            const m = await mount(MaskHarnessComponent, {
                mask: '000 000',
                prefix: '+7 ',
                showMaskTyped: true,
            });

            await m.click('#masked');

            expect(m.get('#masked').selectionStart).toBe(3);
        });
    });

    describe('focus and blur', () => {
        it('showMaskTyped shows the placeholder skeleton on focus and the control stays empty', async () => {
            const m = await mount(MaskHarnessComponent, {
                mask: '00-00',
                showMaskTyped: true,
            });

            m.focus('#masked');
            await m.settle();
            expect(m.get('#masked').value).toBe('__-__');

            await m.blur('#masked');
            // The skeleton stays after blur (pinned by show-mask-typed-initial-value); nothing was typed,
            // so the control stays empty.
            expect(m.get('#masked').value).toBe('__-__');
            expect(m.text('#pre1')).toBe('');
        });

        it('showMaskTyped keeps the typed value and the skeleton after blur', async () => {
            const m = await mount(MaskHarnessComponent, {
                mask: '00-00',
                showMaskTyped: true,
            });

            await m.type('#masked', '12');
            expect(m.get('#masked').value).toBe('12-__');
            await m.blur('#masked');

            expect(m.get('#masked').value).toBe('12-__');
        });

        it('leadZero pads the decimals on blur and propagates the padded value', async () => {
            const m = await mount(MaskHarnessComponent, { mask: 'separator.2', leadZero: true });

            await m.type('#masked', '5');
            await m.blur('#masked');

            expect(m.get('#masked').value).toBe('5.00');
            expect(m.text('#pre1')).toBe('5.00');
        });

        it('leadZero pads a single typed decimal on blur', async () => {
            const m = await mount(MaskHarnessComponent, { mask: 'separator.2', leadZero: true });

            await m.type('#masked', '1234.5');
            await m.blur('#masked');

            expect(m.get('#masked').value).toBe('1,234.50');
        });

        it('leaves an empty separator field empty on blur', async () => {
            const m = await mount(MaskHarnessComponent, { mask: 'separator.2', leadZero: true });

            m.focus('#masked');
            await m.blur('#masked');

            expect(m.get('#masked').value).toBe('');
        });
    });

    describe('paste', () => {
        // A real paste: the text goes through the browser clipboard (copy from a scratch input, then
        // paste into the masked one), so the directive's `(paste)` host listener really fires.
        const paste = async (
            m: Awaited<ReturnType<typeof mount<MaskHarnessComponent>>>,
            text: string
        ): Promise<void> => {
            await copyToClipboard(text);
            const input = m.get('#masked');
            input.focus();
            await userEvent.paste();
            await m.settle();
        };

        it('formats a pasted raw value with the mask', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '(000) 000-0000' });

            await paste(m, '1231231234');

            expect(m.get('#masked').value).toBe('(123) 123-1234');
            expect(m.text('#pre1')).toBe('1231231234');
        });

        it('strips characters the mask rejects from a pasted value', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '000-000' });

            await paste(m, '12 a 34-56x');

            expect(m.get('#masked').value).toBe('123-456');
        });

        it('lands the caret after a pasted raw value that does not carry the prefix', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '000000', prefix: '+7 ' });

            await paste(m, '123456');

            expect(m.get('#masked').value).toBe('+7 123456');
            expect(m.get('#masked').selectionStart).toBe(9);
        });

        it('truncates a pasted value longer than the mask', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '0000' });

            await paste(m, '1234567');

            expect(m.get('#masked').value).toBe('1234');
        });
    });

    describe('IME composition', () => {
        const compose = (input: HTMLInputElement, text: string): void => {
            input.value = text;
            input.dispatchEvent(
                new InputEvent('input', {
                    bubbles: true,
                    data: text,
                    inputType: 'insertCompositionText',
                    isComposing: true,
                })
            );
        };

        it('waits for compositionend before masking a letter mask', async () => {
            const m = await mount(MaskHarnessComponent, { mask: 'AAAA' });
            const input = m.get('#masked');
            input.focus();

            input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
            compose(input, 'ab');
            compose(input, 'abcd');
            await m.settle();
            expect(m.component.counter()).toBe(0);
            expect(m.text('#pre1')).toBe('');

            input.dispatchEvent(
                new CompositionEvent('compositionend', { bubbles: true, data: 'abcd' })
            );
            await m.settle();

            expect(input.value).toBe('abcd');
            expect(m.text('#pre1')).toBe('abcd');
        });

        it('applies the mask to the composed text on compositionend', async () => {
            const m = await mount(MaskHarnessComponent, { mask: 'AA-AA' });
            const input = m.get('#masked');
            input.focus();

            input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
            compose(input, 'abcd');
            input.dispatchEvent(
                new CompositionEvent('compositionend', { bubbles: true, data: 'abcd' })
            );
            await m.settle();

            expect(input.value).toBe('ab-cd');
        });

        it('processes numeric masks live during composition', async () => {
            const m = await mount(MaskHarnessComponent, { mask: '00-00' });
            const input = m.get('#masked');
            input.focus();

            input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
            compose(input, '1234');
            await m.settle();

            expect(input.value).toBe('12-34');
            expect(m.text('#pre1')).toBe('1234');
            input.dispatchEvent(
                new CompositionEvent('compositionend', { bubbles: true, data: '1234' })
            );
            await m.settle();
            expect(input.value).toBe('12-34');
        });
    });
});
