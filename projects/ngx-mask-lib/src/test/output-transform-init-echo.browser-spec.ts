import { TestBed } from '@angular/core/testing';
import { mount } from './utils/browser-harness';
import {
    TransformReactiveHost,
    TransformSignalHost,
    TransformTemplateHost,
} from './utils/output-transform-hosts';

describe('outputTransformFn on the initial write in a real browser (#1700)', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('reactive forms keep the initial value untransformed and pristine', async () => {
        const m = await mount(TransformReactiveHost);

        expect(m.component.control.value).toBe('12-34');
        expect(m.component.control.pristine).toBe(true);
        expect(m.get('#masked').value).toBe('12-34');
    });

    it('ngModel keeps the initial value untransformed', async () => {
        const m = await mount(TransformTemplateHost);

        expect(m.component.model).toBe('12-34');
        expect(m.get('#masked').value).toBe('12-34');
    });

    it('Signal Forms keep the initial value untransformed and pristine', async () => {
        const m = await mount(TransformSignalHost);

        expect(m.component.tree.value().value()).toBe('12-34');
        expect(m.component.tree.value().dirty()).toBe(false);
    });

    it('still transforms what the user types', async () => {
        const m = await mount(TransformReactiveHost);

        await m.type('#masked', '{Control>}a{/Control}5678');

        expect(m.component.control.value).toBe('<56-78>');
    });
});
