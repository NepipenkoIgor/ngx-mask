import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
import { userEvent } from 'vitest/browser';

/**
 * Real-browser test helper (Vitest browser mode + Playwright).
 *
 * Keys are typed with a real keyboard, so every `input`, `selectionStart` and focus behaviour is
 * the one a user gets. Key sequences use the `userEvent.keyboard` syntax (`{Backspace}`,
 * `{ArrowLeft}`, `{Delete}`).
 */
export type Mounted<T> = {
    readonly fixture: ComponentFixture<T>;
    readonly component: T;
    /** Query an element of the mounted component (throws when it does not exist). */
    get(selector: string): HTMLInputElement;
    /** Text content of an element after a change-detection pass. */
    text(selector: string): string;
    /** Type with the real keyboard; focuses the element and puts the caret at the end first. */
    type(selector: string, keys: string): Promise<void>;
    /** Select the whole content and delete it. */
    clear(selector: string): Promise<void>;
    click(selector: string): Promise<void>;
    focus(selector: string): void;
    blur(selector: string): Promise<void>;
    /** Set the DOM selection (the element keeps/gets the focus). */
    select(selector: string, start: number, end: number): void;
    selectAll(selector: string): void;
    /** Simulate a programmatic paste: set the DOM value and dispatch `input`. */
    setValue(selector: string, value: string): Promise<void>;
    /** Wait until pending change detection, microtasks and animation frames are flushed. */
    settle(): Promise<void>;
};

const nextFrame = (): Promise<void> =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

export async function mount<T>(
    type: Type<T>,
    inputs: Record<string, unknown> = {}
): Promise<Mounted<T>> {
    const fixture = TestBed.createComponent(type);
    for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value);
    }

    const root = fixture.nativeElement as HTMLElement;

    const settle = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        // two frames: the directive's afterNextRender callbacks may chain another render
        await nextFrame();
        await nextFrame();
        fixture.detectChanges();
        await fixture.whenStable();
    };

    const get = (selector: string): HTMLInputElement => {
        const element = root.querySelector<HTMLInputElement>(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }
        return element;
    };

    await settle();

    return {
        fixture,
        component: fixture.componentInstance,
        get,
        text: (selector) => {
            fixture.detectChanges();
            return get(selector).textContent;
        },
        type: async (selector, keys) => {
            const element = get(selector);
            if (document.activeElement !== element) {
                // focus + a click event, caret left where the browser put it (the end of the value;
                // the directive moves it itself when the field only holds the mask skeleton)
                element.focus();
                element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
            await userEvent.keyboard(keys);
            await settle();
        },
        clear: async (selector) => {
            const element = get(selector);
            element.focus();
            element.select();
            await userEvent.keyboard('{Delete}');
            await settle();
        },
        click: async (selector) => {
            await userEvent.click(get(selector));
            await settle();
        },
        focus: (selector) => {
            get(selector).focus();
        },
        blur: async (selector) => {
            get(selector).blur();
            await settle();
        },
        select: (selector, start, end) => {
            const element = get(selector);
            element.focus();
            element.setSelectionRange(start, end);
        },
        selectAll: (selector) => {
            const element = get(selector);
            element.focus();
            element.select();
        },
        setValue: async (selector, value) => {
            const element = get(selector);
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await settle();
        },
        settle,
    };
}

/** Puts `text` on the real clipboard by copying it out of a throwaway input. */
export async function copyToClipboard(text: string): Promise<void> {
    const scratch = document.createElement('input');
    document.body.appendChild(scratch);
    try {
        scratch.value = text;
        scratch.focus();
        scratch.select();
        await userEvent.copy();
    } finally {
        scratch.remove();
    }
}
