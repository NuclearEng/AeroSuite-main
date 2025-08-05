# Lazy Loading Guide

This document provides guidance on using the lazy loading implementation in the AeroSuite project. Lazy loading is a technique that defers the loading of non-critical resources until they are needed, improving initial page load performance and user experience.

## Table of Contents

1. [Overview](#overview)
2. [Implementation](#implementation)
3. [Lazy Loading Techniques](#lazy-loading-techniques)
4. [Usage Guide](#usage-guide)
5. [Best Practices](#best-practices)
6. [Performance Metrics](#performance-metrics)
7. [Troubleshooting](#troubleshooting)

## Overview

Lazy loading is a critical optimization technique that helps reduce the initial load time of your application by deferring the loading of non-critical resources until they are needed. This implementation is part of RF034 - Add lazy loading for routes and components.

Benefits of lazy loading include:

- **Reduced initial load time**: Only critical resources are loaded initially
- **Improved performance**: Smaller initial bundle size leads to faster time-to-interactive
- **Better user experience**: Content appears more quickly and progressively
- **Reduced bandwidth usage**: Users only download what they actually use
- **Optimized resource loading**: Resources are loaded based on priority and visibility

## Implementation

The lazy loading implementation in AeroSuite consists of several components:

1. **Core utilities**: `lazyLoading.ts` provides advanced lazy loading capabilities
2. **Route-based lazy loading**: `useLazyRoute.ts` hook for route-level lazy loading
3. **Component-based lazy loading**: `LazyLoadedComponent.tsx` for component-level lazy loading
4. **Image lazy loading**: `LazyLoadedImage.tsx` for image lazy loading
5. **Analysis tools**: Scripts to analyze and implement lazy loading opportunities

### Directory Structure

```
client/src/
├── utils/
│   ├── lazyLoading.ts           # Advanced lazy loading utilities
│   ├── codeSplitting.ts         # Code splitting foundation (from RF033)
│   ├── routeSplitting.tsx       # Route-based splitting (from RF033)
│   └── componentSplitting.tsx   # Component-based splitting (from RF033)
├── hooks/
│   ├── useLazyRoute.ts          # Hooks for route lazy loading
│   └── useRouteSplitting.ts     # Route splitting hooks (from RF033)
├── components/
│   └── ui-library/
│       └── molecules/
│           ├── LazyLoadedImage.tsx    # Image lazy loading component
│           └── LazyLoadedComponent.tsx # Generic lazy loading component
└── ...

scripts/
├── analyze-lazy-loading.js      # Analysis script
└── analyze-lazy-loading.sh      # Shell script
```

## Lazy Loading Techniques

AeroSuite implements several lazy loading techniques:

### 1. Visibility-Based Loading

Components and images are loaded only when they become visible in the viewport, using the Intersection Observer API.

```tsx
// Example with LazyLoadedImage
<LazyLoadedImage
  src="path/to/image.jpg"
  alt="Description"
  height={300}
  width="100%"
/>

// Example with LazyLoadedComponent
<LazyLoadedComponent
  importFn={() => import('./HeavyComponent')}
  height={300}
/>
```

### 2. Route-Based Lazy Loading

Routes are loaded on demand when navigating to them, with prefetching of related routes.

```tsx
// Example with useLazyRoute
const { component: Dashboard, navigateTo } = useLazyRoute('/dashboard');

// Use in a button
<Button onClick={navigateTo}>Go to Dashboard</Button>

// Use in routes
<Route path="/dashboard" element={Dashboard || <LoadingFallback />} />
```

### 3. Predictive Loading

Resources are prefetched based on user interaction patterns and navigation history.

```tsx
// Example with usePrefetchRoutesOnHover
const { hoverProps } = usePrefetchRoutesOnHover(['/dashboard', '/reports']);

// Use in a navigation link
<Link to="/dashboard" {...hoverProps}>Dashboard</Link>
```

### 4. On-Demand Loading

Components are loaded only when explicitly requested, such as when opening a modal or expanding a section.

```tsx
// Example with useAdvancedLazyLoad
const { load, module: ChartComponent, isLoaded } = useAdvancedLazyLoad(
  () => import('./Chart')
);

// Load on button click
<Button onClick={load}>Show Chart</Button>
{isLoaded && <ChartComponent data={chartData} />}
```

## Usage Guide

### Image Lazy Loading

To implement lazy loading for images:

```tsx
import LazyLoadedImage from '../components/ui-library/molecules/LazyLoadedImage';

function MyComponent() {
  return (
    <LazyLoadedImage
      src="path/to/image.jpg"
      alt="Description"
      height={300}
      width="100%"
      placeholder={<div>Loading...</div>}
      blurEffect={true}
    />
  );
}
```

### Component Lazy Loading

To implement lazy loading for components:

```tsx
import LazyLoadedComponent from '../components/ui-library/molecules/LazyLoadedComponent';

function MyComponent() {
  return (
    <LazyLoadedComponent
      importFn={() => import('./HeavyComponent')}
      componentProps={{ data: chartData }}
      height={300}
      rootMargin="100px"
    />
  );
}
```

### Route Lazy Loading

To implement lazy loading for routes:

```tsx
// In your route configuration
import { useLazyRoute } from '../hooks/useLazyRoute';

function RouteComponent() {
  const { component: Dashboard } = useLazyRoute('/dashboard', {
    priority: LoadPriority.HIGH,
    prefetchRelated: true
  });
  
  return Dashboard ? <Dashboard /> : <LoadingFallback />;
}
```

### Prefetching on Hover

To prefetch routes when hovering over links:

```tsx
import { usePrefetchRoutesOnHover } from '../hooks/useLazyRoute';

function Navigation() {
  const { hoverProps } = usePrefetchRoutesOnHover(['/dashboard', '/reports']);
  
  return (
    <nav>
      <Link to="/dashboard" {...hoverProps}>Dashboard</Link>
    </nav>
  );
}
```

## Best Practices

1. **Prioritize above-the-fold content**: Ensure critical content loads first
2. **Use appropriate loading indicators**: Show loading states for better UX
3. **Set appropriate thresholds**: Adjust rootMargin to preload content before it's visible
4. **Consider mobile devices**: Use smaller thresholds on mobile to conserve bandwidth
5. **Avoid layout shifts**: Set fixed dimensions for placeholders to prevent layout shifts
6. **Test on real devices**: Especially on slower connections and devices
7. **Monitor performance**: Regularly check loading times and user experience
8. **Use analysis tools**: Run the analysis script to identify lazy loading opportunities

## Performance Metrics

To measure the effectiveness of lazy loading:

1. **Initial load time**: Measure the time to interactive for the initial page load
2. **First contentful paint**: Measure how quickly content appears
3. **Lazy loading timing**: Measure how quickly lazy-loaded content appears when needed
4. **Bundle size**: Check the size of your JavaScript bundles

You can run the analysis script to get insights:

```bash
./scripts/analyze-lazy-loading.sh
```

## Troubleshooting

### Common Issues

1. **Content flashing**: Adjust loading delays and use appropriate placeholders
2. **Layout shifts**: Set fixed dimensions for lazy-loaded content containers
3. **Content not loading**: Check network requests and browser console for errors
4. **Performance not improving**: Ensure you're lazy loading the right resources
5. **Mobile performance issues**: Adjust thresholds and prioritize critical content

### Debugging

1. Use the browser's network tab to see which resources are being loaded
2. Check the console for lazy loading errors
3. Use the performance panel to measure loading times
4. Use the application's built-in metrics tracking

```tsx
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  window.__LAZY_LOADING_DEBUG__ = true;
}
```

---

For more information, refer to the [Code Splitting Guide](./code-splitting-guide.md) and the [React documentation on lazy loading](https://reactjs.org/docs/code-splitting.html#reactlazy). 
