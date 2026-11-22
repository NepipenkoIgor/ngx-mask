import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { MaskSwitchHost } from './utils/mask-switch-host';
import { typeTest } from './utils/test-functions.component';

describe('Emission type after a runtime mask switch matches a fresh mount (#1701)', () => {
    const mount = () => {
        const fixture = TestBed.createComponent(MaskSwitchHost);
        fixture.detectChanges();
        return fixture;
    };
    const switchTo = async (fixture: ReturnType<typeof mount>, mask: string): Promise<void> => {
        fixture.componentInstance.mask.set(mask);
        fixture.detectChanges();
        await fixture.whenStable();
    };

    it('"" -> separator.2 emits a number, like a fresh separator.2 mount', async () => {
        const switched = mount();
        await switchTo(switched, 'separator.2');
        typeTest('1234.5', switched);

        const fresh = mount();
        fresh.componentInstance.mask.set('separator.2');
        fresh.detectChanges();
        typeTest('1234.5', fresh);

        expect(switched.componentInstance.control.value).toBe(1234.5);
        expect(switched.componentInstance.control.value).toBe(
            fresh.componentInstance.control.value
        );
    });

    it('separator.2 -> plain digits emits a string, like a fresh plain mount', async () => {
        const fixture = mount();
        await switchTo(fixture, 'separator.2');
        await switchTo(fixture, '0000');
        typeTest('1234', fixture);

        expect(fixture.componentInstance.control.value).toBe('1234');
    });
});
