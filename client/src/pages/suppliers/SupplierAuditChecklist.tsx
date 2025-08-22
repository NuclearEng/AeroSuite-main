import React, { ChangeEvent, useState, useEffect } from 'react';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Stepper,
  Step,
  StepLabel,
  Divider,
  IconButton,
  Fab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Snackbar } from
'@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Save as SaveIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  NoteAdd as NoteAddIcon,
  History as HistoryIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon } from
'@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import custom components
import { PageHeader } from '../../components/common';
import SupplierSelector from './components/SupplierSelector';
import AuditChecklist from './components/AuditChecklist';
import useSupplierAudit, { SupplierAudit, ChecklistItem } from './hooks/useSupplierAudit';

const SupplierAuditChecklist: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [auditInfo, setAuditInfo] = useState<any>({
    title: '',
    auditType: 'initial',
    auditDate: new Date(),
    auditTeam: [{ name: '', role: '' }],
    auditorName: '',
    auditScope: '',
    status: 'planned'
  });
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const {
    loading,
    suppliers,
    selectedSupplier,
    audits,
    currentAudit,
    checklist,
    error,
    handleSupplierChange,
    createAudit,
    updateAudit,
    deleteAudit,
    loadAuditDetails,
    updateChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    addFinding,
    removeFinding,
    createNewAuditWithTemplate,
    setChecklist
  } = useSupplierAudit();

  // Effect to initialize the audit with template when a supplier is selected
  useEffect(() => {
    if (selectedSupplier && !currentAudit) {
      createNewAuditWithTemplate();
      setAuditInfo((prev: any) => ({
        ...prev,
        title: `${selectedSupplier.name} - Supplier Audit`
      }));
    }
  }, [selectedSupplier, currentAudit, createNewAuditWithTemplate]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle input change for audit info
  const handleAuditInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<any>) => {
    const { name, value } = e.target;
    if (name) {
      setAuditInfo({
        ...auditInfo,
        [name]: value
      });
    }
  };

  // Handle date change
  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setAuditInfo({
        ...auditInfo,
        [name]: date
      });
    }
  };

  // Handle team member change
  const handleTeamMemberChange = (index: number, field: string, value: string) => {
    const updatedTeam = [...(auditInfo.auditTeam || [])];
    updatedTeam[index] = {
      ...updatedTeam[index],
      [field]: value
    };

    setAuditInfo({
      ...auditInfo,
      auditTeam: updatedTeam
    });
  };

  // Add team member
  const handleAddTeamMember = () => {
    setAuditInfo({
      ...auditInfo,
      auditTeam: [...(auditInfo.auditTeam || []), { name: '', role: '' }]
    });
  };

  // Remove team member
  const handleRemoveTeamMember = (index: number) => {
    const updatedTeam = [...(auditInfo.auditTeam || [])];
    updatedTeam.splice(index, 1);

    setAuditInfo({
      ...auditInfo,
      auditTeam: updatedTeam
    });
  };

  // Save audit
  const handleSaveAudit = async () => {
    // Combine audit info with checklist
    const auditData: Partial<SupplierAudit> = {
      ...auditInfo,
      supplierId: selectedSupplier?._id || '',
      checklist: checklist
    };

    let savedAudit;

    if (currentAudit?._id) {
      // Update existing audit
      savedAudit = await updateAudit(currentAudit._id, auditData);
    } else {
      // Create new audit
      savedAudit = await createAudit(auditData);
    }

    if (savedAudit) {
      setShowSaveDialog(false);
    }
  };

  // Delete current audit
  const handleDeleteAudit = async () => {
    if (currentAudit?._id && window.confirm('Are you sure you want to delete this audit?')) {
      await deleteAudit(currentAudit._id);
      // Navigate back to supplier list
      navigate('/suppliers');
    }
  };

  // Select an audit from history
  const handleSelectAudit = async (auditId: string) => {
    const audit = await loadAuditDetails(auditId);
    if (audit) {
      setAuditInfo({
        title: audit.title,
        auditType: audit.auditType,
        auditDate: new Date(audit.auditDate),
        scheduledDate: audit.scheduledDate ? new Date(audit.scheduledDate) : undefined,
        completionDate: audit.completionDate ? new Date(audit.completionDate) : undefined,
        auditTeam: audit.auditTeam,
        auditorName: audit.auditorName,
        auditScope: audit.auditScope || '',
        status: audit.status,
        result: audit.result
      });
      setShowHistoryDialog(false);
    }
  };

  // Render audit info section
  const RenderAuditInfo = () => {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Audit Information
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="title"
              label="Audit Title"
              value={auditInfo.title || ''}
              onChange={handleAuditInfoChange}
              required
              margin="normal" />

          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Audit Type</InputLabel>
              <Select
                name="auditType"
                value={auditInfo.auditType || 'initial'}
                onChange={handleAuditInfoChange}
                label="Audit Type">

                <MenuItem value="initial">Initial</MenuItem>
                <MenuItem value="surveillance">Surveillance</MenuItem>
                <MenuItem value="recertification">Recertification</MenuItem>
                <MenuItem value="follow-up">Follow-up</MenuItem>
                <MenuItem value="special">Special</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Audit Date"
                value={auditInfo.auditDate ? new Date(auditInfo.auditDate) : null}
                onChange={(date) => handleDateChange('auditDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  }
                }} />

            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Scheduled Date"
                value={auditInfo.scheduledDate ? new Date(auditInfo.scheduledDate) : null}
                onChange={(date) => handleDateChange('scheduledDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  }
                }} />

            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={auditInfo.status || 'planned'}
                onChange={handleAuditInfoChange}
                label="Status">

                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="delayed">Delayed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="auditScope"
              label="Audit Scope"
              value={auditInfo.auditScope || ''}
              onChange={handleAuditInfoChange}
              multiline
              rows={2}
              margin="normal" />

          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="auditorName"
              label="Lead Auditor Name"
              value={auditInfo.auditorName || ''}
              onChange={handleAuditInfoChange}
              required
              margin="normal" />

          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Audit Team
            </Typography>
            
            {auditInfo.auditTeam && auditInfo.auditTeam.map((member: any, index: number) =>
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                label="Name"
                value={member.name || ''}
                onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                sx={{ mr: 2, flex: 1 }}
                size="small" />

                <TextField
                label="Role"
                value={member.role || ''}
                onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                sx={{ mr: 2, flex: 1 }}
                size="small" />

                <IconButton
                color="error"
                onClick={() => handleRemoveTeamMember(index)}
                disabled={auditInfo.auditTeam && auditInfo.auditTeam.length <= 1}>

                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
            
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddTeamMember}
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}>

              Add Team Member
            </Button>
          </Grid>
        </Grid>
      </Paper>);

  };

  // If loading, show loading indicator
  if (loading && !selectedSupplier) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>);

  }

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Supplier Audit Checklist"
        subtitle="Conduct and manage supplier audits"
        breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Suppliers', href: '/suppliers' },
        { label: 'Audit Checklist' }]
        }
        actions={
        <Box>
            <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/suppliers')}
            sx={{ mr: 1 }}>

              Back
            </Button>
            <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={() => setShowSaveDialog(true)}
            disabled={!selectedSupplier || !auditInfo.title || !auditInfo.auditorName}>

              Save Audit
            </Button>
          </Box>
        } />


      {error &&
      <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      }

      <Paper sx={{ p: 3, mb: 3 }}>
        <SupplierSelector
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          onSupplierChange={handleSupplierChange}
          disabled={loading || !!currentAudit?._id} />

        
        {audits.length > 0 &&
        <Box sx={{ mt: 2 }}>
            <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => setShowHistoryDialog(true)}>

              View Audit History ({audits.length})
            </Button>
          </Box>
        }
      </Paper>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Audit Information" />
        <Tab label="Audit Checklist" />
        <Tab label="Summary & Findings" />
      </Tabs>

      {activeTab === 0 && RenderAuditInfo()}
      
      {activeTab === 1 &&
      <AuditChecklist
        checklist={checklist}
        onAddItem={addChecklistItem}
        onUpdateItem={updateChecklistItem}
        onDeleteItem={removeChecklistItem}
        onAddFinding={addFinding}
        onRemoveFinding={removeFinding}
        loading={loading}
        readOnly={auditInfo.status === 'completed' || auditInfo.status === 'cancelled'} />

      }
      
      {activeTab === 2 &&
      <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Audit Summary & Findings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
              fullWidth
              name="summary"
              label="Audit Summary"
              value={auditInfo.summary || ''}
              onChange={handleAuditInfoChange}
              multiline
              rows={4}
              margin="normal" />

            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
              fullWidth
              name="recommendations"
              label="Recommendations"
              value={auditInfo.recommendations || ''}
              onChange={handleAuditInfoChange}
              multiline
              rows={4}
              margin="normal" />

            </Grid>
            
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardHeader title="Findings Summary" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Observations
                      </Typography>
                      <Typography variant="h5">
                        {checklist.reduce((count, item) =>
                      count + (item.findings?.filter((f: any) => f.type === 'observation').length || 0), 0
                      )}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Minor Nonconformities
                      </Typography>
                      <Typography variant="h5" color="warning.main">
                        {checklist.reduce((count, item) =>
                      count + (item.findings?.filter((f: any) => f.type === 'minor-nc').length || 0), 0
                      )}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Major Nonconformities
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        {checklist.reduce((count, item) =>
                      count + (item.findings?.filter((f: any) => f.type === 'major-nc').length || 0), 0
                      )}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Critical Nonconformities
                      </Typography>
                      <Typography variant="h5" color="error.dark">
                        {checklist.reduce((count, item) =>
                      count + (item.findings?.filter((f: any) => f.type === 'critical-nc').length || 0), 0
                      )}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                label="Next Audit Date"
                value={auditInfo.nextAuditDate ? new Date(auditInfo.nextAuditDate) : null}
                onChange={(date) => handleDateChange('nextAuditDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  }
                }} />

              </LocalizationProvider>
            </Grid>
          </Grid>
        </Paper>
      }

      
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Audit</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to save this audit?
          </Typography>
          {auditInfo.status === 'completed' &&
          <Alert severity="warning" sx={{ mt: 2 }}>
              This audit is marked as completed. The audit results will be finalized and cannot be changed later.
            </Alert>
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveAudit} color="primary" variant="contained">
            Save Audit
          </Button>
        </DialogActions>
      </Dialog>

      
      <Dialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        maxWidth="md"
        fullWidth>

        <DialogTitle>Audit History</DialogTitle>
        <DialogContent>
          {audits.length > 0 ?
          <Grid container spacing={2}>
              {audits.map((audit: any) =>
            <Grid item xs={12} sm={6} key={audit._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {audit.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(audit.auditDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        Type: {audit.auditType.charAt(0).toUpperCase() + audit.auditType.slice(1)}
                      </Typography>
                      <Typography variant="body2">
                        Status: {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
                      </Typography>
                      <Typography variant="body2">
                        Lead Auditor: {audit.auditorName}
                      </Typography>
                      <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => handleSelectAudit(audit._id!)}>

                        Load Audit
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
            )}
            </Grid> :

          <Typography>No audit history found for this supplier.</Typography>
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      
      <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
        {currentAudit?._id &&
        <Tooltip title="Delete Audit">
            <Fab color="error" size="small" sx={{ mr: 1 }} onClick={handleDeleteAudit}>
              <DeleteIcon />
            </Fab>
          </Tooltip>
        }
        <Tooltip title="Save Audit">
          <Fab
            color="primary"
            onClick={() => setShowSaveDialog(true)}
            disabled={!selectedSupplier || !auditInfo.title || !auditInfo.auditorName}>

            <SaveIcon />
          </Fab>
        </Tooltip>
      </Box>
    </Container>);

};

export default SupplierAuditChecklist;