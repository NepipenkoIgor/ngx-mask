import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
    TransformReactiveHost,
    TransformSignalHost,
    TransformTemplateHost,
} from './utils/output-transform-hosts';

describe('outputTransformFn on the initial write (#1700)', () => {
    // The model already holds '12-34' and the mask leaves it unchanged, so no form flavour may
    // echo it through the transform: reactive, ngModel and Signal Forms must all keep '12-34'.
    it('reactive forms keep the initial value untransformed and pristine', async () => {
        const fixture = TestBed.createComponent(TransformReactiveHost);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.control.value).toBe('12-34');
        expect(fixture.componentInstance.control.pristine).toBe(true);
    });

    it('ngModel keeps the initial value untransformed', async () => {
        const fixture = TestBed.createComponent(TransformTemplateHost);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.model).toBe('12-34');
    });

    it('Signal Forms keep the initial value untransformed and pristine', async () => {
        const fixture = TestBed.createComponent(TransformSignalHost);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.componentInstance.tree.value().value()).toBe('12-34');
        expect(fixture.componentInstance.tree.value().dirty()).toBe(false);
    });

    it('still transforms what the user types', async () => {
        const fixture = TestBed.createComponent(TransformReactiveHost);
        fixture.detectChanges();
        await fixture.whenStable();
        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

        input.value = '5678';
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();

        expect(fixture.componentInstance.control.value).toBe('<56-78>');
    });
});
