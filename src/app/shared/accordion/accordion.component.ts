import type { AfterViewInit, OnDestroy } from '@angular/core';
import { signal } from '@angular/core';
import {
    Component,
    ElementRef,
    inject,
    input,
    output,
    PLATFORM_ID,
    viewChild,
    viewChildren,
} from '@angular/core';
import { DOCUMENT, isPlatformServer, NgOptimizedImage } from '@angular/common';
import type { ListItem } from './content.types';
import { AssetPipe } from '@shared/asset/asset.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { BodyStylesService } from '@shared/body-styles/body-styles.service';
import { OpenSourcePath } from '@shared/path/open-source.path';
import { AnchorLabelPipe } from '@shared/anchor/anchor-label.pipe';

@Component({
    selector: 'ngxd-accordion',
    templateUrl: './accordion.component.html',
    styleUrl: './accordion.component.scss',
    imports: [AssetPipe, NgOptimizedImage, AnchorLabelPipe],
    standalone: true,
    providers: [BodyStylesService],
})
export class AccordionComponent implements AfterViewInit, OnDestroy {
    public lists = input<ListItem[]>();
    public title = input<string>();

    public switchCardIndex = output<number>();

    public accordion = viewChildren<string, ElementRef<HTMLElement>>('accordion', {
        read: ElementRef,
    });
    public accordionBlockElement = viewChild<string, ElementRef<HTMLElement>>('accordionBlock', {
        read: ElementRef,
    });

    public showAccordion = signal<boolean>(false);
    public itemInAccordion = signal<number>(1);

    public readonly openSourceAccordionPath = OpenSourcePath.ACCORDION;
    public readonly openSourceHeaderPath = OpenSourcePath.HEADER;
    public readonly bodyStylesService = inject(BodyStylesService);

    public readonly githubProfileLink = 'https://github.com/NepipenkoIgor';
    public readonly linkedInProfileLink = 'https://www.linkedin.com/in/igor-nepipenko-ai-architect';
    public readonly upworkProfileLink = 'https://www.upwork.com/freelancers/nepipenkoaiarchitect';

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly platformId = inject<string>(PLATFORM_ID);
    private readonly document = inject(DOCUMENT);

    private clickHandler: ((event: MouseEvent) => void) | null = null;
    private fragmentSubscription: { unsubscribe: () => void } | null = null;

    public ngAfterViewInit(): void {
        this.clickHandler = (event: MouseEvent) => {
            if (
                this.showAccordion() &&
                event.target !== this.accordionBlockElement()?.nativeElement
            ) {
                this.showAccordionBlock();
            }
        };

        window.addEventListener('click', this.clickHandler);

        this.openFirstAccordion();

        this.fragmentSubscription = this.activatedRoute.fragment.subscribe((itemId) => {
            if (itemId) {
                this.itemInAccordion.set(Number(itemId));
            }
        });
    }

    public ngOnDestroy(): void {
        if (this.clickHandler) {
            window.removeEventListener('click', this.clickHandler);
        }
        if (this.fragmentSubscription) {
            this.fragmentSubscription.unsubscribe();
        }
    }

    public showAccordionBlock(): void {
        this.showAccordion.set(!this.showAccordion());
        this.bodyStylesService.setOverflowYBodyHtml(this.showAccordion());
    }

    public switchAccordion(index: number): void {
        this.switchCardIndex.emit(index);
    }

    public handleClick(idItem: number, scrollTo: string | undefined): void {
        if (this.showAccordion()) {
            this.showAccordionBlock();
        }
        this.anchorScroll(idItem, scrollTo);
    }

    public anchorScroll(idItem: number, scrollTo: string | undefined): void {
        if (isPlatformServer(this.platformId)) {
            return;
        }
        this.itemInAccordion.set(idItem);
        void this.router.navigate(['/'], {
            fragment: idItem.toString(),
        });
        if (!scrollTo) {
            return;
        }
        const anchor: HTMLElement | null = this.document.getElementById(scrollTo);
        if (anchor) {
            anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    public toggle(index: number): void {
        this.accordion().forEach((el, i) => {
            if (index !== i) {
                el.nativeElement.classList.remove('active');
            } else {
                el.nativeElement.classList.toggle('active');
            }
        });
    }

    public openFirstAccordion(): void {
        this.accordion()[0]?.nativeElement.classList.toggle('active');
    }
}
