import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  CloudSync as CloudSyncIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import useDashboardSync from '../../hooks/useDashboardSync';
import { format } from 'date-fns';

interface DashboardSyncStatusProps {
  showControls?: boolean;
}

/**
 * Component to display dashboard synchronization status
 */
const DashboardSyncStatus: React.FC<DashboardSyncStatusProps> = ({ showControls = false }) => {
  const {
    loadFromServer,
    saveToServer,
    isSyncing,
    lastSyncTime,
    syncError,
    syncStatus
  } = useDashboardSync(true);

  // Format the last sync time
  const formattedLastSyncTime = lastSyncTime 
    ? format(lastSyncTime, 'MMM d, yyyy h:mm a')
    : 'Never';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {/* Sync Icon based on status */}
      {isSyncing ? (
        <Tooltip title="Syncing dashboard preferences">
          <CircularProgress size={20} sx={{ mr: 1 }} />
        </Tooltip>
      ) : syncStatus === 'success' ? (
        <Tooltip title="Dashboard preferences synced">
          <CloudDoneIcon color="success" sx={{ mr: 1 }} />
        </Tooltip>
      ) : syncStatus === 'error' ? (
        <Tooltip title="Error syncing dashboard preferences">
          <CloudOffIcon color="error" sx={{ mr: 1 }} />
        </Tooltip>
      ) : (
        <Tooltip title="Dashboard preferences not synced">
          <CloudSyncIcon color="action" sx={{ mr: 1 }} />
        </Tooltip>
      )}

      {/* Last sync time */}
      <Typography variant="caption" color="text.secondary">
        Last sync: {formattedLastSyncTime}
      </Typography>

      {/* Manual sync controls */}
      {showControls && (
        <Box sx={{ ml: 2 }}>
          <Tooltip title="Load dashboard from server">
            <IconButton
              size="small"
              onClick={() => loadFromServer()}
              disabled={isSyncing}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save dashboard to server">
            <IconButton
              size="small"
              onClick={() => saveToServer()}
              disabled={isSyncing}
            >
              <CloudUploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Error message */}
      <Snackbar
        open={!!syncError}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" variant="filled">
          {syncError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardSyncStatus; 