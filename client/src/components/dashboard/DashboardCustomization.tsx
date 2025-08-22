import React, { ChangeEvent, useState } from 'react';
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Slider,
  MenuItem,
  Select,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Tooltip,
  SelectChangeEvent,
  InputLabel,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Grid } from
'@mui/material';
import {
  Close as CloseIcon,
  ViewModule as ViewModuleIcon,
  ViewColumn as ViewColumnIcon,
  ViewComfy as ViewComfyIcon,
  ViewAgenda as ViewAgendaIcon,
  Refresh as RefreshIcon,
  DragIndicator as DragIndicatorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Save as SaveIcon } from
'@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  updateLayout,
  toggleWidgetVisibility,
  updateWidgetSize,
  updateWidgetPosition,
  resetDashboard,
  applyPreset,
  savePreset,
  DashboardWidgetConfig } from
'../../redux/slices/dashboard.slice';
import DashboardSyncStatus from './DashboardSyncStatus';
import useDashboardSync from '../../hooks/useDashboardSync';

interface DashboardCustomizationProps {
  open: boolean;
  onClose: () => void;
}

const DashboardCustomization: React.FC<DashboardCustomizationProps> = ({
  open,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const { widgets, layout, presets, activePreset } = useAppSelector((state) => state.dashboard);
  const { saveToServer, resetOnServer, syncStatus, isSyncing } = useDashboardSync();

  const [newPresetName, setNewPresetName] = useState('');

  // Handle layout column count change
  const handleColumnCountChange = (_: React.MouseEvent<HTMLElement>, newValue: number | null) => {
    if (newValue !== null) {
      dispatch(updateLayout({ columnCount: newValue as 1 | 2 | 3 | 4 }));
    }
  };

  // Handle refresh interval change
  const handleRefreshIntervalChange = (_: Event, newValue: number | number[]) => {
    dispatch(updateLayout({ refreshInterval: newValue as number }));
  };

  // Handle widget toggle
  const handleWidgetToggle = (widgetId: string) => {
    dispatch(toggleWidgetVisibility(widgetId));
  };

  // Handle widget size change
  const handleWidgetSizeChange = (event: SelectChangeEvent, widgetId: string) => {
    dispatch(updateWidgetSize({
      id: widgetId,
      size: event.target.value as 'small' | 'medium' | 'large'
    }));
  };

  // Handle preset selection
  const handlePresetChange = (event: SelectChangeEvent) => {
    dispatch(applyPreset(event.target.value));
  };

  // Handle save preset
  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      const presetId = `custom-${Date.now()}`;
      dispatch(savePreset({
        id: presetId,
        name: newPresetName.trim()
      }));
      setNewPresetName('');
    }
  };

  // Handle reset dashboard
  const handleResetDashboard = () => {
    dispatch(resetDashboard());
    resetOnServer();
  };

  // Handle save to server
  const handleSaveToServer = () => {
    saveToServer();
  };

  // Sort widgets by position
  const sortedWidgets = Object.values(widgets).
  sort((a, b) => a.position - b.position);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          p: 3
        }
      }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Dashboard Customization</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <DashboardSyncStatus showControls={true} />
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Dashboard Presets
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="preset-select-label">Select Preset</InputLabel>
          <Select
            labelId="preset-select-label"
            value={activePreset || ''}
            label="Select Preset"
            onChange={handlePresetChange}>

            {Object.entries(presets).map(([id, preset]: any) =>
            <MenuItem key={id} value={id}>
                {preset.name}
              </MenuItem>
            )}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleResetDashboard}
            startIcon={<RefreshIcon />}>

            Reset to Default
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleSaveToServer}
            startIcon={<SaveIcon />}
            disabled={isSyncing}>

            Save Layout
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Layout Settings
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Column Count
          </Typography>
          <ToggleButtonGroup
            value={layout.columnCount}
            exclusive
            onChange={handleColumnCountChange}
            aria-label="column count"
            size="small"
            fullWidth>

            <ToggleButton value={1} aria-label="1 column">
              <ViewAgendaIcon />
            </ToggleButton>
            <ToggleButton value={2} aria-label="2 columns">
              <ViewColumnIcon />
            </ToggleButton>
            <ToggleButton value={3} aria-label="3 columns">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value={4} aria-label="4 columns">
              <ViewComfyIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Compact View
          </Typography>
          <FormControlLabel
            control={
            <Switch
              checked={layout.compactView}
              onChange={() => dispatch(updateLayout({ compactView: !layout.compactView }))}
              size="small" />

            }
            label="Enable compact view" />

        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Animations
          </Typography>
          <FormControlLabel
            control={
            <Switch
              checked={layout.showAnimations}
              onChange={() => dispatch(updateLayout({ showAnimations: !layout.showAnimations }))}
              size="small" />

            }
            label="Enable animations" />

        </Box>
        
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Auto-refresh Interval (seconds)
          </Typography>
          <Slider
            value={layout.refreshInterval}
            min={0}
            max={3600}
            step={60}
            marks={[
            { value: 0, label: 'Off' },
            { value: 300, label: '5m' },
            { value: 1800, label: '30m' },
            { value: 3600, label: '1h' }]
            }
            onChange={handleRefreshIntervalChange} />

        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Widgets
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Drag and drop widgets to reorder, or toggle visibility.
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {sortedWidgets.map((widget: any) =>
          <Grid item xs={12} key={widget.id}>
              <Card
              variant="outlined"
              sx={{
                opacity: widget.visible ? 1 : 0.5,
                transition: 'opacity 0.2s'
              }}>

                <CardHeader
                avatar={<DragIndicatorIcon />}
                action={
                <IconButton
                  size="small"
                  onClick={() => handleWidgetToggle(widget.id)}
                  color={widget.visible ? 'primary' : 'default'}>

                      {widget.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                }
                title={
                <Typography variant="body1">
                      {widget.id.split('-').map((word: any) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Typography>
                }
                sx={{ py: 1 }} />

                <CardContent sx={{ pt: 0 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`${widget.id}-size-label`}>Widget Size</InputLabel>
                    <Select
                    labelId={`${widget.id}-size-label`}
                    id={`${widget.id}-size`}
                    value={widget.size}
                    label="Widget Size"
                    onChange={(e) => handleWidgetSizeChange(e, widget.id)}
                    disabled={!widget.visible}>

                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Drawer>);

};

export default DashboardCustomization;