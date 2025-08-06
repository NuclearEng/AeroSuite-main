import React, { useState } from 'react';
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
  FormHelperText } from
'@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon } from
'@mui/icons-material';
import MockDataService from '../../services/mockDataService';
import type { Customer } from '../../services/mockDataService';

interface FormData {
  name: string;
  code: string;
  industry: string;
  location: string;
  latitude: string;
  longitude: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

interface FormErrors {
  name?: string;
  code?: string;
  contactEmail?: string;
}

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    industry: '',
    location: '',
    latitude: '',
    longitude: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is updated
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Customer code is required';
    }

    if (formData.contactEmail && !/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetCoordinates = () => {
    // This would be replaced with actual Google Maps Geocoding API call
    // For now, we'll just simulate with random coordinates near the provided location
    if (formData.location) {
      // Generate random-ish coordinates for demonstration
      const lat = (Math.random() * 10 + 30).toFixed(6); // Random latitude around 30-40
      const lng = (Math.random() * 10 - 100).toFixed(6); // Random longitude around -90 to -100

      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    } else {
      setSubmitError("Please enter a location to get coordinates");
      setTimeout(() => setSubmitError(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Create customer object
      const newCustomer: Partial<Customer> = {
        _id: `cust_${Date.now()}`,
        name: formData.name,
        code: formData.code,
        industry: formData.industry || undefined,
        location: formData.location || undefined,
        contact: {
          name: formData.contactName || '',
          email: formData.contactEmail || '',
          phone: formData.contactPhone || ''
        },
        coordinates: formData.latitude && formData.longitude ? {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude)
        } : undefined
      };

      // Add the customer to mock data service
      MockDataService.addCustomer(newCustomer as Customer);

      // Show success message
      setSubmitSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/customers');
      }, 1500);
    } catch (error) {
      console.error('Error creating customer:', error);
      setSubmitError((error as Error).message || 'Failed to create customer');
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/customers')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Add Customer
        </Typography>
      </Box>

      {submitSuccess &&
      <Alert severity="success" sx={{ mb: 3 }}>
          Customer added successfully!
        </Alert>
      }

      {submitError &&
      <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      }

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              name="name"
              label="Customer Name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
              sx={{ mb: 2 }} />

            
            <TextField
              name="code"
              label="Customer Code"
              value={formData.code}
              onChange={handleInputChange}
              error={!!errors.code}
              helperText={errors.code}
              fullWidth
              required
              sx={{ mb: 2 }} />

            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="industry-label">Industry</InputLabel>
              <Select
                labelId="industry-label"
                name="industry"
                value={formData.industry}
                onChange={handleSelectChange}
                label="Industry">

                <MenuItem value="Aerospace">Aerospace</MenuItem>
                <MenuItem value="Aviation">Aviation</MenuItem>
                <MenuItem value="Defense">Defense</MenuItem>
                <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                <MenuItem value="Transportation">Transportation</MenuItem>
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
                sx={{ mr: 1 }} />

              <Button
                variant="outlined"
                startIcon={<LocationIcon />}
                onClick={handleGetCoordinates}
                sx={{ minWidth: '160px', height: '56px' }}>

                Get Coordinates
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                name="latitude"
                label="Latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                fullWidth />

              <TextField
                name="longitude"
                label="Longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                fullWidth />

            </Box>
          </Grid>
          
          
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
              sx={{ mb: 2 }} />

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
              sx={{ mb: 2 }} />

          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <TextField
              name="contactPhone"
              label="Contact Phone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              fullWidth
              sx={{ mb: 2 }} />

          </Grid>
          
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/customers')}>

                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                type="submit">

                Add Customer
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>);

};

export default AddCustomer;