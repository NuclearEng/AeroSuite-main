import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Switch, FormControlLabel, Paper, Alert } from '@mui/material';
import FormBuilder, { FormSection } from '../../../components/common/FormBuilder';

const EnhancedSupplierForm: React.FC = () => {
  const [showProgress, setShowProgress] = useState(true);
  const [instantValidation, setInstantValidation] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Define form sections with validation rules
  const formSections: FormSection[] = [
    {
      title: 'Basic Information',
      description: 'Enter the basic supplier information',
      columns: 2,
      fields: [
        {
          name: 'name',
          label: 'Supplier Name',
          type: 'text',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Supplier name is required',
            },
            {
              type: 'minLength',
              value: 3,
              message: 'Name must be at least 3 characters',
            }
          ],
          placeholder: 'Enter supplier name',
          helperText: 'Full legal name of the supplier',
        },
        {
          name: 'code',
          label: 'Supplier Code',
          type: 'text',
          required: true,
          validation: [
            {
              type: 'required',
              message: 'Supplier code is required',
            },
            {
              type: 'pattern',
              value: '^[A-Z0-9]{3,10}$',
              message: 'Code must be 3-10 uppercase letters or numbers',
            }
          ],
          placeholder: 'e.g. SUP123',
          helperText: 'Unique identifier for this supplier',
        },
      ],
    },
    {
      title: 'Contact Information',
      description: 'Enter the contact details for this supplier',
      columns: 2,
      fields: [
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          validation: [
            {
              type: 'email',
              message: 'Please enter a valid email address',
            }
          ],
          placeholder: 'email@example.com',
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'text',
          validation: [
            {
              type: 'pattern',
              value: '^[0-9+\\-\\s()]{8,20}$',
              message: 'Please enter a valid phone number',
              severity: 'warning',
            }
          ],
          placeholder: '+1 (555) 123-4567',
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text',
          validation: [
            {
              type: 'pattern',
              value: '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w.-]*)*\\/?$',
              message: 'Please enter a valid website URL',
              severity: 'success',
            }
          ],
          placeholder: 'https://example.com',
          helperText: 'Company website address',
        },
        {
          name: 'contactName',
          label: 'Contact Person',
          type: 'text',
          placeholder: 'Full name of primary contact',
        },
      ],
    },
    {
      title: 'Supplier Details',
      description: 'Additional information about the supplier',
      columns: 2,
      fields: [
        {
          name: 'industry',
          label: 'Industry',
          type: 'select',
          options: [
            { value: 'aerospace', label: 'Aerospace' },
            { value: 'automotive', label: 'Automotive' },
            { value: 'electronics', label: 'Electronics' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'other', label: 'Other' },
          ],
          validation: [
            {
              type: 'required',
              message: 'Please select an industry',
            }
          ],
        },
        {
          name: 'size',
          label: 'Company Size',
          type: 'select',
          options: [
            { value: 'small', label: 'Small (<50 employees)' },
            { value: 'medium', label: 'Medium (50-250 employees)' },
            { value: 'large', label: 'Large (>250 employees)' },
          ],
        },
        {
          name: 'foundedYear',
          label: 'Founded Year',
          type: 'number',
          validation: [
            {
              type: 'min',
              value: 1900,
              message: 'Year must be after 1900',
              severity: 'warning',
            },
            {
              type: 'max',
              value: new Date().getFullYear(),
              message: 'Year cannot be in the future',
            }
          ],
          placeholder: 'YYYY',
        },
        {
          name: 'certified',
          label: 'ISO Certified',
          type: 'checkbox',
          helperText: 'Does the supplier have ISO certification?',
        },
      ],
    },
    {
      title: 'Security & Compliance',
      description: 'Security and compliance information',
      columns: 1,
      fields: [
        {
          name: 'password',
          label: 'Portal Password',
          type: 'password',
          validation: [
            {
              type: 'minLength',
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            {
              type: 'pattern',
              value: '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
              message: 'Password must include uppercase, lowercase, and numbers',
            }
          ],
          helperText: 'For supplier portal access',
        },
        {
          name: 'confirmPassword',
          label: 'Confirm Password',
          type: 'password',
          validation: [
            {
              type: 'match',
              value: 'password',
              message: 'Passwords must match',
            }
          ],
        },
        {
          name: 'acceptTerms',
          label: 'I accept the terms and conditions',
          type: 'checkbox',
          validation: [
            {
              type: 'custom',
              validate: (value) => value === true,
              message: 'You must accept the terms and conditions',
            }
          ],
        },
      ],
    },
  ];
  
  const handleSubmit = (values: Record<string, any>, isValid: boolean) => {
    console.log('Form submitted:', values, 'Valid:', isValid);
    setFormValues(values);
    setIsSubmitted(true);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Form Validation Demo
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
        <Typography variant="h6" gutterBottom>
          Form Controls
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={showProgress}
                  onChange={(e) => setShowProgress(e.target.checked)}
                />
              }
              label="Show Progress Indicator"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={instantValidation}
                  onChange={(e) => setInstantValidation(e.target.checked)}
                />
              }
              label="Instant Validation"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {isSubmitted && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Form submitted successfully! Check the console for the submitted values.
        </Alert>
      )}
      
      <Card>
        <CardContent>
          <FormBuilder
            sections={formSections}
            onSubmit={handleSubmit}
            submitButtonText="Submit Supplier"
            cancelButtonText="Cancel"
            onCancel={() => console.log('Cancelled')}
            title="New Supplier Registration"
            subtitle="Complete all required fields to register a new supplier"
            showValidationSummary={true}
            validateOnChange={true}
            validateOnBlur={true}
            validateOnSubmit={true}
            showProgressIndicator={showProgress}
            instantValidation={instantValidation}
            validationFeedbackDelay={500}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnhancedSupplierForm; 