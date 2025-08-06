import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Autocomplete,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  Chip } from
'@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon } from
'@mui/icons-material';
import MockDataService from '../../services/mockDataService';
import type { Customer, Supplier, Inspection, ChecklistItem } from '../../services/mockDataService';

type InspectionType = 'incoming' | 'in-process' | 'final' | 'source' | 'audit';
type Priority = 'low' | 'medium' | 'high';

interface FormData {
  title: string;
  description: string;
  inspectionType: InspectionType;
  customerId: string;
  supplierId: string;
  scheduledDate: Date | null;
  priority: Priority;
  purchaseOrderNumber: string;
  partNumber: string;
  revision: string;
  quantity: string; // Using string for form input, will convert to number
  checklistItems: ChecklistItem[];
}

interface FormErrors {
  title?: string;
  customerId?: string;
  supplierId?: string;
  scheduledDate?: string;
}

const defaultChecklist: ChecklistItem[] = [
{
  id: '1',
  description: 'Material certification review',
  required: true,
  completed: false,
  result: 'pending',
  notes: ''
},
{
  id: '2',
  description: 'Dimensional inspection',
  required: true,
  completed: false,
  result: 'pending',
  notes: ''
},
{
  id: '3',
  description: 'Visual inspection',
  required: true,
  completed: false,
  result: 'pending',
  notes: ''
}];


const InspectionSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    inspectionType: 'source',
    customerId: '',
    supplierId: '',
    scheduledDate: new Date(),
    priority: 'medium',
    purchaseOrderNumber: '',
    partNumber: '',
    revision: '',
    quantity: '',
    checklistItems: [...defaultChecklist]
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    // Initialize mock data service
    MockDataService.initialize();

    // Load customers and suppliers
    setCustomers(MockDataService.getCustomers());
    setSuppliers(MockDataService.getSuppliers());

    setLoading(false);
  }, []);

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

    // Clear error when field is updated
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      scheduledDate: date
    }));

    if (errors.scheduledDate) {
      setErrors((prev) => ({
        ...prev,
        scheduledDate: undefined
      }));
    }
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      description: '',
      required: true,
      completed: false,
      result: 'pending',
      notes: ''
    };

    setFormData((prev) => ({
      ...prev,
      checklistItems: [...prev.checklistItems, newItem]
    }));
  };

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeChecklistItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((item) => item.id !== id)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Get selected customer and supplier
      const selectedCustomer = customers.find((c) => c._id === formData.customerId);
      const selectedSupplier = suppliers.find((s) => s._id === formData.supplierId);

      if (!selectedCustomer || !selectedSupplier) {
        throw new Error('Customer or supplier not found');
      }

      // Create inspection object
      const newInspection: Partial<Inspection> = {
        _id: `insp_${Date.now()}`,
        inspectionNumber: `INS-${Date.now().toString().slice(-6)}`,
        title: formData.title,
        description: formData.description,
        inspectionType: formData.inspectionType,
        customer: {
          _id: selectedCustomer._id,
          name: selectedCustomer.name,
          code: selectedCustomer.code,
          logo: selectedCustomer.logo
        },
        supplier: {
          _id: selectedSupplier._id,
          name: selectedSupplier.name,
          code: selectedSupplier.code,
          logo: selectedSupplier.logo
        },
        scheduledDate: formData.scheduledDate?.toISOString() || new Date().toISOString(),
        status: 'scheduled',
        result: 'pending',
        priority: formData.priority,
        purchaseOrderNumber: formData.purchaseOrderNumber,
        partNumber: formData.partNumber,
        revision: formData.revision,
        quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
        checklistItems: formData.checklistItems.filter((item) => item.description.trim() !== ''),
        defects: []
      };

      // Add the inspection to mock data service
      MockDataService.addInspection(newInspection as Inspection);

      // Show success message
      setSubmitSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/inspections');
      }, 1500);
    } catch (error) {
      console.error('Error creating inspection:', error);
      setSubmitError((error as Error).message || 'Failed to create inspection');
    }
  };

  const getCustomerOptions = () => {
    return customers.map((customer) => ({
      id: customer._id,
      label: customer.name,
      code: customer.code
    }));
  };

  const getSupplierOptions = () => {
    return suppliers.map((supplier) => ({
      id: supplier._id,
      label: supplier.name,
      code: supplier.code
    }));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/inspections')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Schedule Inspection
        </Typography>
      </Box>

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
              name="title"
              label="Inspection Title"
              value={formData.title}
              onChange={handleInputChange}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
              sx={{ mb: 2 }} />

            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="inspection-type-label">Inspection Type</InputLabel>
              <Select
                labelId="inspection-type-label"
                name="inspectionType"
                value={formData.inspectionType}
                onChange={handleSelectChange}
                label="Inspection Type">

                <MenuItem value="incoming">Incoming Inspection</MenuItem>
                <MenuItem value="in-process">In-Process Inspection</MenuItem>
                <MenuItem value="final">Final Inspection</MenuItem>
                <MenuItem value="source">Source Inspection</MenuItem>
                <MenuItem value="audit">Audit</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                name="priority"
                value={formData.priority}
                onChange={handleSelectChange}
                label="Priority">

                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={6}
              fullWidth
              sx={{ mb: 2 }} />

          </Grid>
          
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Customer & Supplier
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <FormControl fullWidth error={!!errors.customerId} sx={{ mb: 3 }}>
              <Autocomplete
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
                          sx={{ ml: 1 }} />

                      </Box>
                    </li>);

                }}
                onChange={(_, value) => {
                  setFormData((prev) => ({
                    ...prev,
                    customerId: value ? value.id : ''
                  }));
                  if (errors.customerId) {
                    setErrors((prev) => ({ ...prev, customerId: undefined }));
                  }
                }}
                renderInput={(params) =>
                <TextField
                  {...params}
                  label="Customer"
                  error={!!errors.customerId}
                  helperText={errors.customerId}
                  required />

                }
                ListboxProps={{
                  style: { maxHeight: '200px' }
                }} />

            </FormControl>
          </Grid>
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <FormControl fullWidth error={!!errors.supplierId} sx={{ mb: 3 }}>
              <Autocomplete
                options={getSupplierOptions()}
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
                          sx={{ ml: 1 }} />

                      </Box>
                    </li>);

                }}
                onChange={(_, value) => {
                  setFormData((prev) => ({
                    ...prev,
                    supplierId: value ? value.id : ''
                  }));
                  if (errors.supplierId) {
                    setErrors((prev) => ({ ...prev, supplierId: undefined }));
                  }
                }}
                renderInput={(params) =>
                <TextField
                  {...params}
                  label="Supplier"
                  error={!!errors.supplierId}
                  helperText={errors.supplierId}
                  required />

                }
                ListboxProps={{
                  style: { maxHeight: '200px' }
                }} />

            </FormControl>
          </Grid>
          
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Scheduling & Part Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Scheduled Date *"
                value={formData.scheduledDate}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.scheduledDate,
                    helperText: errors.scheduledDate,
                    sx: { mb: 2 }
                  }
                }} />

            </LocalizationProvider>
            
            <TextField
              name="purchaseOrderNumber"
              label="Purchase Order Number"
              value={formData.purchaseOrderNumber}
              onChange={handleInputChange}
              fullWidth
              sx={{ mb: 2 }} />

          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              name="partNumber"
              label="Part Number"
              value={formData.partNumber}
              onChange={handleInputChange}
              fullWidth
              sx={{ mb: 2 }} />

            
            <Box display="flex" gap={2}>
              <TextField
                name="revision"
                label="Revision"
                value={formData.revision}
                onChange={handleInputChange}
                fullWidth
                sx={{ mb: 2 }} />

              
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                fullWidth
                sx={{ mb: 2 }} />

            </Box>
          </Grid>
          
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mt={2}>
              <Typography variant="h6">
                Checklist Items
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addChecklistItem}
                variant="outlined">

                Add Item
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {formData.checklistItems.map((item, index) =>
            <Box key={item.id} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">
                    Item #{index + 1}
                  </Typography>
                  <Button
                  color="error"
                  size="small"
                  onClick={() => removeChecklistItem(item.id)}>

                    Remove
                  </Button>
                </Box>
                
                <TextField
                label="Description"
                value={item.description}
                onChange={(e) => updateChecklistItem(item.id, 'description', e.target.value)}
                fullWidth
                sx={{ mb: 2 }} />

                
                <TextField
                label="Notes"
                value={item.notes || ''}
                onChange={(e) => updateChecklistItem(item.id, 'notes', e.target.value)}
                fullWidth
                multiline
                rows={2} />

              </Box>
            )}
          </Grid>
          
          
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/inspections')}>

                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<CalendarIcon />}
                type="submit">

                Schedule Inspection
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      
      <Snackbar
        open={submitSuccess}
        autoHideDuration={3000}
        onClose={() => setSubmitSuccess(false)}>

        <Alert severity="success">
          Inspection scheduled successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!submitError}
        autoHideDuration={3000}
        onClose={() => setSubmitError(null)}>

        <Alert severity="error">
          {submitError}
        </Alert>
      </Snackbar>
    </Box>);

};

export default InspectionSchedule;