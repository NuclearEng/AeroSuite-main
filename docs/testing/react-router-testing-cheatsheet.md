# React Router Testing Cheat Sheet

## Import Statements

```jsx
// For components that use React Router hooks
import { renderWithRouter } from '../../test-utils/router-wrapper';

// For components that use Material-UI Theme
import { renderWithTheme } from '../../test-utils/theme-wrapper';

// For components that use both React Router and Material-UI Theme
import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';
```bash

## Basic Usage

```jsx
// For components that use React Router hooks
renderWithRouter(<YourComponent />, {
  path: '/path',
  route: '/path',
  initialEntries: ['/path']
});

// For components that use Material-UI Theme
renderWithTheme(<YourComponent />);

// For components that use both
renderWithRouterAndTheme(<YourComponent />, {
  path: '/path',
  route: '/path',
  initialEntries: ['/path']
});
```bash

## Route Parameters

```jsx
// For components that use route parameters
renderWithRouter(<YourComponent />, {
  path: '/users/:id',
  route: '/users/123',
  initialEntries: ['/users/123']
});
```bash

## Testing Navigation

```jsx
// Test navigation by clicking a link
import userEvent from '@testing-library/user-event';

test('navigates to details page when clicking a link', () => {
  renderWithRouter(<YourComponent />, {
    path: '/users',
    route: '/users',
    initialEntries: ['/users']
  });

  userEvent.click(screen.getByText('View Details'));

  // Assert that the navigation occurred
  expect(screen.getByText('User Details')).toBeInTheDocument();
});
```bash

## Testing with Query Parameters

```jsx
// For components that use query parameters
renderWithRouter(<YourComponent />, {
  path: '/search',
  route: '/search?query=test',
  initialEntries: ['/search?query=test']
});
```bash

## Testing with Route State

```jsx
// For components that use route state
renderWithRouter(<YourComponent />, {
  path: '/dashboard',
  route: '/dashboard',
  initialEntries: [{ pathname: '/dashboard', state: { from: 'login' } }]
});
```bash

## Testing Protected Routes

```jsx
// For testing protected routes
const mockAuthContext = {
  isAuthenticated: true,
  user: { id: '123', name: 'Test User' }
};

renderWithRouter(
  <AuthContext.Provider value={mockAuthContext}>
    <YourProtectedComponent />
  </AuthContext.Provider>,
  {
    path: '/protected',
    route: '/protected',
    initialEntries: ['/protected']
  }
);
```bash

## Testing Redirects

```jsx
// For testing redirects
test('redirects to login when not authenticated', () => {
  const mockAuthContext = {
    isAuthenticated: false
  };

  renderWithRouter(
    <AuthContext.Provider value={mockAuthContext}>
      <YourProtectedComponent />
    </AuthContext.Provider>,
    {
      path: '/protected',
      route: '/protected',
      initialEntries: ['/protected']
    }
  );

  // Assert that the redirect occurred
  expect(screen.getByText('Login Page')).toBeInTheDocument();
});
```bash

## Mocking React Router Hooks

```jsx
// For mocking React Router hooks directly
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '123' }),
  useLocation: () => ({ pathname: '/test', search: '?query=test' })
}));
```bash

## Automated Fixes

```bash
# Run the interactive script
cd client
./scripts/fix-router-tests.sh

# Choose option 1 for interactive mode
# Choose option 2 for batch mode
# Choose option 3 for directory mode
```bash

## Common Errors

| Error | Solution |
|-------|----------|
| `useNavigate() may be used only in the context of a <Router> component` | Use `renderWithRouter`
or `renderWithRouterAndTheme` |
| `useParams() may be used only in the context of a <Router> component` | Use `renderWithRouter` or
`renderWithRouterAndTheme` |
| `Cannot read property 'pathname' of undefined` | Make sure you're providing the correct
`initialEntries` |
| `Cannot read property 'theme' of undefined` | Use `renderWithTheme` or `renderWithRouterAndTheme`
|
