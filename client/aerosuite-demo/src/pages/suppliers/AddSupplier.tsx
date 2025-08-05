import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import MockDataService from '../../services/mockDataService';
import type { Supplier, Customer } from '../../services/mockDataService';

// Extend the Supplier type to include the additional fields we need
interface SupplierWithRelationships extends Supplier {
  tier: 'tier1' | 'tier2' | 'tier3';
  category?: string;
  customers?: { _id: string; name: string; code: string }[];
}

interface FormData {
  name: string;
  code: string;
  category: string;
  location: string;
  latitude: string;
  longitude: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  customerIds: string[];
}

interface FormErrors {
  name?: string;
  code?: string;
  tier?: string;
  contactEmail?: string;
}

const AddSupplier: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    category: '',
    location: '',
    latitude: '',
    longitude: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    tier: 'tier1',
    customerIds: []
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mock data service and load customers
    MockDataService.initialize();
    setCustomers(MockDataService.getCustomers());
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleGetCoordinates = () => {
    // This would be replaced with actual Google Maps Geocoding API call
    // For now, we'll just simulate with random coordinates near the provided location
    if (formData.location) {
      // Generate random-ish coordinates for demonstration
      const lat = (Math.random() * 10 + 30).toFixed(6); // Random latitude around 30-40
      const lng = (Math.random() * 10 - 100).toFixed(6); // Random longitude around -90 to -100
      
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    } else {
      setSubmitError("Please enter a location to get coordinates");
      setTimeout(() => setSubmitError(null), 3000);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Supplier code is required';
    }
    
    if (!formData.tier) {
      newErrors.tier = 'Supplier tier is required';
    }
    
    if (formData.contactEmail && !/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCustomerOptions = () => {
    return customers.map(customer => ({
      id: customer._id,
      label: customer.name,
      code: customer.code
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Get selected customers
      const relatedCustomers = customers
        .filter(c => formData.customerIds.includes(c._id))
        .map(c => ({
          _id: c._id,
          name: c.name,
          code: c.code
        }));
      
      // Create supplier object
      const newSupplier: Partial<SupplierWithRelationships> = {
        _id: `supp_${Date.now()}`,
        name: formData.name,
        code: formData.code,
        category: formData.category || undefined,
        location: formData.location || undefined,
        contact: {
          name: formData.contactName || '',
          email: formData.contactEmail || '',
          phone: formData.contactPhone || ''
        },
        coordinates: formData.latitude && formData.longitude ? {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude)
        } : undefined,
        tier: formData.tier,
        customers: relatedCustomers.length > 0 ? relatedCustomers : undefined
      };
      
      // Add the supplier to mock data service
      // Use the appropriate method based on MockDataService
      if (typeof MockDataService.addSupplier === 'function') {
        MockDataService.addSupplier(newSupplier as SupplierWithRelationships);
      } else {
        // Fallback - add to suppliers array in mock data
        const suppliers = MockDataService.getSuppliers();
        suppliers.push(newSupplier as SupplierWithRelationships);
        console.log('Added supplier to existing suppliers array');
      }
      
      // Show success message
      setSubmitSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/suppliers');
      }, 1500);
    } catch (error) {
      console.error('Error creating supplier:', error);
      setSubmitError((error as Error).message || 'Failed to create supplier');
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/suppliers')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Add Supplier
        </Typography>
      </Box>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Supplier added successfully!
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              name="name"
              label="Supplier Name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              name="code"
              label="Supplier Code"
              value={formData.code}
              onChange={handleInputChange}
              error={!!errors.code}
              helperText={errors.code}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                name="category"
                value={formData.category}
                onChange={handleSelectChange}
                label="Category"
              >
                <MenuItem value="Machining">Machining</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Assembly">Assembly</MenuItem>
                <MenuItem value="Composites">Composites</MenuItem>
                <MenuItem value="Raw Materials">Raw Materials</MenuItem>
                <MenuItem value="Testing">Testing</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <TextField
                name="location"
                label="Location (City, State)"
                value={formData.location}
                onChange={handleInputChange}
                fullWidth
                sx={{ mr: 1 }}
              />
              <Button 
                variant="outlined" 
                startIcon={<LocationIcon />}
                onClick={handleGetCoordinates}
                sx={{ minWidth: '160px', height: '56px' }}
              >
                Get Coordinates
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                name="latitude"
                label="Latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                name="longitude"
                label="Longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
          </Grid>
          
          {/* Supplier Tier & Customer Relationships */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Tier & Relationships
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <FormControl fullWidth error={!!errors.tier} sx={{ mb: 2 }}>
              <InputLabel id="tier-label">Supplier Tier</InputLabel>
              <Select
                labelId="tier-label"
                name="tier"
                value={formData.tier}
                onChange={handleSelectChange}
                label="Supplier Tier"
                required
              >
                <MenuItem value="tier1">Tier 1 (Direct Supplier)</MenuItem>
                <MenuItem value="tier2">Tier 2 (Secondary Supplier)</MenuItem>
                <MenuItem value="tier3">Tier 3 (Tertiary Supplier)</MenuItem>
              </Select>
              {errors.tier && <FormHelperText>{errors.tier}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <Autocomplete
              multiple
              options={getCustomerOptions()}
              getOptionLabel={(option) => option.label}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={option.id} {...otherProps}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {option.label}
                      </Typography>
                      <Chip 
                        label={option.code} 
                        size="small" 
                        sx={{ ml: 1 }} 
                      />
                    </Box>
                  </li>
                );
              }}
              onChange={(_, value) => {
                setFormData(prev => ({
                  ...prev,
                  customerIds: value.map(v => v.id)
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Related Customers"
                  helperText="Select customers this supplier works with"
                  sx={{ mb: 2 }}
                />
              )}
              ListboxProps={{
                style: { maxHeight: '200px' }
              }}
            />
          </Grid>
          
          {/* Contact Information */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <TextField
              name="contactName"
              label="Contact Name"
              value={formData.contactName}
              onChange={handleInputChange}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <TextField
              name="contactEmail"
              label="Contact Email"
              value={formData.contactEmail}
              onChange={handleInputChange}
              error={!!errors.contactEmail}
              helperText={errors.contactEmail}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <TextField
              name="contactPhone"
              label="Contact Phone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Grid>
          
          {/* Submit Buttons */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/suppliers')}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                type="submit"
              >
                Add Supplier
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AddSupplier; 