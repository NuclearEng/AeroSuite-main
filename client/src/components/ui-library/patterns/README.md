# Component Composition Patterns

This directory contains implementations of various component composition patterns for the AeroSuite UI library.

## Patterns Overview

### 1. Compound Component Pattern

The Compound Component pattern allows components to share state and behavior while maintaining separation of concerns. It creates a parent component that manages state and provides context to child components.

**Example**: `CompoundSelect` - A select component with Option sub-components.

```jsx
import { CompoundSelect } from 'src/components/ui-library';

<CompoundSelect value={value} onChange={setValue}>
  <CompoundSelect.Option value="option1">Option 1</CompoundSelect.Option>
  <CompoundSelect.Option value="option2">Option 2</CompoundSelect.Option>
  <CompoundSelect.OptionGroup label="Group 1">
    <CompoundSelect.Option value="option3">Option 3</CompoundSelect.Option>
    <CompoundSelect.Option value="option4">Option 4</CompoundSelect.Option>
  </CompoundSelect.OptionGroup>
</CompoundSelect>
```

### 2. Provider Pattern

The Provider pattern uses React Context to share state and functionality across components without prop drilling. It creates a provider component that manages state and makes it available to all child components through a custom hook.

**Example**: `ThemeProvider` - A theme provider that manages theme state.

```jsx
import { ThemeProvider, useTheme } from 'src/components/ui-library';

// In your app root
<ThemeProvider initialTheme="light">
  <App />
</ThemeProvider>

// In any component
const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
};
```

### 3. Higher Order Component (HOC) Pattern

The HOC pattern creates a function that takes a component and returns a new component with enhanced functionality. This pattern is useful for reusing component logic and cross-cutting concerns like loading states, error handling, and authentication.

**Examples**: `withLoading`, `withErrorHandling`, and `withDataFetching` HOCs.

```jsx
import { withLoading, withErrorHandling, withDataFetching } from 'src/components/ui-library';

// Basic component
const UserProfile = ({ data }) => (
  <div>
    <h2>{data.name}</h2>
    <p>{data.email}</p>
  </div>
);

// Enhanced with loading and error handling
const EnhancedUserProfile = withLoading(withErrorHandling(UserProfile));

// Usage
<EnhancedUserProfile isLoading={isLoading} error={error} data={userData} />

// Or with data fetching
const UserProfileWithData = withDataFetching(UserProfile, () => fetchUserData(userId));

// Usage
<UserProfileWithData />
```

### 4. Render Props Pattern

The Render Props pattern involves passing a function as a prop to a component, which the component then calls to render part of its UI. This pattern provides flexibility in how components render and share state or behavior.

**Examples**: `Toggle`, `DataFetcher`, and `MouseTracker` components.

```jsx
import { Toggle, DataFetcher, MouseTracker } from 'src/components/ui-library';

// Toggle example
<Toggle initialState={false}>
  {({ isOn, toggle }) => (
    <button onClick={toggle}>
      {isOn ? 'ON' : 'OFF'}
    </button>
  )}
</Toggle>

// DataFetcher example
<DataFetcher url="/api/users/1">
  {({ data, isLoading, error, refetch }) => {
    if (isLoading) return <Spinner />;
    if (error) return <ErrorMessage error={error} onRetry={refetch} />;
    return <UserProfile user={data} />;
  }}
</DataFetcher>

// MouseTracker example
<MouseTracker>
  {({ x, y }) => (
    <div>Mouse position: {x}, {y}</div>
  )}
</MouseTracker>
```

### 5. Composition Pattern

The Composition pattern involves building components that accept and render children or specific props that contain React elements. This pattern enables flexible and reusable component structures.

**Examples**: `Layout`, `CompositionCard`, `Split`, and `CompositionTabs` components.

```jsx
import { Layout, CompositionCard, Split, CompositionTabs } from 'src/components/ui-library';

// Layout example
<Layout
  header={<Header />}
  sidebar={<Sidebar />}
  footer={<Footer />}
>
  <MainContent />
</Layout>

// Card example
<CompositionCard
  title="Card Title"
  subtitle="Card Subtitle"
  media={<img src="image.jpg" alt="Card media" />}
  actions={<Button>Action</Button>}
>
  Card content goes here
</CompositionCard>

// Split example
<Split
  left={<LeftContent />}
  right={<RightContent />}
  ratio="2fr 1fr"
/>

// Tabs example
<CompositionTabs
  items={[
    { id: 'tab1', label: 'Tab 1', content: <Tab1Content /> },
    { id: 'tab2', label: 'Tab 2', content: <Tab2Content /> },
    { id: 'tab3', label: 'Tab 3', content: <Tab3Content /> }
  ]}
  onChange={handleTabChange}
/>
```

## Benefits of Component Composition Patterns

1. **Reusability**: Patterns enable code reuse across the application
2. **Flexibility**: Components can be combined in different ways to create complex UIs
3. **Maintainability**: Patterns promote separation of concerns and clean code
4. **Testability**: Components built with these patterns are easier to test
5. **Developer Experience**: Patterns provide consistent and intuitive APIs

## Best Practices

1. Choose the appropriate pattern for the problem at hand
2. Keep components focused on a single responsibility
3. Document component APIs and usage examples
4. Use TypeScript for better type safety and developer experience
5. Test components in isolation and in combination 