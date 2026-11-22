import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    INITIAL_VALUE,
    TransformReactiveHost,
    TransformSignalHost,
    TransformTemplateHost,
} from './utils/output-transform-hosts';

describe('outputTransformFn on an initial value the mask normalises (#1754)', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            providers: [{ provide: INITIAL_VALUE, useValue: '1234' }],
        })
    );

    // The model holds '1234' and the mask renders '12-34': the normalised value is echoed through
    // the transform in every form flavour, without dirtying the control.
    it('reactive forms echo the normalised value and stay pristine', async () => {
        const fixture = TestBed.createComponent(TransformReactiveHost);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.control.value).toBe('<12-34>');
        expect(fixture.componentInstance.control.pristine).toBe(true);
    });

    it('ngModel echoes the normalised value', async () => {
        const fixture = TestBed.createComponent(TransformTemplateHost);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.model).toBe('<12-34>');
    });

    it('Signal Forms echo the normalised value and stay pristine', async () => {
        const fixture = TestBed.createComponent(TransformSignalHost);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.tree.value().value()).toBe('<12-34>');
        expect(fixture.componentInstance.tree.value().dirty()).toBe(false);
    });
});
