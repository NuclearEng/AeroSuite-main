import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  IconButton,
  Divider,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Camera as CameraIcon
} from '@mui/icons-material';
import MockDataService from '../../services/mockDataService';
import type { Inspection, ChecklistItem, Defect } from '../../services/mockDataService';

const InspectionConductor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'complete' | 'cancel' | null>(null);
  const [newDefect, setNewDefect] = useState<Partial<Defect>>({
    id: '',
    description: '',
    severity: 'minor',
    status: 'open',
    notes: ''
  });
  const [addDefectOpen, setAddDefectOpen] = useState(false);

  useEffect(() => {
    // Initialize mock data service
    MockDataService.initialize();
    
    if (!id) {
      setError('No inspection ID provided');
      setLoading(false);
      return;
    }
    
    // Load inspection data
    const inspectionData = MockDataService.getInspectionById(id);
    
    if (inspectionData) {
      // Check if inspection can be conducted
      if (!['scheduled', 'in-progress'].includes(inspectionData.status)) {
        setError(`This inspection is already ${inspectionData.status} and cannot be modified.`);
        setLoading(false);
        return;
      }
      
      setInspection(inspectionData);
    } else {
      setError('Inspection not found');
    }
    
    setLoading(false);
  }, [id]);

  const handleUpdateChecklistItem = (itemId: string, field: keyof ChecklistItem, value: any) => {
    if (!inspection) return;
    
    const updatedChecklist = inspection.checklistItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    
    setInspection({
      ...inspection,
      checklistItems: updatedChecklist
    });
  };

  const handleSave = async () => {
    if (!inspection || !id) return;
    
    try {
      // Update status if it's the first time saving
      let updatedInspection = { ...inspection };
      
      if (inspection.status === 'scheduled') {
        updatedInspection = {
          ...updatedInspection,
          status: 'in-progress',
          startDate: new Date().toISOString()
        };
      }
      
      // Save to mock data service
      MockDataService.updateInspection(id, updatedInspection);
      
      // Show success message
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      // Update local state
      setInspection(updatedInspection);
    } catch (err) {
      setError('Failed to save inspection. Please try again.');
    }
  };

  const handleComplete = () => {
    if (!inspection || !id) return;
    
    // Check if all required items are completed
    const incompleteRequired = inspection.checklistItems.filter(
      item => item.required && !item.completed
    );
    
    if (incompleteRequired.length > 0) {
      setError(`There are ${incompleteRequired.length} required checklist items that have not been completed.`);
      return;
    }
    
    // Calculate overall result based on checklist items
    let overallResult: 'pass' | 'fail' | 'conditional' = 'pass';
    
    if (inspection.checklistItems.some(item => item.result === 'fail')) {
      overallResult = 'fail';
    } else if (inspection.checklistItems.some(item => item.result === 'n/a')) {
      overallResult = 'conditional';
    }
    
    // Update inspection
    const completedInspection: Inspection = {
      ...inspection,
      status: 'completed',
      result: overallResult,
      completionDate: new Date().toISOString()
    };
    
    // Save to mock data service
    MockDataService.updateInspection(id, completedInspection);
    
    // Navigate back to inspection details
    navigate(`/inspections/${id}`);
  };

  const handleCancel = () => {
    if (!inspection || !id) return;
    
    // Update inspection status to cancelled
    const cancelledInspection: Inspection = {
      ...inspection,
      status: 'cancelled',
      result: 'pending'
    };
    
    // Save to mock data service
    MockDataService.updateInspection(id, cancelledInspection);
    
    // Navigate back to inspection details
    navigate(`/inspections/${id}`);
  };

  const handleConfirmDialogOpen = (action: 'complete' | 'cancel') => {
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'complete') {
      handleComplete();
    } else if (confirmAction === 'cancel') {
      handleCancel();
    }
    
    handleConfirmDialogClose();
  };

  const handleAddDefect = () => {
    if (!inspection || !newDefect.description) return;
    
    const defect: Defect = {
      id: `defect_${Date.now()}`,
      description: newDefect.description,
      severity: newDefect.severity as 'minor' | 'major' | 'critical',
      status: 'open',
      notes: newDefect.notes || ''
    };
    
    const updatedInspection = {
      ...inspection,
      defects: [...inspection.defects, defect]
    };
    
    // Update local state
    setInspection(updatedInspection);
    
    // Save to mock data service
    if (id) {
      MockDataService.updateInspection(id, updatedInspection);
    }
    
    // Reset form and close dialog
    setNewDefect({
      id: '',
      description: '',
      severity: 'minor',
      status: 'open',
      notes: ''
    });
    setAddDefectOpen(false);
  };

  const getStepContent = (step: number) => {
    if (!inspection) return null;
    
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Inspection Information
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Customer
                  </Typography>
                  <Typography variant="h6">
                    {inspection.customer.name}
                  </Typography>
                  <Chip label={inspection.customer.code} size="small" />
                </CardContent>
              </Card>
              
              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Supplier
                  </Typography>
                  <Typography variant="h6">
                    {inspection.supplier.name}
                  </Typography>
                  <Chip label={inspection.supplier.code} size="small" />
                </CardContent>
              </Card>
              
              {inspection.partNumber && (
                <Card sx={{ minWidth: 200 }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Part Information
                    </Typography>
                    <Typography variant="h6">
                      {inspection.partNumber}
                    </Typography>
                    {inspection.revision && (
                      <Chip label={`Rev ${inspection.revision}`} size="small" />
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
            
            <Typography variant="body1" paragraph>
              {inspection.description || 'No description provided.'}
            </Typography>
            
            <TextField
              label="Inspection Notes"
              multiline
              rows={4}
              value={inspection.notes || ''}
              onChange={(e) => setInspection({
                ...inspection,
                notes: e.target.value
              })}
              fullWidth
              sx={{ mt: 2 }}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Checklist Items
            </Typography>
            
            <List>
              {inspection.checklistItems.map((item, index) => (
                <Paper key={item.id} sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">
                      Item #{index + 1}{item.required && ' (Required)'}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.completed}
                          onChange={(e) => handleUpdateChecklistItem(item.id, 'completed', e.target.checked)}
                        />
                      }
                      label="Completed"
                    />
                  </Box>
                  
                  <Typography paragraph>
                    {item.description}
                  </Typography>
                  
                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <RadioGroup
                      row
                      value={item.result}
                      onChange={(e) => handleUpdateChecklistItem(item.id, 'result', e.target.value)}
                    >
                      <FormControlLabel value="pass" control={<Radio />} label="Pass" />
                      <FormControlLabel value="fail" control={<Radio />} label="Fail" />
                      <FormControlLabel value="n/a" control={<Radio />} label="N/A" />
                    </RadioGroup>
                  </FormControl>
                  
                  <TextField
                    label="Notes"
                    multiline
                    rows={2}
                    value={item.notes || ''}
                    onChange={(e) => handleUpdateChecklistItem(item.id, 'notes', e.target.value)}
                    fullWidth
                  />
                </Paper>
              ))}
            </List>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Defects {inspection.defects.length > 0 && `(${inspection.defects.length})`}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={() => setAddDefectOpen(true)}
              >
                Add Defect
              </Button>
            </Box>
            
            {inspection.defects.length === 0 ? (
              <Typography color="text.secondary" sx={{ my: 4, textAlign: 'center' }}>
                No defects recorded for this inspection.
              </Typography>
            ) : (
              <List>
                {inspection.defects.map((defect) => (
                  <Paper key={defect.id} sx={{ mb: 2, p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1">
                        {defect.description}
                      </Typography>
                      <Chip
                        label={defect.severity.toUpperCase()}
                        color={
                          defect.severity === 'critical' ? 'error' :
                          defect.severity === 'major' ? 'warning' :
                          'default'
                        }
                        size="small"
                      />
                    </Box>
                    
                    {defect.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {defect.notes}
                      </Typography>
                    )}
                    
                    {defect.image && (
                      <Box sx={{ mt: 2 }}>
                        <img
                          src={defect.image}
                          alt="Defect"
                          style={{ maxWidth: '100%', maxHeight: 200 }}
                        />
                      </Box>
                    )}
                  </Paper>
                ))}
              </List>
            )}
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Summary & Completion
            </Typography>
            
            <Typography paragraph>
              Please review the inspection details before completing:
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Checklist Items
                  </Typography>
                  <Typography variant="h6">
                    {inspection.checklistItems.filter(item => item.completed).length} / {inspection.checklistItems.length} Completed
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Defects
                  </Typography>
                  <Typography variant="h6">
                    {inspection.defects.length} Recorded
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ minWidth: 200 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Projected Result
                  </Typography>
                  <Typography variant="h6">
                    {inspection.checklistItems.some(item => item.result === 'fail') ? 'FAIL' :
                     inspection.checklistItems.some(item => item.result === 'n/a') ? 'CONDITIONAL' : 'PASS'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Once an inspection is completed, it cannot be modified.
            </Alert>
          </Box>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error || !inspection) {
    return (
      <Box mt={3}>
        <Alert severity="error">
          {error || 'Failed to load inspection details'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inspections')}
          sx={{ mt: 2 }}
        >
          Back to Inspections
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(`/inspections/${id}`)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              Conduct Inspection
            </Typography>
            <Typography variant="subtitle1">
              {inspection.title} ({inspection.inspectionNumber})
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ mr: 1 }}
          >
            Save Progress
          </Button>
        </Box>
      </Box>

      {/* Success message */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Inspection progress saved successfully.
        </Alert>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>Inspection Information</StepLabel>
            <StepContent>
              {getStepContent(0)}
              <Box sx={{ mb: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Continue
                </Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Checklist</StepLabel>
            <StepContent>
              {getStepContent(1)}
              <Box sx={{ mb: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(2)}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Continue
                </Button>
                <Button
                  onClick={() => setActiveStep(0)}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Defects</StepLabel>
            <StepContent>
              {getStepContent(2)}
              <Box sx={{ mb: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(3)}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Continue
                </Button>
                <Button
                  onClick={() => setActiveStep(1)}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Complete</StepLabel>
            <StepContent>
              {getStepContent(3)}
              <Box sx={{ mb: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleConfirmDialogOpen('complete')}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Complete Inspection
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleConfirmDialogOpen('cancel')}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Cancel Inspection
                </Button>
                <Button
                  onClick={() => setActiveStep(2)}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>

      {/* Add Defect Dialog */}
      <Dialog open={addDefectOpen} onClose={() => setAddDefectOpen(false)}>
        <DialogTitle>Record Defect</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            fullWidth
            value={newDefect.description}
            onChange={(e) => setNewDefect({ ...newDefect, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Severity
            </Typography>
            <RadioGroup
              row
              value={newDefect.severity}
              onChange={(e) => setNewDefect({ ...newDefect, severity: e.target.value })}
            >
              <FormControlLabel value="minor" control={<Radio />} label="Minor" />
              <FormControlLabel value="major" control={<Radio />} label="Major" />
              <FormControlLabel value="critical" control={<Radio />} label="Critical" />
            </RadioGroup>
          </FormControl>
          
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={3}
            value={newDefect.notes}
            onChange={(e) => setNewDefect({ ...newDefect, notes: e.target.value })}
          />

          <Button
            variant="outlined"
            startIcon={<CameraIcon />}
            fullWidth
            sx={{ mt: 2 }}
            disabled
          >
            Add Photo (Coming Soon)
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDefectOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddDefect}
            variant="contained"
            disabled={!newDefect.description}
          >
            Add Defect
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmDialogClose}
      >
        <DialogTitle>
          {confirmAction === 'complete' ? 'Complete Inspection' : 'Cancel Inspection'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'complete' 
              ? 'Are you sure you want to complete this inspection? This action cannot be undone.'
              : 'Are you sure you want to cancel this inspection? This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>No</Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained" 
            color={confirmAction === 'complete' ? 'primary' : 'error'}
            autoFocus
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InspectionConductor; 