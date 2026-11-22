import type { ElementRef } from '@angular/core';
import { afterNextRender, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { DEFAULT_GROUP_ID, parseFragment, toFragment } from '@shared/fragment/section-fragment';

@Injectable()
export class ScrollService {
    private readonly router = inject(Router);
    private readonly minusTopHeight = 300;
    private readonly minusTopMobileHeight = 150;
    private readonly document = inject(DOCUMENT);
    private readonly platformId = inject<string>(PLATFORM_ID);

    public readonly activeCard = signal<number>(1);
    /** Menu group whose cards are rendered; section ids are only unique inside it. */
    public readonly group = signal<number>(DEFAULT_GROUP_ID);

    private cards = signal<readonly ElementRef<HTMLElement>[]>([]);
    private scrollHandler: (() => void) | null = null;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private scrollListenerInitialized = false;

    public constructor() {
        // afterNextRender must be called in an injection context (constructor)
        afterNextRender(() => {
            this.scrollToFragment();
            this.initScrollListener();
        });
    }

    /** Native fragment scroll misses the cards: their DOM id is not the section number. */
    private scrollToFragment(): void {
        const target = parseFragment(this.document.location.hash);
        if (target?.group !== this.group()) {
            return;
        }
        this.cards()
            .find((card) => card.nativeElement.dataset['section'] === String(target.section))
            ?.nativeElement.querySelector('[id]')
            ?.scrollIntoView({ block: 'start' });
    }

    private initScrollListener(): void {
        if (this.scrollListenerInitialized) {
            return;
        }
        this.scrollListenerInitialized = true;

        this.scrollHandler = () => {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                this.handleScroll();
            }, 100);
        };

        document.addEventListener('scroll', this.scrollHandler);
    }

    public onScroll(cards: readonly ElementRef<HTMLElement>[]): void {
        this.cards.set(cards);
    }

    private handleScroll(): void {
        const scrollIdCard = this.cards().find((e) => this.isInViewport(e.nativeElement))
            ?.nativeElement.dataset['section'];
        if (this.activeCard() !== Number(scrollIdCard) && scrollIdCard) {
            this.activeCard.set(Number(scrollIdCard));
            void this.router.navigate(['/'], {
                fragment: toFragment(this.group(), Number(scrollIdCard)),
            });
        }
    }

    public isInViewport(elm: HTMLElement): boolean {
        if (isPlatformServer(this.platformId)) {
            return false;
        }
        const windowHeight = this.document.body.offsetHeight;
        let elementTop = elm.offsetTop - this.minusTopHeight;
        const elementBottom = elementTop + elm.offsetHeight;

        const viewportTop = this.document.documentElement.scrollTop;
        const viewportBottom = viewportTop + this.document.documentElement.clientHeight;
        if (windowHeight < 450) {
            elementTop = elm.offsetTop - this.minusTopMobileHeight;
        }
        return elementBottom > viewportTop && elementTop < viewportBottom;
    }
}
