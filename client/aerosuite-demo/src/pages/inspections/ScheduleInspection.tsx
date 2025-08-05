import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  IconButton,
  Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import type { Customer, Supplier } from '../../services/mockDataService';
import MockDataService from '../../services/mockDataService';

const ScheduleInspection: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    inspectionType: 'source',
    customer: '',
    supplier: '',
    scheduledDate: '',
    priority: 'medium'
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({
    title: '',
    customer: '',
    supplier: '',
    scheduledDate: ''
  });

  // Load customers and suppliers
  useEffect(() => {
    MockDataService.initialize();
    setCustomers(MockDataService.getCustomers());
    setSuppliers(MockDataService.getSuppliers());
    setLoading(false);
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });

    // Clear error when field is updated
    if (name && name in formErrors) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {
      title: '',
      customer: '',
      supplier: '',
      scheduledDate: ''
    };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.customer) {
      errors.customer = 'Customer is required';
      isValid = false;
    }

    if (!formData.supplier) {
      errors.supplier = 'Supplier is required';
      isValid = false;
    }

    if (!formData.scheduledDate) {
      errors.scheduledDate = 'Scheduled date is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Get customer and supplier objects
    const customerObj = customers.find(c => c._id === formData.customer);
    const supplierObj = suppliers.find(s => s._id === formData.supplier);

    if (!customerObj || !supplierObj) {
      setError('Invalid customer or supplier selected');
      return;
    }

    // Create inspection object
    const newInspection = {
      title: formData.title,
      description: formData.description,
      inspectionType: formData.inspectionType,
      customer: {
        _id: customerObj._id,
        name: customerObj.name,
        code: customerObj.code,
        logo: customerObj.logo
      },
      supplier: {
        _id: supplierObj._id,
        name: supplierObj.name,
        code: supplierObj.code,
        logo: supplierObj.logo
      },
      scheduledDate: formData.scheduledDate,
      status: 'scheduled',
      result: 'pending',
      checklistItems: [],
      defects: [],
      priority: formData.priority
    };

    try {
      const createdInspection = MockDataService.createInspection(newInspection);
      setSuccess(true);
      
      // Navigate to the new inspection after a brief delay
      setTimeout(() => {
        navigate(`/inspections/${createdInspection._id}`);
      }, 1500);
    } catch (err) {
      setError('Failed to create inspection. Please try again.');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/inspections')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Schedule Inspection
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Inspection scheduled successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Inspection Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.customer}>
                <InputLabel id="customer-label">Customer</InputLabel>
                <Select
                  labelId="customer-label"
                  name="customer"
                  value={formData.customer}
                  onChange={handleChange}
                  label="Customer"
                >
                  {customers.map(customer => (
                    <MenuItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.customer && <FormHelperText>{formErrors.customer}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.supplier}>
                <InputLabel id="supplier-label">Supplier</InputLabel>
                <Select
                  labelId="supplier-label"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  label="Supplier"
                >
                  {suppliers.map(supplier => (
                    <MenuItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.supplier && <FormHelperText>{formErrors.supplier}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Inspection Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="inspection-type-label">Inspection Type</InputLabel>
                <Select
                  labelId="inspection-type-label"
                  name="inspectionType"
                  value={formData.inspectionType}
                  onChange={handleChange}
                  label="Inspection Type"
                >
                  <MenuItem value="source">Source Inspection</MenuItem>
                  <MenuItem value="incoming">Incoming Inspection</MenuItem>
                  <MenuItem value="in-process">In-Process Inspection</MenuItem>
                  <MenuItem value="final">Final Inspection</MenuItem>
                  <MenuItem value="audit">Audit</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scheduled Date"
                name="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.scheduledDate}
                helperText={formErrors.scheduledDate}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/inspections')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                >
                  Schedule Inspection
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ScheduleInspection; 