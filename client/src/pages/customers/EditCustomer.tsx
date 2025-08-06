import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Snackbar,
  LinearProgress } from
'@mui/material';
import { PageHeader } from '../../components/common';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import customerService from '../../services/customer.service';

// Mock data for the customer being edited
const mockCustomer = {
  _id: '1',
  name: 'Boeing',
  code: 'BOE',
  description: 'Leading aerospace company and manufacturer of commercial jetliners, defense products, and space systems.',
  industry: 'Aerospace',
  status: 'active',
  logo: 'https://via.placeholder.com/150?text=Boeing',
  primaryContactName: 'John Smith',
  primaryContactEmail: 'jsmith@boeing.example.com',
  primaryContactPhone: '+1 (206) 555-1234',
  billingAddress: {
    street: '100 N Riverside Plaza',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60606',
    country: 'USA'
  },
  shippingAddress: {
    street: '100 N Riverside Plaza',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60606',
    country: 'USA'
  },
  contractStartDate: '2023-01-01',
  contractEndDate: '2025-12-31',
  serviceLevel: 'premium',
  notes: 'Key customer with multiple suppliers. Requires monthly inspection reports.',
  customFields: {
    customerCategory: 'Strategic',
    accountManager: 'Sarah Johnson',
    priorityLevel: 'High'
  }
};

// Form validation interface
interface FormErrors {
  name?: string;
  code?: string;
  industry?: string;
  status?: string;
  serviceLevel?: string;
  primaryContactEmail?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  [key: string]: string | undefined;
}

// Initial form values (will be replaced with actual customer data)
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

const EditCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string;}>();

  // Form state
  const [formValues, setFormValues] = useState(initialFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addressesAreDifferent, setAddressesAreDifferent] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load customer data
  useEffect(() => {
    const loadCustomer = async () => {
      setLoading(true);

      try {
        // Fetch customer data
        const data = await customerService.getCustomer(id!);

        // Format dates to work with date inputs
        const formattedData = {
          ...data,
          contractStartDate: data.contractStartDate ? data.contractStartDate.split('T')[0] : '',
          contractEndDate: data.contractEndDate ? data.contractEndDate.split('T')[0] : ''
        };

        setFormValues(formattedData);

        // Check if shipping address is different from billing
        const shippingDiffersFromBilling = data.billingAddress && data.shippingAddress &&
        JSON.stringify(data.billingAddress) !== JSON.stringify(data.shippingAddress);
        setAddressesAreDifferent(shippingDiffersFromBilling);

        setError(null);
      } catch (err: any) {
        console.error('Error loading customer:', err);
        setError(err.message || 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: unknown;}>) => {
    const { name, value } = e.target;

    if (!name) return;

    // Handle nested fields (using dot notation in name)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormValues((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Copy billing address to shipping address
  const handleCopyAddress = () => {
    if (!addressesAreDifferent) {
      setFormValues((prev) => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress }
      }));
    }
  };

  // Toggle shipping address form
  const handleToggleAddress = () => {
    setAddressesAreDifferent(!addressesAreDifferent);
    if (!addressesAreDifferent) {


      // When setting to different addresses, we don't need to do anything
      // The shipping address will remain as is
    } else {// When setting to same address, copy billing to shipping
      handleCopyAddress();}
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
    if (!addressesAreDifferent) {
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
      // Call API to update customer
      await customerService.updateCustomer(id!, formValues);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Customer updated successfully',
        severity: 'success'
      });

      // Redirect to customer details after a brief delay to show the success message
      setTimeout(() => {
        navigate(`/customers/${id}`);
      }, 1500);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update customer',
        severity: 'error'
      });
      setIsSubmitting(false);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>);

  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}>

          Back to Customers
        </Button>
      </Box>);

  }

  return (
    <Box>
      <PageHeader
        title="Edit Customer"
        subtitle={`Editing ${formValues.name} (${formValues.code})`}
        breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Customers', href: '/customers' },
        { label: formValues.name, href: `/customers/${id}` },
        { label: 'Edit' }]
        }
        actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/customers/${id}`)}>

            Cancel
          </Button>
        } />


      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              
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
                  helperText={errors.name} />

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
                  helperText={errors.code || 'Unique identifier for this customer'} />

              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={formValues.description}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.industry}>
                  <InputLabel>Industry</InputLabel>
                  <Select
                    name="industry"
                    value={formValues.industry}
                    label="Industry"
                    onChange={handleChange}>

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
                    onChange={handleChange}>

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
                    onChange={handleChange}>

                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </Select>
                  {errors.serviceLevel && <FormHelperText>{errors.serviceLevel}</FormHelperText>}
                </FormControl>
              </Grid>
              
              
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
                  helperText={errors.contractStartDate} />

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
                  helperText={errors.contractEndDate} />

              </Grid>
              
              
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
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="primaryContactEmail"
                  value={formValues.primaryContactEmail}
                  onChange={handleChange}
                  error={!!errors.primaryContactEmail}
                  helperText={errors.primaryContactEmail} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  name="primaryContactPhone"
                  value={formValues.primaryContactPhone}
                  onChange={handleChange} />

              </Grid>
              
              
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
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="City"
                  name="billingAddress.city"
                  value={formValues.billingAddress.city}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="State/Province"
                  name="billingAddress.state"
                  value={formValues.billingAddress.state}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  name="billingAddress.zipCode"
                  value={formValues.billingAddress.zipCode}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="Country"
                  name="billingAddress.country"
                  value={formValues.billingAddress.country}
                  onChange={handleChange} />

              </Grid>
              
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Shipping Address
                  </Typography>
                  <Button
                    variant="text"
                    onClick={handleToggleAddress}>

                    {addressesAreDifferent ? 'Same as billing' : 'Different from billing'}
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {addressesAreDifferent &&
              <>
                  <Grid item xs={12}>
                    <TextField
                    fullWidth
                    label="Street Address"
                    name="shippingAddress.street"
                    value={formValues.shippingAddress.street}
                    onChange={handleChange} />

                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <TextField
                    fullWidth
                    label="City"
                    name="shippingAddress.city"
                    value={formValues.shippingAddress.city}
                    onChange={handleChange} />

                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <TextField
                    fullWidth
                    label="State/Province"
                    name="shippingAddress.state"
                    value={formValues.shippingAddress.state}
                    onChange={handleChange} />

                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <TextField
                    fullWidth
                    label="Postal Code"
                    name="shippingAddress.zipCode"
                    value={formValues.shippingAddress.zipCode}
                    onChange={handleChange} />

                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <TextField
                    fullWidth
                    label="Country"
                    name="shippingAddress.country"
                    value={formValues.shippingAddress.country}
                    onChange={handleChange} />

                  </Grid>
                </>
              }
              
              
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
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Customer Category"
                  name="customFields.customerCategory"
                  value={formValues.customFields.customerCategory}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Account Manager"
                  name="customFields.accountManager"
                  value={formValues.customFields.accountManager}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    name="customFields.priorityLevel"
                    value={formValues.customFields.priorityLevel || ''}
                    label="Priority Level"
                    onChange={handleChange}>

                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 2 }}
                  onClick={() => navigate(`/customers/${id}`)}>

                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isSubmitting}>

                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>

        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}>

          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>);

};

export default EditCustomer;