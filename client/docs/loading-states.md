# Loading States System

This document provides an overview of AeroSuite's loading states system, which improves user
experience during data loading operations.

## Components

### SkeletonScreen

The `SkeletonScreen` component provides configurable skeleton screens for different UI patterns:

```tsx
import SkeletonScreen from '../components/ui-library/molecules/SkeletonScreen';

// Basic usage
<SkeletonScreen variant="card" count={3} />

// Advanced usage with configuration
<SkeletonScreen
  variant="table"
  count={5}
  animation="wave"
  config={{
    columns: 4,
    withHeader: true,
    withActions: true
  }}
/>
```bash

#### Variants

- `table`: Skeleton for tabular data
- `card`: Skeleton for card layouts
- `list`: Skeleton for list items
- `grid`: Skeleton for grid layouts
- `detail`: Skeleton for detail views
- `form`: Skeleton for forms
- `chart`: Skeleton for charts and graphs
- `dashboard`: Skeleton for dashboard widgets
- `profile`: Skeleton for profile pages
- `feed`: Skeleton for feed/timeline layouts

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | SkeletonScreenVariant | required | The UI pattern to render |
| `count` | number | 1 | Number of skeleton items to render |
| `animation` | 'pulse' \| 'wave' | 'pulse' | Animation type |
| `height` | number \| string | - | Height of the skeleton |
| `width` | number \| string | - | Width of the skeleton |
| `config` | object | {} | Additional configuration options |

## Hooks

### useLoadingState

The `useLoadingState` hook provides a simple way to manage loading states in components:

```tsx
import { useLoadingState } from '../hooks/useLoadingState';

function MyComponent() {
  const {
    state,
    isLoading,
    isSuccess,
    isError,
    error,
    setLoading,
    setSuccess,
    setError,
    reset,
    wrapAsync
  } = useLoadingState({
    initialState: 'idle',
    minLoadingTime: 500,
    autoReset: true,
    resetDelay: 2000
  });

  // Use with async functions
  const fetchData = async () => {
    try {
      setLoading();
      const data = await api.getData();
      setSuccess();
      return data;
    } catch (err) {
      setError(err);
    }
  };

  // Or use the wrapAsync utility
  const loadData = () => {
    wrapAsync(async () => {
      const data = await api.getData();
      return data;
    });
  };

  return (
    <div>
      {isLoading && <SkeletonScreen variant="card" count={3} />}
      {isSuccess && <DataDisplay data={data} />}
      {isError && <ErrorMessage error={error} onRetry={reset} />}
    </div>
  );
}
```bash

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialState` | LoadingState | 'idle' | Initial loading state |
| `minLoadingTime` | number | 0 | Minimum loading time in milliseconds |
| `autoReset` | boolean | false | Auto-reset to idle after success or error |
| `resetDelay` | number | 3000 | Auto-reset delay in milliseconds |
| `onStateChange` | function | - | Callback when loading state changes |

#### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `state` | LoadingState | Current loading state ('idle', 'loading', 'success', 'error') |
| `isLoading` | boolean | Whether the state is 'loading' |
| `isSuccess` | boolean | Whether the state is 'success' |
| `isError` | boolean | Whether the state is 'error' |
| `error` | Error \| null | Error object if state is 'error' |
| `setLoading` | function | Set state to 'loading' |
| `setSuccess` | function | Set state to 'success' |
| `setError` | function | Set state to 'error' with an error object |
| `reset` | function | Reset state to 'idle' |
| `wrapAsync` | function | Utility to wrap async functions with loading state |

## Best Practices

1. __Use skeleton screens__ that match the layout of the actual content
2. __Provide immediate feedback__ when a user action triggers loading
3. __Maintain layout stability__ by using placeholders with the same dimensions as the final content
4. __Use progressive loading__ for large content sections
5. __Prioritize above-the-fold content__ to load first
6. __Provide clear error states__ with recovery options

## Demo

A comprehensive demo of all loading state components and patterns is available at
`/demos/loading-states`.
