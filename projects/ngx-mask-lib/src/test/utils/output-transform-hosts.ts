import {
    ChangeDetectionStrategy,
    Component,
    Injector,
    InjectionToken,
    inject,
    runInInjectionContext,
    signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

/** Visible in the model: shows exactly when `outputTransformFn` ran. */
export const wrapOutput = (value: unknown): string => `<${String(value)}>`;

/** The initial model value; provide `'1234'` for one the mask normalises to '12-34' (#1754). */
export const INITIAL_VALUE = new InjectionToken<string>('INITIAL_VALUE');
const initialValue = (): string => inject(INITIAL_VALUE, { optional: true }) ?? '12-34';

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
    public readonly control = new FormControl<string | null>(initialValue());
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
    public model: string | null = initialValue();
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
    public readonly data = signal({ value: initialValue() });
    public readonly tree = runInInjectionContext(inject(Injector), () => form(this.data));
}
