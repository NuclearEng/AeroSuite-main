import React, { ChangeEvent, useState, useEffect } from 'react';
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
  Box,
  CircularProgress,
  Autocomplete,
  Chip } from
'@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Save as SaveIcon } from '@mui/icons-material';
import inspectionService, { Inspection } from '../../../services/inspection.service';
import customerService from '../../../services/customer.service';
import supplierService from '../../../services/supplier.service';

// Type options
const inspectionTypeOptions = [
{ value: 'quality', label: 'Quality Inspection' },
{ value: 'safety', label: 'Safety Inspection' },
{ value: 'regulatory', label: 'Regulatory Compliance' },
{ value: 'process', label: 'Process Audit' },
{ value: 'incoming', label: 'Incoming Material' }];


// Status options
const statusOptions = [
{ value: 'scheduled', label: 'Scheduled' },
{ value: 'in-progress', label: 'In Progress' },
{ value: 'completed', label: 'Completed' },
{ value: 'cancelled', label: 'Cancelled' }];


// Priority options
const priorityOptions = [
{ value: 'low', label: 'Low' },
{ value: 'medium', label: 'Medium' },
{ value: 'high', label: 'High' },
{ value: 'critical', label: 'Critical' }];


interface FormErrors {
  title?: string;
  type?: string;
  status?: string;
  scheduledDate?: string;
  customerId?: string;
  supplierId?: string;
  location?: string;
  [key: string]: string | undefined;
}

interface InspectionFormData {
  title: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: Date | null;
  customerId: string;
  supplierId: string | null;
  location: string;
  description: string;
  notes: string;
  tags: string[];
}

interface InspectionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (inspection: Inspection) => void;
  initialData?: Partial<InspectionFormData>;
  isEdit?: boolean;
  inspectionId?: string;
}

const initialFormValues: InspectionFormData = {
  title: '',
  type: 'quality',
  status: 'scheduled',
  priority: 'medium',
  scheduledDate: new Date(),
  customerId: '',
  supplierId: null,
  location: '',
  description: '',
  notes: '',
  tags: []
};

const InspectionFormModal: React.FC<InspectionFormModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEdit = false,
  inspectionId
}) => {
  const [formValues, setFormValues] = useState<any>({
    ...initialFormValues,
    ...initialData
  });
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [customers, setCustomers] = useState<any>([]);
  const [suppliers, setSuppliers] = useState<any>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Load inspection data if editing
  useEffect(() => {
    if (isEdit && inspectionId && open) {
      const fetchInspection = async () => {
        try {
          setLoading(true);
          const inspection = await inspectionService.getInspection(inspectionId);
          setFormValues({
            title: inspection.title || '',
            type: inspection.type || 'quality',
            status: inspection.status || 'scheduled',
            priority: inspection.priority || 'medium',
            scheduledDate: inspection.scheduledDate ? new Date(inspection.scheduledDate) : null,
            customerId: inspection.customerId || '',
            supplierId: inspection.supplierId || null,
            location: inspection.location || '',
            description: inspection.description || '',
            notes: inspection.notes || '',
            tags: inspection.tags || []
          });
        } catch (_error) {
          console.error("Error:", _error);
        } finally {
          setLoading(false);
        }
      };

      fetchInspection();
    }
  }, [isEdit, inspectionId, open]);

  // Load customers and suppliers for dropdowns
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const response = await customerService.getCustomers({ limit: 100 });
        setCustomers(response.customers || []);
      } catch (_error) {
        console.error("Error:", _error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    const loadSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const response = await supplierService.getSuppliers({ limit: 100 });
        setSuppliers(response.suppliers || []);
      } catch (_error) {
        console.error("Error:", _error);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    if (open) {
      loadCustomers();
      loadSuppliers();
    }
  }, [open]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: any;}>) => {
    const { name, value } = e.target;

    if (!name) return;

    setFormValues((prev: any) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormValues((prev: any) => ({
      ...prev,
      scheduledDate: date
    }));
  };

  // Handle tag changes
  const handleTagsChange = (newValue: string[]) => {
    setFormValues((prev: any) => ({
      ...prev,
      tags: newValue
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formValues.title) newErrors.title = 'Title is required';
    if (!formValues.type) newErrors.type = 'Type is required';
    if (!formValues.status) newErrors.status = 'Status is required';
    if (!formValues.scheduledDate) newErrors.scheduledDate = 'Scheduled date is required';
    if (!formValues.customerId) newErrors.customerId = 'Customer is required';
    if (!formValues.location) newErrors.location = 'Location is required';

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
      // Map form values to inspection data structure
      const inspectionData = {
        title: formValues.title,
        type: formValues.type,
        status: formValues.status,
        priority: formValues.priority,
        scheduledDate: formValues.scheduledDate?.toISOString(),
        customerId: formValues.customerId,
        supplierId: formValues.supplierId,
        location: formValues.location,
        description: formValues.description,
        notes: formValues.notes,
        tags: formValues.tags
      };

      let savedInspection: Inspection;

      if (isEdit && inspectionId) {
        // Update existing inspection
        savedInspection = await inspectionService.updateInspection(inspectionId, inspectionData);
      } else {
        // Create new inspection
        savedInspection = await inspectionService.createInspection(inspectionData);
      }

      onSave(savedInspection);
      onClose();
    } catch (_error: any) {
      console.error("Error:", _error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="inspection-form-title">

      <DialogTitle id="inspection-form-title">
        {isEdit ? 'Edit Inspection' : 'Schedule New Inspection'}
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        {loading ?
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box> :

        <form id="inspection-form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              
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
                helperText={errors.title} />

              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.type}>
                  <InputLabel>Inspection Type</InputLabel>
                  <Select
                  name="type"
                  value={formValues.type}
                  label="Inspection Type"
                  onChange={handleChange as any}>

                    {inspectionTypeOptions.map((option: any) =>
                  <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                  )}
                  </Select>
                  {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                  name="status"
                  value={formValues.status}
                  label="Status"
                  onChange={handleChange as any}>

                    {statusOptions.map((option: any) =>
                  <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                  )}
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                  name="priority"
                  value={formValues.priority}
                  label="Priority"
                  onChange={handleChange as any}>

                    {priorityOptions.map((option: any) =>
                  <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                  )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                  label="Scheduled Date & Time"
                  value={formValues.scheduledDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.scheduledDate,
                      helperText: errors.scheduledDate
                    }
                  }} />

                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.customerId}>
                  <InputLabel>Customer</InputLabel>
                  <Select
                  name="customerId"
                  value={formValues.customerId}
                  label="Customer"
                  onChange={handleChange as any}
                  disabled={loadingCustomers}>

                    {customers.map((customer: any) =>
                  <MenuItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </MenuItem>
                  )}
                  </Select>
                  {errors.customerId && <FormHelperText>{errors.customerId}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Supplier (Optional)</InputLabel>
                  <Select
                  name="supplierId"
                  value={formValues.supplierId || ''}
                  label="Supplier (Optional)"
                  onChange={handleChange as any}
                  disabled={loadingSuppliers}>

                    <MenuItem value="">None</MenuItem>
                    {suppliers.map((supplier: any) =>
                  <MenuItem key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </MenuItem>
                  )}
                  </Select>
                </FormControl>
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
                helperText={errors.location} />

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
                placeholder="Detailed description of the inspection" />

              </Grid>
              
              <Grid item xs={12}>
                <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                name="notes"
                value={formValues.notes}
                onChange={handleChange}
                placeholder="Additional notes or instructions" />

              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formValues.tags}
                onChange={(_, newValue) => handleTagsChange(newValue)}
                renderTags={(value, getTagProps) =>
                value.map((option, index: any) =>
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
                  helperText="Add relevant tags to categorize this inspection" />

                } />

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
          form="inspection-form"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={isSubmitting || loading}>

          {isSubmitting ? 'Saving...' : isEdit ? 'Update Inspection' : 'Schedule Inspection'}
        </Button>
      </DialogActions>
    </Dialog>);

};

export default InspectionFormModal;