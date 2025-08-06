# Advanced Router Testing in AeroSuite

This document describes the advanced router testing utilities available in AeroSuite for testing
components that use React Router hooks along with authentication, query parameters, and other
advanced routing features.

## Overview

The `advanced-router-wrapper.tsx` provides enhanced testing utilities that extend our basic React
Router testing solution with additional capabilities:

1. __Authentication Context__ - Test components that require authentication
2. __Role-Based Access Control__ - Test components with role-based permissions
3. __Query Parameters__ - Test components that use query parameters
4. __Navigation History__ - Track and assert on navigation changes
5. __Protected Routes__ - Test components behind route guards

## Installation

The advanced router wrapper requires the following dependencies:

```bash
npm install --save-dev history use-query-params
```bash

## Basic Usage

```tsx
import { renderWithAdvancedRouter } from '../test-utils/advanced-router-wrapper';

// Component that uses React Router hooks and auth context
const MyProtectedComponent = () => {
  const { id } = useParams();
  const auth = useAuthContext();

  return (
    <div>
      <h1>User Profile: {id}</h1>
      <p>Welcome, {auth.user?.name}</p>
    </div>
  );
};

// Test with route parameters and authentication
it('renders the protected component', () => {
  renderWithAdvancedRouter(<MyProtectedComponent />, {
    path: '/profile/:id',
    route: '/profile/123',
    initialEntries: ['/profile/123'],
    isAuthenticated: true,
    roles: ['user', 'admin']
  });

  expect(screen.getByText('User Profile: 123')).toBeInTheDocument();
  expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
});
```bash

## Advanced Features

### Authentication Testing

Test components with different authentication states:

```tsx
// Test authenticated state
it('shows user info when authenticated', () => {
  renderWithAdvancedRouter(<MyComponent />, {
    path: '/dashboard',
    isAuthenticated: true,
  });

  expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
});

// Test unauthenticated state
it('redirects to login when not authenticated', () => {
  renderWithAdvancedRouter(<MyComponent />, {
    path: '/dashboard',
    isAuthenticated: false,
    authenticationPath: '/login',
  });

  expect(screen.getByTestId('login-page')).toBeInTheDocument();
  expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
});
```bash

### Role-Based Access Control

Test components with role-based permissions:

```tsx
// Test with required role
it('allows access with admin role', () => {
  renderWithAdvancedRouter(<AdminPanel />, {
    path: '/admin',
    roles: ['user', 'admin'],
    requiredRole: 'admin',
  });

  expect(screen.getByText('Admin Panel')).toBeInTheDocument();
});

// Test without required role
it('denies access without admin role', () => {
  renderWithAdvancedRouter(<AdminPanel />, {
    path: '/admin',
    roles: ['user'],
    requiredRole: 'admin',
  });

  expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  expect(screen.getByTestId('login-page')).toBeInTheDocument();
});
```bash

### Query Parameters

Test components that use query parameters:

```tsx
// Test with query parameters
it('renders with query parameters', () => {
  renderWithAdvancedRouter(<SearchResults />, {
    path: '/search',
    queryParams: { q: 'test', page: 2, sort: 'date' },
  });

  expect(screen.getByText('Results for: test')).toBeInTheDocument();
  expect(screen.getByText('Page: 2')).toBeInTheDocument();
});
```bash

### Navigation Testing

Test navigation between routes:

```tsx
// Test navigation
it('navigates to another route', async () => {
  const user = userEvent.setup();

  renderWithAdvancedRouter(<Dashboard />, {
    path: '/dashboard',
  });

  await user.click(screen.getByText('Go to Profile'));

  await waitFor(() => {
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });
});
```bash

### Tracking Navigation History

Track and assert on navigation history:

```tsx
it('tracks navigation history', async () => {
  const user = userEvent.setup();
  const { getNavigationHistory } = renderWithAdvancedRouter(<Navigation />, {
    path: '/',
  });

  await user.click(screen.getByText('Products'));
  await user.click(screen.getByText('About'));

  expect(getNavigationHistory()).toEqual(['/', '/products', '/about']);
});
```bash

## API Reference

### renderWithAdvancedRouter

```tsx
renderWithAdvancedRouter(
  ui: React.ReactElement,
  options?: {
    path?: string;                // Route pattern with parameter placeholders
    route?: string;               // Actual URL for the test
    initialEntries?: string[];    // History stack entries
    initialIndex?: number;        // Initial history index
    isAuthenticated?: boolean;    // Authentication state
    authenticationPath?: string;  // Redirect path for unauthenticated users
    roles?: string[];             // User roles
    requiredRole?: string;        // Required role for access
    queryParams?: Record<string, string | number | boolean | null>; // Query parameters
    history?: History;            // Custom history object
  }
): {
  // All standard render result properties
  // Plus these additional properties:
  history: History;
  getNavigationHistory: () => string[];
  getQueryParams: () => Record<string, string | number | boolean | null>;
  getAuthStatus: () => { isAuthenticated: boolean; roles: string[]; hasRequiredRole: boolean };
}
```bash

### AdvancedRouterWrapper

A component wrapper version of the render function:

```tsx
<AdvancedRouterWrapper
  path="/dashboard"
  isAuthenticated={true}
  roles={['admin']}
>
  <MyComponent />
</AdvancedRouterWrapper>
```bash

### useAuthContext

A hook to access the authentication context in your components:

```tsx
const MyComponent = () => {
  const auth = useAuthContext();

  return (
    <div>
      {auth.isAuthenticated ? (
        <p>Welcome, {auth.user?.name}</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
};
```bash

## Best Practices

1. __Match Test Environment to Production__
   - Configure the router wrapper to match your production environment
   - Use the same route patterns and authentication logic

2. __Test Both Success and Failure Cases__
   - Test authenticated and unauthenticated states
   - Test with and without required roles
   - Test with valid and invalid query parameters

3. __Isolate Tests__
   - Each test should have its own router configuration
   - Avoid sharing state between tests

4. __Use Data Testids__
   - Add data-testid attributes to elements for stable test selectors
   - Avoid testing implementation details

5. __Test Navigation Flows__
   - Test complete user journeys through your application
   - Verify that navigation works as expected

## Examples

See `advanced-router-example.test.tsx` for complete examples of how to use these utilities.

## Troubleshooting

### Common Issues

1. __Component not rendering__
   - Check that the path pattern matches the route
   - Ensure authentication and role requirements are met

2. __Query parameters not working__
   - Verify that the queryParams object is correctly formatted
   - Check that your component is using the correct hooks to access query parameters

3. __Navigation not working__
   - Make sure you're using the correct navigation method (useNavigate, Link, etc.)
   - Check that the target route is registered in the router

4. __Auth context not available__
   - Ensure you're using the useAuthContext hook
   - Check that the component is rendered with the AdvancedRouterWrapper

### Debug Tips

1. Use `screen.debug()` to see the current state of the DOM
2. Log the values returned by router hooks to verify they're working
3. Check the authentication state with `getAuthStatus()`
4. Inspect the navigation history with `getNavigationHistory()`
