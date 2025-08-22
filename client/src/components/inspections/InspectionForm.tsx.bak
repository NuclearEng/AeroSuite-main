import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export interface InspectionFormProps {
  onSubmit: (values: Record<string, string>) => void;
  initialValues?: Record<string, string>;
}

const InspectionForm: React.FC<InspectionFormProps> = ({ onSubmit, initialValues = {} }) => {
  const [values, setValues] = useState<Record<string, string>>({
    inspector: initialValues.inspector || '',
    date: initialValues.date || '',
    location: initialValues.location || '',
    notes: initialValues.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!values.inspector) newErrors.inspector = 'Inspector is required';
    if (!values.date) newErrors.date = 'Date is required';
    if (!values.location) newErrors.location = 'Location is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" component="h2">Inspection Form</Typography>
      <TextField
        name="inspector"
        label="Inspector"
        value={values.inspector}
        onChange={handleChange}
        error={!!errors.inspector}
        helperText={errors.inspector}
        required
      />
      <TextField
        name="date"
        label="Date"
        type="date"
        value={values.date}
        onChange={handleChange}
        error={!!errors.date}
        helperText={errors.date}
        required
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        name="location"
        label="Location"
        value={values.location}
        onChange={handleChange}
        error={!!errors.location}
        helperText={errors.location}
        required
      />
      <TextField
        name="notes"
        label="Notes"
        value={values.notes}
        onChange={handleChange}
        multiline
        minRows={3}
      />
      <Button type="submit" variant="contained" color="primary">
        Submit
      </Button>
    </Box>
  );
};

export default InspectionForm; 