import { TestBed } from '@angular/core/testing';
import { mount } from './utils/browser-harness';
import {
    INITIAL_VALUE,
    TransformReactiveHost,
    TransformSignalHost,
    TransformTemplateHost,
} from './utils/output-transform-hosts';

describe('outputTransformFn on an initial value the mask normalises in a real browser (#1754)', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            providers: [{ provide: INITIAL_VALUE, useValue: '1234' }],
        })
    );

    it('reactive forms echo the normalised value and stay pristine', async () => {
        const m = await mount(TransformReactiveHost);

        expect(m.get('#masked').value).toBe('12-34');
        expect(m.component.control.value).toBe('<12-34>');
        expect(m.component.control.pristine).toBe(true);
    });

    it('ngModel echoes the normalised value', async () => {
        const m = await mount(TransformTemplateHost);

        expect(m.get('#masked').value).toBe('12-34');
        expect(m.component.model).toBe('<12-34>');
    });

    it('Signal Forms echo the normalised value and stay pristine', async () => {
        const m = await mount(TransformSignalHost);

        expect(m.get('#masked').value).toBe('12-34');
        expect(m.component.tree.value().value()).toBe('<12-34>');
        expect(m.component.tree.value().dirty()).toBe(false);
    });
});
