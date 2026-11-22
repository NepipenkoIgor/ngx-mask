import { mount } from './utils/browser-harness';
import { userEvent } from 'vitest/browser';
import type { DemoExample, DemoModel } from './utils/demo-bindings-harness.component';
import { DemoBindingsHarnessComponent } from './utils/demo-bindings-harness.component';

describe('Demo bindings: every option the demo binds, in a real browser', () => {
    describe('Valid date start with years (0000.M0.d0)', () => {
        const ex = { _mask: '0000.M0.d0' };

        it('types 20231215 key by key', async () => {
            const m = await mount(DemoBindingsHarnessComponent, { ex });
            await m.type('#masked', '20231215');
            await expect.poll(() => m.get('#masked').value).toBe('2023.12.15');
            expect(m.component.form.value).toBe('20231215');
        });

        // One `insertText` input event carrying the whole string (autofill, a drop, the Browser
        // pane's insertText): it was processed like a keystroke, and the month window read from
        // the mask cursor, which runs behind a bare digit string by the emitted separator
        // ('20231215' -> '2023.1.21').
        it('takes 20231215 inserted in one go', async () => {
            const m = await mount(DemoBindingsHarnessComponent, { ex });
            await userEvent.fill(m.get('#masked'), '20231215');
            await m.settle();
            await expect.poll(() => m.get('#masked').value).toBe('2023.12.15');
            expect(m.component.form.value).toBe('20231215');
        });
    });

    describe('Mask reconfigured at runtime (apps that rebind [mask] and related inputs at runtime)', () => {
        const reconfigure = async (
            from: DemoExample,
            to: DemoExample,
            initialValue: DemoModel = ''
        ) => {
            const m = await mount(DemoBindingsHarnessComponent, { ex: from, initialValue });
            m.fixture.componentRef.setInput('ex', to);
            await m.settle();
            return m;
        };

        it('separator with negatives -> typed mask with prefix: 123456 gives $1234.56', async () => {
            const m = await reconfigure(
                { _mask: 'separator', _allowNegativeNumbers: true, _decimalMarker: '.' },
                {
                    _showMaskTyped: true,
                    _keepCharacterPositions: true,
                    _prefix: '$',
                    _mask: '0000.00',
                }
            );
            await m.type('#masked', '123456');
            await expect.poll(() => m.get('#masked').value).toBe('$1234.56');
            // no number was written and the new mask is no separator mask: a string (see below)
            expect(m.component.form.value).toBe('123456');
        });

        it('separator.2 with "." thousands -> default thousands: 1234.56 gives "1 234.56"', async () => {
            const m = await reconfigure(
                { _mask: 'separator.2', _thousandSeparator: '.' },
                { _mask: 'separator.2' }
            );
            await m.type('#masked', '1234.56');
            await expect.poll(() => m.get('#masked').value).toBe('1 234.56');
            expect(m.component.form.value).toBe(1234.56);
        });

        // A runtime mask change re-derives the model type from the new mask and the last write,
        // like a fresh mount: a separator mask or a number write gives numbers, anything else strings.
        it('separator.0 -> plain digits mask: ngModel gives a string model', async () => {
            const m = await reconfigure({ _mask: 'separator.0' }, { _mask: '0000' });
            await m.type('#ngmodel', '1234');
            await expect.poll(() => m.get('#ngmodel').value).toBe('1234');
            await expect.poll(() => m.component.model).toBe('1234');
        });

        it('plain digits mask -> separator.0: signal form gives a number model', async () => {
            const m = await reconfigure({ _mask: '0000' }, { _mask: 'separator.0' });
            await m.type('#signal', '1234');
            await expect.poll(() => m.get('#signal').value).toBe('1 234');
            await expect.poll(() => m.component.signalValue).toBe(1234);
        });

        it('no mask -> separator.0: the form gives a number model', async () => {
            const m = await reconfigure({}, { _mask: 'separator.0' });
            await m.type('#masked', '1234');
            await expect.poll(() => m.get('#masked').value).toBe('1 234');
            expect(m.component.form.value).toBe(1234);
        });

        it('separator.2 with a number model -> percent: 12 stays a number', async () => {
            const m = await reconfigure({ _mask: 'separator.2' }, { _mask: 'percent' }, 12);
            await m.clear('#masked');
            await m.type('#masked', '12');
            await expect.poll(() => m.get('#masked').value).toBe('12');
            expect(m.component.form.value).toBe(12);
        });

        it('plain digits with a number model -> separator.0 -> plain digits: 12 stays a number', async () => {
            const m = await reconfigure({ _mask: '0000' }, { _mask: 'separator.0' }, 1234);
            m.fixture.componentRef.setInput('ex', { _mask: '0000' });
            await m.settle();
            await m.clear('#masked');
            await m.type('#masked', '12');
            await expect.poll(() => m.get('#masked').value).toBe('12');
            expect(m.component.form.value).toBe(12);
        });

        it('separator.2 with a number model -> no mask -> separator.2: 77 stays a number', async () => {
            const m = await reconfigure({ _mask: 'separator.2' }, { _mask: '' }, 1234.5);
            // no mask shows the raw value: the decimal point is part of it, not a special
            // character of the separator mask it was produced by
            await expect.poll(() => m.get('#masked').value).toBe('1234.5');
            expect(m.component.form.value).toBe(1234.5);

            m.fixture.componentRef.setInput('ex', { _mask: 'separator.2' });
            await m.settle();
            await expect.poll(() => m.get('#masked').value).toBe('1 234.5');
            await m.clear('#masked');
            await m.type('#masked', '77');
            await expect.poll(() => m.get('#masked').value).toBe('77');
            expect(m.component.form.value).toBe(77);
        });

        it('separator.2 -> typed mask with dashes: first key shows the skeleton', async () => {
            const m = await reconfigure(
                { _mask: 'separator.2', _thousandSeparator: '.' },
                { _showMaskTyped: true, _keepCharacterPositions: true, _mask: '000-000-000' }
            );
            await m.type('#masked', '1');
            await expect.poll(() => m.get('#masked').value).toBe('1__-___-___');
            expect(m.component.form.value).toBe('1');
        });

        it('separator.0 -> date mask 0000.M0.d0: 20231215 gives 2023.12.15', async () => {
            const m = await reconfigure({ _mask: 'separator.0' }, { _mask: '0000.M0.d0' });
            await m.type('#masked', '20231215');
            await expect.poll(() => m.get('#masked').value).toBe('2023.12.15');
            expect(m.component.form.value).toBe('20231215');
        });

        it('separator with negatives -> +7 phone mask: 125 gives +7(125) ___-____', async () => {
            const m = await reconfigure(
                { _mask: 'separator', _allowNegativeNumbers: true },
                { _showMaskTyped: true, _prefix: '+7', _mask: '(000) 000-0000' }
            );
            await m.type('#masked', '125');
            await expect.poll(() => m.get('#masked').value).toBe('+7(125) ___-____');
        });
    });
});
