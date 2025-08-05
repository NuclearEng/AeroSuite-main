/**
 * Component Composition Patterns
 * 
 * @task RF015 - Implement component composition patterns
 * 
 * This module exports various component composition patterns that can be used
 * to build complex UIs by composing smaller components.
 */

// Import pattern implementations
import { Select as CompoundSelect } from './Compound';
import { ThemeProvider, useTheme, ThemeConsumer } from './Provider';
import { withLoading, withErrorHandling, withDataFetching } from './HOC';
import { Toggle, DataFetcher, MouseTracker } from './RenderProps';
import { Layout, Card as CompositionCard, Split, Tabs as CompositionTabs } from './Composition';

// Re-export with namespaced names to avoid conflicts
export {
  // Compound Pattern
  CompoundSelect,
  
  // Provider Pattern
  ThemeProvider,
  useTheme,
  ThemeConsumer,
  
  // HOC Pattern
  withLoading,
  withErrorHandling,
  withDataFetching,
  
  // Render Props Pattern
  Toggle,
  DataFetcher,
  MouseTracker,
  
  // Composition Pattern
  Layout,
  CompositionCard,
  Split,
  CompositionTabs
};

// Export types
export type { 
  // From Compound.tsx
  SelectProps, OptionProps, LabelProps, OptionGroupProps 
} from './Compound';

export type {
  // From Provider.tsx
  ThemeType, ThemeContextType
} from './Provider';

export type {
  // From HOC.tsx
  WithLoadingProps, WithErrorHandlingProps, WithErrorHandlingState
} from './HOC';

export type {
  // From RenderProps.tsx
  ToggleState, ToggleProps, DataFetcherState, DataFetcherProps, MousePosition, MouseTrackerProps
} from './RenderProps';

export type {
  // From Composition.tsx
  LayoutProps, CardProps, SplitProps, TabItem, TabsProps
} from './Composition'; 