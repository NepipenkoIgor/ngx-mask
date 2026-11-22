import { By } from '@angular/platform-browser';
import type { FormControl } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { mount } from './utils/browser-harness';
import { MaskHarnessComponent } from './utils/mask-harness.component';

// #1763: the email verdict used a backtracking regex (polynomial ReDoS); it is now a split check.
describe('Directive: email mask validator in a real browser (#1763)', () => {
    const setup = async () => {
        const m = await mount(MaskHarnessComponent, { mask: 'A*@A*.A*' });
        const directive = m.fixture.debugElement
            .query(By.directive(NgxMaskDirective))
            .injector.get(NgxMaskDirective);

        return (value: string) => directive.validate({ value } as FormControl);
    };

    it('accepts a well-formed address', async () => {
        const validate = await setup();

        expect(validate('a@b.c')).toBeNull();
    });

    for (const value of ['a@.bc', 'a@bc.', 'a@b@c.d', '@b.c', 'ab.c']) {
        it(`rejects ${value}`, async () => {
            const validate = await setup();

            expect(validate(value)).not.toBeNull();
        });
    }

    it('validates a pathological "@......" value without hanging', async () => {
        const validate = await setup();
        const start = performance.now();

        expect(validate('@' + '.'.repeat(50000))).not.toBeNull();
        expect(performance.now() - start).toBeLessThan(1000);
    });
});
