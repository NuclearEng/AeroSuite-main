import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  CircularProgress,
  Alert } from
'@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  DragHandle as DragHandleIcon } from
'@mui/icons-material';
import { ReportTemplate, ReportSection, DataSource } from '../../../services/report.service';
import reportService from '../../../services/report.service';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ReportTemplateFormProps {
  template: ReportTemplate | null;
  mode: 'create' | 'edit' | 'view';
  loading: boolean;
  onSave: (template: Partial<ReportTemplate>) => void;
  onCancel: () => void;
}

const ReportTemplateForm: React.FC<ReportTemplateFormProps> = ({
  template,
  mode,
  loading,
  onSave,
  onCancel
}) => {
  // State
  const [formData, setFormData] = useState<Partial<ReportTemplate>>({
    name: '',
    description: '',
    category: 'general',
    isPublic: false,
    sections: [
    {
      title: 'New Section',
      type: 'text',
      content: 'This is a new section. Edit the content here.'
    }]

  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(null);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [dataSourcesLoading, setDataSourcesLoading] = useState(false);

  // Load data sources
  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        setDataSourcesLoading(true);
        const sources = await reportService.getDataSources();
        setDataSources(sources);
      } catch (err) {
        console.error('Error fetching data sources:', err);
      } finally {
        setDataSourcesLoading(false);
      }
    };

    fetchDataSources();
  }, []);

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        ...template
      });
    } else {
      // Reset to default values when creating new template
      setFormData({
        name: '',
        description: '',
        category: 'general',
        isPublic: false,
        sections: [
        {
          title: 'New Section',
          type: 'text',
          content: 'This is a new section. Edit the content here.'
        }]

      });
    }
  }, [template]);

  // Handle field change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: unknown;}>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle switch change
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  // Add section
  const handleAddSection = () => {
    setCurrentSectionIndex(null); // Create new section
    setSectionDialogOpen(true);
  };

  // Edit section
  const handleEditSection = (index: number) => {
    setCurrentSectionIndex(index);
    setSectionDialogOpen(true);
  };

  // Delete section
  const handleDeleteSection = (index: number) => {
    setFormData((prev) => {
      const newSections = [...(prev.sections || [])];
      newSections.splice(index, 1);
      return {
        ...prev,
        sections: newSections
      };
    });
  };

  // Handle drag and drop for sections
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sections = [...(formData.sections || [])];
    const [removed] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, removed);

    setFormData((prev) => ({
      ...prev,
      sections
    }));
  };

  // Save section from dialog
  const handleSaveSection = (section: ReportSection) => {
    setFormData((prev) => {
      const newSections = [...(prev.sections || [])];

      if (currentSectionIndex !== null) {
        // Update existing section
        newSections[currentSectionIndex] = section;
      } else {
        // Add new section
        newSections.push(section);
      }

      return {
        ...prev,
        sections: newSections
      };
    });

    setSectionDialogOpen(false);
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Report name is required';
    }

    if (!formData.sections || formData.sections.length === 0) {
      newErrors.sections = 'At least one section is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
    }
  };

  // Determine if the form is in view-only mode
  const isViewOnly = mode === 'view';

  return (
    <Box component="form" onSubmit={handleSubmit}>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Template Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              name="name"
              label="Report Name"
              value={formData.name || ''}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              disabled={isViewOnly} />

          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category || 'general'}
                onChange={handleChange}
                label="Category"
                disabled={isViewOnly}>

                <MenuItem value="inspection">Inspection</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description"
              value={formData.description || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              disabled={isViewOnly} />

          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
              <Switch
                name="isPublic"
                checked={formData.isPublic || false}
                onChange={handleSwitchChange}
                disabled={isViewOnly} />

              }
              label="Make this template available to all users" />

          </Grid>
        </Grid>
      </Paper>
      
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Report Sections
          </Typography>
          
          {!isViewOnly &&
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSection}>

              Add Section
            </Button>
          }
        </Box>
        
        {errors.sections &&
        <Alert severity="error" sx={{ mb: 2 }}>
            {errors.sections}
          </Alert>
        }
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) =>
            <List
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{ bgcolor: 'background.paper' }}>

                {formData.sections?.map((section, index) =>
              <Draggable
                key={`section-${index}`}
                draggableId={`section-${index}`}
                index={index}
                isDragDisabled={isViewOnly}>

                    {(provided) =>
                <ListItem
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}>

                        {!isViewOnly &&
                  <Box
                    {...provided.dragHandleProps}
                    sx={{
                      mr: 1,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'grab'
                    }}>

                            <DragHandleIcon color="action" />
                          </Box>
                  }
                        
                        <ListItemText
                    primary={section.title}
                    secondary={`Type: ${section.type.charAt(0).toUpperCase() + section.type.slice(1)}`} />

                        
                        {!isViewOnly &&
                  <ListItemSecondaryAction>
                            <IconButton edge="end" onClick={() => handleEditSection(index)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton edge="end" onClick={() => handleDeleteSection(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                  }
                      </ListItem>
                }
                  </Draggable>
              )}
                {provided.placeholder}
              </List>
            }
          </Droppable>
        </DragDropContext>
      </Paper>
      
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}>

          {isViewOnly ? 'Back' : 'Cancel'}
        </Button>
        
        {!isViewOnly &&
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}>

            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        }
      </Box>
      
      
      <SectionDialog
        open={sectionDialogOpen}
        onClose={() => setSectionDialogOpen(false)}
        onSave={handleSaveSection}
        section={currentSectionIndex !== null && formData.sections ? formData.sections[currentSectionIndex] : null}
        dataSources={dataSources}
        loading={dataSourcesLoading} />

    </Box>);

};

// Section Dialog Component
interface SectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (section: ReportSection) => void;
  section: ReportSection | null;
  dataSources: DataSource[];
  loading: boolean;
}

const SectionDialog: React.FC<SectionDialogProps> = ({
  open,
  onClose,
  onSave,
  section,
  dataSources,
  loading
}) => {
  const [sectionData, setSectionData] = useState<ReportSection>({
    title: '',
    type: 'text',
    content: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize section data when dialog opens
  useEffect(() => {
    if (section) {
      setSectionData({ ...section });
    } else {
      setSectionData({
        title: '',
        type: 'text',
        content: ''
      });
    }
  }, [section, open]);

  // Handle field change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: unknown;}>) => {
    const { name, value } = e.target;
    if (!name) return;

    setSectionData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate section before submission
  const validateSection = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!sectionData.title?.trim()) {
      newErrors.title = 'Section title is required';
    }

    if (sectionData.type === 'text' && !sectionData.content?.trim()) {
      newErrors.content = 'Content is required for text sections';
    }

    if (sectionData.type === 'table' && !sectionData.dataSource?.model) {
      newErrors.dataSource = 'Data source is required for table sections';
    }

    if (sectionData.type === 'chart' && !sectionData.dataSource?.model) {
      newErrors.dataSource = 'Data source is required for chart sections';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save button click
  const handleSaveClick = () => {
    if (validateSection()) {
      onSave(sectionData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {section ? 'Edit Section' : 'Add Section'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="title"
                label="Section Title"
                value={sectionData.title || ''}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title} />

            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Section Type</InputLabel>
                <Select
                  name="type"
                  value={sectionData.type || 'text'}
                  onChange={handleChange}
                  label="Section Type">

                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="table">Table</MenuItem>
                  <MenuItem value="chart">Chart</MenuItem>
                  <MenuItem value="metrics">Metrics</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                </Select>
                <FormHelperText>
                  {sectionData.type === 'text' && 'Static text content'}
                  {sectionData.type === 'table' && 'Tabular data display'}
                  {sectionData.type === 'chart' && 'Visualize data as charts'}
                  {sectionData.type === 'metrics' && 'Key metrics with indicators'}
                  {sectionData.type === 'image' && 'Image/logo display'}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            
            {sectionData.type === 'text' &&
            <Grid item xs={12}>
                <TextField
                name="content"
                label="Content"
                value={sectionData.content || ''}
                onChange={handleChange}
                fullWidth
                multiline
                rows={5}
                error={!!errors.content}
                helperText={errors.content || 'Enter the text content for this section'} />

              </Grid>
            }
            
            
            {(sectionData.type === 'table' || sectionData.type === 'chart') &&
            <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Data Source
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.dataSource}>
                    <InputLabel>Data Model</InputLabel>
                    <Select
                    name="dataSource.model"
                    value={sectionData.dataSource?.model || ''}
                    onChange={(e) => {
                      setSectionData((prev) => ({
                        ...prev,
                        dataSource: {
                          ...(prev.dataSource || {}),
                          model: e.target.value as any
                        }
                      }));
                    }}
                    label="Data Model"
                    disabled={loading}>

                      {loading ?
                    <MenuItem value="">Loading...</MenuItem> :

                    dataSources.map((source) =>
                    <MenuItem key={source.model} value={source.model}>
                            {source.label}
                          </MenuItem>
                    )
                    }
                    </Select>
                    {errors.dataSource &&
                  <FormHelperText>{errors.dataSource}</FormHelperText>
                  }
                  </FormControl>
                </Grid>
                
                {sectionData.dataSource?.model &&
              <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Fields
                    </Typography>
                    <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                      <Grid container spacing={1}>
                        {loading ?
                    <Grid item xs={12}>
                            <CircularProgress size={20} />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              Loading available fields...
                            </Typography>
                          </Grid> :

                    dataSources.
                    find((source) => source.model === sectionData.dataSource?.model)?.
                    fields.map((field) =>
                    <Grid item xs={6} md={4} key={field.id}>
                                <Chip
                        label={`${field.label} (${field.type})`}
                        size="small"
                        sx={{ mb: 1 }} />

                              </Grid>
                    )
                    }
                      </Grid>
                    </Paper>
                  </Grid>
              }
              </>
            }
            
            
            {sectionData.type === 'chart' &&
            <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Chart Options
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Chart Type</InputLabel>
                    <Select
                    name="chartOptions.type"
                    value={sectionData.chartOptions?.type || 'bar'}
                    onChange={(e) => {
                      setSectionData((prev) => ({
                        ...prev,
                        chartOptions: {
                          ...(prev.chartOptions || {}),
                          type: e.target.value as any
                        }
                      }));
                    }}
                    label="Chart Type">

                      <MenuItem value="bar">Bar Chart</MenuItem>
                      <MenuItem value="line">Line Chart</MenuItem>
                      <MenuItem value="pie">Pie Chart</MenuItem>
                      <MenuItem value="doughnut">Doughnut Chart</MenuItem>
                      <MenuItem value="radar">Radar Chart</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                  name="chartOptions.title"
                  label="Chart Title"
                  value={sectionData.chartOptions?.title || ''}
                  onChange={(e) => {
                    setSectionData((prev) => ({
                      ...prev,
                      chartOptions: {
                        ...(prev.chartOptions || {}),
                        title: e.target.value
                      }
                    }));
                  }}
                  fullWidth />

                </Grid>
              </>
            }
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveClick}>

          Save
        </Button>
      </DialogActions>
    </Dialog>);

};

export default ReportTemplateForm;