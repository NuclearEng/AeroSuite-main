import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Grid as MuiGrid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { PageHeader, FormBuilder } from '../../components/common';
import { FormSection } from '../../components/common/FormBuilder';
import supplierService, { CreateSupplierData } from '../../services/supplier.service';

// Create a Grid component that fixes TypeScript issues
const Grid = MuiGrid;

const SupplierCreate: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Form sections for FormBuilder
  const formSections: FormSection[] = [
    {
      title: 'Basic Information',
      description: 'Enter the basic information about the supplier',
      fields: [
        {
          name: 'name',
          label: 'Supplier Name',
          type: 'text' as const,
          required: true,
          validation: [{ type: 'required' as const, message: 'Supplier name is required' }],
          md: 6,
        },
        {
          name: 'code',
          label: 'Supplier Code',
          type: 'text' as const,
          required: true,
          validation: [{ type: 'required' as const, message: 'Supplier code is required' }],
          md: 6,
          helperText: 'A unique identifier for the supplier (e.g. API, GA)',
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
            { value: 'Chemical', label: 'Chemical' },
          ],
          required: true,
          validation: [{ type: 'required' as const, message: 'Industry is required' }],
          md: 6,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' },
          ],
          required: true,
          defaultValue: 'active',
          md: 6,
        },
      ],
      columns: 2 as const,
    },
    {
      title: 'Contact Information',
      description: 'Enter the primary contact information for the supplier',
      fields: [
        {
          name: 'primaryContactName',
          label: 'Primary Contact Name',
          type: 'text' as const,
          required: true,
          validation: [{ type: 'required' as const, message: 'Primary contact name is required' }],
          md: 6,
        },
        {
          name: 'primaryContactEmail',
          label: 'Primary Contact Email',
          type: 'email' as const,
          required: true,
          validation: [
            { type: 'required' as const, message: 'Primary contact email is required' },
            { type: 'email' as const, message: 'Invalid email format' },
          ],
          md: 6,
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'text' as const,
          md: 6,
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text' as const,
          md: 6,
        },
      ],
      columns: 2 as const,
    },
    {
      title: 'Address',
      description: 'Enter the supplier\'s address information',
      fields: [
        {
          name: 'address.street',
          label: 'Street Address',
          type: 'text' as const,
          md: 12,
        },
        {
          name: 'address.city',
          label: 'City',
          type: 'text' as const,
          md: 6,
        },
        {
          name: 'address.state',
          label: 'State/Province',
          type: 'text' as const,
          md: 6,
        },
        {
          name: 'address.zipCode',
          label: 'ZIP/Postal Code',
          type: 'text' as const,
          md: 6,
        },
        {
          name: 'address.country',
          label: 'Country',
          type: 'text' as const,
          md: 6,
        },
      ],
      columns: 2 as const,
    },
    {
      title: 'Additional Information',
      description: 'Add any additional details about the supplier',
      fields: [
        {
          name: 'description',
          label: 'Description',
          type: 'textarea' as const,
          rows: 4,
          md: 12,
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
            { value: 'Preferred', label: 'Preferred' },
          ],
          md: 12,
        },
      ],
      columns: 1 as const,
    },
  ];
  
  // Handle form submission
  const handleSubmit = async (values: any, isValid: boolean) => {
    if (!isValid) return;
    
    setLoading(true);
    
    try {
      // Format the data according to our API expectations
      const supplierData: CreateSupplierData = {
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
          country: values['address.country'],
        },
      };
      
      // Call the API
      const newSupplier = await supplierService.createSupplier(supplierData);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Supplier created successfully',
        severity: 'success'
      });
      
      // Navigate to the new supplier's detail page
      setTimeout(() => {
        navigate(`/suppliers/${newSupplier._id}`);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating supplier:', err);
      
      // Show error message
      setSnackbar({
        open: true,
        message: err.message || 'Failed to create supplier',
        severity: 'error'
      });
      
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/suppliers');
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Box>
      <PageHeader
        title="Create Supplier"
        subtitle="Add a new supplier to your network"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Suppliers', href: '/suppliers' },
          { label: 'Create Supplier' },
        ]}
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
          >
            {isMobile ? 'Back' : 'Back to Suppliers'}
          </Button>
        }
      />
      
      <MuiGrid container spacing={3}>
        <MuiGrid item xs={12} lg={8}>
          <FormBuilder
            sections={formSections}
            onSubmit={handleSubmit}
            loading={loading}
            submitButtonText="Create Supplier"
            cancelButtonText="Cancel"
            onCancel={handleCancel}
            validateOnChange
            validateOnBlur
            showValidationSummary
          />
        </MuiGrid>
        <MuiGrid item xs={12} lg={4}>
          <Box 
            sx={{ 
              backgroundColor: 'background.paper', 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" gutterBottom>Tips for Adding Suppliers</Typography>
            <Typography variant="body2" paragraph>
              Ensure you have the correct contact information for the supplier, 
              as this will be used for all communications.
            </Typography>
            <Typography variant="body2" paragraph>
              The supplier code should be unique and easily identifiable.
            </Typography>
            <Typography variant="body2" paragraph>
              You can upload a supplier logo and additional documents after creating the supplier.
            </Typography>
          </Box>
        </MuiGrid>
      </MuiGrid>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SupplierCreate; 