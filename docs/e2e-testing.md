# End-to-End Testing Guide for AeroSuite

This document outlines the end-to-end testing strategy and implementation for the AeroSuite application.

## Overview

The AeroSuite end-to-end testing suite uses Cypress to test the complete application flow from the user interface through to the database and back. These tests verify that the entire system works as expected from a user's perspective.

## Test Structure

Our E2E tests are organized by feature area:

- **Authentication**: Login, logout, registration, password reset
- **Dashboard**: Dashboard components and navigation
- **Suppliers**: Supplier listing, creation, editing, deletion, and performance metrics
- **Customers**: Customer listing, creation, editing, deletion, and contacts management
- **Inspections**: Inspection scheduling, conducting, reporting, and analytics

## Setting Up the Testing Environment

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4.4 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/aerosuite.git
   cd aerosuite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

## Running the Tests

### Running All Tests

To run all E2E tests:

```bash
npm run test:e2e
```

This command:
1. Starts the backend server
2. Waits for the server to be ready
3. Starts the frontend application
4. Runs all Cypress tests
5. Shuts down both server and application

### Running Specific Test Suites

To run specific test suites:

```bash
# Run authentication tests
npm run cy:run:auth

# Run dashboard tests
npm run cy:run:dashboard

# Run supplier management tests
npm run cy:run:suppliers

# Run customer management tests
npm run cy:run:customers

# Run inspection management tests
npm run cy:run:inspections
```

### Opening Cypress UI

To open the Cypress UI for interactive testing:

```bash
npm run cy:open
```

## Test Data

Test data is managed through:

1. **Fixtures**: JSON files in the `cypress/fixtures` directory containing test data
2. **Dynamic Generation**: Timestamps and random values to ensure unique test data

### Available Fixtures

- `users.json`: Test user accounts
- `suppliers.json`: Supplier data
- `customers.json`: Customer data
- `inspections.json`: Inspection data

## Custom Commands

We've extended Cypress with several custom commands to simplify test writing:

| Command | Description |
|---------|-------------|
| `cy.login()` | Log in with default or specified credentials |
| `cy.apiLogin()` | Log in via API for faster tests |
| `cy.navigateTo()` | Navigate to a specific module |
| `cy.waitForData()` | Wait for data loading to complete |
| `cy.fillForm()` | Fill a form with the provided data object |
| `cy.assertToast()` | Assert that a toast notification appeared |
| `cy.screenshotWithName()` | Take a named screenshot for visual testing |

## Continuous Integration

Our E2E tests run automatically in CI using GitHub Actions:

- On pull requests to main/master branches
- On direct pushes to main/master branches
- Manually via workflow dispatch

### CI Workflow

The CI workflow:

1. Sets up the test environment with MongoDB
2. Installs dependencies
3. Starts server and client applications
4. Runs tests in parallel across multiple workers
5. Captures screenshots and videos of test runs
6. Generates a comprehensive HTML report
7. Publishes reports to GitHub Pages

## Best Practices

### Writing Tests

1. **Isolation**: Each test should be independent of others
2. **Data Management**: Create and clean up test data properly
3. **Selectors**: Use `data-testid` attributes for stable selectors
4. **Assertions**: Be specific in assertions to catch regressions

### Example Test Structure

```javascript
describe('Feature', () => {
  beforeEach(() => {
    // Set up test environment
    cy.apiLogin();
    cy.visit('/feature-area');
    cy.waitForData();
  });

  it('should perform expected action', () => {
    // Interact with the application
    cy.get('[data-testid="element"]').click();
    
    // Assert expected outcomes
    cy.url().should('include', '/expected-path');
    cy.get('[data-testid="result"]').should('contain', 'Expected text');
  });
});
```

## Troubleshooting

### Common Issues

1. **Tests Timing Out**
   - Increase timeouts in `cypress.config.js`
   - Use `cy.waitForData()` to ensure data is loaded

2. **Authentication Issues**
   - Check if login endpoints are working
   - Verify that test credentials are valid

3. **Selector Issues**
   - Use the Cypress UI to inspect elements
   - Update selectors if UI has changed

### Debugging Tips

1. Use `cy.pause()` to pause test execution
2. Add `debugger` statements for browser debugging
3. Use `cy.log()` to add debug information to the test output

## Extending the Test Suite

To add new tests:

1. Create a new `.cy.js` file in the `cypress/e2e` directory
2. Follow the existing patterns for test structure
3. Add necessary fixtures in `cypress/fixtures`
4. Update the test documentation if adding significant features

## Visual Testing

For visual testing:

1. Use `cy.screenshotWithName()` to capture screenshots
2. Screenshots are automatically captured on test failures
3. Compare screenshots across runs for visual regressions

## Performance Considerations

1. Use `cy.apiLogin()` instead of UI login when possible
2. Keep tests focused on specific features
3. Use `beforeEach` hooks efficiently for setup
4. Use the fastest selectors (data-testid > ID > class > tag)

## Maintainers

For questions about the E2E testing framework, contact:

- QA Team (qa@aerosuite.example.com)
- DevOps Team (devops@aerosuite.example.com) 