import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Description as DescriptionIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Help as HelpIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useSupplierApi } from '../../hooks/useSupplierApi';
import useErrorHandling from '../../hooks/useErrorHandling';
import ErrorHandler from '../common/ErrorHandler';
import { ErrorType, ErrorSeverity, createBusinessError } from '../../utils/errorHandling';

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
      id={`import-export-tabpanel-${index}`}
      aria-labelledby={`import-export-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `import-export-tab-${index}`,
    'aria-controls': `import-export-tabpanel-${index}`,
  };
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

/**
 * Supplier Import/Export Component
 * 
 * Provides functionality to import and export supplier data in various formats
 */
const SupplierImportExport: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportStatus, setExportStatus] = useState('');
  const [exportFilters, setExportFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { importSuppliers, exportSuppliers, getImportTemplate } = useSupplierApi();
  
  // Initialize error handling
  const {
    error,
    isDialogOpen,
    handleError,
    closeErrorDialog,
    withErrorHandling
  } = useErrorHandling({
    context: 'Supplier Import/Export'
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json'
      ];
      
      if (!validTypes.includes(file.type)) {
        handleError(createBusinessError(
          'Invalid file type. Please upload a CSV, Excel, or JSON file.',
          {
            severity: ErrorSeverity.WARNING,
            code: 'INVALID_FILE_TYPE'
          }
        ));
        return;
      }
      
      // Validate file size (max 10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        handleError(createBusinessError(
          'File is too large. Maximum size is 10MB.',
          {
            severity: ErrorSeverity.WARNING,
            code: 'FILE_TOO_LARGE'
          }
        ));
        return;
      }
      
      setImportFile(file);
    }
  };

  const handleExportFormatChange = (event: SelectChangeEvent) => {
    setExportFormat(event.target.value);
  };

  const handleExportFilterChange = (field: string, value: string) => {
    setExportFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImport = async () => {
    if (!importFile) {
      handleError(createBusinessError(
        'Please select a file to import',
        {
          severity: ErrorSeverity.WARNING,
          code: 'NO_FILE_SELECTED'
        }
      ));
      return;
    }

    setLoading(true);
    setImportResult(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('updateExisting', updateExisting.toString());
      
      // Send the import request
      const result = await importSuppliers(formData);
      
      if (result.importResults) {
        setImportResult(result.importResults);
        setSuccessMessage('Suppliers imported successfully');
        
        // If the import is processed asynchronously and returns a job ID
        if (result.importJobId) {
          setImportJobId(result.importJobId);
          startPollingImportProgress(result.importJobId);
        }
      }
    } catch (_err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const startPollingImportProgress = (jobId: string) => {
    // This would be implemented to poll the import progress endpoint
    // For now, we'll simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setImportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 500);
  };

  const handleExport = withErrorHandling(async () => {
    setLoading(true);
    setExportStatus('Preparing export...');
    
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('format', exportFormat);
      
      if (exportFilters.status) {
        queryParams.append('status', exportFilters.status);
      }
      
      if (exportFilters.type) {
        queryParams.append('type', exportFilters.type);
      }
      
      if (exportFilters.search) {
        queryParams.append('search', exportFilters.search);
      }
      
      // Trigger file download
      await exportSuppliers(queryParams.toString());
      setSuccessMessage('Export started. Your file will download shortly.');
    } finally {
      setLoading(false);
      setExportStatus('');
    }
  });

  const handleDownloadTemplate = withErrorHandling(async () => {
    await getImportTemplate(exportFormat);
    setSuccessMessage('Template download started');
  });

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  return (
    <ErrorHandler context="Supplier Import/Export">
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="import export tabs"
          >
            <Tab label="Import" icon={<CloudUploadIcon />} iconPosition="start" {...a11yProps(0)} />
            <Tab label="Export" icon={<CloudDownloadIcon />} iconPosition="start" {...a11yProps(1)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Import Suppliers
          </Typography>
          <Typography variant="body2" paragraph>
            Upload a CSV, Excel, or JSON file containing supplier data. You can download a template below.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Upload File" />
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <input
                      ref={fileInputRef}
                      accept=".csv,.xlsx,.xls,.json"
                      style={{ display: 'none' }}
                      id="supplier-import-file"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="supplier-import-file">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<FileUploadIcon />}
                        fullWidth
                      >
                        Select File
                      </Button>
                    </label>
                    
                    {importFile && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {importFile.name} ({Math.round(importFile.size / 1024)} KB)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Import Options
                    </Typography>
                    <FormControlLabel
                      control={
                        <Radio
                          checked={updateExisting}
                          onChange={() => setUpdateExisting(true)}
                        />
                      }
                      label="Update existing suppliers (match by code)"
                    />
                    <FormControlLabel
                      control={
                        <Radio
                          checked={!updateExisting}
                          onChange={() => setUpdateExisting(false)}
                        />
                      }
                      label="Create new suppliers only"
                    />
                  </FormControl>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleImport}
                    disabled={!importFile || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    fullWidth
                  >
                    {loading ? 'Importing...' : 'Import Suppliers'}
                  </Button>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="text"
                      onClick={handleDownloadTemplate}
                      startIcon={<FileDownloadIcon />}
                    >
                      Download Template
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {importJobId && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardHeader title="Import Progress" />
                  <CardContent>
                    <Box sx={{ width: '100%', mb: 2 }}>
                      <LinearProgress variant="determinate" value={importProgress} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {importProgress < 100 ? 'Processing import...' : 'Import completed'}
                    </Typography>
                  </CardContent>
                </Card>
              )}
              
              {importResult && (
                <Card variant="outlined">
                  <CardHeader title="Import Results" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Total Records:</Typography>
                        <Typography variant="h6">{importResult.total}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Created:</Typography>
                        <Typography variant="h6" color="success.main">{importResult.created}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Updated:</Typography>
                        <Typography variant="h6" color="info.main">{importResult.updated}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Failed:</Typography>
                        <Typography variant="h6" color="error.main">{importResult.failed}</Typography>
                      </Grid>
                    </Grid>
                    
                    {importResult.errors.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="error">
                          Errors:
                        </Typography>
                        <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', p: 1, mt: 1 }}>
                          {importResult.errors.map((error, index) => (
                            <Typography key={index} variant="body2" color="error" sx={{ mb: 0.5 }}>
                              • {error}
                            </Typography>
                          ))}
                        </Paper>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <Card variant="outlined" sx={{ mt: 3 }}>
                <CardHeader title="Import Guidelines" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    <strong>Supported file formats:</strong>
                  </Typography>
                  <ul>
                    <li>CSV (.csv)</li>
                    <li>Excel (.xlsx, .xls)</li>
                    <li>JSON (.json)</li>
                  </ul>
                  
                  <Typography variant="body2" paragraph>
                    <strong>Required fields:</strong>
                  </Typography>
                  <ul>
                    <li>name - Supplier name</li>
                    <li>code - Unique supplier code</li>
                  </ul>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    For large imports, the process may take some time. You can navigate away and check the results later.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Export Suppliers
          </Typography>
          <Typography variant="body2" paragraph>
            Export your supplier data in various formats. Apply filters to export specific suppliers.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Export Options" />
                <CardContent>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="export-format-label">Export Format</InputLabel>
                    <Select
                      labelId="export-format-label"
                      id="export-format"
                      value={exportFormat}
                      label="Export Format"
                      onChange={handleExportFormatChange}
                    >
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                    <FormHelperText>
                      Choose the format for your exported data
                    </FormHelperText>
                  </FormControl>
                  
                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                    Filters (Optional)
                  </Typography>
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      id="status-filter"
                      value={exportFilters.status}
                      label="Status"
                      onChange={(e) => handleExportFilterChange('status', e.target.value)}
                    >
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="blacklisted">Blacklisted</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="type-filter-label">Type</InputLabel>
                    <Select
                      labelId="type-filter-label"
                      id="type-filter"
                      value={exportFilters.type}
                      label="Type"
                      onChange={(e) => handleExportFilterChange('type', e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="vendor">Vendor</MenuItem>
                      <MenuItem value="manufacturer">Manufacturer</MenuItem>
                      <MenuItem value="distributor">Distributor</MenuItem>
                      <MenuItem value="service">Service Provider</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Search"
                    placeholder="Search by name or code"
                    value={exportFilters.search}
                    onChange={(e) => handleExportFilterChange('search', e.target.value)}
                  />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleExport}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                    fullWidth
                    sx={{ mt: 3 }}
                  >
                    {loading ? 'Exporting...' : 'Export Suppliers'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader title="Export Information" />
                <CardContent>
                  <Typography variant="body2" paragraph>
                    <strong>Available export formats:</strong>
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" paragraph>
                      <strong>CSV</strong> - Comma-separated values file that can be opened in Excel or other spreadsheet software.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Excel</strong> - Native Excel file with proper formatting and multiple sheets.
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>JSON</strong> - Machine-readable format, useful for data integration.
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                    <strong>Exported data includes:</strong>
                  </Typography>
                  <ul>
                    <li>Basic supplier information (name, code, status, type)</li>
                    <li>Contact information</li>
                    <li>Address details</li>
                    <li>Additional metadata</li>
                  </ul>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Large exports may take some time to generate. The file will download automatically when ready.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </ErrorHandler>
  );
};

export default SupplierImportExport; 