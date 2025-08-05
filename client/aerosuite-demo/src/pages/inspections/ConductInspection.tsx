import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import type { Inspection } from '../../services/mockDataService';
import MockDataService from '../../services/mockDataService';

const ConductInspection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [result, setResult] = useState('pending');
  const [notes, setNotes] = useState('');
  const [formDirty, setFormDirty] = useState(false);

  // Steps for the inspection process
  const steps = ['Preparation', 'Conduct Inspection', 'Submit Results'];

  // Load inspection data
  useEffect(() => {
    if (!id) {
      setError('No inspection ID provided');
      setLoading(false);
      return;
    }

    MockDataService.initialize();
    const data = MockDataService.getInspectionById(id);
    
    if (data) {
      setInspection(data);
      setNotes(data.notes || '');
      
      // Set the active step based on the inspection status
      if (data.status === 'in-progress') {
        setActiveStep(1); // Go to conduct step
      }
    } else {
      setError('Inspection not found');
    }
    
    setLoading(false);
  }, [id]);

  // Mark form as dirty on changes
  useEffect(() => {
    if (inspection) {
      setFormDirty(inspection.notes !== notes || inspection.result !== result);
    }
  }, [notes, result, inspection]);

  // Start the inspection
  const handleStartInspection = () => {
    if (!inspection || !id) return;
    
    const updatedInspection = {
      ...inspection,
      status: 'in-progress',
      startDate: new Date().toISOString()
    };
    
    const updated = MockDataService.updateInspection(id, updatedInspection);
    
    if (updated) {
      setInspection(updated);
      setActiveStep(1);
    } else {
      setError('Failed to start inspection');
    }
  };

  // Update checklist item result
  const handleChecklistItemChange = (itemId: string, newResult: string) => {
    if (!inspection || !id) return;
    
    const updatedItems = inspection.checklistItems.map(item => 
      item.id === itemId ? { ...item, result: newResult } : item
    );
    
    const updatedInspection = {
      ...inspection,
      checklistItems: updatedItems
    };
    
    const updated = MockDataService.updateInspection(id, updatedInspection);
    
    if (updated) {
      setInspection(updated);
    } else {
      setError('Failed to update checklist item');
    }
  };

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(e.target.value);
  };

  // Save progress
  const handleSaveProgress = () => {
    if (!inspection || !id) return;
    
    const updatedInspection = {
      ...inspection,
      notes,
      result
    };
    
    const updated = MockDataService.updateInspection(id, updatedInspection);
    
    if (updated) {
      setInspection(updated);
      setFormDirty(false);
      setSaveDialogOpen(true);
    } else {
      setError('Failed to save progress');
    }
  };

  // Complete the inspection
  const handleCompleteInspection = () => {
    if (!inspection || !id) return;
    
    // Update the inspection status to completed
    const updatedInspection = {
      ...inspection,
      status: 'completed',
      completionDate: new Date().toISOString(),
      notes,
      result
    };
    
    const updated = MockDataService.updateInspection(id, updatedInspection);
    
    if (updated) {
      // Navigate to the inspection details
      navigate(`/inspections/${id}`);
    } else {
      setError('Failed to complete inspection');
    }
  };

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Render preparation step
  const renderPreparationStep = () => {
    if (!inspection) return null;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Inspection Preparation
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Inspection Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Inspection Number
              </Typography>
              <Typography variant="body1">
                {inspection.inspectionNumber}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Customer
              </Typography>
              <Typography variant="body1">
                {inspection.customer.name}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Supplier
              </Typography>
              <Typography variant="body1">
                {inspection.supplier.name}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Scheduled Date
              </Typography>
              <Typography variant="body1">
                {formatDate(inspection.scheduledDate)}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body1" paragraph>
            {inspection.description || 'No description provided.'}
          </Typography>
        </Paper>
        
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartInspection}
          >
            Start Inspection
          </Button>
        </Box>
      </Box>
    );
  };

  // Render checklist items step
  const renderChecklistStep = () => {
    if (!inspection) return null;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Inspection Checklist
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          {inspection.checklistItems.length === 0 ? (
            <Box py={2}>
              <Typography variant="body1" align="center">
                No checklist items available for this inspection.
              </Typography>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                >
                  Add Checklist Item
                </Button>
              </Box>
            </Box>
          ) : (
            <List>
              {inspection.checklistItems.map((item, index) => (
                <ListItem key={item.id} divider={index < inspection.checklistItems.length - 1}>
                  <Box width="100%">
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="subtitle1">
                        {index + 1}. {item.description}
                      </Typography>
                      <Box ml="auto">
                        <Chip
                          label={item.result.toUpperCase()}
                          color={
                            item.result === 'pass' ? 'success' :
                            item.result === 'fail' ? 'error' :
                            'default'
                          }
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        row
                        value={item.result}
                        onChange={(e) => handleChecklistItemChange(item.id, e.target.value)}
                      >
                        <FormControlLabel
                          value="pass"
                          control={<Radio color="success" />}
                          label="Pass"
                        />
                        <FormControlLabel
                          value="fail"
                          control={<Radio color="error" />}
                          label="Fail"
                        />
                        <FormControlLabel
                          value="pending"
                          control={<Radio />}
                          label="Pending"
                        />
                      </RadioGroup>
                    </FormControl>
                    
                    {item.notes && (
                      <Typography variant="body2" color="text.secondary">
                        Notes: {item.notes}
                      </Typography>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Inspection Notes
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Add notes about the inspection here..."
            value={notes}
            onChange={handleNotesChange}
            variant="outlined"
          />
        </Paper>
        
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Box>
            <Button
              variant="outlined"
              sx={{ mr: 2 }}
              onClick={handleSaveProgress}
              disabled={!formDirty}
            >
              Save Progress
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  // Render results step
  const renderResultsStep = () => {
    if (!inspection) return null;
    
    // Calculate pass/fail statistics
    const passedItems = inspection.checklistItems.filter(item => item.result === 'pass').length;
    const failedItems = inspection.checklistItems.filter(item => item.result === 'fail').length;
    const pendingItems = inspection.checklistItems.filter(item => item.result === 'pending').length;
    const totalItems = inspection.checklistItems.length;
    
    const getDefaultResult = () => {
      if (pendingItems > 0) return 'pending';
      if (failedItems > 0) return 'fail';
      return 'pass';
    };
    
    // Set the default result if not changed
    useEffect(() => {
      if (result === 'pending') {
        setResult(getDefaultResult());
      }
    }, []);
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Inspection Results
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Checklist Summary
          </Typography>
          
          <Box display="flex" gap={2} mb={3}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`Passed: ${passedItems}`}
              color="success"
            />
            <Chip
              icon={<CancelIcon />}
              label={`Failed: ${failedItems}`}
              color="error"
            />
            {pendingItems > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`Pending: ${pendingItems}`}
                color="warning"
              />
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Overall Result
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              row
              value={result}
              onChange={(e) => setResult(e.target.value)}
            >
              <FormControlLabel
                value="pass"
                control={<Radio color="success" />}
                label="Pass"
              />
              <FormControlLabel
                value="fail"
                control={<Radio color="error" />}
                label="Fail"
              />
              <FormControlLabel
                value="conditional"
                control={<Radio color="warning" />}
                label="Conditional Pass"
              />
            </RadioGroup>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Final Notes"
            placeholder="Add final notes and observations..."
            value={notes}
            onChange={handleNotesChange}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </Paper>
        
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Box>
            <Button
              variant="outlined"
              sx={{ mr: 2 }}
              onClick={handleSaveProgress}
              disabled={!formDirty}
            >
              Save Progress
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setConfirmDialogOpen(true)}
            >
              Complete Inspection
            </Button>
          </Box>
        </Box>
        
        {/* Confirmation dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>
            Complete Inspection?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to complete this inspection? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteInspection} 
              variant="contained" 
              color="primary"
            >
              Complete
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Save dialog */}
        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
        >
          <DialogTitle>
            Progress Saved
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Your inspection progress has been saved successfully.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setSaveDialogOpen(false)} 
              variant="contained" 
              color="primary"
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  // Render the current step
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderPreparationStep();
      case 1:
        return renderChecklistStep();
      case 2:
        return renderResultsStep();
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
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(`/inspections/${id}`)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            Conduct Inspection
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {inspection.title}
          </Typography>
        </Box>
      </Box>
      
      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Step content */}
      {renderStep()}
    </Box>
  );
};

export default ConductInspection; 