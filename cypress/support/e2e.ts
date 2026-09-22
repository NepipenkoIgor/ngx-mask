// E2E support file for Cypress

// Custom commands for E2E testing
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        interface Chainable {
            /**
             * Type into an input with proper mask handling
             */
            typeWithMask(
                value: string,
                options?: Partial<Cypress.TypeOptions>
            ): Chainable<JQuery<HTMLElement>>;
            /**
             * Paste value into an input
             */
            pasteValue(value: string): Chainable<JQuery<HTMLElement>>;
            /**
             * Clear input using backspace
             */
            clearWithBackspace(): Chainable<JQuery<HTMLElement>>;
        }
    }
}

Cypress.Commands.add('typeWithMask', { prevSubject: 'element' }, (subject, value, options = {}) => {
    cy.wrap(subject)
        .clear()
        .type(value, { delay: 50, ...options });
    return cy.wrap(subject);
});

Cypress.Commands.add('pasteValue', { prevSubject: 'element' }, (subject, value) => {
    cy.wrap(subject).focus();
    cy.wrap(subject).invoke('val', value);
    cy.wrap(subject).trigger('paste');
    cy.wrap(subject).trigger('input');
    return cy.wrap(subject);
});

Cypress.Commands.add('clearWithBackspace', { prevSubject: 'element' }, (subject) => {
    cy.wrap(subject).focus();
    cy.wrap(subject).type('{selectall}{backspace}');
    return cy.wrap(subject);
});

export {};
