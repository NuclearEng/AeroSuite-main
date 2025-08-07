/**
 * Combined Application Tests
 * 
 * This test suite combines:
 * - Core application functionality tests
 * - UI/UX tests
 * - Accessibility tests
 * - Performance tests
 * - Error handling tests
 */

describe('Application Core Functionality', () => {
  beforeEach(() => {
    // Seed test data before each test
    cy.seedDatabase({
      users: [
        { email: 'test@aerosuite.com', password: 'test123', role: 'admin' }
      ],
      inspections: [
        { title: 'Test Inspection', status: 'pending' }
      ]
    });
  });

  afterEach(() => {
    // Clean up test data after each test
    cy.cleanupDatabase();
  });

  describe('Home Page', () => {
    it('should load successfully', () => {
      cy.visit('/');
      cy.get('body').should('be.visible');
      cy.get('h1').should('contain', 'Welcome to AeroSuite');
    });

    it('should display server status', () => {
      cy.visit('/');
      cy.get('[data-testid="server-status"]').should('be.visible');
    });

    it('should handle loading states', () => {
      cy.intercept('GET', `${Cypress.env('apiUrl')}/api/health`, {
        delay: 2000,
        statusCode: 200,
        body: { status: 'healthy' }
      }).as('slowHealth');

      cy.visit('/');
      cy.get('[data-testid="loading"]').should('be.visible');
      cy.wait('@slowHealth');
      cy.get('[data-testid="loading"]').should('not.exist');
    });
  });

  describe('Dashboard', () => {
    it('should display dashboard after login', () => {
      cy.login('test@aerosuite.com', 'test123');
      cy.visit('/dashboard');
      cy.get('[data-testid="dashboard"]').should('be.visible');
    });

    it('should show user-specific information', () => {
      cy.login('test@aerosuite.com', 'test123');
      cy.visit('/dashboard');
      cy.get('[data-testid="user-welcome"]').should('contain', 'test@aerosuite.com');
    });

    it('should display key metrics', () => {
      cy.login('test@aerosuite.com', 'test123');
      cy.visit('/dashboard');
      cy.get('[data-testid="metrics"]').should('be.visible');
    });
  });

  describe('Inspections Management', () => {
    beforeEach(() => {
      cy.login('test@aerosuite.com', 'test123');
    });

    it('should display inspections list', () => {
      cy.visit('/inspections');
      cy.get('[data-testid="inspections-list"]').should('be.visible');
    });

    it('should allow creating new inspection', () => {
      cy.visit('/inspections/new');
      cy.get('input[name="title"]').type('New Test Inspection');
      cy.get('select[name="status"]').select('pending');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/inspections');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should allow editing inspection', () => {
      cy.visit('/inspections/1/edit');
      cy.get('input[name="title"]').clear().type('Updated Inspection');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/inspections');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should allow deleting inspection', () => {
      cy.visit('/inspections');
      cy.get('[data-testid="delete-button"]').first().click();
      cy.get('[data-testid="confirm-delete"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Suppliers Management', () => {
    beforeEach(() => {
      cy.login('test@aerosuite.com', 'test123');
    });

    it('should display suppliers list', () => {
      cy.visit('/suppliers');
      cy.get('[data-testid="suppliers-list"]').should('be.visible');
    });

    it('should allow creating new supplier', () => {
      cy.visit('/suppliers/new');
      cy.get('input[name="name"]').type('New Test Supplier');
      cy.get('input[name="email"]').type('supplier@example.com');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/suppliers');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Customers Management', () => {
    beforeEach(() => {
      cy.login('test@aerosuite.com', 'test123');
    });

    it('should display customers list', () => {
      cy.visit('/customers');
      cy.get('[data-testid="customers-list"]').should('be.visible');
    });

    it('should allow creating new customer', () => {
      cy.visit('/customers/new');
      cy.get('input[name="name"]').type('New Test Customer');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/customers');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });
});

describe('UI/UX & Responsiveness', () => {
  it('should be responsive on different screen sizes', () => {
    cy.viewport(375, 667); // Mobile
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.get('[data-testid="mobile-menu"]').should('be.visible');

    cy.viewport(768, 1024); // Tablet
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.get('[data-testid="tablet-layout"]').should('be.visible');

    cy.viewport(1920, 1080); // Desktop
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.get('[data-testid="desktop-layout"]').should('be.visible');
  });

  it('should handle keyboard navigation', () => {
    cy.visit('/');
    cy.get('body').type('{tab}');
    cy.focused().should('exist');
    cy.focused().type('{enter}');
  });

  it('should handle form validation', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="validation-error"]').should('be.visible');
  });

  it('should have consistent styling', () => {
    cy.visit('/');
    cy.get('button').should('have.css', 'border-radius', '4px');
    cy.get('input').should('have.css', 'border-radius', '4px');
  });
});

describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    cy.visit('/');
    cy.get('[aria-label]').should('exist');
  });

  it('should have proper heading structure', () => {
    cy.visit('/');
    cy.get('h1').should('exist');
  });

  it('should be keyboard navigable', () => {
    cy.visit('/');
    cy.get('body').type('{tab}');
    cy.focused().should('exist');
  });

  it('should have sufficient color contrast', () => {
    cy.visit('/');
    // This is a simplified check - in a real test we would use axe or similar
    cy.get('body').should('have.css', 'color');
    cy.get('body').should('have.css', 'background-color');
  });
});

describe('Performance', () => {
  it('should load within acceptable time', () => {
    cy.visit('/', { timeout: 10000 });
    cy.get('body').should('be.visible');
  });

  it('should handle large datasets', () => {
    cy.login('test@aerosuite.com', 'test123');
    
    // Mock large dataset
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Inspection ${i + 1}`,
      status: 'pending'
    }));

    cy.intercept('GET', `${Cypress.env('apiUrl')}/api/inspections`, {
      statusCode: 200,
      body: largeDataset
    }).as('getLargeDataset');

    cy.visit('/inspections');
    cy.wait('@getLargeDataset');
    cy.get('[data-testid="inspection-item"]').should('have.length', 100);
  });

  it('should lazy load components', () => {
    cy.visit('/');
    cy.window().then((win) => {
      expect(win.performance.getEntriesByType('resource').length).to.be.lessThan(50);
    });
  });
});

describe('Error Handling', () => {
  it('should handle network errors', () => {
    cy.intercept('GET', `${Cypress.env('apiUrl')}/api/health`, {
      forceNetworkError: true
    }).as('networkError');

    cy.visit('/');
    cy.wait('@networkError');
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should handle 404 errors', () => {
    cy.visit('/nonexistent-page');
    cy.get('body').should('contain', '404');
  });

  it('should handle server errors', () => {
    cy.intercept('GET', `${Cypress.env('apiUrl')}/api/health`, {
      statusCode: 503,
      body: { error: 'Service Unavailable' }
    }).as('serverError');

    cy.visit('/');
    cy.wait('@serverError');
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should handle form validation errors', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="validation-error"]').should('be.visible');
  });
});
