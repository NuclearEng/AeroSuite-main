/**
 * Form Component Type Definitions
 * Contains interfaces and types for form components and validation
 */

import { ReactNode, ComponentType } from 'react';

/**
 * Form field validation function
 * @param value - The value to validate
 * @param formValues - All form values (for cross-field validation)
 * @returns Error message or null if valid
 */
export type ValidationFunction<T = unknown> = (
  value: T,
  formValues?: Record<string, unknown>
) => string | null;

/**
 * Form field interface
 */
export interface FormField<T = unknown> {
  /** Unique field identifier */
  id: string;
  /** Field label */
  label: string;
  /** Field component */
  component: ComponentType<any>;
  /** Field priority for progressive loading */
  priority?: 'high' | 'medium' | 'low';
  /** Whether the field is required */
  required?: boolean;
  /** Validation function */
  validate?: ValidationFunction<T>;
  /** Default value */
  defaultValue?: T;
  /** Field placeholder */
  placeholder?: string;
  /** Helper text */
  helperText?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is visible */
  visible?: boolean;
  /** Field width (1-12 for grid systems) */
  width?: number;
  /** Additional props to pass to the field component */
  componentProps?: Record<string, unknown>;
  /** Field dependencies (other field IDs this field depends on) */
  dependencies?: string[];
}

/**
 * Form section interface
 */
export interface FormSection {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Fields in this section */
  fields: FormField[];
  /** Whether the section is collapsible */
  collapsible?: boolean;
  /** Whether the section is initially collapsed */
  collapsed?: boolean;
  /** Whether the section is visible */
  visible?: boolean;
  /** Condition function to determine if section should be shown */
  showIf?: (formValues: Record<string, unknown>) => boolean;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  /** Whether the form is valid */
  isValid: boolean;
  /** Validation errors by field ID */
  errors: Record<string, string | null>;
  /** First invalid field ID */
  firstInvalidField?: string;
}

/**
 * Form submission status
 */
export type FormSubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Form props interface
 */
export interface FormProps<T = Record<string, unknown>> {
  /** Form fields */
  fields: FormField[];
  /** Form sections */
  sections?: FormSection[];
  /** Initial form values */
  initialValues?: Partial<T>;
  /** Form submission handler */
  onSubmit?: (values: T) => void | Promise<void>;
  /** Form cancel handler */
  onCancel?: () => void;
  /** Whether the form is loading */
  isLoading?: boolean;
  /** Form submission status */
  submissionStatus?: FormSubmissionStatus;
  /** Form error message */
  errorMessage?: string;
  /** Form success message */
  successMessage?: string;
  /** Whether to validate on change */
  validateOnChange?: boolean;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  /** Whether to show required field indicators */
  showRequiredIndicator?: boolean;
  /** Custom form renderer */
  renderForm?: (props: {
    fields: FormField[];
    values: T;
    errors: Record<string, string | null>;
    handleChange: (fieldId: string, value: unknown) => void;
    handleBlur: (fieldId: string) => void;
    handleSubmit: () => void;
  }) => ReactNode;
  /** Form layout */
  layout?: 'vertical' | 'horizontal' | 'inline';
  /** Form title */
  title?: string;
  /** Form subtitle */
  subtitle?: string;
  /** Submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether to disable the submit button when the form is invalid */
  disableSubmitOnInvalid?: boolean;
  /** Whether to show a reset button */
  showResetButton?: boolean;
  /** Reset button text */
  resetText?: string;
  /** Whether to enable progressive loading for form fields */
  progressiveLoadingEnabled?: boolean;
}

/**
 * Form state interface
 */
export interface FormState<T = Record<string, unknown>> {
  /** Form values */
  values: T;
  /** Initial form values */
  initialValues: Partial<T>;
  /** Validation errors by field ID */
  errors: Record<string, string | null>;
  /** Whether the form is dirty (has unsaved changes) */
  isDirty: boolean;
  /** Whether the form has been touched */
  isTouched: Record<string, boolean>;
  /** Whether the form is being submitted */
  isSubmitting: boolean;
  /** Whether the form has been submitted */
  isSubmitted: boolean;
  /** Whether the form is valid */
  isValid: boolean;
  /** Form submission status */
  submissionStatus: FormSubmissionStatus;
}

/**
 * Form field props interface
 */
export interface FormFieldProps<T = unknown> {
  /** Field definition */
  field: FormField<T>;
  /** Field value */
  value: T;
  /** Field error */
  error?: string | null;
  /** Field change handler */
  onChange: (value: T) => void;
  /** Field blur handler */
  onBlur: () => void;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is loading */
  isLoading?: boolean;
} 