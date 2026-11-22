import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccordionComponent } from './accordion.component';
import type { ListItem } from './content.types';

const lists: ListItem[] = [1, 2, 4].map((id) => ({
    header: `Group ${id}`,
    id,
    text: [{ content: `Item ${id}`, id: 6 }],
    defaultSvg: 'default',
    activeSvg: 'active',
    whiteChevron: 'white',
    yellowChevron: 'yellow',
}));

describe('AccordionComponent group switch', () => {
    let fragment$: BehaviorSubject<string | null>;
    let fixture: ComponentFixture<AccordionComponent>;
    let emitted: number[];

    const activeIndexes = (): number[] =>
        fixture.componentInstance
            .accordion()
            .flatMap((el, i) => (el.nativeElement.classList.contains('active') ? [i] : []));

    beforeEach(() => {
        fragment$ = new BehaviorSubject<string | null>(null);
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { fragment: fragment$ } },
            ],
        });
        fixture = TestBed.createComponent(AccordionComponent);
        fixture.componentRef.setInput('lists', lists);
        emitted = [];
        fixture.componentInstance.switchCardIndex.subscribe((group) => emitted.push(group));
        fixture.detectChanges();
    });

    it('should open group 4 and emit it when the fragment is 4-6', () => {
        fragment$.next('4-6');

        expect(emitted).toEqual([4]);
        expect(activeIndexes()).toEqual([2]);
        expect(fixture.componentInstance.itemInAccordion()).toBe(6);
    });

    it('should map a legacy #N fragment to group 1 without switching when group 1 is active', () => {
        fragment$.next('3');

        expect(emitted).toEqual([]);
        expect(activeIndexes()).toEqual([0]);
        expect(fixture.componentInstance.itemInAccordion()).toBe(3);
    });

    it('should switch back to group 1 for a legacy fragment while another group is active', () => {
        fixture.componentRef.setInput('activeGroup', 4);
        fragment$.next('#3');

        expect(emitted).toEqual([1]);
        expect(activeIndexes()).toEqual([0]);
        expect(fixture.componentInstance.itemInAccordion()).toBe(3);
    });

    it('should not switch the group or the item for a malformed fragment', () => {
        fragment$.next('abc');
        fragment$.next('4-');
        fragment$.next(null);

        expect(emitted).toEqual([]);
        expect(activeIndexes()).toEqual([0]);
        expect(fixture.componentInstance.itemInAccordion()).toBe(1);
    });

    it('should emit but keep the first panel open for an unknown group', () => {
        fragment$.next('9-2');

        expect(emitted).toEqual([9]);
        expect(activeIndexes()).toEqual([0]);
    });

    it('should stop reacting to fragments after destroy', () => {
        fixture.destroy();
        fragment$.next('4-6');

        expect(emitted).toEqual([]);
    });
});
