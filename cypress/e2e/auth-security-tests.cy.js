/**
 * Combined Authentication & Security Tests
 * 
 * This test suite combines:
 * - Authentication Tests
 * - Security Tests
 * - Access Control Tests
 * - Session Management Tests
 */

describe('Authentication & Login', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.get('form').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('invalid@email.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should login successfully with valid credentials', () => {
    cy.login('admin@aerosuite.com', 'admin123');
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.login();
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();
    cy.url().should('include', '/login');
  });
});

describe('Protected Routes & Access Control', () => {
  it('should redirect to login when accessing protected route without auth', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should allow access to protected routes when authenticated', () => {
    cy.login();
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });

  it('should enforce role-based access control', () => {
    // Test admin access
    cy.login('admin@aerosuite.com', 'admin123');
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    
    // Test regular user access (should be denied)
    cy.login('user@aerosuite.com', 'user123');
    cy.visit('/admin');
    cy.url().should('not.include', '/admin');
  });
});

describe('Session Management', () => {
  it('should persist session on page reload', () => {
    cy.login();
    cy.reload();
    cy.url().should('include', '/dashboard');
  });

  it('should handle session timeout gracefully', () => {
    cy.login();
    // Simulate expired token
    cy.window().then((win) => {
      win.localStorage.removeItem('token');
    });
    cy.reload();
    cy.url().should('include', '/login');
  });

  it('should maintain session across page navigation', () => {
    cy.login();
    cy.visit('/dashboard');
    cy.visit('/inspections');
    cy.visit('/suppliers');
    cy.url().should('include', '/suppliers');
    cy.get('body').should('not.contain', 'Please log in');
  });
});

describe('Security Features', () => {
  it('should enforce password policies', () => {
    cy.visit('/register');
    
    // Test weak password
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('123');
    cy.get('button[type="submit"]').click();
    cy.contains('Password must be at least 8 characters').should('be.visible');
    
    // Test strong password
    cy.get('input[name="password"]').clear().type('StrongP@ss123');
    cy.get('button[type="submit"]').click();
    cy.contains('Password must be at least 8 characters').should('not.exist');
  });

  it('should protect against XSS attacks', () => {
    cy.login();
    cy.visit('/profile');
    
    // Attempt XSS in name field
    cy.get('input[name="name"]').clear().type('<script>alert("XSS")</script>');
    cy.get('button[type="submit"]').click();
    
    // Check that the script tag is escaped
    cy.visit('/profile');
    cy.get('body').should('not.contain', '<script>alert("XSS")</script>');
  });

  it('should protect against CSRF attacks', () => {
    cy.login();
    
    // Check for CSRF token in forms
    cy.visit('/profile');
    cy.get('form').then($form => {
      const formHtml = $form.html();
      expect(formHtml).to.match(/csrf|_token|xsrf/i);
    });
  });

  it('should implement proper HTTP security headers', () => {
    cy.request('/').then((response) => {
      const headers = response.headers;
      expect(headers).to.have.property('content-security-policy');
      expect(headers).to.have.property('x-xss-protection');
      expect(headers).to.have.property('x-content-type-options');
      expect(headers).to.have.property('strict-transport-security');
    });
  });
});
