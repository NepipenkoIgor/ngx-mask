import {
    ChangeDetectionStrategy,
    Component,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    runInInjectionContext,
    signal,
    untracked,
    viewChildren,
} from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { initialConfig, NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { HighlightModule } from 'ngx-highlightjs';
import { AssetPipe } from '@shared/asset/asset.pipe';
import { IsEmptyPipe } from '@shared/is-empty/is-empty.pipe';
import { CardContentComponent } from '../shared/card-content/card-content.component';
import { ScrollService } from '@shared/scroll/scroll.service';
import { AccordionService } from '@shared/accordion/accordion.service';
import { OpenSourcePath } from '@shared/path/open-source.path';
import type {
    ComDoc,
    MaskOptions,
    TExample,
    TExampleConfig,
} from '@shared/accordion/content.types';

@Component({
    selector: 'ngxd-options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ScrollService, AccordionService],
    imports: [
        NgTemplateOutlet,
        FormsModule,
        ReactiveFormsModule,
        FormField,
        HighlightModule,
        NgxMaskDirective,
        NgxMaskPipe,
        AssetPipe,
        IsEmptyPipe,
        CardContentComponent,
        NgOptimizedImage,
    ],
})
export class OptionsComponent {
    public readonly cardDocs = input<ComDoc[]>();
    public readonly group = input<number>(1);
    public readonly cardExamplesConfig = input<(TExampleConfig<MaskOptions> | { _pipe: string })[]>(
        [],
        {
            alias: 'cardExamples',
        }
    );

    protected readonly cardExamples = signal<(TExample<MaskOptions> | { _pipe: string })[]>([]);

    protected readonly cards = viewChildren<string, ElementRef<HTMLElement>>('cards', {
        read: ElementRef,
    });

    protected readonly phone = '123456789';
    protected readonly openSourceOptionsPath = OpenSourcePath.OPTIONS;
    protected readonly specialCharacters = initialConfig.specialCharacters;
    protected readonly outputTransformFn = initialConfig.outputTransformFn;
    protected readonly inputTransformFn = initialConfig.inputTransformFn;

    private readonly scrollService = inject(ScrollService);
    private readonly accordionService = inject(AccordionService);
    private readonly injector = inject(Injector);

    protected readonly activeCardId = this.scrollService.activeCard;

    protected splitCode(code: string): { setup: string | null; template: string } {
        const [first, ...rest] = code.split(/\n\s*\n/);
        if (rest.length && typeof first === 'string' && !first.trimStart().startsWith('<')) {
            return { setup: first, template: rest.join('\n\n') };
        }
        return { setup: null, template: code };
    }

    public constructor() {
        effect(() => {
            const configs = this.cardExamplesConfig();
            if (!configs) {
                untracked(() => this.cardExamples.set([]));
                return;
            }

            untracked(() => {
                const runtimeExamples = configs.map((config) => {
                    if ('_pipe' in config) {
                        return config;
                    }
                    const initialValue = config.control.initialValue;
                    const formControl = new FormControl<string | null>(initialValue);
                    const modelSignal = signal<string | null>(initialValue);
                    const signalFormModel = signal({ value: initialValue });

                    const signalForm = runInInjectionContext(this.injector, () =>
                        form(signalFormModel)
                    );

                    return {
                        ...config,
                        control: {
                            formControl,
                            model: modelSignal,
                            signalForm,
                        },
                    } as TExample<MaskOptions>;
                });

                this.cardExamples.set(runtimeExamples);
            });
        });

        effect(() => {
            this.scrollService.group.set(this.group());
        });

        effect(() => {
            this.scrollService.onScroll(this.cards());
            this.accordionService.onChangeAccordion(this.cards());
        });
    }
}
