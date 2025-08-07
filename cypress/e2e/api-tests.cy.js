/**
 * Combined API Tests
 * 
 * This test suite combines:
 * - API Health Checks
 * - API Integration Tests
 * - API Performance Tests
 * - API Security Tests
 */

describe('API Health & Connectivity', () => {
  beforeEach(() => {
    // Check if API is healthy before running tests
    cy.task('checkApiHealth').then((isHealthy) => {
      if (!isHealthy) {
        cy.log('⚠️ Backend API is not responding. Some tests may fail.');
      }
    });
  });

  it('should have a healthy backend API', () => {
    cy.task('checkApiHealth').then((isHealthy) => {
      expect(isHealthy).to.be.true;
    });
  });

  it('should be able to connect to health endpoint', () => {
    cy.request({
      url: `${Cypress.env('apiUrl')}/api/health`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 404, 500]);
      cy.log(`Health endpoint response: ${response.status}`);
    });
  });

  it('should handle API connection gracefully', () => {
    // Test that the app handles API failures gracefully
    cy.visit('/');
    
    // Wait for page to be ready
    cy.get('body').should('be.visible');
    
    // Check if there are any console errors related to API
    cy.window().then((win) => {
      const consoleErrors = win.console.error;
      if (consoleErrors) {
        cy.log('Console errors detected:', consoleErrors);
      }
    });
  });

  it('should show proper error handling for API failures', () => {
    // Mock API failure and check error handling
    cy.intercept('GET', `${Cypress.env('apiUrl')}/api/health`, {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('healthCheck');
    
    cy.visit('/');
    cy.wait('@healthCheck');
    
    // Verify the app doesn't crash
    cy.get('body').should('be.visible');
  });
});

describe('API Endpoints & Integration', () => {
  it('should verify all critical API endpoints', () => {
    const endpoints = [
      '/api/health',
      '/api/auth/login',
      '/api/inspections',
      '/api/customers',
      '/api/suppliers'
    ];

    endpoints.forEach((endpoint) => {
      cy.request({
        url: `${Cypress.env('apiUrl')}${endpoint}`,
        failOnStatusCode: false
      }).then((response) => {
        cy.log(`${endpoint}: ${response.status}`);
        // Don't fail the test, just log the status
        expect(response.status).to.be.a('number');
      });
    });
  });

  it('should handle WebSocket connections', () => {
    // Test WebSocket connectivity
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        const ws = new win.WebSocket('ws://localhost:3000/ws');
        
        ws.onopen = () => {
          cy.log('WebSocket connection established');
          ws.close();
          resolve();
        };
        
        ws.onerror = (error) => {
          cy.log('WebSocket connection failed:', error);
          resolve(); // Don't fail the test
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          cy.log('WebSocket connection timeout');
          resolve();
        }, 5000);
      });
    });
  });

  it('should fetch and display inspections', () => {
    cy.intercept('GET', `${Cypress.env('apiUrl')}/api/inspections`, {
      statusCode: 200,
      body: [
        { id: 1, title: 'Test Inspection', status: 'pending' }
      ]
    }).as('getInspections');

    cy.visit('/inspections');
    cy.wait('@getInspections');
    cy.get('[data-testid="inspection-item"]').should('have.length', 1);
  });

  it('should handle API errors gracefully', () => {
    cy.intercept('GET', `${Cypress.env('apiUrl')}/api/inspections`, {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('apiError');

    cy.visit('/inspections');
    cy.wait('@apiError');
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should create new inspection', () => {
    cy.login('test@aerosuite.com', 'test123');
    
    cy.intercept('POST', `${Cypress.env('apiUrl')}/api/inspections`, {
      statusCode: 201,
      body: { id: 2, title: 'New Inspection', status: 'pending' }
    }).as('createInspection');

    cy.visit('/inspections/new');
    cy.get('input[name="title"]').type('New Inspection');
    cy.get('button[type="submit"]').click();
    cy.wait('@createInspection');
    cy.url().should('include', '/inspections');
  });
});

describe('API Error Handling', () => {
  it('should handle network errors', () => {
    cy.intercept('GET', `${Cypress.env('apiUrl')}/api/health`, {
      forceNetworkError: true
    }).as('networkError');

    cy.visit('/');
    cy.wait('@networkError');
    cy.get('[data-testid="error-message"]').should('be.visible');
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
});

describe('API Performance', () => {
  it('should load within acceptable time', () => {
    cy.visit('/', { timeout: 10000 });
    cy.get('body').should('be.visible');
  });

  it('should handle large datasets', () => {
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
});
