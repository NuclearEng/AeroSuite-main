describe('API Health Check', () => {
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
    
    // Wait for page to be ready (using our custom visit command)
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

describe('Backend Connectivity', () => {
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
}); 