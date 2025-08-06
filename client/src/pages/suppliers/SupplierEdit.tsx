import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery } from
'@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { PageHeader, FormBuilder } from '../../components/common';
import supplierService, { Supplier, UpdateSupplierData } from '../../services/supplier.service';

// Import FormSection type directly from the FormBuilder file
type FormSection = {
  title?: string;
  description?: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'password' | 'email' | 'number' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'switch' | 'date' | 'autocomplete' | 'custom';
    required?: boolean;
    validation?: Array<{type: 'required' | 'email' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'match' | 'custom';message: string;}>;
    defaultValue?: any;
    md?: number;
    options?: Array<{value: string | number | boolean;label: string;}>;
    helperText?: string;
    rows?: number;
  }[];
  columns?: 1 | 2 | 3 | 4;
};

const SupplierEdit: React.FC = () => {
  const { id } = useParams<{id: string;}>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load supplier data
  useEffect(() => {
    const loadSupplier = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const data = await supplierService.getSupplier(id);
        setSupplier(data);
      } catch (err: any) {
        console.error('Error loading supplier:', err);
        setError(err.message || 'Failed to load supplier');
      } finally {
        setLoading(false);
      }
    };

    loadSupplier();
  }, [id]);

  // Form sections for FormBuilder
  const formSections: FormSection[] = [
  {
    title: 'Basic Information',
    description: 'Update the basic information about the supplier',
    fields: [
    {
      name: 'name',
      label: 'Supplier Name',
      type: 'text' as const,
      required: true,
      validation: [{ type: 'required' as const, message: 'Supplier name is required' }],
      defaultValue: supplier?.name,
      md: 6
    },
    {
      name: 'code',
      label: 'Supplier Code',
      type: 'text' as const,
      required: true,
      validation: [{ type: 'required' as const, message: 'Supplier code is required' }],
      defaultValue: supplier?.code,
      md: 6,
      helperText: 'A unique identifier for the supplier (e.g. API, GA)'
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'select' as const,
      options: [
      { value: 'Aerospace', label: 'Aerospace' },
      { value: 'Manufacturing', label: 'Manufacturing' },
      { value: 'Electronics', label: 'Electronics' },
      { value: 'Metallurgy', label: 'Metallurgy' },
      { value: 'Chemical', label: 'Chemical' }],

      required: true,
      validation: [{ type: 'required' as const, message: 'Industry is required' }],
      defaultValue: supplier?.industry,
      md: 6
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Pending' }],

      required: true,
      defaultValue: supplier?.status || 'active',
      md: 6
    }],

    columns: 2 as const
  },
  {
    title: 'Contact Information',
    description: 'Update the primary contact information for the supplier',
    fields: [
    {
      name: 'primaryContactName',
      label: 'Primary Contact Name',
      type: 'text' as const,
      required: true,
      validation: [{ type: 'required' as const, message: 'Primary contact name is required' }],
      defaultValue: supplier?.primaryContactName,
      md: 6
    },
    {
      name: 'primaryContactEmail',
      label: 'Primary Contact Email',
      type: 'email' as const,
      required: true,
      validation: [
      { type: 'required' as const, message: 'Primary contact email is required' },
      { type: 'email' as const, message: 'Invalid email format' }],

      defaultValue: supplier?.primaryContactEmail,
      md: 6
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text' as const,
      defaultValue: supplier?.phone || '',
      md: 6
    },
    {
      name: 'website',
      label: 'Website',
      type: 'text' as const,
      defaultValue: supplier?.website || '',
      md: 6
    }],

    columns: 2 as const
  },
  {
    title: 'Address',
    description: 'Update the supplier\'s address information',
    fields: [
    {
      name: 'address.street',
      label: 'Street Address',
      type: 'text' as const,
      defaultValue: supplier?.address?.street || '',
      md: 12
    },
    {
      name: 'address.city',
      label: 'City',
      type: 'text' as const,
      defaultValue: supplier?.address?.city || '',
      md: 6
    },
    {
      name: 'address.state',
      label: 'State/Province',
      type: 'text' as const,
      defaultValue: supplier?.address?.state || '',
      md: 6
    },
    {
      name: 'address.zipCode',
      label: 'ZIP/Postal Code',
      type: 'text' as const,
      defaultValue: supplier?.address?.zipCode || '',
      md: 6
    },
    {
      name: 'address.country',
      label: 'Country',
      type: 'text' as const,
      defaultValue: supplier?.address?.country || '',
      md: 6
    }],

    columns: 2 as const
  },
  {
    title: 'Additional Information',
    description: 'Update any additional details about the supplier',
    fields: [
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      rows: 4,
      defaultValue: supplier?.description || '',
      md: 12
    },
    {
      name: 'tags',
      label: 'Tags',
      type: 'multiselect' as const,
      options: [
      { value: 'ISO Certified', label: 'ISO Certified' },
      { value: 'Domestic', label: 'Domestic' },
      { value: 'International', label: 'International' },
      { value: 'Strategic', label: 'Strategic' },
      { value: 'Preferred', label: 'Preferred' }],

      defaultValue: supplier?.tags || [],
      md: 12
    }],

    columns: 1 as const
  }];


  // Handle form submission
  const handleSubmit = async (values: any, isValid: boolean) => {
    if (!isValid || !id) return;

    setSaving(true);

    try {
      // Format the data according to our API expectations
      const supplierData: UpdateSupplierData = {
        name: values.name,
        code: values.code,
        industry: values.industry,
        status: values.status,
        primaryContactName: values.primaryContactName,
        primaryContactEmail: values.primaryContactEmail,
        phone: values.phone,
        website: values.website,
        description: values.description,
        tags: values.tags,
        address: {
          street: values['address.street'],
          city: values['address.city'],
          state: values['address.state'],
          zipCode: values['address.zipCode'],
          country: values['address.country']
        }
      };

      // Call the API
      const updatedSupplier = await supplierService.updateSupplier(id, supplierData);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Supplier updated successfully',
        severity: 'success'
      });

      // Navigate to the supplier's detail page after a short delay
      setTimeout(() => {
        navigate(`/suppliers/${id}`);
      }, 1500);

    } catch (err: any) {
      console.error('Error updating supplier:', err);

      // Show error message
      setSnackbar({
        open: true,
        message: err.message || 'Failed to update supplier',
        severity: 'error'
      });

      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/suppliers/${id}`);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>);

  }

  // Error state
  if (error || !supplier) {
    return (
      <Box>
        <PageHeader
          title="Error"
          subtitle="Failed to load supplier"
          breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Suppliers', href: '/suppliers' },
          { label: 'Error' }]
          } />

        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Supplier not found'}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/suppliers')}
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}>

          Back to Suppliers
        </Button>
      </Box>);

  }

  return (
    <Box>
      <PageHeader
        title={`Edit ${supplier.name}`}
        subtitle="Update supplier information"
        breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Suppliers', href: '/suppliers' },
        { label: supplier.name, href: `/suppliers/${id}` },
        { label: 'Edit Supplier' }]
        }
        actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}>

            {isMobile ? 'Back' : 'Back to Details'}
          </Button>
        } />

      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <FormBuilder
            sections={formSections}
            onSubmit={handleSubmit}
            loading={saving}
            submitButtonText="Save Changes"
            cancelButtonText="Cancel"
            onCancel={handleCancel}
            validateOnChange
            validateOnBlur
            showValidationSummary />

        </Grid>
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              backgroundColor: 'background.paper',
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}>

            <Typography variant="h6" gutterBottom>Tips for Updating Suppliers</Typography>
            <Typography variant="body2" paragraph>
              Make sure to keep the supplier code consistent with your internal systems.
            </Typography>
            <Typography variant="body2" paragraph>
              If you need to change the primary contact, ensure the new contact information is accurate.
            </Typography>
            <Typography variant="body2" paragraph>
              Consider adding relevant tags to make it easier to filter and find this supplier.
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}>

        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled">

          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>);

};

export default SupplierEdit;