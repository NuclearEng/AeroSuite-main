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
import supplierService, { Supplier, CreateSupplierData, UpdateSupplierData } from '../../../services/supplier.service';

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


interface FormErrors {
  name?: string;
  code?: string;
  industry?: string;
  status?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  [key: string]: string | undefined;
}

interface SupplierFormData {
  name: string;
  code: string;
  description: string;
  industry: string;
  status: string;
  website: string;
  primaryContactName: string;
  primaryContactEmail: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags: string[];
}

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  initialData?: Partial<SupplierFormData>;
  isEdit?: boolean;
  supplierId?: string;
}

const initialFormValues: SupplierFormData = {
  name: '',
  code: '',
  description: '',
  industry: '',
  status: 'pending',
  website: '',
  primaryContactName: '',
  primaryContactEmail: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  tags: []
};

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEdit = false,
  supplierId
}) => {
  const [formValues, setFormValues] = useState<SupplierFormData>({
    ...initialFormValues,
    ...initialData
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Load supplier data if editing
  useEffect(() => {
    if (isEdit && supplierId && open) {
      const fetchSupplier = async () => {
        try {
          setLoading(true);
          const supplier = await supplierService.getSupplier(supplierId);
          setFormValues({
            name: supplier.name || '',
            code: supplier.code || '',
            description: supplier.description || '',
            industry: supplier.industry || '',
            status: supplier.status || 'pending',
            website: supplier.website || '',
            primaryContactName: supplier.primaryContactName || '',
            primaryContactEmail: supplier.primaryContactEmail || '',
            phone: supplier.phone || '',
            address: supplier.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: ''
            },
            tags: supplier.tags || []
          });
        } catch (_error) {
          console.error('Error loading supplier:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchSupplier();
    }
  }, [isEdit, supplierId, open]);

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

  // Generate supplier code
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
    if (!formValues.code) newErrors.code = 'Supplier code is required';
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
      let supplier: Supplier;

      // Prepare data for API
      const supplierData: CreateSupplierData | UpdateSupplierData = {
        name: formValues.name,
        code: formValues.code,
        description: formValues.description,
        industry: formValues.industry,
        status: formValues.status as 'active' | 'inactive' | 'pending',
        website: formValues.website,
        primaryContactName: formValues.primaryContactName,
        primaryContactEmail: formValues.primaryContactEmail,
        phone: formValues.phone,
        address: formValues.address,
        tags: formValues.tags
      };

      if (isEdit && supplierId) {
        // Update existing supplier
        supplier = await supplierService.updateSupplier(supplierId, supplierData);
      } else {
        // Create new supplier
        supplier = await supplierService.createSupplier(supplierData as CreateSupplierData);
      }

      // Call onSave callback with the created/updated supplier
      onSave(supplier);

      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      setErrors({
        ...errors,
        submit: error.message || 'Failed to save supplier. Please try again.'
      });
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
        {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ?
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box> :

        <form id="supplier-form" onSubmit={handleSubmit}>
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
                helperText={errors.name}
                onBlur={generateCode} />

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
                rows={2}
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
                  Tags
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                multiple
                options={tagOptions}
                value={formValues.tags}
                onChange={(_, newValue) => handleTagsChange(newValue)}
                renderTags={(value, getTagProps) =>
                value.map((option, index) =>
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  key={option} />

                )
                }
                renderInput={(params) =>
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Add tags"
                  helperText="Select or type tags to categorize this supplier" />

                }
                freeSolo />

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
          form="supplier-form"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={isSubmitting || loading}>

          {isSubmitting ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
        </Button>
      </DialogActions>
    </Dialog>);

};

export default SupplierFormModal;