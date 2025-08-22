import React, { ChangeEvent, useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Grid,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  IconButton } from
'@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Preview as PreviewIcon } from
'@mui/icons-material';
import { useAppDispatch } from '../../../redux/store';
import { WidgetMeta, registerCustomWidget } from './WidgetRegistry';
import DashboardWidget from '../DashboardWidget';
import { v4 as uuidv4 } from 'uuid';
import { addWidget } from '../../../redux/slices/dashboard.slice';

// Define available data sources
const dataSources = [
{ id: 'inspections', name: 'Inspections Data' },
{ id: 'suppliers', name: 'Suppliers Data' },
{ id: 'customers', name: 'Customers Data' },
{ id: 'quality', name: 'Quality Metrics' },
{ id: 'custom', name: 'Custom API Endpoint' }];


// Define visualization types
const visualizationTypes = [
{ id: 'table', name: 'Table' },
{ id: 'chart-bar', name: 'Bar Chart' },
{ id: 'chart-line', name: 'Line Chart' },
{ id: 'chart-pie', name: 'Pie Chart' },
{ id: 'stat-card', name: 'Stat Card' },
{ id: 'list', name: 'List View' },
{ id: 'custom', name: 'Custom View' }];


// Widget builder steps
const steps = ['Basic Info', 'Data Source', 'Visualization', 'Preview & Save'];

interface CustomWidgetBuilderProps {
  onClose?: () => void;
  onSave?: (widgetId: string) => void;
}

const CustomWidgetBuilder: React.FC<CustomWidgetBuilderProps> = ({ onClose, onSave }) => {
  const dispatch = useAppDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [widgetConfig, setWidgetConfig] = useState<any>({
    id: `custom-${uuidv4().slice(0, 8)}`,
    title: '',
    description: '',
    category: 'custom',
    defaultSize: 'medium',
    dataSource: '',
    visualization: '',
    apiEndpoint: '',
    props: {}
  });

  // For widget preview
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any>({
    labels: ['Category 1', 'Category 2', 'Category 3'],
    values: [45, 32, 18]
  });

  // Form validation
  const [errors, setErrors] = useState<any>({});

  // Validate current step
  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (activeStep === 0) {
      if (!widgetConfig.title?.trim()) {
        newErrors.title = 'Title is required';
      }
      if (!widgetConfig.description?.trim()) {
        newErrors.description = 'Description is required';
      }
    } else if (activeStep === 1) {
      if (!widgetConfig.dataSource) {
        newErrors.dataSource = 'Data source is required';
      }
      if (widgetConfig.dataSource === 'custom' && !widgetConfig.apiEndpoint) {
        newErrors.apiEndpoint = 'API endpoint is required for custom data source';
      }
    } else if (activeStep === 2) {
      if (!widgetConfig.visualization) {
        newErrors.visualization = 'Visualization type is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: any;}>) => {
    const { name, value } = e.target;
    if (name) {
      setWidgetConfig((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Handle select changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    if (name) {
      setWidgetConfig((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prev) => prev + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Generate mock preview component based on visualization type
  const PreviewComponent = () => {
    const RenderVisualization = () => {
      switch (widgetConfig.visualization) {
        case 'chart-bar':
          return (
            <Box sx={{ height: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
              {previewData.labels.map((label: string, i: number) =>
              <Box
                key={i}
                sx={{
                  width: 30,
                  height: `${previewData.values[i]}%`,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}>

                  <Typography variant="caption" sx={{ color: 'white' }}>
                    {previewData.values[i]}
                  </Typography>
                </Box>
              )}
            </Box>);

        case 'chart-pie':
          return (
            <Box sx={{ height: 150, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: 150, height: 150, borderRadius: '50%', background: 'conic-gradient(#1976d2 70%, #dc004e 70%, #dc004e 85%, #ffc107 85%)' }} />
            </Box>);

        case 'stat-card':
          return (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 1, width: '48%' }}>
                <Typography variant="h4">85</Typography>
                <Typography variant="body2">Total Items</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 1, width: '48%' }}>
                <Typography variant="h4">42</Typography>
                <Typography variant="body2">Completed</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, width: '100%' }}>
                <Typography variant="h5">49%</Typography>
                <Typography variant="body2">Completion Rate</Typography>
              </Box>
            </Box>);

        case 'table':
          return (
            <Box sx={{ height: 150, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Item</th>
                    <th style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #ddd' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.labels.map((label: string, i: number) =>
                  <tr key={i}>
                      <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{label}</td>
                      <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #eee' }}>{previewData.values[i]}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Box>);

        case 'list':
          return (
            <Box sx={{ height: 150, overflow: 'auto' }}>
              {previewData.labels.map((label: string, i: number) =>
              <Box key={i} sx={{ p: 1, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{label}</Typography>
                  <Typography variant="body2" fontWeight="bold">{previewData.values[i]}</Typography>
                </Box>
              )}
            </Box>);

        default:
          return (
            <Box sx={{ height: 150, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body2">Select a visualization type to preview</Typography>
            </Box>);

      }
    };

    return (
      <Box>
        {RenderVisualization()}
      </Box>);

  };

  // Save the custom widget
  const handleSave = () => {
    // Create widget component based on visualization type
    const WidgetComponent = () => <PreviewComponent />;

    // Register the custom widget
    const newWidget: WidgetMeta = {
      id: widgetConfig.id!,
      title: widgetConfig.title!,
      description: widgetConfig.description!,
      category: 'custom',
      defaultSize: widgetConfig.defaultSize || 'medium',
      component: WidgetComponent,
      props: {
        dataSource: widgetConfig.dataSource,
        visualization: widgetConfig.visualization,
        apiEndpoint: widgetConfig.apiEndpoint,
        ...widgetConfig.props
      },
      isCustom: true
    };

    registerCustomWidget(newWidget);

    // Add widget to dashboard
    dispatch(addWidget({
      id: newWidget.id,
      visible: true,
      position: 999, // Will be sorted by the dashboard
      size: newWidget.defaultSize
    }));

    // Notify parent component
    if (onSave) {
      onSave(newWidget.id);
    }

    // Close the builder
    if (onClose) {
      onClose();
    }
  };

  // Render form step content
  const GetStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              margin="normal"
              label="Widget Title"
              name="title"
              value={widgetConfig.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title} />

            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              value={widgetConfig.description}
              onChange={handleChange}
              multiline
              rows={2}
              error={!!errors.description}
              helperText={errors.description} />

            <FormControl fullWidth margin="normal">
              <InputLabel>Size</InputLabel>
              <Select
                name="defaultSize"
                value={widgetConfig.defaultSize}
                onChange={handleSelectChange}
                label="Size">

                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
              <FormHelperText>Choose the default size for your widget</FormHelperText>
            </FormControl>
          </Box>);

      case 1:
        return (
          <Box>
            <FormControl fullWidth margin="normal" error={!!errors.dataSource}>
              <InputLabel>Data Source</InputLabel>
              <Select
                name="dataSource"
                value={widgetConfig.dataSource}
                onChange={handleSelectChange}
                label="Data Source">

                {dataSources.map((source: any) =>
                <MenuItem key={source.id} value={source.id}>{source.name}</MenuItem>
                )}
              </Select>
              {errors.dataSource && <FormHelperText>{errors.dataSource}</FormHelperText>}
            </FormControl>
            
            {widgetConfig.dataSource === 'custom' &&
            <TextField
              fullWidth
              margin="normal"
              label="API Endpoint"
              name="apiEndpoint"
              value={widgetConfig.apiEndpoint}
              onChange={handleChange}
              placeholder="/api/v1/custom-data"
              error={!!errors.apiEndpoint}
              helperText={errors.apiEndpoint || 'Enter the API endpoint for custom data'} />

            }
          </Box>);

      case 2:
        return (
          <Box>
            <FormControl fullWidth margin="normal" error={!!errors.visualization}>
              <InputLabel>Visualization Type</InputLabel>
              <Select
                name="visualization"
                value={widgetConfig.visualization}
                onChange={handleSelectChange}
                label="Visualization Type">

                {visualizationTypes.map((type: any) =>
                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                )}
              </Select>
              {errors.visualization && <FormHelperText>{errors.visualization}</FormHelperText>}
            </FormControl>
            
            <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Preview</Typography>
              <PreviewComponent />
            </Box>
          </Box>);

      case 3:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>Widget Preview</Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
              <DashboardWidget widgetId="preview" title={widgetConfig.title || 'Widget Title'}>
                <PreviewComponent />
              </DashboardWidget>
            </Paper>
            
            <Typography variant="subtitle1" gutterBottom>Widget Configuration</Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Title</Typography>
                  <Typography variant="body1">{widgetConfig.title}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Size</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{widgetConfig.defaultSize}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Description</Typography>
                  <Typography variant="body1">{widgetConfig.description}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Data Source</Typography>
                  <Typography variant="body1">{dataSources.find((s) => s.id === widgetConfig.dataSource)?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Visualization</Typography>
                  <Typography variant="body1">{visualizationTypes.find((v) => v.id === widgetConfig.visualization)?.name}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>);

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>Custom Widget Builder</Typography>
        <Typography variant="body2" color="textSecondary">
          Create your own dashboard widget in a few simple steps
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label: any) =>
        <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        )}
      </Stepper>

      <Box sx={{ mt: 2, mb: 3 }}>
        {GetStepContent(activeStep)}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={activeStep === 0 ? onClose : handleBack}
          sx={{ mr: 1 }}>

          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Box>
          {activeStep === steps.length - 1 ?
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            startIcon={<SaveIcon />}>

              Save Widget
            </Button> :

          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            endIcon={<CheckIcon />}>

              Next
            </Button>
          }
        </Box>
      </Box>
    </Box>);

};

export default CustomWidgetBuilder;