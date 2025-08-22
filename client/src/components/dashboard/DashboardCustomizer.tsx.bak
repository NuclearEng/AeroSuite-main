import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Divider,
  Slider,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tooltip,
  Collapse } from
'@mui/material';
import {
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
  AspectRatio as SizeIcon } from
'@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  toggleWidgetVisibility,
  updateWidgetPosition,
  updateWidgetSize,
  updateLayout,
  applyPreset,
  savePreset,
  resetDashboard,
  toggleCustomizationMode,
  DashboardWidgetConfig } from
'../../redux/slices/dashboard.slice';

interface DashboardCustomizerProps {
  onClose?: () => void;
}

const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const { widgets, layout, presets, activePreset, isCustomizing } = useAppSelector((state) => state.dashboard);

  // Local state for new preset name
  const [newPresetName, setNewPresetName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Convert widgets object to sorted array for rendering
  const widgetsList = Object.values(widgets).
  sort((a, b) => a.position - b.position);

  // Handle drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const widgetId = widgetsList[sourceIndex].id;

    // Update the position
    dispatch(updateWidgetPosition({
      id: widgetId,
      position: destinationIndex
    }));
  };

  // Handle widget visibility toggle
  const handleToggleVisibility = (widgetId: string) => {
    dispatch(toggleWidgetVisibility(widgetId));
  };

  // Handle widget size change
  const handleSizeChange = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    dispatch(updateWidgetSize({ id: widgetId, size }));
  };

  // Handle layout changes
  const handleLayoutChange = (property: keyof typeof layout, value: any) => {
    dispatch(updateLayout({ [property]: value }));
  };

  // Handle preset selection
  const handlePresetChange = (presetId: string) => {
    dispatch(applyPreset(presetId));
  };

  // Open save dialog
  const handleOpenSaveDialog = () => {
    setSaveDialogOpen(true);
  };

  // Save new preset
  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      const presetId = `custom-${Date.now()}`;
      dispatch(savePreset({ id: presetId, name: newPresetName.trim() }));
      setNewPresetName('');
      setSaveDialogOpen(false);
    }
  };

  // Reset dashboard to defaults
  const handleResetDashboard = () => {
    if (window.confirm('Are you sure you want to reset your dashboard to default settings?')) {
      dispatch(resetDashboard());
    }
  };

  // Close customization mode
  const handleCloseCustomizer = () => {
    dispatch(toggleCustomizationMode());
    if (onClose) onClose();
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <SettingsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Dashboard Customization</Typography>
          </Box>
          <IconButton onClick={handleCloseCustomizer} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Layout Presets
          </Typography>
          <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
            {Object.entries(presets).map(([id, preset]) =>
            <Chip
              key={id}
              label={preset.name}
              onClick={() => handlePresetChange(id)}
              color={activePreset === id ? 'primary' : 'default'}
              variant={activePreset === id ? 'filled' : 'outlined'}
              sx={{ m: 0.5 }} />

            )}
            <Tooltip title="Save current layout as preset">
              <Chip
                icon={<AddIcon />}
                label="Save Current"
                onClick={handleOpenSaveDialog}
                variant="outlined"
                sx={{ m: 0.5 }} />

            </Tooltip>
          </Box>
        </Box>
        
        
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Layout Options
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="column-count-label">Column Count</InputLabel>
              <Select
                labelId="column-count-label"
                value={layout.columnCount}
                onChange={(e) => handleLayoutChange('columnCount', Number(e.target.value))}
                label="Column Count">

                <MenuItem value={1}>1 Column</MenuItem>
                <MenuItem value={2}>2 Columns</MenuItem>
                <MenuItem value={3}>3 Columns</MenuItem>
                <MenuItem value={4}>4 Columns</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
              <Switch
                checked={layout.compactView}
                onChange={(e) => handleLayoutChange('compactView', e.target.checked)} />

              }
              label="Compact View" />

            
            <FormControlLabel
              control={
              <Switch
                checked={layout.showAnimations}
                onChange={(e) => handleLayoutChange('showAnimations', e.target.checked)} />

              }
              label="Show Animations" />

          </Box>
        </Box>
        
        
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          endIcon={advancedOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
          onClick={() => setAdvancedOpen(!advancedOpen)}
          sx={{ mb: 2 }}>

          Advanced Settings
        </Button>
        
        <Collapse in={advancedOpen}>
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Auto-Refresh Interval (seconds)
            </Typography>
            <Slider
              value={layout.refreshInterval}
              onChange={(_, value) => handleLayoutChange('refreshInterval', value)}
              step={30}
              marks
              min={0}
              max={600}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => value === 0 ? 'Off' : `${value}s`} />

            <Typography variant="caption" color="text.secondary">
              Set to 0 to disable auto-refresh
            </Typography>
          </Box>
        </Collapse>
        
        
        <Typography variant="subtitle1" gutterBottom>
          Widgets
        </Typography>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets-list">
            {(provided: unknown) =>
            <List
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}>

                {widgetsList.map((widget, index) =>
              <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided: any) =>
                <ListItem
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  divider={index < widgetsList.length - 1}
                  secondaryAction={
                  <Box>
                            <Tooltip title="Toggle visibility">
                              <IconButton onClick={() => handleToggleVisibility(widget.id)} edge="end">
                                {widget.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Change size">
                              <IconButton
                        onClick={() => {
                          const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                          const currentIndex = sizes.indexOf(widget.size);
                          const nextSize = sizes[(currentIndex + 1) % sizes.length];
                          handleSizeChange(widget.id, nextSize);
                        }}>

                                <SizeIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                  }>

                        <ListItemIcon {...provided.dragHandleProps}>
                          <DragIcon />
                        </ListItemIcon>
                        <ListItemText
                    primary={getWidgetDisplayName(widget.id)}
                    secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip
                        label={widget.size}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }} />

                              {!widget.visible &&
                      <Chip
                        label="Hidden"
                        size="small"
                        color="error"
                        sx={{ height: 20, fontSize: '0.7rem' }} />

                      }
                            </Box>
                    } />

                      </ListItem>
                }
                  </Draggable>
              )}
                {provided.placeholder}
              </List>
            }
          </Droppable>
        </DragDropContext>
        
        
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RefreshIcon />}
            onClick={handleResetDashboard}>

            Reset to Default
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleCloseCustomizer}>

            Apply Changes
          </Button>
        </Box>
      </CardContent>
      
      
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Dashboard Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            variant="outlined"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)} />

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSavePreset}
            variant="contained"
            disabled={!newPresetName.trim()}>

            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>);

};

// Helper function to get a display name for widget ID
function getWidgetDisplayName(widgetId: string): string {
  const displayNames: {[key: string]: string;} = {
    'inspections-summary': 'Inspections Summary',
    'upcoming-inspections': 'Upcoming Inspections',
    'supplier-performance': 'Supplier Performance',
    'inspection-status': 'Inspection Status',
    'quality-metrics': 'Quality Metrics',
    'recent-activity': 'Recent Activity',
    'reports-summary': 'Reports Summary',
    'calendar': 'Calendar'
  };

  return displayNames[widgetId] || widgetId;
}

export default DashboardCustomizer;