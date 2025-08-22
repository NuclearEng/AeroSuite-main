import React from 'react';
import { Box, FormControl, FormHelperText, FormLabel } from '@mui/material';
import Input from '../atoms/Input';

interface FormFieldProps {
  label: string;
  helperText?: string;
  required?: boolean;
  error?: boolean;
  id?: string;
  name?: string;
  [key: string]: any; // Allow any additional props to be passed to Input
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  helperText,
  required = false,
  error = false,
  id,
  name,
  ...rest
}) => {
  const fieldId = id || name || '';
  
  return (
    <FormControl fullWidth error={error} required={required}>
      <FormLabel htmlFor={fieldId}>{label}</FormLabel>
      <Box mt={1}>
        <Input
          id={fieldId}
          name={name}
          error={error}
          required={required}
          aria-describedby={`${fieldId}-helper-text`}
          {...rest}
        />
      </Box>
      {helperText && (
        <FormHelperText id={`${fieldId}-helper-text`}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default FormField; 