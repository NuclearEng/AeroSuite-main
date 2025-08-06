// ***********************************************
// Custom Commands for AeroSuite E2E Testing
// Based on Cypress Best Practices
// https://docs.cypress.io/app/core-concepts/best-practices
// ***********************************************

// Custom command for login with session caching
Cypress.Commands.add('login', (email = 'admin@aerosuite.com', password = 'admin123') => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type(email)
      cy.get('input[name="password"]').type(password, { log: false })
      cy.get('button[type="submit"]').click()
      cy.url().should('not.include', '/login')
      // Verify login was successful
      cy.get('body').should('contain', 'Welcome')
    },
    {
      validate: () => {
        cy.getCookie('token').should('exist')
      },
      cacheAcrossSpecs: true
    }
  )
})

// Custom command for API authentication with session
Cypress.Commands.add('authenticateAPI', () => {
  cy.session('api-auth', () => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/auth/login`,
      body: {
        email: 'admin@aerosuite.com',
        password: 'admin123'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      window.localStorage.setItem('token', response.body.token)
      cy.setCookie('token', response.body.token)
    })
  })
})

// Custom command for creating test data with proper error handling
Cypress.Commands.add('createTestData', (type, data) => {
  cy.authenticateAPI()
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/${type}`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: data,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201])
    return response
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

// Custom command for database seeding
Cypress.Commands.add('seedDatabase', (data) => {
  return cy.task('seedDatabase', data)
})

// Custom command for database cleanup
Cypress.Commands.add('cleanupDatabase', () => {
  return cy.task('cleanupDatabase')
})

// Custom command for waiting for API responses
Cypress.Commands.add('waitForAPI', (method, url, alias) => {
  cy.intercept(method, url).as(alias)
  cy.wait(`@${alias}`)
})

// Custom command for checking element visibility with retry
Cypress.Commands.add('shouldBeVisible', (selector, options = {}) => {
  const defaultOptions = {
    timeout: 10000,
    retryInterval: 1000
  }
  const finalOptions = { ...defaultOptions, ...options }
  
  cy.get(selector, { timeout: finalOptions.timeout })
    .should('be.visible')
})

// Custom command for handling flaky elements
Cypress.Commands.add('getStableElement', (selector, options = {}) => {
  const defaultOptions = {
    timeout: 10000,
    retryInterval: 1000
  }
  const finalOptions = { ...defaultOptions, ...options }
  
  return cy.get(selector, { timeout: finalOptions.timeout })
    .should('exist')
    .should('be.visible')
})

// Override visit command to handle loading states
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  return originalFn(url, options).then(() => {
    // Wait for page to be ready
    cy.get('body').should('be.visible')
    // Wait for any loading spinners to disappear
    cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist')
  })
})