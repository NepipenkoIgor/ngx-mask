import {
    ChangeDetectionStrategy,
    Component,
    Injector,
    inject,
    runInInjectionContext,
    signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

/** Visible in the model: shows exactly when `outputTransformFn` ran. */
export const wrapOutput = (value: unknown): string => `<${String(value)}>`;

const TEMPLATE_ATTRS =
    'id="masked" mask="00-00" [dropSpecialCharacters]="false" [outputTransformFn]="transform"';

@Component({
    selector: 'ngxd-transform-reactive',
    imports: [ReactiveFormsModule, NgxMaskDirective],
    providers: [provideNgxMask()],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input ${TEMPLATE_ATTRS} [formControl]="control" />`,
})
export class TransformReactiveHost {
    public readonly transform = wrapOutput;
    public readonly control = new FormControl<string | null>('12-34');
}

@Component({
    selector: 'ngxd-transform-template',
    imports: [FormsModule, NgxMaskDirective],
    providers: [provideNgxMask()],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input ${TEMPLATE_ATTRS} [(ngModel)]="model" />`,
})
export class TransformTemplateHost {
    public readonly transform = wrapOutput;
    public model: string | null = '12-34';
}

@Component({
    selector: 'ngxd-transform-signal',
    imports: [FormField, NgxMaskDirective],
    providers: [provideNgxMask()],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<input ${TEMPLATE_ATTRS} [formField]="tree.value" />`,
})
export class TransformSignalHost {
    public readonly transform = wrapOutput;
    public readonly data = signal({ value: '12-34' });
    public readonly tree = runInInjectionContext(inject(Injector), () => form(this.data));
}
