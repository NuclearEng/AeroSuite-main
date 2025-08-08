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
  SelectChangeEvent,
  FormHelperText,
  Alert,
  Snackbar,
  Autocomplete,
  Chip,
  LinearProgress } from
'@mui/material';
import { PageHeader } from '../../components/common';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import supplierService from '../../services/supplier.service';

// Mock data for the supplier being edited
const mockSupplier: FormValues = {
  name: 'Aerospace Parts Inc.',
  code: 'API',
  description: 'Leading provider of precision-engineered components for the aerospace industry with a focus on high-quality materials and advanced manufacturing processes.',
  industry: 'Aerospace',
  status: 'active',
  website: 'https://www.aerospaceparts.example.com',
  contactName: 'Michael Johnson',
  contactEmail: 'mjohnson@aerospaceparts.example.com',
  contactPhone: '+1 (206) 555-1234',
  address: {
    street: '123 Aviation Way',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98108',
    country: 'USA'
  },
  qualifications: ['FAA Approved', 'DoD Compliant'],
  certifications: ['ISO 9001', 'AS9100', 'Nadcap'],
  supplierTags: ['Critical Supplier', 'Long-Term Contract'],
  notes: 'Key supplier for turbine components. Quarterly quality reviews required.'
};

// Form validation interface
interface FormErrors {
  name?: string;
  code?: string;
  industry?: string;
  status?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  [key: string]: string | undefined;
}

// Form values interface
interface FormValues {
  name: string;
  code: string;
  description: string;
  industry: string;
  status: 'active' | 'inactive' | 'pending';
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  qualifications: string[];
  certifications: string[];
  notes: string;
  supplierTags: string[];
}

// Initial form values (will be replaced with actual supplier data)
const initialFormValues: FormValues = {
  name: '',
  code: '',
  description: '',
  industry: '',
  status: 'pending',
  website: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  qualifications: [],
  certifications: [],
  notes: '',
  supplierTags: []
};

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


// Certification options
const certificationOptions = [
'ISO 9001',
'AS9100',
'ISO 14001',
'IATF 16949',
'Nadcap',
'API Q1',
'ISO 45001',
'ISO 13485',
'ASME',
'FAA Repair Station'];


// Tags options
const tagOptions = [
'Critical Supplier',
'Preferred Vendor',
'Local',
'International',
'Small Business',
'Minority-Owned',
'Veteran-Owned',
'Women-Owned',
'Long-Term Contract',
'New Supplier'];


const EditSupplier: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string;}>();

  // Form state
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);

      try {
        // Replace with actual API call
        // const data = await supplierService.getSupplier(id);
        const data = mockSupplier;

        setFormValues(data);
        setError(null);
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || 'Failed to load supplier data');
      } finally {
        setLoading(false);
      }
    };

    loadSupplier();
  }, [id]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;

    if (!name) return;

    // Handle nested fields (using dot notation in name)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormValues((prev) => {
        if (parent === 'address') {
          return {
            ...prev,
            address: {
              ...prev.address,
              [child]: value
            }
          };
        }
        return prev;
      });
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
    setFormValues((prev: FormValues) => ({
      ...prev,
      supplierTags: newValue
    }));
  };

  // Handle certifications changes
  const handleCertificationsChange = (newValue: string[]) => {
    setFormValues((prev: FormValues) => ({
      ...prev,
      certifications: newValue
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formValues.name) newErrors.name = 'Name is required';
    if (!formValues.code) newErrors.code = 'Supplier code is required';
    if (!formValues.industry) newErrors.industry = 'Industry is required';
    if (!formValues.status) newErrors.status = 'Status is required';

    // Email validation
    if (formValues.contactEmail && !/\S+@\S+\.\S+/.test(formValues.contactEmail)) {
      newErrors.contactEmail = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // Map form values to supplier data structure
      const supplierData = {
        name: formValues.name,
        code: formValues.code,
        description: formValues.description,
        industry: formValues.industry,
        status: formValues.status as 'active' | 'inactive' | 'pending',
        website: formValues.website,
        primaryContactName: formValues.contactName,
        primaryContactEmail: formValues.contactEmail,
        phone: formValues.contactPhone,
        address: formValues.address,
        tags: formValues.supplierTags
      };

      // Call API to update supplier
      await supplierService.updateSupplier(id || '', supplierData);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Supplier updated successfully',
        severity: 'success'
      });

      // Redirect to supplier details after a brief delay to show the success message
      setTimeout(() => {
        navigate(`/suppliers/${id}`);
      }, 1500);
    } catch (_error: any) {
      setSnackbar({
        open: true,
        message: _error.message || 'Failed to update supplier',
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
          onClick={() => navigate('/suppliers')}
          sx={{ mt: 2 }}>

          Back to Suppliers
        </Button>
      </Box>);

  }

  return (
    <Box>
      <PageHeader
        title="Edit Supplier"
        subtitle={`Editing ${formValues.name} (${formValues.code})`}
        breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Suppliers', href: '/suppliers' },
        { label: formValues.name, href: `/suppliers/${id}` },
        { label: 'Edit' }]
        }
        actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/suppliers/${id}`)}>

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
              
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  required
                  label="Supplier Name"
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Supplier Code"
                  name="code"
                  value={formValues.code}
                  onChange={handleChange}
                  error={!!errors.code}
                  helperText={errors.code || 'Unique identifier for this supplier'} />

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
                  placeholder="Brief description of supplier capabilities and products" />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.industry}>
                  <InputLabel>Industry</InputLabel>
                  <Select
                    name="industry"
                    value={formValues.industry}
                    label="Industry"
                    onChange={handleChange}>

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
                    onChange={handleChange}>

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
                  name="contactName"
                  value={formValues.contactName}
                  onChange={handleChange}
                  error={!!errors.contactName}
                  helperText={errors.contactName} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contactEmail"
                  value={formValues.contactEmail}
                  onChange={handleChange}
                  error={!!errors.contactEmail}
                  helperText={errors.contactEmail} />

              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  name="contactPhone"
                  value={formValues.contactPhone}
                  onChange={handleChange}
                  error={!!errors.contactPhone}
                  helperText={errors.contactPhone} />

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
                  value={formValues.address.street}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="City"
                  name="address.city"
                  value={formValues.address.city}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="State/Province"
                  name="address.state"
                  value={formValues.address.state}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  name="address.zipCode"
                  value={formValues.address.zipCode}
                  onChange={handleChange} />

              </Grid>
              
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="Country"
                  name="address.country"
                  value={formValues.address.country}
                  onChange={handleChange} />

              </Grid>
              
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Qualifications & Certifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={certificationOptions}
                  value={formValues.certifications}
                  onChange={(_, value) => handleCertificationsChange(value)}
                  renderTags={(value, getTagProps) =>
                  value.map((option, index) =>
                  <Chip key={index}
                  label={option}
                  {...getTagProps({ index })}
                  color="primary"
                  variant="outlined" />

                  )
                  }
                  renderInput={(params) =>
                  <TextField
                    {...params}
                    label="Certifications"
                    placeholder="Add certifications"
                    helperText="Select all applicable certifications" />

                  } />

              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={tagOptions}
                  value={formValues.supplierTags}
                  onChange={(_, value) => handleTagsChange(value)}
                  renderTags={(value, getTagProps) =>
                  value.map((option, index) =>
                  <Chip key={index}
                  label={option}
                  {...getTagProps({ index })}
                  color="secondary"
                  variant="outlined" />

                  )
                  }
                  renderInput={(params) =>
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags"
                    helperText="Categorize the supplier with relevant tags" />

                  } />

              </Grid>
              
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
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
                  placeholder="Any additional information about this supplier" />

              </Grid>
              
              
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 2 }}
                  onClick={() => navigate(`/suppliers/${id}`)}>

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

export default EditSupplier;