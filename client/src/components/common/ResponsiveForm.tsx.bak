import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  FormHelperText,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  CircularProgress,
  styled,
  useTheme } from
'@mui/material';
import useResponsive from '../../hooks/useResponsive';
import { ResponsiveGridItem } from '../layout/ResponsiveGrid';

// Types for form field configuration
export interface FormFieldBase {
  id: string;
  label: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  hidden?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface TextFieldConfig extends FormFieldBase {
  type: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  autoFocus?: boolean;
  autoComplete?: string;
}

export interface SelectFieldConfig extends FormFieldBase {
  type: 'select';
  options: Array<{value: string | number;label: string;}>;
  multiple?: boolean;
  native?: boolean;
}

export interface RadioFieldConfig extends FormFieldBase {
  type: 'radio';
  options: Array<{value: string | number;label: string;}>;
  row?: boolean;
}

export interface CheckboxFieldConfig extends FormFieldBase {
  type: 'checkbox';
  label: string;
  checkboxLabel?: string;
}

export interface DividerFieldConfig {
  type: 'divider';
  id: string;
  label?: string;
  margin?: number;
}

export interface SectionConfig {
  type: 'section';
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export type FormFieldConfig =
TextFieldConfig |
SelectFieldConfig |
RadioFieldConfig |
CheckboxFieldConfig |
DividerFieldConfig |
SectionConfig;

// Form props
export interface ResponsiveFormProps {
  fields: FormFieldConfig[];
  values: Record<string, any>;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onChange: (id: string, value: any) => void;
  onBlur?: (id: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  paperProps?: React.ComponentProps<typeof Paper>;
  gridSpacing?: number;
  disabled?: boolean;
  dense?: boolean;
  submitFullWidth?: boolean;
}

// Styled components
const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  }
}));

const FormTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

const FormDescription = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  color: theme.palette.text.secondary
}));

const FormDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(3, 0)
}));

const FormActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: theme.spacing(3),
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column-reverse',
    '& > button': {
      width: '100%'
    }
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginBottom: theme.spacing(1)
}));

const SectionDescription = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.text.secondary
}));

/**
 * A responsive form component that adapts to different screen sizes.
 * It automatically adjusts layout and field sizes based on screen size.
 */
const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  fields,
  values,
  errors = {},
  touched = {},
  onChange,
  onBlur,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  loading = false,
  title,
  description,
  paperProps,
  gridSpacing = 2,
  disabled = false,
  dense = false,
  submitFullWidth = false
}) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !loading && !disabled) {
      onSubmit(e);
    }
  };

  // Handle field change
  const handleChange = (id: string, value: any) => {
    if (!disabled && !loading) {
      onChange(id, value);
    }
  };

  // Handle field blur
  const handleBlur = (id: string) => {
    if (onBlur && !disabled) {
      onBlur(id);
    }
  };

  // Get field error state
  const getFieldError = (id: string): {error: boolean;helperText: string | undefined;} => {
    const hasError = !!(touched[id] && errors[id]);
    return {
      error: hasError,
      helperText: hasError ? errors[id] : undefined
    };
  };

  // Render a specific form field based on its type
  const RenderField = (field: FormFieldConfig) => {
    // Don't render hidden fields
    if ('hidden' in field && field.hidden) {
      return null;
    }

    // Handle dividers
    if (field.type === 'divider') {
      return (
        <Grid item xs={12} key={field.id}>
          <Box sx={{ my: field.margin !== undefined ? field.margin : 2 }}>
            {field.label ?
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {field.label}
              </Typography> :
            null}
            <FormDivider />
          </Box>
        </Grid>);

    }

    // Handle sections
    if (field.type === 'section') {
      return (
        <Grid item xs={12} key={field.id}>
          <Box sx={{ mb: 2 }}>
            <SectionTitle variant="h6">{field.title}</SectionTitle>
            {field.description &&
            <SectionDescription variant="body2">{field.description}</SectionDescription>
            }
          </Box>
        </Grid>);

    }

    // Default column sizes if not specified
    const xs = field.xs ?? 12;
    const sm = field.sm ?? (isMobile ? 12 : 6);
    const md = field.md ?? (field.type === 'checkbox' ? 12 : 6);
    const lg = field.lg ?? (field.type === 'checkbox' ? 12 : 4);
    const xl = field.xl ?? lg;

    // Field is disabled if form is disabled or field itself is disabled
    const isDisabled = disabled || loading || field.disabled;

    // Handle different field types
    switch (field.type) {
      case 'text':
      case 'password':
      case 'email':
      case 'number':
      case 'tel':
      case 'url':
      case 'date':
      case 'datetime-local':
      case 'time':
        const { error, helperText } = getFieldError(field.id);
        return (
          <ResponsiveGridItem
            key={field.id}
            xs={xs}
            sm={sm}
            md={md}
            lg={lg}
            xl={xl}>

            <TextField
              id={field.id}
              name={field.id}
              label={field.label}
              type={field.type}
              value={values[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              onBlur={() => handleBlur(field.id)}
              error={error}
              helperText={error ? helperText : field.helperText}
              required={field.required}
              disabled={isDisabled}
              fullWidth={field.fullWidth !== false}
              placeholder={field.placeholder}
              multiline={field.multiline}
              rows={field.rows}
              maxRows={field.maxRows}
              autoFocus={field.autoFocus}
              autoComplete={field.autoComplete}
              size={dense ? 'small' : 'medium'}
              margin={dense ? 'dense' : 'normal'} />

          </ResponsiveGridItem>);


      case 'select':
        const selectError = getFieldError(field.id);
        return (
          <ResponsiveGridItem
            key={field.id}
            xs={xs}
            sm={sm}
            md={md}
            lg={lg}
            xl={xl}>

            <FormControl
              fullWidth={field.fullWidth !== false}
              error={selectError.error}
              disabled={isDisabled}
              required={field.required}
              size={dense ? 'small' : 'medium'}
              margin={dense ? 'dense' : 'normal'}>

              <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
              <Select
                labelId={`${field.id}-label`}
                id={field.id}
                name={field.id}
                value={values[field.id] || (field.multiple ? [] : '')}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onBlur={() => handleBlur(field.id)}
                multiple={field.multiple}
                native={field.native}
                label={field.label}>

                {field.options.map((option) =>
                field.native ?
                <option key={option.value} value={option.value}>
                      {option.label}
                    </option> :

                <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>

                )}
              </Select>
              {(selectError.error || field.helperText) &&
              <FormHelperText>
                  {selectError.error ? selectError.helperText : field.helperText}
                </FormHelperText>
              }
            </FormControl>
          </ResponsiveGridItem>);


      case 'radio':
        const radioError = getFieldError(field.id);
        return (
          <ResponsiveGridItem
            key={field.id}
            xs={xs}
            sm={sm}
            md={md}
            lg={lg}
            xl={xl}>

            <FormControl
              component="fieldset"
              error={radioError.error}
              disabled={isDisabled}
              required={field.required}
              margin={dense ? 'dense' : 'normal'}
              fullWidth>

              <FormLabel component="legend">{field.label}</FormLabel>
              <RadioGroup
                aria-label={field.label}
                name={field.id}
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                row={field.row}>

                {field.options.map((option) =>
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio size={dense ? 'small' : 'medium'} />}
                  label={option.label} />

                )}
              </RadioGroup>
              {(radioError.error || field.helperText) &&
              <FormHelperText>
                  {radioError.error ? radioError.helperText : field.helperText}
                </FormHelperText>
              }
            </FormControl>
          </ResponsiveGridItem>);


      case 'checkbox':
        const checkboxError = getFieldError(field.id);
        return (
          <ResponsiveGridItem
            key={field.id}
            xs={xs}
            sm={sm}
            md={md}
            lg={lg}
            xl={xl}>

            <FormControl
              error={checkboxError.error}
              disabled={isDisabled}
              required={field.required}
              margin={dense ? 'dense' : 'normal'}
              fullWidth>

              <FormControlLabel
                control={
                <Checkbox
                  name={field.id}
                  checked={!!values[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  onBlur={() => handleBlur(field.id)}
                  size={dense ? 'small' : 'medium'} />

                }
                label={field.checkboxLabel || field.label} />

              {(checkboxError.error || field.helperText) &&
              <FormHelperText>
                  {checkboxError.error ? checkboxError.helperText : field.helperText}
                </FormHelperText>
              }
            </FormControl>
          </ResponsiveGridItem>);


      default:
        return null;
    }
  };

  return (
    <FormContainer elevation={1} {...paperProps}>
      {title && <FormTitle variant="h5">{title}</FormTitle>}
      {description && <FormDescription variant="body2">{description}</FormDescription>}

      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={gridSpacing}>
          {fields.map(RenderField)}
        </Grid>

        <FormActions>
          {onCancel &&
          <Button
            type="button"
            color="inherit"
            onClick={onCancel}
            disabled={loading || disabled}
            fullWidth={isMobile}>

              {cancelLabel}
            </Button>
          }
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || disabled}
            fullWidth={submitFullWidth || isMobile}
            startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : undefined
            }>

            {submitLabel}
          </Button>
        </FormActions>
      </form>
    </FormContainer>);

};

export default ResponsiveForm;