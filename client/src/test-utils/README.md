# Testing Utilities for AeroSuite

This directory contains utilities for testing React components in the AeroSuite application.

## Overview

Testing React components often requires providing various contexts such as Router, Theme, Redux store, etc. These utilities make it easier to test components that depend on these contexts.

## Available Utilities

### `router-wrapper.tsx`

Provides utilities for testing components that use React Router hooks like `useNavigate`, `useParams`, etc.

- `renderWithRouter`: Renders a component wrapped in a `MemoryRouter` with a `Routes` and `Route` setup
- `RouterWrapper`: A wrapper component that provides a `MemoryRouter` context

### `theme-wrapper.tsx`

Provides utilities for testing components that use Material-UI theme.

- `renderWithTheme`: Renders a component wrapped in a `ThemeProvider`
- `ThemeWrapper`: A wrapper component that provides a `ThemeProvider` context

### `combined-wrapper.tsx`

Provides utilities for testing components that need both Router and Theme contexts.

- `renderWithRouterAndTheme`: Renders a component wrapped in both `ThemeProvider` and `MemoryRouter`
- `CombinedWrapper`: A wrapper component that provides both `ThemeProvider` and `MemoryRouter` contexts

### `test-setup.tsx`

Provides a custom render function that wraps components with necessary providers.

- `render`: A custom render function that wraps components with `MemoryRouter` and `ThemeProvider`

## Usage Examples

### Testing a component that uses React Router hooks

```tsx
import { renderWithRouter } from '../test-utils/router-wrapper';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    renderWithRouter(<MyComponent />, {
      path: '/my-path/:id',
      route: '/my-path/123',
      initialEntries: ['/my-path/123']
    });
    
    // Your assertions here
  });
});
```

### Testing a component that uses Material-UI theme

```tsx
import { renderWithTheme } from '../test-utils/theme-wrapper';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    renderWithTheme(<MyComponent />);
    
    // Your assertions here
  });
});
```

### Testing a component that uses both React Router and Material-UI theme

```tsx
import { renderWithRouterAndTheme } from '../test-utils/combined-wrapper';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    renderWithRouterAndTheme(<MyComponent />, {
      path: '/my-path/:id',
      route: '/my-path/123',
      initialEntries: ['/my-path/123']
    });
    
    // Your assertions here
  });
});
```

## Best Practices

1. Always use the appropriate wrapper for the component you're testing
2. For components that use React Router hooks, make sure to provide the correct path and route
3. For components that use URL parameters, make sure to provide the correct parameters in the route
4. For components that use query parameters, make sure to provide the correct query parameters in the initialEntries

## Troubleshooting

### Common Issues

1. **"useNavigate() may be used only in the context of a Router component"**
   - This error occurs when a component using `useNavigate` is rendered without a Router context
   - Solution: Use `renderWithRouter` or `renderWithRouterAndTheme`

2. **"useParams() may be used only in the context of a Router component"**
   - This error occurs when a component using `useParams` is rendered without a Router context
   - Solution: Use `renderWithRouter` or `renderWithRouterAndTheme`

3. **"Theme is undefined"**
   - This error occurs when a component using Material-UI theme is rendered without a ThemeProvider context
   - Solution: Use `renderWithTheme` or `renderWithRouterAndTheme` 