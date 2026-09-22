<h1 align="center">ngx-mask</h1>

<p align="center">
A powerful Angular directive for input masking with customizable patterns
</p>

<p align="center">
  <a href="https://github.com/NepipenkoIgor/ngx-mask/actions/workflows/quality-check.yml">
    <img src="https://github.com/NepipenkoIgor/ngx-mask/actions/workflows/quality-check.yml/badge.svg?branch=develop" alt="CI">
  </a>
  <a href="https://www.npmjs.com/package/ngx-mask">
    <img src="https://img.shields.io/npm/v/ngx-mask.svg" alt="npm version">
  </a>
  <a href="https://npmjs.org/ngx-mask">
    <img src="https://img.shields.io/npm/dt/ngx-mask.svg" alt="npm downloads">
  </a>
  <a href="https://www.npmjs.com/package/ngx-mask">
    <img src="https://img.shields.io/npm/dm/ngx-mask.svg" alt="npm monthly downloads">
  </a>
  <a href="https://bundlephobia.com/package/ngx-mask">
    <img src="https://img.shields.io/bundlephobia/minzip/ngx-mask.svg" alt="Bundle size">
  </a>
  <a href="https://www.npmjs.com/package/ngx-mask">
    <img src="https://img.shields.io/npm/types/ngx-mask.svg" alt="TypeScript support">
  </a>
  <a href="https://github.com/NepipenkoIgor/ngx-mask/blob/develop/LICENSE">
    <img src="https://img.shields.io/npm/l/ngx-mask.svg" alt="License">
  </a>
  <a href="https://github.com/NepipenkoIgor/ngx-mask">
    <img src="https://img.shields.io/github/contributors/NepipenkoIgor/ngx-mask.svg?style=flat" alt="GitHub contributors">
  </a>
  <a href="https://github.com/NepipenkoIgor/ngx-mask">
    <img src="https://img.shields.io/github/stars/NepipenkoIgor/ngx-mask.svg?label=GitHub%20Stars&style=flat" alt="GitHub Stars">
  </a>
</p>

`ngx-mask` is the input-masking library built for modern Angular. One standalone directive (`NgxMaskDirective`) and pipe (`NgxMaskPipe`) cover all three form models — **Reactive Forms, template-driven, and the new Signal Forms** — through a first-class `ControlValueAccessor`, and run cleanly in **zoneless** and SSR applications. You get production-ready masks out of the box: dates and times with validity checking, numbers with thousand separators and decimal precision, IP, CPF/CNPJ, secure/hidden input, plus fully custom patterns with prefixes, suffixes and multi-mask expressions. No runtime dependencies beyond Angular, ~15 KB gzipped — provide it once, bind `mask`, done.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Version Compatibility](#version-compatibility)
- [Quick Start](#quick-start)
    - [Standalone Applications](#standalone-applications)
    - [NgModule-based Applications](#ngmodule-based-applications)
- [For AI Agents](#for-ai-agents)
- [Contributing](#contributing)

## Features

NGX-MASK is a feature-rich input mask directive for Angular applications that provides:

<table>
<tr>
<td width="33%" valign="top">

### 🎯 Masking Patterns

• Custom patterns & expressions

• Multiple mask patterns (|)

• Built-in common patterns

• Prefix & suffix support

</td>
<td width="33%" valign="top">

### 🔢 Number Formatting

• Thousand separators

• Decimal markers

• Negative numbers

• Leading zeros

</td>
<td width="33%" valign="top">

### ⚡ Input Control

• Real-time validation

• Clear on non-match

• Show/hide mask typing

• Keep character positions

</td>
</tr>
<tr>
<td width="33%" valign="top">

### 📅 Date & Time

• Leading zero handling

• AM/PM support

• Custom separators

• Multiple formats

</td>
<td width="33%" valign="top">

### 🛠️ Customization

• Custom placeholders

• Special characters

• Transform functions

• Custom validation

</td>
<td width="33%" valign="top">

### 📋 Form Integration

• Reactive Forms

• ControlValueAccessor

• Built-in validation

• Standalone support

</td>
</tr>
</table>

## Demo

Check out our [live documentation and examples](https://nepipenkoigor.github.io/ngx-mask/)

## Installation

```bash
# For Angular 17 and above
$ npm install ngx-mask    # Using npm
$ bun add ngx-mask       # Using bun

# For specific Angular versions:
# Angular 16.x.x
$ npm install ngx-mask@16.4.2    # Using npm
$ bun add ngx-mask@16.4.2       # Using bun

# Angular 15.x.x
$ npm install ngx-mask@15.2.3    # Using npm
$ bun add ngx-mask@15.2.3       # Using bun

# Angular 14.x.x
$ npm install ngx-mask@14.3.3    # Using npm
$ bun add ngx-mask@14.3.3       # Using bun

# Angular 13.x.x or 12.x.x
$ npm install ngx-mask@13.2.2    # Using npm
$ bun add ngx-mask@13.2.2       # Using bun
```

> **Package Manager Note**: You can use either npm or bun based on your preference. Both package managers will work equally well with ngx-mask.

## Version Compatibility

NGX-MASK follows Angular's official support policy, supporting Active and LTS versions. Currently supported:

- Angular 17 and newer (latest features and updates)
- For older Angular versions, use the corresponding NGX-MASK version as specified above

> **Note**: Versions for Angular older than v17 will not receive new features or updates.

## Quick Start

`ngx-mask` ships as a standalone directive (`NgxMaskDirective`) and pipe (`NgxMaskPipe`) — there is no `NgxMaskModule` in current versions. Configuration is registered through one of two provider functions:

- **`provideEnvironmentNgxMask(config?)`** — application-wide config. Use it once in `bootstrapApplication` / `app.config.ts` (or a root `NgModule`'s `providers`).
- **`provideNgxMask(config?)`** — injector-level config. Use it in a component's or feature's `providers` to configure/override the options for that subtree only.

Directive inputs (e.g. `[thousandSeparator]`) always override any provider config. See [USAGE.md](USAGE.md#configuration) for the full decision guide, examples, and common pitfalls.

### Standalone Applications

#### Application-wide Setup with Default Config

```typescript
bootstrapApplication(AppComponent, { providers: [provideEnvironmentNgxMask()] }).catch((err) =>
    console.error(err)
);
```

#### With Custom Configuration

```typescript
import { NgxMaskConfig } from 'ngx-mask';

const maskConfig: Partial<NgxMaskConfig> = { validation: false };

bootstrapApplication(AppComponent, { providers: [provideEnvironmentNgxMask(maskConfig)] }).catch(
    (err) => console.error(err)
);
```

#### Feature-level Configuration

```typescript
@Component({
    selector: 'my-feature',
    standalone: true,
    imports: [NgxMaskDirective],
    providers: [provideNgxMask()],
})
export class MyFeatureComponent {}
```

### NgModule-based Applications

Module-based apps import the standalone directive/pipe into `imports` and register the provider function:

```typescript
import { NgxMaskDirective, NgxMaskPipe, provideEnvironmentNgxMask } from 'ngx-mask';

@NgModule({
    imports: [NgxMaskDirective, NgxMaskPipe],
    exports: [NgxMaskDirective, NgxMaskPipe],
    providers: [provideEnvironmentNgxMask()],
})
export class AppModule {}
```

#### Migrating from ngx-mask ≤ 14 (`NgxMaskModule`)

`NgxMaskModule.forRoot()` / `forChild()` only exist in ngx-mask 14.x and older (Angular < 15):

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

## For AI Agents

ngx-mask ships an [`llms.txt`](llms.txt) (index) and [`llms-full.txt`](llms-full.txt) (full API reference with inline code snippets), following the [llmstxt.org](https://llmstxt.org) convention, so tools like Claude Code, Codex and other coding agents can ground themselves in the current API without guessing. The library is also indexed on [Context7](https://context7.com/nepipenkoigor/ngx-mask) for MCP-based doc retrieval.

## Contributing

We welcome contributions! Please read our [contributing guidelines](CONTRIBUTING.md) to learn about our development process and how you can propose bugfixes and improvements.

---

<p align="center">Maintained by <a href="https://software.novines.eu">Igor Nepipenko</a></p>
