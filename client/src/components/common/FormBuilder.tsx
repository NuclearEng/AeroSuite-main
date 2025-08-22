import React, { ChangeEvent, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Autocomplete,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
  useTheme,
  CircularProgress,
  LinearProgress,
  Alert } from
'@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Visibility,
  VisibilityOff,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon } from
'@mui/icons-material';
import { LoadingButton } from './index';

// Types for field validation
export type ValidationRule = {
  type: 'required' | 'email' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'match' | 'custom';
  value?: any;
  message: string;
  validate?: (value: any, formValues: any) => boolean;
  severity?: 'error' | 'warning' | 'validating' | 'success' | 'none';
};

// Types for form fields
export type FieldType =
'text' |
'textarea' |
'password' |
'email' |
'number' |
'select' |
'multiselect' |
'radio' |
'checkbox' |
'switch' |
'date' |
'autocomplete' |
'custom';

export interface SelectOption {
  value: string | number | boolean;
  label: string;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  options?: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  validation?: ValidationRule[];
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  autoFocus?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  endAdornment?: React.ReactNode;
  startAdornment?: React.ReactNode;
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  customComponent?: React.ReactNode;
  tooltip?: string;
  onChange?: (value: any) => void;
  size?: 'small' | 'medium';
}

export interface FormSection {
  title?: string;
  description?: string;
  fields: FormField[];
  columns?: 1 | 2 | 3 | 4;
  spacing?: number;
}

export interface FormBuilderProps {
  sections?: FormSection[];
  fields?: any[]; // Support legacy fields prop for backward compatibility
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>, isValid: boolean) => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  onCancel?: () => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  elevation?: number;
  defaultValues?: Record<string, any>;
  onSubmitCapture?: (e: React.FormEvent) => void;
  showReset?: boolean;
  submitText?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  sx?: any;
  showValidationSummary?: boolean;
  resetOnSubmit?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  isReadOnly?: boolean;
  submitButtonProps?: any;
  cancelButtonProps?: any;
  hideSubmitButton?: boolean;
  variant?: 'standard' | 'outlined' | 'paper';
  actions?: React.ReactNode;
  showProgressIndicator?: boolean;
  validationFeedbackDelay?: number;
  instantValidation?: boolean;
}

// New type for validation results
type ValidationResult = {
  isValid: boolean;
  message: string;
  severity: 'error' | 'warning' | 'validating' | 'success' | 'none';
};

const FormBuilder: React.FC<FormBuilderProps> = ({
  sections = [],
  initialValues = {},
  onSubmit,
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  onCancel,
  loading = false,
  title,
  subtitle,
  elevation = 0,
  showValidationSummary = true,
  resetOnSubmit = false,
  validateOnChange = true,
  validateOnBlur = true,
  validateOnSubmit = true,
  isReadOnly = false,
  submitButtonProps = {},
  cancelButtonProps = {},
  hideSubmitButton = false,
  variant = 'paper',
  actions,
  showProgressIndicator = false,
  validationFeedbackDelay = 500,
  instantValidation = false
}) => {
  const theme = useTheme();

  // Defensive default for allFields
  const allFields = (sections || []).flatMap((section) => section.fields || []);

  // Initialize values from initialValues or defaultValues
  const getInitialFormValues = () => {
    const values: Record<string, any> = {};

    allFields.forEach((field) => {
      // Skip hidden fields
      if (field.hidden) return;

      // Use initialValues if provided, otherwise use field's defaultValue
      if (initialValues && initialValues[field.name] !== undefined) {
        values[field.name] = initialValues[field.name];
      } else if (field.defaultValue !== undefined) {
        values[field.name] = field.defaultValue;
      } else {
        // Default values based on field type
        switch (field.type) {
          case 'checkbox':
          case 'switch':
            values[field.name] = false;
            break;
          case 'multiselect':
            values[field.name] = [];
            break;
          default:
            values[field.name] = '';
        }
      }
    });

    return values;
  };

  // Initialize state
  const [formValues, setFormValues] = useState<any>(getInitialFormValues());
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});
  const [showPassword, setShowPassword] = useState<any>({});
  const [validating, setValidating] = useState<any>({});
  const [validationSeverity, setValidationSeverity] = useState<any>({});
  const [validationTimeouts, setValidationTimeouts] = useState<any>({});
  const [formProgress, setFormProgress] = useState(0);

  // Update form values when initialValues change
  useEffect(() => {
    setFormValues(getInitialFormValues());
  }, [JSON.stringify(initialValues)]);

  // New function to calculate form completion progress
  const calculateFormProgress = () => {
    if (!showProgressIndicator) return;

    const requiredFields = allFields.filter((field: any) =>
    !field.hidden && (field.required ||
    field.validation?.some((rule: any) => rule.type === 'required'))
    );

    if (requiredFields.length === 0) {
      setFormProgress(100);
      return;
    }

    const filledRequiredFields = requiredFields.filter((field: any) => {
      const value = formValues[field.name];
      return value !== undefined && value !== null && value !== '';
    });

    const progress = Math.round(filledRequiredFields.length / requiredFields.length * 100);
    setFormProgress(progress);
  };

  // Update progress when form values change
  useEffect(() => {
    calculateFormProgress();
  }, [formValues]);

  // Enhanced validate field function that returns severity level
  const validateField = (field: FormField, value: any): ValidationResult => {
    if (!field.validation) return { isValid: true, message: '', severity: 'none' };

    for (const rule of field.validation) {
      const severity = rule.severity || 'error';

      if (rule.type === 'required' && (value === undefined || value === null || value === '')) {
        return { isValid: false, message: rule.message, severity };
      }

      if (value === undefined || value === null || value === '') {
        continue; // Skip other validations for empty values (unless required)
      }

      switch (rule.type) {
        case 'email':
          if (!/\S+@\S+\.\S+/.test(value)) {
            return { isValid: false, message: rule.message, severity };
          }
          break;

        case 'min':
          if (Number(value) < rule.value) {
            return { isValid: false, message: rule.message, severity };
          }
          break;

        case 'max':
          if (Number(value) > rule.value) {
            return { isValid: false, message: rule.message, severity };
          }
          break;

        case 'minLength':
          if (String(value).length < rule.value) {
            return { isValid: false, message: rule.message, severity };
          }
          break;

        case 'maxLength':
          if (String(value).length > rule.value) {
            return { isValid: false, message: rule.message, severity };
          }
          break;

        case 'pattern':
          if (!new RegExp(rule.value).test(value)) {
            return { isValid: false, message: rule.message, severity };
          }
          break;

        case 'match':
          if (value !== formValues[rule.value]) {
            return { isValid: false, message: rule.message, severity };
          }
          break;

        case 'custom':
          if (rule.validate && !rule.validate(value, formValues)) {
            return { isValid: false, message: rule.message, severity };
          }
          break;
      }
    }

    return { isValid: true, message: '', severity: 'none' };
  };

  // Validate the entire form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newSeverities: Record<string, 'error' | 'warning' | 'validating' | 'success' | 'none'> = {};
    let isValid = true;

    allFields.forEach((field) => {
      if (field.hidden) return;

      const value = formValues[field.name];
      const result = validateField(field, value);

      if (!result.isValid) {
        newErrors[field.name] = result.message;
        newSeverities[field.name] = result.severity;

        // Only consider errors (not warnings) for overall form validity
        if (result.severity === 'error') {
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    setValidationSeverity(newSeverities);
    return isValid;
  };

  // Handle field change with debounced validation
  const handleChange = (field: FormField, value: any) => {
    const newValues = { ...formValues, [field.name]: value };

    setFormValues(newValues);

    // Mark field as touched if instant validation is enabled
    if (instantValidation && !touched[field.name]) {
      setTouched({ ...touched, [field.name]: true });
    }

    // Clear previous timeout if it exists
    if (validationTimeouts[field.name]) {
      clearTimeout(validationTimeouts[field.name]);
    }

    // Set validating state to show spinner
    if (validateOnChange) {
      setValidating((prev: any) => ({ ...prev, [field.name]: true }));

      // Debounce validation to prevent excessive validation while typing
      const timeout = setTimeout(() => {
        const result = validateField(field, value);

        setErrors((prev: any) => ({ ...prev, [field.name]: result.isValid ? '' : result.message }));
        setValidationSeverity((prev: any) => ({ ...prev, [field.name]: result.severity }));
        setValidating((prev: any) => ({ ...prev, [field.name]: false }));

        // Remove this timeout from the tracked timeouts
        setValidationTimeouts((prev: any) => {
          const newTimeouts = { ...prev };
          delete newTimeouts[field.name];
          return newTimeouts;
        });
      }, validationFeedbackDelay);

      // Track the new timeout
      setValidationTimeouts((prev: any) => ({ ...prev, [field.name]: timeout }));
    }

    // Call field's onChange handler if provided
    if (field.onChange) {
      field.onChange(value);
    }
  };

  // Handle field blur with enhanced validation
  const handleBlur = (field: FormField) => {
    // Mark field as touched
    if (!touched[field.name]) {
      setTouched({ ...touched, [field.name]: true });
    }

    // Validate on blur if enabled
    if (validateOnBlur) {
      // Clear any pending validation timeout
      if (validationTimeouts[field.name]) {
        clearTimeout(validationTimeouts[field.name]);

        // Remove this timeout from the tracked timeouts
        setValidationTimeouts((prev: any) => {
          const newTimeouts = { ...prev };
          delete newTimeouts[field.name];
          return newTimeouts;
        });
      }

      const result = validateField(field, formValues[field.name]);
      setErrors((prev: any) => ({ ...prev, [field.name]: result.isValid ? '' : result.message }));
      setValidationSeverity((prev: any) => ({ ...prev, [field.name]: result.severity }));
      setValidating((prev: any) => ({ ...prev, [field.name]: false }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const newTouched: Record<string, boolean> = {};
    allFields.forEach((field) => {
      if (!field.hidden) {
        newTouched[field.name] = true;
      }
    });
    setTouched(newTouched);

    // Validate form if enabled
    let isValid = true;
    if (validateOnSubmit) {
      isValid = validateForm();
    }

    // Call onSubmit with form values and validation status
    onSubmit(formValues, isValid);

    // Reset form if requested
    if (resetOnSubmit && isValid) {
      setFormValues(getInitialFormValues());
      setTouched({});
      setErrors({});
    }
  };

  // Toggle password visibility
  const handleTogglePassword = (fieldName: string) => {
    setShowPassword((prev: any) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  // Enhanced hasError to check for validation severity
  const hasError = (field: FormField): boolean => {
    return touched[field.name] && !!errors[field.name];
  };

  // Get the validation state for a field
  const getValidationState = (field: FormField): 'error' | 'warning' | 'success' | 'validating' | 'none' => {
    if (validating[field.name]) return 'validating';
    if (!touched[field.name]) return 'none';
    if (!errors[field.name]) return 'success';
    return validationSeverity[field.name] || 'error';
  };

  // Get the helper text for a field (error or field's helperText)
  const getHelperText = (field: FormField): string => {
    return hasError(field) ? errors[field.name] : field.helperText || '';
  };

  // Render validation icon based on validation state
  const RenderValidationIcon = (field: FormField) => {
    const validationState = getValidationState(field);

    if (!touched[field.name]) return null;

    switch (validationState) {
      case 'validating':
        return (
          <InputAdornment position="end">
            <CircularProgress size={16} />
          </InputAdornment>);

      case 'success':
        return (
          <InputAdornment position="end">
            <Tooltip title="Valid">
              <SuccessIcon color="success" fontSize="small" />
            </Tooltip>
          </InputAdornment>);

      case 'warning':
        return (
          <InputAdornment position="end">
            <Tooltip title={errors[field.name]}>
              <WarningIcon color="warning" fontSize="small" />
            </Tooltip>
          </InputAdornment>);

      case 'error':
        return (
          <InputAdornment position="end">
            <Tooltip title={errors[field.name]}>
              <ErrorIcon color="error" fontSize="small" />
            </Tooltip>
          </InputAdornment>);

      default:
        return null;
    }
  };

  // Render form fields based on type
  const RenderField = (field: FormField) => {
    // Skip hidden fields
    if (field.hidden) return null;

    // Common props for all field types
    const commonProps = {
      id: field.name,
      name: field.name,
      label: field.label,
      placeholder: field.placeholder,
      disabled: isReadOnly || field.disabled,
      required: field.required,
      fullWidth: field.fullWidth !== false,
      error: hasError(field) && validationSeverity[field.name] === 'error',
      helperText: getHelperText(field),
      value: formValues[field.name] === undefined ? '' : formValues[field.name],
      onChange: (e: React.ChangeEvent<any>) => {
        // Different handling based on field type
        if (field.type === 'checkbox' || field.type === 'switch') {
          handleChange(field, e.target.checked);
        } else {
          handleChange(field, e.target.value);
        }
      },
      onBlur: () => handleBlur(field),
      size: field.size || 'medium',
      InputProps: {
        endAdornment: getValidationState(field) !== 'none' && RenderValidationIcon(field)
      },
      // Add aria attributes for accessibility
      'aria-invalid': hasError(field) && validationSeverity[field.name] === 'error',
      'aria-describedby': `${field.name}-helper-text`
    };

    // For specific field types like text, email, number
    if (field.type === 'text' || field.type === 'email' || field.type === 'number') {
      const endAdornment =
      <>
          {field.endAdornment && <InputAdornment position="end">{field.endAdornment}</InputAdornment>}
          {field.tooltip &&
        <InputAdornment position="end">
              <Tooltip title={field.tooltip}>
                <InfoIcon color="action" fontSize="small" />
              </Tooltip>
            </InputAdornment>
        }
          {getValidationState(field) !== 'none' && RenderValidationIcon(field)}
        </>;


      commonProps.InputProps = {
        ...commonProps.InputProps,
        endAdornment: endAdornment
      };
    }

    // Rest of the renderField function remains similar, just need to update password field
    if (field.type === 'password') {
      commonProps.InputProps = {
        ...commonProps.InputProps,
        endAdornment:
        <>
            <InputAdornment position="end">
              <IconButton
              aria-label="toggle password visibility"
              onClick={() => handleTogglePassword(field.name)}
              edge="end"
              size="small">

                {showPassword[field.name] ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
            {getValidationState(field) !== 'none' && RenderValidationIcon(field)}
          </>

      };
    }

    // Special case for select
    if (field.type === 'select' || field.type === 'multiselect') {
      // Use the commonProps but handle the endAdornment differently since it's not directly supported in Select
      return (
        <FormControl
          fullWidth={field.fullWidth !== false}
          error={hasError(field) && validationSeverity[field.name] === 'error'}
          size={field.size || 'medium'}>

          <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
          <Box sx={{ position: 'relative' }}>
            <Select
              labelId={`${field.name}-label`}
              id={field.name}
              name={field.name}
              value={field.type === 'multiselect' ? formValues[field.name] || [] : formValues[field.name] || ''}
              label={field.label}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              disabled={isReadOnly || field.disabled}
              multiple={field.type === 'multiselect'}
              required={field.required}
              aria-invalid={hasError(field) && validationSeverity[field.name] === 'error'}
              aria-describedby={`${field.name}-helper-text`}
              renderValue={field.type === 'multiselect' ? (selected) =>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as any[]).map((value: any) => {
                  const option = field.options?.find((opt) => opt.value === value);
                  return (
                    <Chip key={String(value)} label={option?.label || value} size="small" />);

                })}
                </Box> :
              undefined}>

              {field.options?.map((option: any) =>
              <MenuItem
                key={String(option.value)}
                value={typeof option.value === 'boolean' ? String(option.value) : option.value}
                disabled={option.disabled}>

                  {option.label}
                </MenuItem>
              )}
            </Select>
            {getValidationState(field) !== 'none' &&
            <Box sx={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                {RenderValidationIcon(field)}
              </Box>
            }
          </Box>
          {(hasError(field) || field.helperText) &&
          <FormHelperText id={`${field.name}-helper-text`} error={hasError(field) && validationSeverity[field.name] === 'error'}>
              {getHelperText(field)}
            </FormHelperText>
          }
        </FormControl>);

    }

    // Continue with the existing switch statements for other field types
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <TextField
            {...commonProps}
            type={field.type === 'number' ? 'number' : 'text'}
            multiline={field.multiline}
            rows={field.rows}
            inputProps={{
              readOnly: field.readOnly,
              min: field.min,
              max: field.max,
              step: field.step
            }} />);



      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={field.rows || 4}
            inputProps={{
              readOnly: field.readOnly
            }} />);



      case 'password':
        return (
          <TextField
            {...commonProps}
            type={showPassword[field.name] ? 'text' : 'password'} />);



      case 'checkbox':
        return (
          <FormControl
            error={hasError(field)}
            fullWidth={field.fullWidth !== false}>

            <FormControlLabel
              control={
              <Checkbox
                id={field.name}
                name={field.name}
                checked={Boolean(formValues[field.name])}
                onChange={(e) => handleChange(field, e.target.checked)}
                onBlur={() => handleBlur(field)}
                disabled={isReadOnly || field.disabled} />

              }
              label={field.label} />

          </FormControl>);


      case 'switch':
        return (
          <FormControl
            error={hasError(field)}
            fullWidth={field.fullWidth !== false}>

            <FormControlLabel
              control={
              <Switch
                id={field.name}
                name={field.name}
                checked={Boolean(formValues[field.name])}
                onChange={(e) => handleChange(field, e.target.checked)}
                onBlur={() => handleBlur(field)}
                disabled={isReadOnly || field.disabled} />

              }
              label={field.label} />

          </FormControl>);


      case 'radio':
        return (
          <FormControl
            error={hasError(field)}
            fullWidth={field.fullWidth !== false}>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {field.label}
            </Typography>
            <RadioGroup
              id={field.name}
              name={field.name}
              value={formValues[field.name] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}>

              {field.options?.map((option: any) =>
              <FormControlLabel
                key={String(option.value)}
                value={option.value}
                control={<Radio disabled={isReadOnly || field.disabled || option.disabled} />}
                label={option.label}
                disabled={isReadOnly || field.disabled || option.disabled} />

              )}
            </RadioGroup>
          </FormControl>);


      case 'date':
        return (
          <DatePicker
            label={field.label}
            value={formValues[field.name] || null}
            onChange={(date) => handleChange(field, date)}
            disabled={isReadOnly || field.disabled}
            slotProps={{
              textField: {
                fullWidth: field.fullWidth !== false,
                error: hasError(field),
                helperText: getHelperText(field),
                onBlur: () => handleBlur(field),
                size: field.size || 'medium'
              }
            }} />);



      case 'autocomplete':
        return (
          <Autocomplete
            id={field.name}
            options={field.options || []}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              const optionObj = option as SelectOption;
              return optionObj.label || String(optionObj.value);
            }}
            isOptionEqualToValue={(option, value) => {
              if (typeof option === 'string' && typeof value === 'string') {
                return option === value;
              }
              const optionObj = option as SelectOption;
              const valueObj = value as SelectOption;
              return optionObj.value === valueObj.value;
            }}
            value={formValues[field.name] || null}
            onChange={(_, newValue) => handleChange(field, newValue)}
            disabled={isReadOnly || field.disabled}
            fullWidth={field.fullWidth !== false}
            multiple={field.multiple}
            renderInput={(params) =>
            <TextField
              {...params}
              label={field.label}
              error={hasError(field)}
              helperText={getHelperText(field)}
              onBlur={() => handleBlur(field)}
              size={field.size || 'medium'} />

            } />);



      case 'custom':
        return field.customComponent || null;

      default:
        return null;
    }
  };

  // Enhanced validation summary with severity levels
  const RenderValidationSummary = () => {
    const errorMessages = Object.entries(errors).filter(([_, message]: any) => message);

    if (!showValidationSummary || errorMessages.length === 0) {
      return null;
    }

    const errorCount = Object.entries(errors).
    filter(([field, _]) => validationSeverity[field] === 'error').
    length;

    const warningCount = Object.entries(errors).
    filter(([field, _]) => validationSeverity[field] === 'warning').
    length;

    return (
      <Box sx={{ mt: 2 }}>
        {errorCount > 0 &&
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          icon={<ErrorIcon />}>
          <Box>
            <Typography variant="subtitle2">
              Please fix the following {errorCount} error{errorCount !== 1 ? 's' : ''}:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 4 }}>
              {errorMessages
                .filter(([field, _]) => validationSeverity[field] === 'error')
                .map(([field, message]) => {
                  const fieldDef = allFields.find((f) => f.name === field);
                  return (
                    <li key={field} style={{ marginBottom: '4px' }}>
                      <Typography variant="body2">
                        {`${fieldDef?.label}: ${message}`}
                      </Typography>
                    </li>
                  );
                })}
            </Box>
          </Box>
          </Alert>
        }
        
        {warningCount > 0 &&
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          icon={<WarningIcon />}>
          <Box>
            <Typography variant="subtitle2">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 4 }}>
              {errorMessages
                .filter(([field, _]) => validationSeverity[field] === 'warning')
                .map(([field, message]) => {
                  const fieldDef = allFields.find((f) => f.name === field);
                  return (
                    <li key={field} style={{ marginBottom: '4px' }}>
                      <Typography variant="body2">
                        {`${fieldDef?.label}: ${message}`}
                      </Typography>
                    </li>
                  );
                })}
            </Box>
          </Box>
          </Alert>
        }
      </Box>);

  };

  // Form container based on variant
  const FormContainer = ({ children }: {children: React.ReactNode;}) => {
    switch (variant) {
      case 'paper':
        return (
          <Paper
            elevation={elevation}
            sx={{
              p: 3,
              borderRadius: 2,
              width: '100%',
              overflow: 'hidden'
            }}>

            {children}
          </Paper>);

      case 'outlined':
        return (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              width: '100%',
              overflow: 'hidden'
            }}>

            {children}
          </Paper>);

      default:
        return <Box sx={{ width: '100%' }}>{children}</Box>;
    }
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit} noValidate>
        
        {(title || subtitle) &&
        <Box sx={{ mb: 3 }}>
            {title &&
          <Typography variant="h5" component="h2" gutterBottom>
                {title}
              </Typography>
          }
            {subtitle &&
          <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
          }
          </Box>
        }
        
        
        {showProgressIndicator &&
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                Form Completion: {formProgress}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Object.keys(touched).length} of {allFields.filter((f: any) => !f.hidden).length} fields visited
              </Typography>
            </Box>
            <LinearProgress
            variant="determinate"
            value={formProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4
              }
            }} />

          </Box>
        }
        
        
        {sections.map((section, sectionIndex: any) =>
        <Box
          key={sectionIndex}
          sx={{
            mb: sectionIndex < sections.length - 1 ? 4 : 2,
            ...(sectionIndex > 0 && {
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider'
            })
          }}>

            
            {(section.title || section.description) &&
          <Box sx={{ mb: 2 }}>
                {section.title &&
            <Typography variant="h6" component="h3" gutterBottom>
                    {section.title}
                  </Typography>
            }
                {section.description &&
            <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
            }
              </Box>
          }
            
            
            <Grid container spacing={section.spacing || 2}>
              {(section.fields || []).map((field: any) => {
              if (field.hidden) return null;

              // Calculate grid size based on columns or field's specific sizes
              const getGridSize = (breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
                const fieldSize = field[breakpoint];
                if (fieldSize !== undefined) return fieldSize;

                const columns = section.columns || 1;
                return 12 / columns;
              };

              return (
                <Grid
                  item
                  key={field.name}
                  xs={getGridSize('xs')}
                  sm={getGridSize('sm')}
                  md={getGridSize('md')}
                  lg={getGridSize('lg')}
                  xl={getGridSize('xl')}>

                    {RenderField(field)}
                  </Grid>);

            })}
            </Grid>
          </Box>
        )}
        
        
        {RenderValidationSummary()}
        
        
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 3,
            gap: 2
          }}>

          {actions ||
          <>
              {onCancel &&
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              {...cancelButtonProps}>

                  {cancelButtonText}
                </Button>
            }
              
              {!hideSubmitButton &&
            <LoadingButton
              type="submit"
              variant="contained"
              color="primary"
              loading={loading}
              {...submitButtonProps}>

                  {submitButtonText}
                </LoadingButton>
            }
            </>
          }
        </Box>
      </form>
    </FormContainer>);

};

export default FormBuilder;