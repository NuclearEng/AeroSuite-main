import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Snackbar,
  Grid,
  LinearProgress,
  MobileStepper,
  useMediaQuery,
  useTheme,
  Fab,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip } from
'@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowForward as ForwardIcon,
  Menu as MenuIcon,
  ErrorOutline as ErrorIcon,
  CheckCircleOutline as CheckCircleIcon,
  HelpOutline as HelpIcon,
  SwipeVertical as SwipeIcon } from
'@mui/icons-material';
import { PageHeader } from '../../components/common';
import inspectionService, { Inspection } from '../../services/inspection.service';
import useResponsive from '../../hooks/useResponsive';

interface ChecklistItem {
  id: string;
  [key: string]: any;
}

const ConductInspection: React.FC = () => {
  const { id } = useParams<{id: string;}>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const isMobileOrTablet = isMobile || isTablet;

  // State
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [checklistItems, setChecklistItems] = useState<any>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Steps for the inspection process
  const steps = ['Start', 'Checks', 'Findings', 'Submit'];

  // Load inspection data
  useEffect(() => {
    const loadInspection = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const data = await inspectionService.getInspection(id);
        setInspection(data);

        // If inspection already has checklist items, use those
        if ((data as any).checklistItems && (data as any).checklistItems.length > 0) {
          setChecklistItems((data as any).checklistItems);
        } else {
          // Otherwise, create default checklist items based on inspection type
          const defaultItems = generateDefaultChecklist((data as any).inspectionType);
          setChecklistItems(defaultItems);
        }
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || 'Failed to load inspection');
      } finally {
        setLoading(false);
      }
    };

    loadInspection();
  }, [id]);

  // Generate default checklist based on inspection type
  const generateDefaultChecklist = (inspectionType: string): ChecklistItem[] => {
    const baseItems: Partial<ChecklistItem>[] = [];

    switch (inspectionType) {
      case 'quality_audit':
        baseItems.push(
          { text: 'Quality Manual Review', category: 'Documentation' },
          { text: 'Process Control', category: 'Operations' },
          { text: 'Equipment Calibration', category: 'Equipment' },
          { text: 'Personnel Training Records', category: 'Personnel' },
          { text: 'Material Traceability', category: 'Materials' }
        );
        break;
      case 'process_audit':
        baseItems.push(
          { text: 'Process Documentation', category: 'Documentation' },
          { text: 'Workflow Efficiency', category: 'Operations' },
          { text: 'Equipment Maintenance', category: 'Equipment' },
          { text: 'Operator Competency', category: 'Personnel' },
          { text: 'Process Output Quality', category: 'Quality' }
        );
        break;
      case 'certification_audit':
        baseItems.push(
          { text: 'Certification Requirements', category: 'Documentation' },
          { text: 'Management Responsibility', category: 'Management' },
          { text: 'Internal Audit Process', category: 'Quality System' },
          { text: 'Corrective Action Process', category: 'Quality System' },
          { text: 'Preventive Action Process', category: 'Quality System' }
        );
        break;
      case 'first_article':
        baseItems.push(
          { text: 'Drawing Compliance', category: 'Documentation' },
          { text: 'Dimensional Inspection', category: 'Quality' },
          { text: 'Material Certification', category: 'Materials' },
          { text: 'Special Process Verification', category: 'Process' },
          { text: 'Functional Testing', category: 'Testing' }
        );
        break;
      case 'receiving_inspection':
        baseItems.push(
          { text: 'Shipping Documentation', category: 'Documentation' },
          { text: 'Part Identification', category: 'Quality' },
          { text: 'Quantity Verification', category: 'Receiving' },
          { text: 'Visual Inspection', category: 'Quality' },
          { text: 'Packaging Condition', category: 'Receiving' }
        );
        break;
      default:
        baseItems.push(
          { text: 'Documentation Review', category: 'Documentation' },
          { text: 'Process Verification', category: 'Process' },
          { text: 'Quality Check', category: 'Quality' }
        );
    }

    // Generate IDs and return complete checklist items
    return baseItems.map((item, index: any) => ({
      id: `CL-${Date.now()}-${index}`,
      text: item.text || '',
      category: item.category || 'General',
      result: undefined,
      comments: ''
    }));
  };

  // Handle step navigation
  const handleNext = () => {
    if (activeStep === 1 && isMobile) {
      // If on mobile and in checklist step, navigate to next checklist item
      if (currentItemIndex < checklistItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
        return;
      }
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 1 && isMobile) {
      // If on mobile and in checklist step, navigate to previous checklist item
      if (currentItemIndex > 0) {
        setCurrentItemIndex(currentItemIndex - 1);
        return;
      }
    }
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Navigate directly to a checklist item
  const handleJumpToItem = (index: number) => {
    setCurrentItemIndex(index);
    setDrawerOpen(false);
  };

  // Handle checklist item result change
  const handleResultChange = (itemId: string, result: 'pass' | 'fail' | 'na') => {
    setChecklistItems((prevItems: any) =>
    prevItems.map((item: any) =>
    item.id === itemId ? { ...item, result } : item
    )
    );
  };

  // Handle checklist item comment change
  const handleCommentChange = (itemId: string, comments: string) => {
    setChecklistItems((prevItems: any) =>
    prevItems.map((item: any) =>
    item.id === itemId ? { ...item, comments } : item
    )
    );
  };

  // Save checklist progress
  const handleSaveChecklist = async () => {
    if (!id) return;

    try {
      setSaving(true);
      await (inspectionService as any).updateChecklist(id, checklistItems);

      setSnackbar({
        open: true,
        message: 'Checklist saved successfully',
        severity: 'success'
      });
    } catch (err: any) {
      console.error("Error:", err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save checklist',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Complete the inspection
  const handleCompleteInspection = async () => {
    if (!id) return;

    try {
      setSaving(true);

      // Calculate findings
      const findings = checklistItems.filter((item: any) => item.result === 'fail').length;

      // Calculate score (percentage of passed items)
      const totalEvaluatedItems = checklistItems.filter((item: any) => item.result === 'pass' || item.result === 'fail').length;
      const passedItems = checklistItems.filter((item: any) => item.result === 'pass').length;
      const score = totalEvaluatedItems > 0 ? Math.round(passedItems / totalEvaluatedItems * 100) : 0;

      // Complete the inspection
      await (inspectionService as any).completeInspection(id, {
        score,
        findings,
        criticalFindings: 0, // In a real app, you'd identify critical findings
        checklistItems
      });

      setSnackbar({
        open: true,
        message: 'Inspection completed successfully',
        severity: 'success'
      });

      // Redirect to inspection details
      setTimeout(() => {
        navigate(`/inspections/${id}`);
      }, 1500);
    } catch (err: any) {
      console.error("Error:", err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to complete inspection',
        severity: 'error'
      });
      setSaving(false);
    }
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Get checklist completion percentage
  const getCompletionPercentage = () => {
    if (checklistItems.length === 0) return 0;
    const completedItems = checklistItems.filter((item: any) => item.result).length;
    return Math.round(completedItems / checklistItems.length * 100);
  };

  // Get result icon
  const GetResultIcon = (result?: string) => {
    switch (result) {
      case 'pass':
        return <CheckCircleIcon color="success" />;
      case 'fail':
        return <ErrorIcon color="error" />;
      case 'na':
        return <HelpIcon color="disabled" />;
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>);

  }

  // Error state
  if (error || !inspection) {
    return (
      <Box>
        <PageHeader
          title="Error"
          subtitle="Failed to load inspection"
          breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inspections', href: '/inspections' },
          { label: 'Error' }]
          } />

        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Inspection not found'}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/inspections')}
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}>

          Back to Inspections
        </Button>
      </Box>);

  }

  return (
    <Box>
      
      {isMobile ?
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton
          edge="start"
          onClick={() => navigate(`/inspections/${id}`)}
          aria-label="back">

            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flex: 1, mx: 1 }}>
            {steps[activeStep]}
          </Typography>
          <IconButton
          edge="end"
          onClick={() => setDrawerOpen(true)}
          aria-label="menu">

            <MenuIcon />
          </IconButton>
        </Box> :

      // Desktop: Standard header
      <PageHeader
        title={`Conduct Inspection: ${inspection.id}`}
        subtitle={`${inspection.supplierName} - ${new Date(inspection.inspectionDate).toLocaleDateString()}`}
        breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Inspections', href: '/inspections' },
        { label: inspection.id, href: `/inspections/${id}` },
        { label: 'Conduct' }]
        }
        actions={
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/inspections/${id}`)}>

              Back to Inspection
            </Button>
        } />

      }
      
      
      {!isMobile &&
      <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label: any) =>
          <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
          )}
          </Stepper>
        </Paper>
      }
      
      
      {isMobile &&
      <MobileStepper
        variant="dots"
        steps={steps.length}
        position="static"
        activeStep={activeStep}
        sx={{ mb: 2 }}
        nextButton={
        <Button
          size="small"
          onClick={handleNext}
          disabled={activeStep === steps.length - 1}>

              Next
              <ForwardIcon />
            </Button>
        }
        backButton={
        <Button
          size="small"
          onClick={handleBack}
          disabled={activeStep === 0}>

              <BackIcon />
              Back
            </Button>
        } />

      }
      
      
      <SwipeableDrawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}>

        <Box sx={{ width: 280, pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Typography variant="h6">Inspection Menu</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider />
          
          <List>
            <ListItem button onClick={() => setActiveStep(0)}>
              <ListItemIcon>
                {activeStep === 0 ? <CheckCircleIcon color="primary" /> : null}
              </ListItemIcon>
              <ListItemText primary="Start Inspection" />
            </ListItem>
            
            <ListItem button onClick={() => setActiveStep(1)}>
              <ListItemIcon>
                {activeStep === 1 ? <CheckCircleIcon color="primary" /> : null}
              </ListItemIcon>
              <ListItemText primary="Conduct Checks" />
            </ListItem>
            
            <ListItem button onClick={() => setActiveStep(2)}>
              <ListItemIcon>
                {activeStep === 2 ? <CheckCircleIcon color="primary" /> : null}
              </ListItemIcon>
              <ListItemText primary="Findings" />
            </ListItem>
            
            <ListItem button onClick={() => setActiveStep(3)}>
              <ListItemIcon>
                {activeStep === 3 ? <CheckCircleIcon color="primary" /> : null}
              </ListItemIcon>
              <ListItemText primary="Review & Submit" />
            </ListItem>
          </List>
          
          {activeStep === 1 &&
          <>
              <Divider />
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">Checklist Items</Typography>
                <LinearProgress
                variant="determinate"
                value={getCompletionPercentage()}
                sx={{ my: 1 }} />

                <Typography variant="body2" color="text.secondary">
                  {checklistItems.filter((item: any) => item.result).length} of {checklistItems.length} completed
                </Typography>
              </Box>
              <List dense>
                {checklistItems.map((item: any, index: number) =>
              <ListItem
                button
                key={item.id}
                onClick={() => handleJumpToItem(index)}
                selected={currentItemIndex === index}>

                    <ListItemIcon>
                      {GetResultIcon(item.result)}
                    </ListItemIcon>
                    <ListItemText
                  primary={`Item ${index + 1}`}
                  secondary={item.text.length > 20 ? `${item.text.substring(0, 20)}...` : item.text} />

                  </ListItem>
              )}
              </List>
            </>
          }
        </Box>
      </SwipeableDrawer>
      
      
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        {activeStep === 0 &&
        <Box>
            <Typography variant="h6" gutterBottom>
              Start Inspection
            </Typography>
            <Typography paragraph>
              You are about to conduct an inspection for {inspection.supplierName}.
              This inspection will evaluate their compliance with quality requirements.
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Inspection Details" />
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Type:</strong> {inspection.inspectionType.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {new Date(inspection.inspectionDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Location:</strong> {inspection.location}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Description:</strong> {inspection.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Supplier Information" />
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Supplier:</strong> {inspection.supplierName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>ID:</strong> {inspection.supplierId}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {isMobile &&
          <Alert icon={<SwipeIcon />} severity="info" sx={{ mt: 2 }}>
                Swipe left/right to navigate between items
              </Alert>
          }
          </Box>
        }
        
        {activeStep === 1 &&
        <Box>
            <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: isMobile ? 'column' : 'row'
          }}>
              <Typography variant="h6" sx={{ mb: isMobile ? 1 : 0 }}>
                {isMobile ? `Item ${currentItemIndex + 1} of ${checklistItems.length}` : 'Inspection Checklist'}
              </Typography>
              
              {isMobile &&
            <LinearProgress
              variant="determinate"
              value={getCompletionPercentage()}
              sx={{ width: '100%', mb: 2 }} />

            }
              
              <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveChecklist}
              disabled={saving}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}>

                Save Progress
              </Button>
            </Box>
            
            
            {!isMobile && checklistItems.map((item: any) =>
          <Card key={item.id} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {item.text}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Category: {item.category}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Result</FormLabel>
                    <RadioGroup
                  row
                  value={item.result || ''}
                  onChange={(e) => handleResultChange(item.id, e.target.value as 'pass' | 'fail' | 'na')}>

                      <FormControlLabel
                    value="pass"
                    control={<Radio color="success" />}
                    label="Pass" />

                      <FormControlLabel
                    value="fail"
                    control={<Radio color="error" />}
                    label="Fail" />

                      <FormControlLabel
                    value="na"
                    control={<Radio />}
                    label="N/A" />

                    </RadioGroup>
                  </FormControl>
                  
                  <TextField
                label="Comments"
                multiline
                rows={2}
                fullWidth
                margin="normal"
                value={item.comments || ''}
                onChange={(e) => handleCommentChange(item.id, e.target.value)}
                placeholder="Add your observations, findings, or comments here..." />

                </CardContent>
              </Card>
          )}
            
            
            {isMobile && checklistItems.length > 0 &&
          <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {checklistItems[currentItemIndex].text}
                  </Typography>
                  <Chip
                label={checklistItems[currentItemIndex].category}
                size="small"
                sx={{ mb: 2 }} />

                  
                  <Divider sx={{ my: 2 }} />
                  
                  <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                    <FormLabel component="legend">Result</FormLabel>
                    <RadioGroup
                  row
                  value={checklistItems[currentItemIndex].result || ''}
                  onChange={(e) => handleResultChange(
                    checklistItems[currentItemIndex].id,
                    e.target.value as 'pass' | 'fail' | 'na'
                  )}>

                      <FormControlLabel
                    value="pass"
                    control={<Radio color="success" />}
                    label="Pass" />

                      <FormControlLabel
                    value="fail"
                    control={<Radio color="error" />}
                    label="Fail" />

                      <FormControlLabel
                    value="na"
                    control={<Radio />}
                    label="N/A" />

                    </RadioGroup>
                  </FormControl>
                  
                  <TextField
                label="Comments"
                multiline
                rows={3}
                fullWidth
                margin="normal"
                value={checklistItems[currentItemIndex].comments || ''}
                onChange={(e) => handleCommentChange(
                  checklistItems[currentItemIndex].id,
                  e.target.value
                )}
                placeholder="Add your observations, findings, or comments here..." />

                </CardContent>
              </Card>
          }
            
            
            {isMobile &&
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 2
            }}>

                <Button
              variant="outlined"
              onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
              disabled={currentItemIndex === 0}
              startIcon={<BackIcon />}>

                  Previous
                </Button>
                <Button
              variant="outlined"
              onClick={() => setCurrentItemIndex(Math.min(checklistItems.length - 1, currentItemIndex + 1))}
              disabled={currentItemIndex === checklistItems.length - 1}
              endIcon={<NextIcon />}>

                  Next
                </Button>
              </Box>
          }
          </Box>
        }
        
        {activeStep === 2 &&
        <Box>
            <Typography variant="h6" gutterBottom>
              Findings Summary
            </Typography>
            <Typography paragraph>
              Review the findings identified during this inspection.
            </Typography>
            
            {checklistItems.filter((item: any) => item.result === 'fail').length > 0 ?
          <>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  Failed Items:
                </Typography>
                {checklistItems.
            filter((item: any) => item.result === 'fail').
            map((item: any) =>
            <Card key={item.id} sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'error.main' }}>
                      <CardContent>
                        <Typography variant="subtitle1">{item.text}</Typography>
                        <Typography variant="body2" color="text.secondary">Category: {item.category}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {item.comments || 'No comments provided'}
                        </Typography>
                      </CardContent>
                    </Card>
            )
            }
              </> :

          <Alert severity="success" sx={{ mt: 2 }}>
                No findings were identified during this inspection.
              </Alert>
          }
          </Box>
        }
        
        {activeStep === 3 &&
        <Box>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>
            <Typography paragraph>
              Please review the inspection results before submitting.
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2">
                      <strong>Total Items:</strong> {checklistItems.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2">
                      <strong>Passed:</strong> {checklistItems.filter((item: any) => item.result === 'pass').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2">
                      <strong>Failed:</strong> {checklistItems.filter((item: any) => item.result === 'fail').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2">
                      <strong>N/A:</strong> {checklistItems.filter((item: any) => item.result === 'na').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2">
                      <strong>Not Evaluated:</strong> {checklistItems.filter((item: any) => !item.result).length}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Alert severity="info">
                  By completing this inspection, you are confirming that all items have been evaluated according to the required standards.
                </Alert>
              </CardContent>
            </Card>
          </Box>
        }
      </Paper>
      
      
      {!isMobile &&
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<BackIcon />}
          disabled={activeStep === 0}>

            Back
          </Button>
          
          <Box>
            {activeStep < steps.length - 1 ?
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NextIcon />}>

                Next
              </Button> :

          <Button
            variant="contained"
            color="primary"
            onClick={handleCompleteInspection}
            endIcon={<CheckIcon />}
            disabled={saving}>

                Complete Inspection
              </Button>
          }
          </Box>
        </Box>
      }
      
      
      {isMobile && activeStep === steps.length - 1 &&
      <Fab
        color="primary"
        variant="extended"
        onClick={handleCompleteInspection}
        disabled={saving}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}>

          <CheckIcon sx={{ mr: 1 }} />
          Complete
        </Fab>
      }
      
      {isMobile && activeStep < steps.length - 1 &&
      <Fab
        color="primary"
        variant="extended"
        onClick={handleNext}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}>

          <NextIcon sx={{ mr: 1 }} />
          Next
        </Fab>
      }
      
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}>

        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled">

          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>);

};

export default ConductInspection;