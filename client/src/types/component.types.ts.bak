/**
 * Generic Component Type Definitions
 * Contains reusable generic types for React components
 */

import { ReactNode, ComponentType, CSSProperties } from 'react';

/**
 * Generic props for components that can be disabled
 */
export interface Disableable {
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Generic props for components that can have loading state
 */
export interface Loadable {
  /** Whether the component is loading */
  isLoading?: boolean;
  /** Loading text to display */
  loadingText?: string;
}

/**
 * Generic props for components that can have children
 */
export interface WithChildren<T = ReactNode> {
  /** Child elements */
  children?: T;
}

/**
 * Generic props for components that can have a className
 */
export interface WithClassName {
  /** CSS class name */
  className?: string;
}

/**
 * Generic props for components that can have inline styles
 */
export interface WithStyle {
  /** Inline style object */
  style?: CSSProperties;
}

/**
 * Generic props for components that can have a test ID
 */
export interface WithTestId {
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Generic props for components that can have a ref
 */
export interface WithRef<T> {
  /** Ref object */
  ref?: React.Ref<T>;
}

/**
 * Generic props for components that can have an ID
 */
export interface WithId {
  /** Component ID */
  id?: string;
}

/**
 * Generic props for components that can have a title
 */
export interface WithTitle {
  /** Component title */
  title?: string;
}

/**
 * Generic props for components that can have an aria label
 */
export interface WithAriaLabel {
  /** Aria label for accessibility */
  'aria-label'?: string;
}

/**
 * Generic props for components that can have a tabIndex
 */
export interface WithTabIndex {
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

/**
 * Generic props for components that can have a name
 */
export interface WithName {
  /** Component name */
  name?: string;
}

/**
 * Generic props for components that can have a value
 */
export interface WithValue<T = string> {
  /** Component value */
  value?: T;
}

/**
 * Generic props for components that can have a default value
 */
export interface WithDefaultValue<T = string> {
  /** Default value */
  defaultValue?: T;
}

/**
 * Generic props for components that can have an onChange event
 */
export interface WithOnChange<T = any> {
  /** Change event handler */
  onChange?: (value: T) => void;
}

/**
 * Generic props for components that can have an onClick event
 */
export interface WithOnClick<T = React.MouseEvent> {
  /** Click event handler */
  onClick?: (event: T) => void;
}

/**
 * Generic props for components that can have a placeholder
 */
export interface WithPlaceholder {
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Generic props for components that can be required
 */
export interface Required {
  /** Whether the component is required */
  required?: boolean;
}

/**
 * Generic props for components that can have a label
 */
export interface WithLabel {
  /** Component label */
  label?: string;
}

/**
 * Generic props for components that can have an error
 */
export interface WithError {
  /** Whether the component has an error */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

/**
 * Generic props for components that can have helper text
 */
export interface WithHelperText {
  /** Helper text */
  helperText?: string;
}

/**
 * Generic props for components that can be readonly
 */
export interface Readonly {
  /** Whether the component is readonly */
  readonly?: boolean;
}

/**
 * Generic props for components that can be focused
 */
export interface Focusable {
  /** Whether the component should be auto-focused */
  autoFocus?: boolean;
}

/**
 * Generic props for components that can have a size
 */
export interface WithSize {
  /** Component size */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Generic props for components that can have a variant
 */
export interface WithVariant<T = string> {
  /** Component variant */
  variant?: T;
}

/**
 * Generic props for components that can have a color
 */
export interface WithColor<T = string> {
  /** Component color */
  color?: T;
}

/**
 * Generic props for components that can have an icon
 */
export interface WithIcon {
  /** Icon element */
  icon?: ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
}

/**
 * Generic props for components that can have a tooltip
 */
export interface WithTooltip {
  /** Tooltip text */
  tooltip?: string;
  /** Tooltip position */
  tooltipPosition?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Generic props for components that can be animated
 */
export interface Animatable {
  /** Whether animations are enabled */
  animated?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
}

/**
 * Generic props for components that can have a theme
 */
export interface WithTheme {
  /** Theme name */
  theme?: string;
}

/**
 * Base component props combining common props
 */
export type BaseComponentProps = 
  WithChildren & 
  WithClassName & 
  WithStyle & 
  WithTestId & 
  WithId;

/**
 * Generic component type with props
 */
export type GenericComponent<P = {}> = ComponentType<P & BaseComponentProps>;

/**
 * Generic form field component props
 */
export type FormFieldComponentProps<T = string> = 
  BaseComponentProps & 
  WithLabel & 
  WithValue<T> & 
  WithDefaultValue<T> & 
  WithOnChange<T> & 
  WithPlaceholder & 
  Required & 
  Disableable & 
  WithError & 
  WithHelperText & 
  Readonly & 
  Focusable & 
  WithName;

/**
 * Generic button component props
 */
export type ButtonComponentProps = 
  BaseComponentProps & 
  WithOnClick & 
  Disableable & 
  Loadable & 
  WithVariant<'text' | 'contained' | 'outlined'> & 
  WithColor<'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> & 
  WithSize & 
  WithIcon & 
  WithAriaLabel;

/**
 * Generic list component props
 */
export type ListComponentProps<T = any> = 
  BaseComponentProps & 
  Loadable & {
    /** List items */
    items?: T[];
    /** Function to render each item */
    renderItem?: (item: T, index: number) => ReactNode;
    /** Function to get a key for each item */
    getItemKey?: (item: T, index: number) => string | number;
    /** Whether the list is empty */
    isEmpty?: boolean;
    /** Content to show when the list is empty */
    emptyContent?: ReactNode;
  };

/**
 * Generic modal component props
 */
export type ModalComponentProps = 
  BaseComponentProps & {
    /** Whether the modal is open */
    open: boolean;
    /** Function to close the modal */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Whether to show a close button */
    showCloseButton?: boolean;
    /** Whether to close when clicking outside */
    closeOnClickOutside?: boolean;
    /** Whether to close when pressing escape */
    closeOnEscape?: boolean;
    /** Modal size */
    size?: 'small' | 'medium' | 'large' | 'full';
    /** Modal position */
    position?: 'center' | 'top' | 'right' | 'bottom' | 'left';
    /** Modal footer */
    footer?: ReactNode;
  }; 