import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { format } from 'date-fns';

interface InspectionFormData {
  inspectionNumber: string;
  type: 'source' | 'receiving' | 'in-process' | 'final' | 'audit';
  status: 'scheduled' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  supplierId: string;
  supplierName: string;
  partNumber: string;
  partDescription: string;
  specification: string;
  quantity: number;
  inspectorId: string;
  inspectorName: string;
  scheduledDate: string;
  location: string;
  notes: string;
  items: InspectionItem[];
}

interface InspectionItem {
  id: string;
  checklistItem: string;
  requirement: string;
  result: 'pass' | 'fail' | 'na' | 'pending';
  notes: string;
  inspector: string;
}

const EditInspection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);

  const [formData, setFormData] = useState<InspectionFormData>({
    inspectionNumber: 'INS-2024-001',
    type: 'source',
    status: 'scheduled',
    priority: 'high',
    supplierId: '1',
    supplierName: 'Aerospace Components Ltd.',
    partNumber: 'ACL-TRB-001',
    partDescription: 'Turbine Blade Assembly',
    specification: 'AS9100 Rev D compliant, Ti-6Al-4V material',
    quantity: 50,
    inspectorId: '1',
    inspectorName: 'Sarah Chen',
    scheduledDate: '2024-01-15T09:00',
    location: 'Supplier Facility - Bay 3',
    notes: 'High priority inspection for critical aerospace component',
    items: [
      {
        id: '1',
        checklistItem: 'Material Certification',
        requirement: 'Material certificates must be provided for all raw materials',
        result: 'pending',
        notes: '',
        inspector: 'Sarah Chen'
      },
      {
        id: '2',
        checklistItem: 'Dimensional Inspection',
        requirement: 'Critical dimensions within ±0.002" tolerance',
        result: 'pending',
        notes: '',
        inspector: 'Sarah Chen'
      },
      {
        id: '3',
        checklistItem: 'Surface Finish',
        requirement: 'Surface roughness Ra ≤ 32 μin on critical surfaces',
        result: 'pending',
        notes: '',
        inspector: 'Sarah Chen'
      }
    ]
  });

  const [newItem, setNewItem] = useState<Partial<InspectionItem>>({
    checklistItem: '',
    requirement: '',
    result: 'pending',
    notes: '',
    inspector: 'Sarah Chen'
  });

  useEffect(() => {
    // Simulate loading inspection data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: keyof InspectionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleItemChange = (field: keyof InspectionItem, value: any) => {
    if (editingItem) {
      setEditingItem(prev => prev ? ({
        ...prev,
        [field]: value
      }) : null);
    } else {
      setNewItem(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.inspectionNumber.trim()) {
      newErrors.inspectionNumber = 'Inspection number is required';
    }
    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    }
    if (!formData.partDescription.trim()) {
      newErrors.partDescription = 'Part description is required';
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Saving inspection:', formData);
      navigate(`/inspections/${id}`);
    } catch (error) {
      console.error('Error saving inspection:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.checklistItem || !newItem.requirement) {
      return;
    }

    const item: InspectionItem = {
      id: Date.now().toString(),
      checklistItem: newItem.checklistItem || '',
      requirement: newItem.requirement || '',
      result: newItem.result || 'pending',
      notes: newItem.notes || '',
      inspector: newItem.inspector || 'Sarah Chen'
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      checklistItem: '',
      requirement: '',
      result: 'pending',
      notes: '',
      inspector: 'Sarah Chen'
    });
    setItemDialogOpen(false);
  };

  const handleEditItem = (item: InspectionItem) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === editingItem.id ? editingItem : item
      )
    }));

    setEditingItem(null);
    setItemDialogOpen(false);
  };

  const handleDeleteItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'scheduled': return 'info';
      case 'on-hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'pass': return 'success';
      case 'fail': return 'error';
      case 'na': return 'default';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading inspection details...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Edit Inspection ${formData.inspectionNumber}`}
        subtitle="Update inspection details and checklist items"
        actions={
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate(`/inspections/${id}`)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Inspection Number"
                    value={formData.inspectionNumber}
                    onChange={(e) => handleInputChange('inspectionNumber', e.target.value)}
                    error={!!errors.inspectionNumber}
                    helperText={errors.inspectionNumber}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      label="Type"
                    >
                      <MenuItem value="source">Source Inspection</MenuItem>
                      <MenuItem value="receiving">Receiving Inspection</MenuItem>
                      <MenuItem value="in-process">In-Process Inspection</MenuItem>
                      <MenuItem value="final">Final Inspection</MenuItem>
                      <MenuItem value="audit">Quality Audit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="on-hold">On Hold</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Scheduled Date"
                    value={formData.scheduledDate}
                    onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                    error={!!errors.scheduledDate}
                    helperText={errors.scheduledDate}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    error={!!errors.location}
                    helperText={errors.location}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Part & Supplier Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Part & Supplier Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Supplier Name"
                    value={formData.supplierName}
                    onChange={(e) => handleInputChange('supplierName', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Part Number"
                    value={formData.partNumber}
                    onChange={(e) => handleInputChange('partNumber', e.target.value)}
                    error={!!errors.partNumber}
                    helperText={errors.partNumber}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                    error={!!errors.quantity}
                    helperText={errors.quantity}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Part Description"
                    value={formData.partDescription}
                    onChange={(e) => handleInputChange('partDescription', e.target.value)}
                    error={!!errors.partDescription}
                    helperText={errors.partDescription}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Specification"
                    value={formData.specification}
                    onChange={(e) => handleInputChange('specification', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Inspector"
                    value={formData.inspectorName}
                    onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Inspection Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any relevant notes or special instructions..."
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Checklist Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Checklist Items ({formData.items.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setItemDialogOpen(true)}
                >
                  Add Item
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Checklist Item</TableCell>
                      <TableCell>Requirement</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Inspector</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {item.checklistItem}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.requirement}
                          </Typography>
                          {item.notes && (
                            <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                              Notes: {item.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.result.toUpperCase()}
                            color={getResultColor(item.result) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{item.inspector}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditItem(item)} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteItem(item.id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Checklist Item"
                value={editingItem ? editingItem.checklistItem : newItem.checklistItem}
                onChange={(e) => handleItemChange('checklistItem', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Requirement"
                value={editingItem ? editingItem.requirement : newItem.requirement}
                onChange={(e) => handleItemChange('requirement', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Result</InputLabel>
                <Select
                  value={editingItem ? editingItem.result : newItem.result}
                  onChange={(e) => handleItemChange('result', e.target.value)}
                  label="Result"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="pass">Pass</MenuItem>
                  <MenuItem value="fail">Fail</MenuItem>
                  <MenuItem value="na">N/A</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Inspector"
                value={editingItem ? editingItem.inspector : newItem.inspector}
                onChange={(e) => handleItemChange('inspector', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={editingItem ? editingItem.notes : newItem.notes}
                onChange={(e) => handleItemChange('notes', e.target.value)}
                placeholder="Optional notes about this checklist item..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={editingItem ? handleUpdateItem : handleAddItem} 
            variant="contained"
          >
            {editingItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditInspection;
