/**
 * Progressive Form Component
 * 
 * This component implements progressive loading and rendering for forms,
 * showing fields in stages based on priority and visibility.
 * 
 * Implementation of RF036 - Implement progressive loading strategies
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, LinearProgress, Typography, Paper, Divider, Button } from '@mui/material';
import { useIncrementalHydration } from '../../../utils/progressiveLoading';
import { LoadPriority } from '../../../utils/codeSplittingConfig';
import { 
  FormField as FormFieldType,
  FormProps,
  FormSection as FormSectionType,
  ValidationFunction
} from '../../../types/forms.types';

// Types
export interface FormField<T = any> {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  value?: T;
  onChange?: (value: T) => void;
  priority: LoadPriority;
  required?: boolean;
  disabled?: boolean;
  visible?: boolean;
  section?: string;
  width?: 'full' | 'half' | 'third' | number;
  validate?: ValidationFunction<T>;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  priority: LoadPriority;
}

export interface ProgressiveFormProps {
  fields: FormField[];
  sections?: FormSection[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  onSubmit?: (values: Record<string, any>) => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  onCancel?: () => void;
  progressiveLoadingEnabled?: boolean;
  initialValues?: Record<string, any>;
  batchSize?: number;
  delayBetweenBatches?: number;
  hydrateAboveTheFoldFirst?: boolean;
}

/**
 * Progressive Form Component
 */
export function ProgressiveForm({
  fields,
  sections = [],
  isLoading = false,
  title,
  description,
  onSubmit,
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  onCancel,
  progressiveLoadingEnabled = true,
  initialValues = {},
  batchSize = 5,
  delayBetweenBatches = 50,
  hydrateAboveTheFoldFirst = true
}: ProgressiveFormProps) {
  // State for form values
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Ref to track if form is mounted
  const isMounted = useRef(true);
  
  // Effect to set initial values
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);
  
  // Effect to cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Setup incremental hydration for fields
  const { 
    hydratedComponents, 
    isComplete, 
    progress, 
    isHydrated 
  } = useIncrementalHydration(
    fields.map(field => ({
      id: field.id,
      priority: field.priority
    })),
    {
      batchSize,
      delayBetweenBatches,
      hydrateAboveTheFoldFirst
    }
  );
  
  // Handle field change
  const handleChange = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    setTouched(prev => ({ ...prev, [fieldId]: true }));
    
    // Clear error if field was previously invalid
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string | null> = {};
    let hasErrors = false;
    
    fields.forEach(field => {
      if (field.validate && field.visible !== false) {
        const error = field.validate(values[field.id], values);
        if (error) {
          newErrors[field.id] = error;
          hasErrors = true;
        }
      }
      
      // Mark all fields as touched on submit
      setTouched(prev => ({
        ...prev,
        [field.id]: true
      }));
    });
    
    setErrors(newErrors);
    
    if (!hasErrors && onSubmit) {
      onSubmit(values);
    }
  };
  
  // Group fields by section
  const fieldsBySection: Record<string, FormField[]> = {};
  
  // Initialize sections
  sections.forEach(section => {
    fieldsBySection[section.id] = [];
  });
  
  // Add default section if no sections provided
  if (sections.length === 0) {
    fieldsBySection['default'] = [];
  }
  
  // Group fields
  fields.forEach(field => {
    const sectionId = field.section || 'default';
    if (!fieldsBySection[sectionId]) {
      fieldsBySection[sectionId] = [];
    }
    fieldsBySection[sectionId].push(field);
  });
  
  // Render a field
  const renderField = (field: FormField) => {
    // Skip if not visible
    if (field.visible === false) return null;
    
    // Skip if not hydrated yet and progressive loading is enabled
    if (progressiveLoadingEnabled && !isHydrated(field.id)) {
      return (
        <Box 
          key={field.id} 
          id={field.id}
          sx={{ 
            mb: 2, 
            width: getFieldWidth(field.width),
            px: 1
          }}
        >
          <Box sx={{ pt: 3, pb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {field.label}{field.required ? ' *' : ''}
            </Typography>
            <LinearProgress />
          </Box>
        </Box>
      );
    }
    
    // Render the actual field component
    return (
      <Box 
        key={field.id} 
        id={field.id}
        sx={{ 
          mb: 2, 
          width: getFieldWidth(field.width),
          px: 1
        }}
      >
        <field.component
          {...field.props}
          id={field.id}
          name={field.id}
          label={field.label}
          value={values[field.id] !== undefined ? values[field.id] : field.value}
          onChange={(value: any) => {
            field.onChange?.(value);
            handleChange(field.id, value);
          }}
          required={field.required}
          disabled={field.disabled || isLoading}
          error={touched[field.id] && Boolean(errors[field.id])}
          helperText={touched[field.id] && errors[field.id]}
        />
      </Box>
    );
  };
  
  // Helper to get field width
  const getFieldWidth = (width?: 'full' | 'half' | 'third' | number) => {
    if (typeof width === 'number') return `${width}%`;
    switch (width) {
      case 'half': return '50%';
      case 'third': return '33.33%';
      case 'full':
      default: return '100%';
    }
  };
  
  // Render a section with its fields
  const renderSection = (sectionId: string, sectionFields: FormField[]) => {
    const section = sections.find(s => s.id === sectionId);
    
    return (
      <Box key={sectionId} sx={{ mb: 4 }}>
        {section && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">{section.title}</Typography>
            {section.description && (
              <Typography variant="body2" color="text.secondary">
                {section.description}
              </Typography>
            )}
            <Divider sx={{ mt: 1 }} />
          </Box>
        )}
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1 }}>
          {sectionFields.map(renderField)}
        </Box>
      </Box>
    );
  };
  
  return (
    <Paper sx={{ p: 3 }} elevation={2}>
      <form onSubmit={handleSubmit}>
        {title && <Typography variant="h5" sx={{ mb: 1 }}>{title}</Typography>}
        {description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </Typography>
        )}
        
        {isLoading && <LinearProgress sx={{ mb: 3 }} />}
        
        {progressiveLoadingEnabled && !isComplete && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* Render each section with its fields */}
        {Object.entries(fieldsBySection).map(([sectionId, sectionFields]) => 
          renderSection(sectionId, sectionFields)
        )}
        
        {/* Form actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
          {onCancel && (
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelButtonText}
            </Button>
          )}
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isLoading || (progressiveLoadingEnabled && !isComplete)}
          >
            {submitButtonText}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}

export default ProgressiveForm; 