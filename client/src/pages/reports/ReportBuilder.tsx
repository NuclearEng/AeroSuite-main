import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  useTheme } from
'@mui/material';
import {
  Add as AddIcon,
  List as ListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  TableChart as ExcelIcon,
  Menu as MenuIcon } from
'@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common';
import reportService, { ReportTemplate } from '../../services/report.service';
import ReportTemplateList from './components/ReportTemplateList';
import ReportTemplateForm from './components/ReportTemplateForm';
import ReportPreview from './components/ReportPreview';
import { z } from 'zod';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-builder-tabpanel-${index}`}
      aria-labelledby={`report-builder-tab-${index}`}
      {...other}>

      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>);

}

// Expand zod schema for report template validation
const reportTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  sections: z.array(z.object({
    title: z.string().min(1, 'Section title is required'),
    type: z.string().min(1, 'Section type is required'),
    content: z.string().optional(),
    dataSource: z.any().optional(),
    chartOptions: z.any().optional()
  })).min(1, 'At least one section is required')
});

// Main ReportBuilder component
const ReportBuilder: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'create' | 'edit' | 'view'>('view');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReportTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.error("Error:", _error);
      setError(err.message || 'Failed to load report templates');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle template selection
  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setCurrentAction('view');
    setTabValue(1); // Switch to the Design tab
  };

  // Handle new template
  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setCurrentAction('create');
    setTabValue(1); // Switch to the Design tab
  };

  // Handle edit template
  const handleEditTemplate = () => {
    setCurrentAction('edit');
  };

  // Handle save template
  const handleSaveTemplate = async (template: Partial<ReportTemplate>) => {
    // Zod validation
    const result = reportTemplateSchema.safeParse(template);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) errors[e.path[0] as string] = e.message;
      });
      setFormErrors(errors);
      setErrorMessage('Validation error');
      return;
    }
    setFormErrors({});
    setErrorMessage(null);
    try {
      setLoading(true);
      let savedTemplate;
      if (currentAction === 'create') {
        savedTemplate = await reportService.createReportTemplate(template);
        setSuccess('Report template created successfully');
      } else {
        savedTemplate = await reportService.updateReportTemplate(selectedTemplate!._id, template);
        setSuccess('Report template updated successfully');
      }
      setSelectedTemplate(savedTemplate);
      setCurrentAction('view');
      fetchTemplates();
    } catch (err: any) {
      console.error("Error:", _error);
      setError(err.message || 'Failed to save report template');
      setErrorMessage(err.message || 'Failed to save report template');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete template
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      await reportService.deleteReportTemplate(selectedTemplate._id);
      setSelectedTemplate(null);
      setCurrentAction('view');
      setDeleteDialogOpen(false);
      setSuccess('Report template deleted successfully');
      fetchTemplates();
      setTabValue(0);
    } catch (err: any) {
      console.error("Error:", _error);
      setError(err.message || 'Failed to delete report template');
      setErrorMessage(err.message || 'Failed to delete report template');
    } finally {
      setLoading(false);
    }
  };

  // Handle preview template
  const handlePreviewTemplate = () => {
    setPreviewDialogOpen(true);
  };

  // Handle download template
  const handleDownloadTemplate = () => {
    if (!selectedTemplate) return;

    const downloadUrl = reportService.getDownloadUrl(selectedTemplate._id);
    window.open(downloadUrl, '_blank');
  };

  // Handle Excel export
  const handleExcelExport = () => {
    if (!selectedTemplate) return;

    const downloadUrl = reportService.getExcelDownloadUrl(selectedTemplate._id);
    window.open(downloadUrl, '_blank');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (currentAction === 'create') {
      setSelectedTemplate(null);
      setTabValue(0); // Go back to templates tab
    } else {
      setCurrentAction('view');
    }
  };

  // Handle duplicate template
  const handleDuplicateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);

      // Create a copy of the template
      const templateCopy = {
        ...selectedTemplate,
        name: `${selectedTemplate.name} (Copy)`,
        isPublic: false
      };

      // Remove the _id field
      delete (templateCopy as any)._id;

      const savedTemplate = await reportService.createReportTemplate(templateCopy);

      // Update state
      setSelectedTemplate(savedTemplate);
      setCurrentAction('view');
      setSuccess('Report template duplicated successfully');

      // Refresh templates list
      fetchTemplates();
    } catch (err: any) {
      console.error("Error:", _error);
      setError(err.message || 'Failed to duplicate report template');
    } finally {
      setLoading(false);
    }
  };

  // Clear error and success messages
  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <PageHeader
        title="Report Builder"
        subtitle="Create and manage custom reports"
        breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reports', href: '/reports' },
        { label: 'Report Builder' }]
        }
        onBack={() => navigate('/reports')} />

      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="report builder tabs">

            <Tab label="Templates" />
            <Tab
              label="Design"
              disabled={currentAction === 'view' && !selectedTemplate} />

            <Tab
              label="Preview"
              disabled={!selectedTemplate} />

          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNewTemplate}
              sx={{ mb: 2 }}>

              Create New Template
            </Button>
            
            <ReportTemplateList
              templates={templates}
              loading={loading}
              onSelectTemplate={handleSelectTemplate} />

          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            
            {selectedTemplate && currentAction === 'view' &&
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditTemplate}>

                  Edit
                </Button>
                <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreviewTemplate}>

                  Preview
                </Button>
                <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}>

                  Download
                </Button>
                <Button
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={handleExcelExport}>

                  Export to Excel
                </Button>
                <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={handleDuplicateTemplate}>

                  Duplicate
                </Button>
                <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}>

                  Delete
                </Button>
              </Box>
            }
            
            
            <ReportTemplateForm
              template={selectedTemplate}
              mode={currentAction}
              loading={loading}
              onSave={handleSaveTemplate}
              onCancel={handleCancelEdit} />

          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            {selectedTemplate ?
            <ReportPreview templateId={selectedTemplate._id} /> :

            <Alert severity="info">
                Please select or create a template first
              </Alert>
            }
          </Box>
        </TabPanel>
      </Paper>
      
      
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth>

        <DialogTitle>Report Preview</DialogTitle>
        <DialogContent sx={{ height: '80vh', p: 0 }}>
          {selectedTemplate &&
          <ReportPreview templateId={selectedTemplate._id} />
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}>

            Download
          </Button>
        </DialogActions>
      </Dialog>
      
      
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="delete-dialog-title">

        <DialogTitle id="delete-dialog-title">Delete Report Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the report template "{selectedTemplate?.name}"?
            This action cannot be undone.
          </Typography>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteTemplate}>

            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}>

        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}>

          {error || success}
        </Alert>
      </Snackbar>
    </Box>);

};

export default ReportBuilder;

// Contract/performance test hooks can be added here for automation frameworks 

// TEST: should show error for empty/duplicate/large/in-use/download/export
// TEST: all dialogs/forms are keyboard accessible and have ARIA labels