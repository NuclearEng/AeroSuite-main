/**
 * Feature Flags Manager Component
 * 
 * This component provides a UI for administrators to manage feature flags.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Alert,
  Stack,
  Divider,
  LinearProgress } from
'@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sync as SyncIcon,
  Flag as FlagIcon,
  VisibilityOff as VisibilityOffIcon,
  BrightnessAuto as BrightnessAutoIcon,
  Brightness1 as Brightness1Icon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Settings as SettingsIcon } from
'@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import featureFlagsService, { FeatureFlag } from '../../services/featureFlags.service';
import { setFlags, toggleFlag } from '../../redux/slices/featureFlags.slice';

interface EditDialogState {
  open: boolean;
  flagKey: string;
  flagData: Partial<FeatureFlag>;
  isNew: boolean;
}

/**
 * Feature Flags Manager Component
 */
const FeatureFlagsManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { flags, loading, error } = useAppSelector((state) => state.featureFlags);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnvironment, setFilterEnvironment] = useState<any>('');
  const [filterStatus, setFilterStatus] = useState<any>('');
  const [syncing, setSyncing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ type: 'success', message: '' });

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<any>({
    open: false,
    flagKey: '',
    flagData: {},
    isNew: false
  });

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<any>({
    open: false,
    flagKey: ''
  });

  // Load feature flags on mount
  useEffect(() => {
    loadFeatureFlags();
  }, []);

  // Load feature flags
  const loadFeatureFlags = async () => {
    try {
      await featureFlagsService.getAllFlags();
    } catch (err) {
      showAlertMessage('error', 'Failed to load feature flags');
    }
  };

  // Sync feature flags
  const syncFeatureFlags = async () => {
    try {
      setSyncing(true);
      const success = await featureFlagsService.syncFlags();

      if (success) {
        showAlertMessage('success', 'Feature flags synced successfully');
      } else {
        showAlertMessage('error', 'Failed to sync feature flags');
      }
    } catch (err) {
      showAlertMessage('error', 'Failed to sync feature flags');
    } finally {
      setSyncing(false);
    }
  };

  // Toggle a feature flag
  const handleToggleFlag = async (flagKey: string) => {
    try {
      await featureFlagsService.toggleFlag(flagKey);

      // Update is handled by the service which dispatches to Redux
      const flag = flags[flagKey];
      showAlertMessage(
        'success',
        `Feature flag "${flagKey}" ${flag.enabled ? 'disabled' : 'enabled'}`
      );
    } catch (err) {
      showAlertMessage('error', `Failed to toggle feature flag "${flagKey}"`);
    }
  };

  // Open edit dialog
  const handleOpenEditDialog = (flagKey: string = '', isNew: boolean = false) => {
    setEditDialog({
      open: true,
      flagKey,
      flagData: isNew ?
      {
        enabled: false,
        description: '',
        owner: '',
        rolloutPercentage: 0,
        segmentRules: {},
        environmentsEnabled: ['development']
      } :
      { ...flags[flagKey] },
      isNew
    });
  };

  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialog({
      open: false,
      flagKey: '',
      flagData: {},
      isNew: false
    });
  };

  // Save feature flag
  const handleSaveFlag = async () => {
    try {
      const { flagKey, flagData, isNew } = editDialog;

      if (isNew && !flagKey) {
        showAlertMessage('error', 'Feature flag key is required');
        return;
      }

      await featureFlagsService.updateFlag(flagKey, flagData);

      showAlertMessage(
        'success',
        `Feature flag "${flagKey}" ${isNew ? 'created' : 'updated'} successfully`
      );

      handleCloseEditDialog();
    } catch (err) {
      showAlertMessage('error', 'Failed to save feature flag');
    }
  };

  // Delete feature flag
  const handleDeleteFlag = async () => {
    try {
      const { flagKey } = deleteDialog;

      const success = await featureFlagsService.deleteFlag(flagKey);

      if (success) {
        showAlertMessage('success', `Feature flag "${flagKey}" deleted successfully`);
      } else {
        showAlertMessage('error', `Failed to delete feature flag "${flagKey}"`);
      }

      setDeleteDialog({ open: false, flagKey: '' });
    } catch (err) {
      showAlertMessage('error', 'Failed to delete feature flag');
      setDeleteDialog({ open: false, flagKey: '' });
    }
  };

  // Show alert message
  const showAlertMessage = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlertMessage({ type, message });
    setShowAlert(true);

    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 5000);
  };

  // Handle input change in edit dialog
  const handleEditInputChange = (field: string, value: any) => {
    setEditDialog({
      ...editDialog,
      flagData: {
        ...editDialog.flagData,
        [field]: value
      }
    });
  };

  // Filter flags based on search term and filters
  const filteredFlags = Object.entries(flags).
  filter(([key, flag]) => {
    // Filter by search term
    if (
    searchTerm &&
    !key.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !flag.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    {
      return false;
    }

    // Filter by environment
    if (
    filterEnvironment &&
    !flag.environmentsEnabled.includes(filterEnvironment))
    {
      return false;
    }

    // Filter by status
    if (filterStatus) {
      if (filterStatus === 'enabled' && !flag.enabled) {
        return false;
      }
      if (filterStatus === 'disabled' && flag.enabled) {
        return false;
      }
      if (
      filterStatus === 'partial' && (
      flag.rolloutPercentage === 0 || flag.rolloutPercentage === 100 || !flag.enabled))
      {
        return false;
      }
    }

    return true;
  }).
  sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  return (
    <Box sx={{ p: 3 }}>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <FlagIcon sx={{ mr: 1 }} />
          Feature Flags Manager
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={syncFeatureFlags}
            disabled={syncing}>

            {syncing ? 'Syncing...' : 'Sync Flags'}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenEditDialog('', true)}>

            Create Flag
          </Button>
        </Stack>
      </Box>
      
      
      {loading && <LinearProgress sx={{ mb: 3 }} />}
      
      
      {error &&
      <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      }
      
      
      {showAlert &&
      <Alert severity={alertMessage.type as any} sx={{ mb: 3 }}>
          {alertMessage.message}
        </Alert>
      }
      
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment:
              <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>

            }}
            sx={{ flexGrow: 1, minWidth: 200 }} />

          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="environment-filter-label">Environment</InputLabel>
            <Select
              labelId="environment-filter-label"
              value={filterEnvironment}
              label="Environment"
              onChange={(e) => setFilterEnvironment(e.target.value)}>

              <MenuItem value="">All</MenuItem>
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="production">Production</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}>

              <MenuItem value="">All</MenuItem>
              <MenuItem value="enabled">Enabled</MenuItem>
              <MenuItem value="disabled">Disabled</MenuItem>
              <MenuItem value="partial">Partial Rollout</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Flag Key</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Rollout %</TableCell>
              <TableCell>Environments</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFlags.length === 0 ?
            <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography sx={{ py: 2 }}>
                    {loading ? 'Loading feature flags...' : 'No feature flags found.'}
                  </Typography>
                </TableCell>
              </TableRow> :

            filteredFlags.map(([key, flag]: any) =>
            <TableRow key={key} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Switch
                  checked={flag.enabled}
                  onChange={() => handleToggleFlag(key)}
                  color={
                  !flag.enabled ?
                  'default' :
                  flag.rolloutPercentage < 100 ?
                  'warning' :
                  'success'
                  } />

                  </TableCell>
                  <TableCell>{flag.description}</TableCell>
                  <TableCell>
                    {flag.enabled ?
                <Chip
                  label={`${flag.rolloutPercentage}%`}
                  color={
                  flag.rolloutPercentage === 0 ?
                  'default' :
                  flag.rolloutPercentage < 100 ?
                  'warning' :
                  'success'
                  }
                  size="small" /> :


                <Chip label="Disabled" size="small" />
                }
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {flag.environmentsEnabled.map((env: any) =>
                  <Chip
                    key={env}
                    label={env}
                    size="small"
                    color={
                    env === 'production' ?
                    'error' :
                    env === 'staging' ?
                    'warning' :
                    'info'
                    }
                    variant="outlined" />

                  )}
                    </Box>
                  </TableCell>
                  <TableCell>{flag.owner}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton
                      size="small"
                      onClick={() => handleOpenEditDialog(key)}>

                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete">
                        <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, flagKey: key })}>

                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
            )
            }
          </TableBody>
        </Table>
      </TableContainer>
      
      
      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editDialog.isNew ? 'Create Feature Flag' : 'Edit Feature Flag'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            <TextField
              label="Flag Key"
              value={editDialog.flagKey}
              onChange={(e) => setEditDialog({ ...editDialog, flagKey: e.target.value })}
              helperText="Format: namespace.feature (e.g., ui.darkMode)"
              fullWidth
              required
              disabled={!editDialog.isNew} />

            
            
            <TextField
              label="Description"
              value={editDialog.flagData.description || ''}
              onChange={(e) => handleEditInputChange('description', e.target.value)}
              helperText="Brief description of the feature flag"
              fullWidth />

            
            
            <TextField
              label="Owner"
              value={editDialog.flagData.owner || ''}
              onChange={(e) => handleEditInputChange('owner', e.target.value)}
              helperText="Team or person responsible for this feature"
              fullWidth />

            
            
            <FormControlLabel
              control={
              <Switch
                checked={editDialog.flagData.enabled || false}
                onChange={(e) => handleEditInputChange('enabled', e.target.checked)} />

              }
              label="Enabled" />

            
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Rollout Percentage: {editDialog.flagData.rolloutPercentage || 0}%
              </Typography>
              <Slider
                value={editDialog.flagData.rolloutPercentage || 0}
                onChange={(_, value) => handleEditInputChange('rolloutPercentage', value)}
                disabled={!editDialog.flagData.enabled}
                step={10}
                marks
                min={0}
                max={100}
                valueLabelDisplay="auto" />

            </Box>
            
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Enabled Environments
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['development', 'staging', 'production'].map((env: any) =>
                <FormControlLabel
                  key={env}
                  control={
                  <Checkbox
                    checked={
                    (editDialog.flagData.environmentsEnabled || []).includes(env)
                    }
                    onChange={(e) => {
                      const environments = editDialog.flagData.environmentsEnabled || [];
                      if (e.target.checked) {
                        handleEditInputChange(
                          'environmentsEnabled',
                          [...environments, env]
                        );
                      } else {
                        handleEditInputChange(
                          'environmentsEnabled',
                          environments.filter((e: any) => e !== env)
                        );
                      }
                    }} />

                  }
                  label={env} />

                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveFlag} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, flagKey: '' })}>
        <DialogTitle>Delete Feature Flag</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the feature flag "{deleteDialog.flagKey}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, flagKey: '' })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteFlag} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>);

};

export default FeatureFlagsManager;