describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Login', () => {
    it('should display login form', () => {
      cy.visit('/login')
      cy.get('form').should('be.visible')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('invalid@email.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      cy.contains('Invalid credentials').should('be.visible')
      cy.url().should('include', '/login')
    })

    it('should login successfully with valid credentials', () => {
      cy.login('admin@aerosuite.com', 'admin123')
      cy.url().should('include', '/dashboard')
      cy.contains('Dashboard').should('be.visible')
    })

    it('should logout successfully', () => {
      cy.login()
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      cy.url().should('include', '/login')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })

    it('should allow access to protected routes when authenticated', () => {
      cy.login()
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Session Management', () => {
    it('should persist session on page reload', () => {
      cy.login()
      cy.reload()
      cy.url().should('include', '/dashboard')
    })

    it('should handle session timeout gracefully', () => {
      cy.login()
      // Simulate expired token
      cy.window().then((win) => {
        win.localStorage.removeItem('token')
      })
      cy.reload()
      cy.url().should('include', '/login')
    })
  })
})