// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (email = 'admin@aerosuite.com', password = 'admin123') => {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
})

// Custom command for API authentication
Cypress.Commands.add('authenticateAPI', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: {
      email: 'admin@aerosuite.com',
      password: 'admin123'
    }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token)
    cy.setCookie('token', response.body.token)
  })
})

// Custom command for creating test data
Cypress.Commands.add('createTestData', (type, data) => {
  cy.authenticateAPI()
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/${type}`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: data
  })
})

// Custom command for cleaning up test data
Cypress.Commands.add('cleanupTestData', (type, id) => {
  cy.authenticateAPI()
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/api/${type}/${id}`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    failOnStatusCode: false
  })
})