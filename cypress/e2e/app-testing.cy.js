describe('AeroSuite Application Testing', () => {
  beforeEach(() => {
    // Seed test data before each test
    cy.seedDatabase({
      users: [
        { email: 'test@aerosuite.com', password: 'test123', role: 'admin' }
      ],
      inspections: [
        { title: 'Test Inspection', status: 'pending' }
      ]
    })
  })

  afterEach(() => {
    // Clean up test data after each test
    cy.cleanupDatabase()
  })

  describe('Home Page', () => {
    it('should load successfully', () => {
      cy.visit('/')
      cy.get('body').should('be.visible')
      cy.get('h1').should('contain', 'Welcome to AeroSuite')
    })

    it('should display server status', () => {
      cy.visit('/')
      cy.get('[data-testid="server-status"]').should('be.visible')
    })

    it('should handle loading states', () => {
      cy.intercept('GET', `${Cypress.env('apiUrl')}/api/health`, {
        delay: 2000,
        statusCode: 200,
        body: { status: 'healthy' }
      }).as('slowHealth')

      cy.visit('/')
      cy.get('[data-testid="loading"]').should('be.visible')
      cy.wait('@slowHealth')
      cy.get('[data-testid="loading"]').should('not.exist')
    })
  })

  describe('Authentication', () => {
    it('should login successfully with valid credentials', () => {
      cy.login('test@aerosuite.com', 'test123')
      cy.url().should('not.include', '/login')
      cy.get('body').should('contain', 'Welcome')
    })

    it('should show error with invalid credentials', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('invalid@example.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    it('should maintain session across page reloads', () => {
      cy.login('test@aerosuite.com', 'test123')
      cy.reload()
      cy.url().should('not.include', '/login')
    })
  })

  describe('API Integration', () => {
    it('should fetch and display inspections', () => {
      cy.intercept('GET', `${Cypress.env('apiUrl')}/api/inspections`, {
        statusCode: 200,
        body: [
          { id: 1, title: 'Test Inspection', status: 'pending' }
        ]
      }).as('getInspections')

      cy.visit('/inspections')
      cy.wait('@getInspections')
      cy.get('[data-testid="inspection-item"]').should('have.length', 1)
    })

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', `${Cypress.env('apiUrl')}/api/inspections`, {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('apiError')

      cy.visit('/inspections')
      cy.wait('@apiError')
      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    it('should create new inspection', () => {
      cy.login('test@aerosuite.com', 'test123')
      
      cy.intercept('POST', `${Cypress.env('apiUrl')}/api/inspections`, {
        statusCode: 201,
        body: { id: 2, title: 'New Inspection', status: 'pending' }
      }).as('createInspection')

      cy.visit('/inspections/new')
      cy.get('input[name="title"]').type('New Inspection')
      cy.get('button[type="submit"]').click()
      cy.wait('@createInspection')
      cy.url().should('include', '/inspections')
    })
  })

  describe('User Interface', () => {
    it('should be responsive on different screen sizes', () => {
      cy.viewport(375, 667) // Mobile
      cy.visit('/')
      cy.get('body').should('be.visible')

      cy.viewport(768, 1024) // Tablet
      cy.visit('/')
      cy.get('body').should('be.visible')

      cy.viewport(1920, 1080) // Desktop
      cy.visit('/')
      cy.get('body').should('be.visible')
    })

    it('should handle keyboard navigation', () => {
      cy.visit('/')
      cy.get('body').type('{tab}')
      cy.focused().should('exist')
    })

    it('should handle form validation', () => {
      cy.visit('/inspections/new')
      cy.get('button[type="submit"]').click()
      cy.get('[data-testid="validation-error"]').should('be.visible')
    })
  })

  describe('Performance', () => {
    it('should load within acceptable time', () => {
      cy.visit('/', { timeout: 10000 })
      cy.get('body').should('be.visible')
    })

    it('should handle large datasets', () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Inspection ${i + 1}`,
        status: 'pending'
      }))

      cy.intercept('GET', `${Cypress.env('apiUrl')}/api/inspections`, {
        statusCode: 200,
        body: largeDataset
      }).as('getLargeDataset')

      cy.visit('/inspections')
      cy.wait('@getLargeDataset')
      cy.get('[data-testid="inspection-item"]').should('have.length', 100)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      cy.intercept('GET', `${Cypress.env('apiUrl')}/api/health`, {
        forceNetworkError: true
      }).as('networkError')

      cy.visit('/')
      cy.wait('@networkError')
      cy.get('[data-testid="error-message"]').should('be.visible')
    })

    it('should handle 404 errors', () => {
      cy.visit('/nonexistent-page')
      cy.get('body').should('contain', '404')
    })

    it('should handle server errors', () => {
      cy.intercept('GET', `${Cypress.env('apiUrl')}/api/health`, {
        statusCode: 503,
        body: { error: 'Service Unavailable' }
      }).as('serverError')

      cy.visit('/')
      cy.wait('@serverError')
      cy.get('[data-testid="error-message"]').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.visit('/')
      cy.get('[aria-label]').should('exist')
    })

    it('should have proper heading structure', () => {
      cy.visit('/')
      cy.get('h1').should('exist')
    })

    it('should be keyboard navigable', () => {
      cy.visit('/')
      cy.get('body').type('{tab}')
      cy.focused().should('exist')
    })
  })
}) 