// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global before hook for authentication if needed
beforeEach(() => {
  // Clear cookies and local storage before each test
  cy.clearCookies()
  cy.clearLocalStorage()
})

// Disable uncaught exception handling to prevent tests from failing
// due to application errors
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})