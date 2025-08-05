# Code Splitting Guide

This document provides guidance on the code splitting implementation in the AeroSuite project. Code splitting is a technique that allows you to split your code into various bundles which can then be loaded on demand or in parallel, improving application performance.

## Table of Contents

1. [Overview](#overview)
2. [Implementation](#implementation)
3. [Code Splitting Strategies](#code-splitting-strategies)
4. [Usage Guide](#usage-guide)
5. [Best Practices](#best-practices)
6. [Performance Metrics](#performance-metrics)
7. [Troubleshooting](#troubleshooting)

## Overview

Code splitting is a critical optimization technique that helps reduce the initial load time of your application by splitting the code into smaller chunks that can be loaded on demand. This implementation is part of RF033 - Implement code splitting for frontend.

Benefits of code splitting include:

- **Reduced initial load time**: Users only download the code they need
- **Improved performance**: Smaller bundles load faster
- **Better caching**: Changes to one part of the application don't invalidate the entire bundle
- **On-demand loading**: Features are loaded only when needed

## Implementation

The code splitting implementation in AeroSuite consists of several components:

1. **Configuration**: `codeSplittingConfig.ts` defines global settings and priorities
2. **Core utilities**: `codeSplitting.ts` provides the core functionality
3. **Route-based splitting**: `routeSplitting.tsx` handles route-level code splitting
4. **Component-based splitting**: `componentSplitting.tsx` handles component-level code splitting
5. **React hooks**: `useRouteSplitting.ts` integrates with React Router
6. **Analysis tools**: Scripts to analyze and implement code splitting

### Directory Structure

```
client/src/
├── utils/
│   ├── codeSplittingConfig.ts    # Configuration
│   ├── codeSplitting.ts          # Core utilities
│   ├── routeSplitting.tsx        # Route-based splitting
│   └── componentSplitting.tsx    # Component-based splitting
├── hooks/
│   └── useRouteSplitting.ts      # React Router integration
└── ...

scripts/
├── implement-code-splitting.js   # Analysis script
└── implement-code-splitting.sh   # Shell script
```

## Code Splitting Strategies

AeroSuite implements three main code splitting strategies:

### 1. Route-Based Splitting

Routes are split into separate chunks, so each page is loaded on demand when the user navigates to it. This is the most common and effective form of code splitting.

```tsx
// Example from routeSplitting.tsx
export const routeImports = {
  '/dashboard': () => import('../pages/dashboard/Dashboard'),
  '/customers': () => import('../pages/customers/CustomerList'),
  // ...
};
```

### 2. Component-Based Splitting

Large or infrequently used components are split into separate chunks and loaded on demand.

```tsx
// Example from componentSplitting.tsx
export const componentImports = {
  'DataGrid': () => import('../components/ui-library/organisms/DataGrid'),
  'RichTextEditor': () => import('../components/ui-library/molecules/RichTextEditor'),
  // ...
};
```

### 3. Visibility-Based Splitting

Components are loaded only when they become visible in the viewport, using the Intersection Observer API.

```tsx
// Example usage of useInViewLazyLoad
function MyComponent() {
  const [ref, LazyChart] = useInViewLazyLoad(() => import('./Chart'));
  
  return (
    <div ref={ref}>
      {LazyChart && <LazyChart data={chartData} />}
    </div>
  );
}
```

## Usage Guide

### Route-Based Splitting

To implement route-based code splitting:

1. Update your routes to use the `createLazyRouteComponent` function:

```tsx
// Example routes.tsx
import { createLazyRouteComponent } from './utils/routeSplitting';

const Dashboard = createLazyRouteComponent('/dashboard');
const CustomerList = createLazyRouteComponent('/customers');

// Then use these components in your Routes
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/customers" element={<CustomerList />} />
```

2. Add the `useRouteSplitting` hook to your main layout component:

```tsx
// Example MainLayout.tsx
import { useRouteSplitting } from '../hooks/useRouteSplitting';

function MainLayout() {
  // This will prefetch related routes
  useRouteSplitting();
  
  return (
    // Your layout
  );
}
```

### Component-Based Splitting

To implement component-based code splitting:

1. Use the `createLazyUIComponent` function:

```tsx
// Example usage
import { createLazyUIComponent } from '../utils/componentSplitting';

const DataGrid = createLazyUIComponent('DataGrid');
const RichTextEditor = createLazyUIComponent('RichTextEditor');

function MyComponent() {
  return (
    <div>
      <DataGrid data={gridData} />
      <RichTextEditor value={content} onChange={handleChange} />
    </div>
  );
}
```

2. For components that should load when visible:

```tsx
// Example usage
import { createInViewComponent } from '../utils/componentSplitting';

function MyComponent() {
  const [chartRef, LazyChart] = createInViewComponent('LineChart');
  
  return (
    <div ref={chartRef} style={{ minHeight: 300 }}>
      {LazyChart && <LazyChart data={chartData} />}
    </div>
  );
}
```

### Prefetching Components

You can prefetch components that will likely be needed soon:

```tsx
import { prefetchComponents } from '../utils/componentSplitting';

// When user hovers over a button that will open a modal
function handleButtonHover() {
  prefetchComponents(['ConfirmDialog', 'FormBuilder']);
}
```

## Best Practices

1. **Don't over-split**: Only split components that are large or infrequently used
2. **Consider the network**: Too many small chunks can lead to network overhead
3. **Prioritize critical paths**: Ensure the main user flows load quickly
4. **Use appropriate loading indicators**: Show loading states for better UX
5. **Monitor performance**: Regularly check bundle sizes and load times
6. **Test on real devices**: Especially on slower connections and devices
7. **Analyze before implementing**: Use the analysis tools to identify candidates for splitting

## Performance Metrics

To measure the effectiveness of code splitting:

1. **Bundle size**: Check the size of your JavaScript bundles
2. **Load time**: Measure the time to interactive for key user flows
3. **First contentful paint**: Measure how quickly content appears
4. **Time to interactive**: Measure when the user can interact with the page

You can run the analysis script to get insights:

```bash
npm run analyze:code-splitting
```

## Troubleshooting

### Common Issues

1. **Flash of loading content**: Add appropriate loading delays and fallbacks
2. **Missing chunks**: Ensure all routes and components are properly mapped
3. **Duplicate code**: Check for duplicated code across chunks
4. **Too many requests**: Consolidate small chunks
5. **Errors during loading**: Implement proper error handling and retry logic

### Debugging

1. Use the browser's network tab to see which chunks are being loaded
2. Enable source maps for better debugging
3. Check the console for chunk loading errors
4. Use the bundle analyzer to visualize your bundle composition:

```bash
npm run analyze
```

---

For more information, refer to the [React documentation on code splitting](https://reactjs.org/docs/code-splitting.html) and [Webpack documentation on code splitting](https://webpack.js.org/guides/code-splitting/). 