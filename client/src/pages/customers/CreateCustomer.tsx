import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  Snackbar
} from '@mui/material';
import { PageHeader } from '../../components/common';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import customerService from '../../services/customer.service';

// Form validation interface
interface FormErrors {
  name?: string;
  code?: string;
  industry?: string;
  status?: string;
  serviceLevel?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  [key: string]: string | undefined;
}

// Initial form values
const initialFormValues = {
  name: '',
  code: '',
  description: '',
  industry: '',
  status: 'active',
  serviceLevel: 'standard',
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactPhone: '',
  billingAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  shippingAddress: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  contractStartDate: '',
  contractEndDate: '',
  notes: '',
  customFields: {
    customerCategory: '',
    accountManager: '',
    priorityLevel: ''
  }
};

const CreateCustomer: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formValues, setFormValues] = useState(initialFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (!name) return;
    
    // Handle nested fields (using dot notation in name)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormValues(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Copy billing address to shipping address
  const handleCopyAddress = () => {
    if (sameAsShipping) {
      setFormValues(prev => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress }
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Required fields validation
    if (!formValues.name) newErrors.name = 'Name is required';
    if (!formValues.code) newErrors.code = 'Customer code is required';
    if (!formValues.industry) newErrors.industry = 'Industry is required';
    if (!formValues.status) newErrors.status = 'Status is required';
    if (!formValues.serviceLevel) newErrors.serviceLevel = 'Service level is required';
    
    // Email validation
    if (formValues.primaryContactEmail && !/\S+@\S+\.\S+/.test(formValues.primaryContactEmail)) {
      newErrors.primaryContactEmail = 'Invalid email address';
    }
    
    // Date validation
    if (formValues.contractStartDate && formValues.contractEndDate) {
      const startDate = new Date(formValues.contractStartDate);
      const endDate = new Date(formValues.contractEndDate);
      
      if (endDate < startDate) {
        newErrors.contractEndDate = 'End date cannot be before start date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Copy billing address to shipping if same address is checked
    if (sameAsShipping) {
      handleCopyAddress();
    }
    
    // Validate form
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the form',
        severity: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call API to create customer
      await customerService.createCustomer(formValues);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Customer created successfully',
        severity: 'success'
      });
      
      // Redirect to customer list after a brief delay to show the success message
      setTimeout(() => {
        navigate('/customers');
      }, 1500);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create customer',
        severity: 'error'
      });
      setIsSubmitting(false);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <PageHeader
        title="Create Customer"
        subtitle="Add a new customer to your portfolio"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Customers', href: '/customers' },
          { label: 'Create Customer' },
        ]}
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/customers')}
          >
            Cancel
          </Button>
        }
      />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Customer Name"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Customer Code"
                  name="code"
                  value={formValues.code}
                  onChange={handleChange}
                  error={!!errors.code}
                  helperText={errors.code || 'Unique identifier for this customer'}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={formValues.description}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.industry}>
                  <InputLabel>Industry</InputLabel>
                  <Select
                    name="industry"
                    value={formValues.industry}
                    label="Industry"
                    onChange={handleChange}
                  >
                    <MenuItem value="Aerospace">Aerospace</MenuItem>
                    <MenuItem value="Automotive">Automotive</MenuItem>
                    <MenuItem value="Defense">Defense</MenuItem>
                    <MenuItem value="Electronics">Electronics</MenuItem>
                    <MenuItem value="Energy">Energy</MenuItem>
                    <MenuItem value="Healthcare">Healthcare</MenuItem>
                    <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                    <MenuItem value="Technology">Technology</MenuItem>
                  </Select>
                  {errors.industry && <FormHelperText>{errors.industry}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formValues.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.serviceLevel}>
                  <InputLabel>Service Level</InputLabel>
                  <Select
                    name="serviceLevel"
                    value={formValues.serviceLevel}
                    label="Service Level"
                    onChange={handleChange}
                  >
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </Select>
                  {errors.serviceLevel && <FormHelperText>{errors.serviceLevel}</FormHelperText>}
                </FormControl>
              </Grid>
              
              {/* Contract Information */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Contract Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Contract Start Date"
                  name="contractStartDate"
                  value={formValues.contractStartDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.contractStartDate}
                  helperText={errors.contractStartDate}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Contract End Date"
                  name="contractEndDate"
                  value={formValues.contractEndDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.contractEndDate}
                  helperText={errors.contractEndDate}
                />
              </Grid>
              
              {/* Primary Contact */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Primary Contact
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  name="primaryContactName"
                  value={formValues.primaryContactName}
                  onChange={handleChange}
                  error={!!errors.primaryContactName}
                  helperText={errors.primaryContactName}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="primaryContactEmail"
                  value={formValues.primaryContactEmail}
                  onChange={handleChange}
                  error={!!errors.primaryContactEmail}
                  helperText={errors.primaryContactEmail}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  name="primaryContactPhone"
                  value={formValues.primaryContactPhone}
                  onChange={handleChange}
                  error={!!errors.primaryContactPhone}
                  helperText={errors.primaryContactPhone}
                />
              </Grid>
              
              {/* Billing Address */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Billing Address
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="billingAddress.street"
                  value={formValues.billingAddress.street}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="City"
                  name="billingAddress.city"
                  value={formValues.billingAddress.city}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="State/Province"
                  name="billingAddress.state"
                  value={formValues.billingAddress.state}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  name="billingAddress.zipCode"
                  value={formValues.billingAddress.zipCode}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="Country"
                  name="billingAddress.country"
                  value={formValues.billingAddress.country}
                  onChange={handleChange}
                />
              </Grid>
              
              {/* Shipping Address */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Shipping Address
                  </Typography>
                  <Button
                    variant="text"
                    onClick={() => {
                      setSameAsShipping(!sameAsShipping);
                      if (!sameAsShipping) {
                        handleCopyAddress();
                      }
                    }}
                  >
                    {sameAsShipping ? 'Different from billing' : 'Same as billing'}
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {!sameAsShipping && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      name="shippingAddress.street"
                      value={formValues.shippingAddress.street}
                      onChange={handleChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <TextField
                      fullWidth
                      label="City"
                      name="shippingAddress.city"
                      value={formValues.shippingAddress.city}
                      onChange={handleChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <TextField
                      fullWidth
                      label="State/Province"
                      name="shippingAddress.state"
                      value={formValues.shippingAddress.state}
                      onChange={handleChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <TextField
                      fullWidth
                      label="Postal Code"
                      name="shippingAddress.zipCode"
                      value={formValues.shippingAddress.zipCode}
                      onChange={handleChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <TextField
                      fullWidth
                      label="Country"
                      name="shippingAddress.country"
                      value={formValues.shippingAddress.country}
                      onChange={handleChange}
                    />
                  </Grid>
                </>
              )}
              
              {/* Additional Information */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  name="notes"
                  value={formValues.notes}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Customer Category"
                  name="customFields.customerCategory"
                  value={formValues.customFields.customerCategory}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Account Manager"
                  name="customFields.accountManager"
                  value={formValues.customFields.accountManager}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    name="customFields.priorityLevel"
                    value={formValues.customFields.priorityLevel}
                    label="Priority Level"
                    onChange={handleChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 2 }}
                  onClick={() => navigate('/customers')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Customer'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateCustomer; 