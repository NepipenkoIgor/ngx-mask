## Usage

```html
<input type="text" mask="<here goes your mask>" />
```

```html
<input type="text" [mask]="<here goes a reference to your component's mask property>" />
```

Also, you can use mask pipe.

```html
<span>{{phone | mask: '(000) 000-0000'}}</span>
```

You could path any valid config options, for example thousandSeparator and suffix

```html
<span>{{value | mask: 'separator': { thousandSeparator: ',', suffix: ' sm' } }}</span>
```

### Examples

| mask           | example        |
| -------------- | -------------- |
| 9999-99-99     | 2017-04-15     |
| 0\*.00         | 2017.22        |
| 000.000.000-99 | 048.457.987-98 |
| AAAA           | 0F6g           |
| SSSS           | asDF           |
| UUUU           | ASDF           |
| LLLL           | asdf           |

## Configuration

`ngx-mask` ships as a standalone directive (`NgxMaskDirective`) and pipe (`NgxMaskPipe`). There is **no `NgxMaskModule`** in current versions — `NgxMaskModule.forRoot()` only exists in ngx-mask 14.x and older. Whatever your app structure, you always import the directive/pipe directly and register the configuration through a provider function.

**Which provider function should I use?**

- `provideEnvironmentNgxMask(config?)` — application-wide configuration. Use it once in `bootstrapApplication` / `app.config.ts` (or in a root `NgModule`'s `providers`). It returns `EnvironmentProviders`, so Angular prevents you from accidentally registering it at the component level.
- `provideNgxMask(config?)` — injector-level configuration. Use it in a component's (or route's/feature `NgModule`'s) `providers` to configure or override the mask options for that subtree only.

Both accept the same `NgxMaskOptions` object (or a factory function returning one). The options you pass are merged over the **library defaults** — so if a component provides `provideNgxMask()`, the resulting config **replaces** the environment config for that subtree (options set only at the environment level are not inherited). Individual directive inputs (e.g. `[thousandSeparator]`) always win over any provider config.

### Standalone applications (`bootstrapApplication` / `app.config.ts`)

```typescript
// app.config.ts
import { provideEnvironmentNgxMask } from 'ngx-mask';

export const appConfig: ApplicationConfig = {
    providers: [provideEnvironmentNgxMask({ validation: false })],
};
```

```typescript
// any component that uses the mask
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    imports: [NgxMaskDirective],
    template: `<input mask="0000" />`,
})
export class MyComponent {}
```

### Per-component override

```typescript
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
    imports: [NgxMaskDirective],
    providers: [provideNgxMask({ thousandSeparator: ',' })],
    template: `<input mask="separator.2" />`,
})
export class PriceInputComponent {}
```

### NgModule-based applications

Module-based apps are still supported — import the standalone directive/pipe into the `imports` of your `NgModule` and register the provider function:

```typescript
import { NgxMaskDirective, NgxMaskPipe, provideEnvironmentNgxMask } from 'ngx-mask';

@NgModule({
    imports: [NgxMaskDirective, NgxMaskPipe],
    exports: [NgxMaskDirective, NgxMaskPipe],
    providers: [provideEnvironmentNgxMask()],
})
export class AppModule {}
```

Migrating from ngx-mask ≤ 14:

```typescript
// Before (ngx-mask <= 14)
@NgModule({ imports: [NgxMaskModule.forRoot(maskConfig)] })
export class AppModule {}

// After (current ngx-mask)
@NgModule({
    imports: [NgxMaskDirective],
    providers: [provideEnvironmentNgxMask(maskConfig)],
})
export class AppModule {}
```

### Pipe configuration

The `mask` pipe reads the same provider config; per-usage overrides are passed as the pipe's second argument:

```html
<span>{{ value | mask: 'separator' : { thousandSeparator: ',', suffix: ' sm' } }}</span>
```

### Common pitfalls

- **`NullInjectorError: No provider for InjectionToken ngx-mask config`** — the directive/pipe is used without any provider in scope. Add `provideEnvironmentNgxMask()` to your bootstrap providers (or `provideNgxMask()` to the component).
- **`NgxMaskModule` not found** — you are reading instructions for ngx-mask ≤ 14. Use the standalone imports + provider functions shown above.
- **Config seems ignored** — a closer `provideNgxMask()` in a parent component replaces the environment config for that subtree, and directive inputs override both.

## Mask Options

You can define your custom options for all directives (as object in the mask module) or for each (as attributes for directive). If you override this parameter, you have to provide all the special characters (default one are not included).

### specialCharacters (string[ ])

We have next default characters:

| character |
| --------- |
| -         |
| /         |
| (         |
| )         |
| .         |
| :         |
| **space** |
| +         |
| ,         |
| @         |
| [         |
| ]         |
| "         |
| '         |

#### Usage

```html
<input type="text" [specialCharacters]="[ '[' ,']' , '\\' ]" mask="[00]\[000]" />
```

##### Then

```text
Input value: 789-874.98
Masked value: [78]\[987]
```

```typescript
patterns ({ [character: string]: { pattern: RegExp, optional?: boolean})
```

We have next default patterns:

| code  | meaning                                     |
| ----- | ------------------------------------------- |
| **0** | digits (like 0 to 9 numbers)                |
| **9** | digits (like 0 to 9 numbers), but optional  |
| **A** | letters (uppercase or lowercase) and digits |
| **S** | only letters (uppercase or lowercase)       |
| **U** | only letters uppercase                      |
| **L** | only letters lowercase                      |

##### Usage

```html
<input type="text" [patterns]="customPatterns" mask="(000-000)" />
```

and in your component

```typescript
public customPatterns = { '0': { pattern: new RegExp('\[a-zA-Z\]')} };
```

##### Then

```text
Input value: 789HelloWorld
Masked value: (Hel-loW)
```

### Custom Pattern Definition for Input Masks

You can define a custom pattern and specify a unique symbol to be rendered in the input field.

Important Notes:

Reserved Characters: Certain characters (h, d, m, s) are reserved for date patterns and should not be used in custom patterns to avoid conflicts.

```html
Special Symbol *: The * character is reserved for patterns like 0*, which means any length of digits
can appear before the asterisk. Avoid using this symbol in custom patterns.

<input type="text" mask="A*" />
```

```typescript
pattern = {
    B: {
        pattern: new RegExp('\\d'),
        symbol: 'X',
    },
};
```

### prefix (string)

You can add prefix to you masked value

#### Usage

```html
<input type="text" prefix="+7" mask="(000) 000 00 00" />
```

### instantPrefix

The input property instantPrefix controls the display behavior of a prefix in the input.

When set to true, the prefix is displayed even if the model is empty.
When set to false, the prefix only becomes visible when a value is present in the model.

#### Usage

```html
<input type="text" prefix="+7" instantPrefix="false" mask="(000) 000 00 00" />
<input type="text" prefix="+7" instantPrefix="true" mask="(000) 000 00 00" />
```

### suffix (string)

You can add suffix to you masked value

#### Usage

```html
<input type="text" suffix="$" mask="0000" />
```

### dropSpecialCharacters (boolean | string[])

You can choose if mask will drop special character in the model, or not, default value is `true`.

#### Usage

```html
<input type="text" [dropSpecialCharacters]="false" mask="000-000.00" />
```

##### Then

```text
Input value: 789-874.98
Model value: 789-874.98
```

### showMaskTyped (boolean)

You can choose if mask is shown while typing, or not, default value is `false`.

#### Usage

```html
<input mask="(000) 000-0000" prefix="+7" [showMaskTyped]="true" />
```

### allowNegativeNumbers (boolean)

You can choose if mask will allow the use of negative numbers. The default value is `false`.

#### Usage

```html
<input type="text" [allowNegativeNumbers]="true" mask="separator.2" />
```

##### Then

```text
Input value: -10,000.45
Model value: -10000.45
```

### placeHolderCharacter (string)

If the `showMaskTyped` parameter is enabled, this setting customizes the character used as placeholder. Default value is `_`.

#### Usage

```html
<input mask="(000) 000-0000" prefix="+7" [showMaskTyped]="true" placeHolderCharacter="*" />
```

### clearIfNotMatch (boolean)

You can choose clear the input if the input value **not match** the mask, default value is `false`.

### typeFromDecimals (boolean)

Opt-in "banking" typing mode for separator masks with a fixed precision (`separator.N`, N > 0). When enabled, typed digits fill the value from the decimal end, ATM/calculator style: typing `5` shows `0.05`, then `7` shows `0.57`, then `3` shows `5.73`. Backspace shifts digits back to the right (`5.73` → `0.57`). Pasted values and values written from the model keep the regular separator formatting. Works together with `thousandSeparator`, `prefix`/`suffix`, `allowNegativeNumbers` and `separatorLimit`. Default value is `false`.

#### Usage

```html
<input type="text" mask="separator.2" [typeFromDecimals]="true" thousandSeparator="," />
<!-- typing 1 2 3 4 5 6 renders: 0.01 → 0.12 → 1.23 → 12.34 → 123.45 → 1,234.56 -->
```

It can also be enabled application-wide via the provider config (the directive input wins when both are set):

```typescript
provideNgxMask({ typeFromDecimals: true });
```

The displayed value always carries the full precision while typing — that is inherent to the mode.

### defaultValueOnBlur (string)

When set, the given raw value is written through the regular mask pipeline on blur whenever the control's unmasked value is empty (an empty input, a bare prefix/suffix, or the untouched `showMaskTyped` skeleton). The display shows the masked default, the model receives the usual output (`dropSpecialCharacters` / `outputTransformFn` applied), and the write does not mark the form dirty. Default value is `null` (current behavior — empty inputs stay empty).

#### Usage

```html
<input type="text" mask="separator.2" defaultValueOnBlur="0" />
```

```text
User clears the input and blurs
Displayed value: 0
Model value: 0
```

With `showMaskTyped` the default fills the leading mask slots and the placeholder skeleton covers the rest:

```html
<input type="text" mask="0000" [showMaskTyped]="true" defaultValueOnBlur="9" />
```

```text
User blurs the empty input
Displayed value: 9___
Model value: 9
```

It can also be set application-wide via the provider config: `provideNgxMask({ defaultValueOnBlur: '0' })`.

If you need conditional or computed defaults instead of a fixed value, combine `inputTransformFn` / `outputTransformFn` programmatically:

```typescript
// Model side: never emit an empty value
public outputTransformFn = (value: string | number | undefined | null) => (value === '' || value == null ? 0 : value);

// View side: render empty incoming model values as '0'
public inputTransformFn = (value: unknown) => (value === '' || value == null ? '0' : (value as string | number));
```

### Pipe with mask expression and custom Pattern ([string, pattern])

You can pass array of expression and custom Pattern to pipe.

#### Usage

```html
<span>{{phone | mask: customMask}}</span>
```

and in your component

```typescript
customMask: [string, pattern];

pattern = {
    P: {
        pattern: new RegExp('\\d'),
    },
};

this.customMask = ['PPP-PPP', this.pattern];
```

### Repeat mask

You can pass into mask pattern with brackets.

#### Usage

```html
<input type="text" mask="A{4}" />
```

### Thousand separator

You can divide your input by thousands, by default will seperate with a space.

#### Usage

```html
<input type="text" mask="separator" />
```

For separate input with dots.

```html
<input type="text" mask="separator" thousandSeparator="." />
```

For using decimals enter `.` and how many decimals to the end of your input to `separator` mask.

```html
<input type="text" mask="separator.2" />
```

```text
Input value: 1234.56
Masked value: 1 234.56

Input value: 1234,56
Masked value: 1.234,56

Input value: 1234.56
Masked value: 1,234.56
```

```html
<input type="text" mask="separator.2" thousandSeparator="." />
<input type="text" mask="separator.2" thousandSeparator="," />
<input type="text" mask="separator.0" thousandSeparator="." />
<input type="text" mask="separator.0" thousandSeparator="," />
```

For limiting decimal precision add `.` and the precision you want to limit too on the input. **2** is useful for currency. **0** will prevent decimals completely.

```text
Input value: 1234,56
Masked value: 1.234,56

Input value: 1234.56
Masked value: 1,234.56

Input value: 1234,56
Masked value: 1.234

Input value: 1234.56
Masked value: 1,234
```

```html
<input type="text" mask="separator.2" [leadZero]="true" />
```

To add zeros to the model at the end

```text
Input value: 12
Masked value: 12.00

Input value: 12.1
Masked value: 12.10
```

```html
<input type="text" mask="separator.2" separatorLimit="1000" />
```

For limiting the number of digits before the decimal point you can set `separatorLimit` value to _10_, _100_, _1000_ etc.

```text
Input value: 12345678,56
Masked value: 1.234,56
```

On a `separator` mask with `decimalMarker=","` (e.g. `thousandSeparator="."`) the numeric keypad decimal key inserts `,`; a `.` typed on the main keyboard keeps its normal behavior.

### Time validation

You can validate your input as 24 hour format.

#### Usage

```html
<input type="text" mask="Hh:m0:s0" />
```

### Date validation

You can validate your date.

#### Usage

```html
<input type="text" mask="d0/M0/0000" />
```

### leadZeroDateTime (boolean)

If the `leadZeroDateTime` parameter is `true`, skipped symbols of date or time will be replaced by `0`. Default value is `false`.

#### Usage

```html
<input type="text" mask="d0/M0/0000" [leadZeroDateTime]="true" />
```

```text
Input value: 422020
Masked value: 04/02/2020
```

```html
<input type="text" mask="Hh:m0:s0" [leadZeroDateTime]="true" />
```

```text
Input value: 777
Masked value: 07:07:07
```

### Percent validation

You can validate your input for percents.

#### Usage

```html
<input type="text" mask="percent" suffix="%" />
```

`percent` also works with several decimal markers, e.g. `[decimalMarker]="['.', ',']"` accepts both `12.5` and `12,5`.

### FormControl validation

You can validate your `formControl`, default value is `true`.

#### Usage

```html
<input type="text" mask="00 00" [validation]="true" />
```

### Secure input

You can hide symbols in input field and get the actual value in `formcontrol`.

#### Usage

```html
<input placeholder="Secure input" [hiddenInput]="true" mask="XXX/X0/0000" />
```

Day (`d`) and month (`M`) tokens can also be concealed, e.g. to hide the day and month of a date while keeping the year visible:

```html
<input placeholder="Secure date input" [hiddenInput]="true" mask="d0/M0/0000" />
```

### IP valid mask

#### Usage

```html
<input mask="IP" />
```

### CPF_CNPJ valid mask

#### Usage

```html
<input mask="CPF_CNPJ" />
```

### CPF_CNPJ_ALPHA valid mask

#### Usage

```html
<input mask="CPF_CNPJ_ALPHA" />
```

### Allow few mask in one expression

#### Usage

You can pass into mask pattern with `||`.

```html
<input mask="000.000.000-00||00.000.000/0000-00" />
```

```html
<input mask="(00) 0000-0000||(00) 0 0000-0000" />
```

```html
<input mask="00||SS" />
```

### Custom mask aliases

#### Usage

You can define your own named masks once in the config and reference them by name in the `mask` input or the `mask` pipe. Aliases are resolved before any other mask processing, so an alias may also expand to a `||` multi-mask expression.

```typescript
provideNgxMask({
    maskAliases: {
        PHONE_BR: '(00) 00000-0000',
        MY_DOC: '000-AAA||0000-AAA',
    },
});
```

```html
<input mask="PHONE_BR" /> <input mask="MY_DOC" />
```

Alias keys should be written in UPPER_SNAKE case. They must not shadow the built-in tokens (`IP`, `CPF_CNPJ`, `CPF_CNPJ_ALPHA`, ...) — such aliases are ignored with a one-time console warning and the built-in mask wins. The alias map is resolved at the DI-config level, so it is static per injector: changing it at runtime is not supported.

Security note: alias values are mask expressions evaluated by the library, at the same trust level as the `mask` attribute itself. Define them statically in your application code and never feed untrusted user input into `maskAliases` values.

### Function maskFilled

#### Usage

```html
<input mask="0000" (maskFilled)="maskFilled()" />
```
