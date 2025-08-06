import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Typography,
  Autocomplete,
  Chip,
  Box,
  CircularProgress } from
'@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import customerService, { Customer, CreateCustomerData, UpdateCustomerData } from '../../../services/customer.service';

// Industry options
const industryOptions = [
{ value: 'Aerospace', label: 'Aerospace' },
{ value: 'Automotive', label: 'Automotive' },
{ value: 'Aviation', label: 'Aviation' },
{ value: 'Defense', label: 'Defense' },
{ value: 'Electronics', label: 'Electronics' },
{ value: 'Energy', label: 'Energy' },
{ value: 'Manufacturing', label: 'Manufacturing' },
{ value: 'Materials', label: 'Materials' },
{ value: 'Technology', label: 'Technology' }];


// Status options
const statusOptions = [
{ value: 'active', label: 'Active' },
{ value: 'inactive', label: 'Inactive' },
{ value: 'pending', label: 'Pending' }];


// Service level options
const serviceLevelOptions = [
{ value: 'standard', label: 'Standard' },
{ value: 'premium', label: 'Premium' },
{ value: 'enterprise', label: 'Enterprise' }];


interface FormErrors {
  name?: string;
  code?: string;
  industry?: string;
  status?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  [key: string]: string | undefined;
}

interface CustomerFormData {
  name: string;
  code: string;
  description: string;
  industry: string;
  status: string;
  website: string;
  primaryContactName: string;
  primaryContactEmail: string;
  phone: string;
  serviceLevel: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags: string[];
}

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  initialData?: Partial<CustomerFormData>;
  isEdit?: boolean;
  customerId?: string;
}

const initialFormValues: CustomerFormData = {
  name: '',
  code: '',
  description: '',
  industry: '',
  status: 'pending',
  website: '',
  primaryContactName: '',
  primaryContactEmail: '',
  phone: '',
  serviceLevel: 'standard',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  tags: []
};

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEdit = false,
  customerId
}) => {
  const [formValues, setFormValues] = useState<CustomerFormData>({
    ...initialFormValues,
    ...initialData
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Load customer data if editing
  useEffect(() => {
    if (isEdit && customerId && open) {
      const fetchCustomer = async () => {
        try {
          setLoading(true);
          const customer = await customerService.getCustomer(customerId);
          setFormValues({
            name: customer.name || '',
            code: customer.code || '',
            description: customer.description || '',
            industry: customer.industry || '',
            status: customer.status || 'pending',
            website: customer.website || '',
            primaryContactName: customer.primaryContactName || '',
            primaryContactEmail: customer.primaryContactEmail || '',
            phone: customer.phone || '',
            serviceLevel: customer.serviceLevel || 'standard',
            address: {
              street: customer.address?.street || '',
              city: customer.address?.city || '',
              state: customer.address?.state || '',
              zipCode: customer.address?.zipCode || '',
              country: customer.address?.country || ''
            },
            tags: customer.tags || []
          });
        } catch (_error) {
          console.error('Error loading customer:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchCustomer();
    }
  }, [isEdit, customerId, open]);

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
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
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

  // Handle tag changes
  const handleTagsChange = (newValue: string[]) => {
    setFormValues((prev) => ({
      ...prev,
      tags: newValue
    }));
  };

  // Generate customer code
  const generateCode = () => {
    if (!formValues.name) return;

    // Create code from first 3 letters of the name, converted to uppercase
    const words = formValues.name.split(' ');
    let code = '';

    if (words.length >= 2) {
      // Use first letter of each word for multi-word names
      code = words.slice(0, 3).map((word) => word.charAt(0)).join('');
    } else {
      // Use first 3 letters for single-word names
      code = formValues.name.substring(0, 3);
    }

    setFormValues((prev) => ({
      ...prev,
      code: code.toUpperCase()
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formValues.name) newErrors.name = 'Name is required';
    if (!formValues.code) newErrors.code = 'Customer code is required';
    if (!formValues.industry) newErrors.industry = 'Industry is required';
    if (!formValues.status) newErrors.status = 'Status is required';

    // Email validation
    if (formValues.primaryContactEmail && !/\S+@\S+\.\S+/.test(formValues.primaryContactEmail)) {
      newErrors.primaryContactEmail = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let customer: Customer;

      // Prepare data for API
      const customerData: CreateCustomerData | UpdateCustomerData = {
        name: formValues.name,
        code: formValues.code,
        description: formValues.description,
        industry: formValues.industry,
        status: formValues.status as 'active' | 'inactive' | 'pending',
        website: formValues.website,
        primaryContactName: formValues.primaryContactName,
        primaryContactEmail: formValues.primaryContactEmail,
        phone: formValues.phone,
        serviceLevel: formValues.serviceLevel,
        address: formValues.address,
        tags: formValues.tags
      };

      if (isEdit && customerId) {
        // Update existing customer
        customer = await customerService.updateCustomer(customerId, customerData as UpdateCustomerData);
      } else {
        // Create new customer
        customer = await customerService.createCustomer(customerData as CreateCustomerData);
      }

      // Call onSave callback with the created/updated customer
      onSave(customer);

      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error.message || 'Failed to save customer. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md">

      <DialogTitle>
        {isEdit ? 'Edit Customer' : 'Add New Customer'}
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ?
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box> :

        <form id="customer-form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <TextField
                fullWidth
                required
                label="Customer Name"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                onBlur={generateCode} />

              </Grid>
              
              <Grid item xs={12} md={4}>
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
                rows={2}
                label="Description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                placeholder="Brief description of customer" />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.industry}>
                  <InputLabel>Industry</InputLabel>
                  <Select
                  name="industry"
                  value={formValues.industry}
                  label="Industry"
                  onChange={handleChange as any}>

                    {industryOptions.map((option) =>
                  <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                  )}
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
                  onChange={handleChange as any}>

                    {statusOptions.map((option) =>
                  <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                  )}
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Service Level</InputLabel>
                  <Select
                  name="serviceLevel"
                  value={formValues.serviceLevel}
                  label="Service Level"
                  onChange={handleChange as any}>

                    {serviceLevelOptions.map((option) =>
                  <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                  )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={12}>
                <TextField
                fullWidth
                label="Website"
                name="website"
                value={formValues.website}
                onChange={handleChange}
                placeholder="https://example.com" />

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
                onChange={handleChange}
                error={!!errors.primaryContactName}
                helperText={errors.primaryContactName} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                fullWidth
                label="Contact Email"
                name="primaryContactEmail"
                type="email"
                value={formValues.primaryContactEmail}
                onChange={handleChange}
                error={!!errors.primaryContactEmail}
                helperText={errors.primaryContactEmail} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formValues.phone}
                onChange={handleChange} />

              </Grid>
              
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                fullWidth
                label="Street Address"
                name="address.street"
                value={formValues.address.street || ''}
                onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                fullWidth
                label="City"
                name="address.city"
                value={formValues.address.city || ''}
                onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                fullWidth
                label="State/Province"
                name="address.state"
                value={formValues.address.state || ''}
                onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                fullWidth
                label="Postal Code"
                name="address.zipCode"
                value={formValues.address.zipCode || ''}
                onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                fullWidth
                label="Country"
                name="address.country"
                value={formValues.address.country || ''}
                onChange={handleChange} />

              </Grid>
            </Grid>
          </form>
        }
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          form="customer-form"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={isSubmitting || loading}>

          {isSubmitting ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
        </Button>
      </DialogActions>
    </Dialog>);

};

export default CustomerFormModal;