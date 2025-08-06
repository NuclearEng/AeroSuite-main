# React Router Testing Guide

## Overview

This document explains our approach to testing components that use React Router hooks like
`useNavigate`, `useParams`, etc.

## The Problem

When testing components that use React Router hooks, we encounter errors like:

```bash
Error: useNavigate() may be used only in the context of a <Router> component.
```bash

This happens because React Router hooks need to be used within a Router context, but our tests are
rendering components in isolation without this context.

## The Solution

We've created several testing utilities to provide the necessary context for components that use
React Router hooks:

1. `renderWithRouter`: A function that renders a component wrapped in a `MemoryRouter` with a
`Routes` and `Route` setup
2. `RouterWrapper`: A component that provides a `MemoryRouter` context
3. `renderWithRouterAndTheme`: A function that renders a component wrapped in both `ThemeProvider`
and `MemoryRouter`
4. `CombinedWrapper`: A component that provides both `ThemeProvider` and `MemoryRouter` contexts

## Implementation

### 1. Create Testing Utilities

We've created the following files in the `client/src/test-utils` directory:

- `router-wrapper.tsx`: Provides utilities for testing components that use React Router hooks
- `theme-wrapper.tsx`: Provides utilities for testing components that use Material-UI theme
- `combined-wrapper.tsx`: Provides utilities for testing components that need both Router and Theme
contexts
- `test-setup.tsx`: Provides a custom render function that wraps components with necessary providers

### 2. Update Component Tests

We've updated component tests to use these utilities. For example:

```tsx
// Before
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />);
    expect(screen.getByText(/MyComponent/i)).toBeInTheDocument();
  });
});

// After
import { screen } from '@testing-library/react';
import MyComponent from './MyComponent';
import { renderWithRouter } from '../../test-utils/router-wrapper';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    renderWithRouter(<MyComponent />, {
      path: '/my-path/:id',
      route: '/my-path/123',
      initialEntries: ['/my-path/123']
    });
    expect(screen.getByText(/MyComponent/i)).toBeInTheDocument();
  });
});
```bash

### 3. Mock React Router Hooks

In some cases, we might want to mock React Router hooks instead of providing a Router context.
We've added mocks for common React Router hooks in `setupTests.ts`:

```tsx
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
}));
```bash

## Best Practices

1. Always use the appropriate wrapper for the component you're testing
2. For components that use React Router hooks, make sure to provide the correct path and route
3. For components that use URL parameters, make sure to provide the correct parameters in the route
4. For components that use query parameters, make sure to provide the correct query parameters in
the initialEntries

## Troubleshooting

### Common Issues

1. __"useNavigate() may be used only in the context of a Router component"__
   - This error occurs when a component using `useNavigate` is rendered without a Router context
   - Solution: Use `renderWithRouter` or `renderWithRouterAndTheme`

2. __"useParams() may be used only in the context of a Router component"__
   - This error occurs when a component using `useParams` is rendered without a Router context
   - Solution: Use `renderWithRouter` or `renderWithRouterAndTheme`

3. __"Theme is undefined"__
   - This error occurs when a component using Material-UI theme is rendered without a ThemeProvider
context
   - Solution: Use `renderWithTheme` or `renderWithRouterAndTheme`

## References

- [React Router Testing
Documentation](https://reactrouter.com/docs/en/v6/getting-started/overview#testing)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/setup)
- [Jest Documentation](https://jestjs.io/docs/tutorial-react)
