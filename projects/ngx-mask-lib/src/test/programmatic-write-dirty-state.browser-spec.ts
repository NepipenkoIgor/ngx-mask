import { NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { mount } from './utils/browser-harness';
import {
    SignalFormSeparatorHost,
    WrapperNgFormHost,
    WrapperUpdateOnBlurHost,
} from './utils/programmatic-write-hosts';

describe('Programmatic writes keep the form pristine in a real browser (#1695)', () => {
    it('a forwarding wrapper on an updateOn blur control stays pristine through a focus and blur', async () => {
        const m = await mount(WrapperUpdateOnBlurHost);

        m.component.amount.setValue('10.2');
        await m.settle();
        m.focus('#amount input');
        await m.blur('#amount input');
        await m.settle();

        expect(m.get('#amount input').value).toBe('10.20');
        expect(m.component.amount.value).toBe('10.20');
        expect(m.component.amount.pristine).toBe(true);
    });

    it('a forwarding wrapper in an ngForm leaves the form pristine, and typing still dirties it', async () => {
        const m = await mount(WrapperNgFormHost);
        await m.settle();
        const ngForm = m.fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);

        m.component.amount.set('10.2');
        await m.settle();

        expect(m.get('#amount input').value).toBe('10.20');
        expect(ngForm.pristine).toBe(true);

        await m.type('#amount input', '{Backspace}');
        await m.settle();

        expect(ngForm.dirty).toBe(true);
    });

    it('a Signal Forms field on separator.2 stays pristine, and typing still dirties it', async () => {
        const m = await mount(SignalFormSeparatorHost);
        const { tree } = m.component;

        m.component.data.set({ amount: '10.2' });
        await m.settle();

        expect(m.get('#amount').value).toBe('10.2');
        expect(tree.amount().dirty()).toBe(false);
        expect(tree().dirty()).toBe(false);

        await m.type('#amount', '5');
        await m.settle();

        expect(tree.amount().dirty()).toBe(true);
        expect(tree().dirty()).toBe(true);
    });
});
