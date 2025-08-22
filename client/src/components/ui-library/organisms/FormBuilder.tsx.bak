import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
}

export interface FormBuilderProps {
  fields: FormField[];
  onSubmit: (values: Record<string, string>) => void;
  submitLabel?: string;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ fields, onSubmit, submitLabel = 'Submit' }) => {
  const [values, setValues] = useState<Record<string, string>>(
    fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue || '';
      return acc;
    }, {} as Record<string, string>)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !values[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {fields.map(field => (
        <TextField
          key={field.name}
          name={field.name}
          label={field.label}
          type={field.type}
          required={field.required}
          value={values[field.name]}
          onChange={handleChange}
          error={!!errors[field.name]}
          helperText={errors[field.name]}
          fullWidth
          variant="outlined"
          inputProps={{ 'aria-label': field.label }}
        />
      ))}
      <Button type="submit" variant="contained" color="primary">
        {submitLabel}
      </Button>
    </Box>
  );
};

export default FormBuilder; 