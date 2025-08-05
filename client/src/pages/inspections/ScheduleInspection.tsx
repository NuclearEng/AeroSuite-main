import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Autocomplete
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PageHeader } from '../../components/common';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { addDays } from 'date-fns';

// Mock data for suppliers
const mockSuppliers = [
  { id: '1', name: 'Aerospace Parts Inc.', status: 'active' },
  { id: '2', name: 'Global Aviation Technologies', status: 'active' },
  { id: '3', name: 'Precision Manufacturing Ltd', status: 'inactive' },
  { id: '4', name: 'Advanced Electronics Corp', status: 'active' },
  { id: '5', name: 'Titanium Solutions', status: 'pending' }
];

// Mock data for inspectors
const mockInspectors = [
  { id: '1', name: 'Jane Doe', title: 'Senior Quality Inspector' },
  { id: '2', name: 'John Smith', title: 'Quality Engineer' },
  { id: '3', name: 'Michael Brown', title: 'Senior Quality Assurance Specialist' },
  { id: '4', name: 'Lisa Anderson', title: 'Quality Control Inspector' },
  { id: '5', name: 'Robert Johnson', title: 'Lead Auditor' }
];

// Form validation interface
interface FormErrors {
  title?: string;
  inspectionType?: string;
  supplierId?: string;
  inspectorId?: string;
  inspectionDate?: string;
  location?: string;
  priority?: string;
  [key: string]: string | undefined;
}

// Initial form values
const initialFormValues = {
  title: '',
  description: '',
  inspectionType: '',
  supplierId: '',
  supplierName: '',
  inspectorId: '',
  inspectorName: '',
  inspectionDate: new Date(addDays(new Date(), 3)),
  location: '',
  priority: 'medium',
  notes: '',
  checklistTemplateId: ''
};

// Inspection type options
const inspectionTypes = [
  { value: 'Quality Audit', label: 'Quality Audit' },
  { value: 'Process Audit', label: 'Process Audit' },
  { value: 'First Article', label: 'First Article' },
  { value: 'Follow-up', label: 'Follow-up' },
  { value: 'Compliance Audit', label: 'Compliance Audit' }
];

// Priority options
const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

// Checklist template options
const checklistTemplates = [
  { id: '1', name: 'General Quality Audit Checklist', itemCount: 25 },
  { id: '2', name: 'First Article Inspection Checklist', itemCount: 18 },
  { id: '3', name: 'ISO 9001 Compliance Audit', itemCount: 30 },
  { id: '4', name: 'Process Audit - Assembly', itemCount: 22 },
  { id: '5', name: 'Process Audit - Machining', itemCount: 20 }
];

const ScheduleInspection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract any query parameters from the URL
  const searchParams = new URLSearchParams(location.search);
  const supplierIdFromQuery = searchParams.get('supplierId');
  const customerIdFromQuery = searchParams.get('customerId');
  
  // Form state
  const [formValues, setFormValues] = useState(initialFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load suppliers and inspectors
  useEffect(() => {
    // Load suppliers - replace with API call
    setSuppliers(mockSuppliers);
    
    // Load inspectors - replace with API call
    setInspectors(mockInspectors);
    
    // If supplier ID is provided in the URL, select that supplier
    if (supplierIdFromQuery) {
      const supplier = mockSuppliers.find(s => s.id === supplierIdFromQuery);
      if (supplier) {
        setFormValues(prev => ({
          ...prev,
          supplierId: supplier.id,
          supplierName: supplier.name
        }));
      }
    }
  }, [supplierIdFromQuery]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    
    if (!name) return;
    
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle date change
  const handleDateChange = (newDate: Date | null) => {
    setFormValues(prev => ({
      ...prev,
      inspectionDate: newDate || new Date()
    }));
    
    // Clear error when field is updated
    if (errors.inspectionDate) {
      setErrors(prev => ({
        ...prev,
        inspectionDate: undefined
      }));
    }
  };

  // Handle supplier selection
  const handleSupplierChange = (value: any) => {
    setFormValues(prev => ({
      ...prev,
      supplierId: value ? value.id : '',
      supplierName: value ? value.name : ''
    }));
    
    // Clear error when field is updated
    if (errors.supplierId) {
      setErrors(prev => ({
        ...prev,
        supplierId: undefined
      }));
    }
  };

  // Handle inspector selection
  const handleInspectorChange = (value: any) => {
    setFormValues(prev => ({
      ...prev,
      inspectorId: value ? value.id : '',
      inspectorName: value ? value.name : ''
    }));
    
    // Clear error when field is updated
    if (errors.inspectorId) {
      setErrors(prev => ({
        ...prev,
        inspectorId: undefined
      }));
    }
  };

  // Generate a title based on inspection type and supplier
  const generateTitle = () => {
    const inspectionType = formValues.inspectionType;
    const supplierName = formValues.supplierName;
    
    if (!inspectionType || !supplierName) return;
    
    const title = `${inspectionType} - ${supplierName}`;
    setFormValues(prev => ({
      ...prev,
      title
    }));
  };

  // Handle auto-generation of title when type or supplier changes
  useEffect(() => {
    if (formValues.inspectionType && formValues.supplierName) {
      generateTitle();
    }
  }, [formValues.inspectionType, formValues.supplierName]);

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    // Required fields validation
    if (!formValues.title) newErrors.title = 'Title is required';
    if (!formValues.inspectionType) newErrors.inspectionType = 'Inspection type is required';
    if (!formValues.supplierId) newErrors.supplierId = 'Supplier is required';
    if (!formValues.inspectorId) newErrors.inspectorId = 'Inspector is required';
    if (!formValues.inspectionDate) newErrors.inspectionDate = 'Inspection date is required';
    if (!formValues.location) newErrors.location = 'Location is required';
    
    // Date validation
    if (formValues.inspectionDate && formValues.inspectionDate < new Date()) {
      newErrors.inspectionDate = 'Inspection date cannot be in the past';
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
      // Call API to schedule inspection (replace with actual API call)
      // await inspectionService.scheduleInspection(formValues);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Inspection scheduled successfully',
        severity: 'success'
      });
      
      // Redirect to inspections list after a brief delay to show the success message
      setTimeout(() => {
        navigate('/inspections');
      }, 1500);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to schedule inspection',
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
        title="Schedule Inspection"
        subtitle="Create a new supplier inspection"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inspections', href: '/inspections' },
          { label: 'Schedule Inspection' },
        ]}
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/inspections')}
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
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Inspection Title"
                  name="title"
                  value={formValues.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.inspectionType}>
                  <InputLabel>Inspection Type</InputLabel>
                  <Select
                    name="inspectionType"
                    value={formValues.inspectionType}
                    label="Inspection Type"
                    onChange={handleChange}
                  >
                    {inspectionTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.inspectionType && <FormHelperText>{errors.inspectionType}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.priority}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formValues.priority}
                    label="Priority"
                    onChange={handleChange}
                  >
                    {priorityOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Inspection Date & Time"
                    value={formValues.inspectionDate}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.inspectionDate,
                        helperText: errors.inspectionDate
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={suppliers.filter(s => s.status === 'active')}
                  getOptionLabel={(option) => option.name}
                  value={formValues.supplierId ? suppliers.find(s => s.id === formValues.supplierId) || null : null}
                  onChange={(_, value) => handleSupplierChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier"
                      required
                      error={!!errors.supplierId}
                      helperText={errors.supplierId}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={inspectors}
                  getOptionLabel={(option) => `${option.name} (${option.title})`}
                  value={formValues.inspectorId ? inspectors.find(i => i.id === formValues.inspectorId) || null : null}
                  onChange={(_, value) => handleInspectorChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Inspector"
                      required
                      error={!!errors.inspectorId}
                      helperText={errors.inspectorId}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Location"
                  name="location"
                  value={formValues.location}
                  onChange={handleChange}
                  error={!!errors.location}
                  helperText={errors.location || 'Physical location where the inspection will take place'}
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
              
              {/* Checklist Template */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Checklist Template
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Checklist Template</InputLabel>
                  <Select
                    name="checklistTemplateId"
                    value={formValues.checklistTemplateId}
                    label="Checklist Template"
                    onChange={handleChange}
                  >
                    <MenuItem value="">No Template (Create from scratch)</MenuItem>
                    {checklistTemplates.map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} ({template.itemCount} items)
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Select a template to pre-populate checklist items or create from scratch
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              {/* Additional Notes */}
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
                  placeholder="Enter any additional notes or instructions for the inspector"
                />
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  sx={{ mr: 2 }}
                  onClick={() => navigate('/inspections')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<CalendarIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Inspection'}
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

export default ScheduleInspection; 