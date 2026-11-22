import { Component, effect, ElementRef, inject, input, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollService } from './scroll.service';

@Component({
    selector: 'ngxd-test-cards',
    template: `
        @for (section of sections; track $index) {
            <div [id]="'card-' + $index" [attr.data-section]="section" #cards>
                <div [id]="'anchor-' + $index"></div>
            </div>
        }
    `,
    providers: [ScrollService],
})
class TestCardsComponent {
    public readonly sections = [1, 7, 7];
    public readonly group = input(1);
    public readonly cards = viewChildren<string, ElementRef<HTMLElement>>('cards', {
        read: ElementRef,
    });
    private readonly scrollService = inject(ScrollService);

    public constructor() {
        // same wiring as OptionsComponent: cards reach the service before the first render ends
        effect(() => this.scrollService.onScroll(this.cards()));
        effect(() => this.scrollService.group.set(this.group()));
    }
}

describe('ScrollService fragment scroll', () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;

    const render = (fragment: string, group = 1): void => {
        history.replaceState(null, '', `/${fragment}`);
        const fixture = TestBed.createComponent(TestCardsComponent);
        fixture.componentRef.setInput('group', group);
        fixture.detectChanges();
        TestBed.tick();
    };

    beforeEach(() => {
        Element.prototype.scrollIntoView = function (this: Element, ...args: unknown[]): void {
            scrollIntoView(this.id, ...args);
        };
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
    });

    afterEach(() => {
        Element.prototype.scrollIntoView = originalScrollIntoView;
        scrollIntoView.mockReset();
        history.replaceState(null, '', '/');
    });

    it('scrolls to the anchor of the first card matching the fragment section', () => {
        render('#7');

        expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith('anchor-1', { block: 'start' });
    });

    it('resolves a group-qualified fragment inside its own group', () => {
        render('#4-7', 4);

        expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith('anchor-1', { block: 'start' });
    });

    it('does not scroll a fragment that names another group', () => {
        render('#4-7', 1);
        render('#7', 4);

        expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it('does not scroll when the fragment is empty or matches no section', () => {
        render('');
        render('#unknown');

        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});
