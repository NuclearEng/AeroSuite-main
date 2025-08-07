/**
 * API Version Warning Banner
 * 
 * Displays warnings about deprecated API versions and provides
 * migration guidance to users.
 * 
 * @task TS376 - API versioning strategy implementation
 */
import React from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { dismissVersionWarningBanner } from '../../redux/slices/app.slice';
import { Link } from 'react-router-dom';
import { Alert, Button, Typography, Box } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import apiService from '../../services/api';

/**
 * API Version Warning Banner Component
 * 
 * Displays a warning banner when using a deprecated API version
 */
const ApiVersionWarningBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const { apiVersionWarning, showVersionWarningBanner, migrationGuideUrl } = useAppSelector((state) => state.app);
  
  // Don't render if no warning or banner is hidden
  if (!apiVersionWarning || !showVersionWarningBanner) {
    return null;
  }
  
  // Format sunset date if available
  const formattedSunsetDate = apiVersionWarning.sunset 
    ? new Date(apiVersionWarning.sunset).toLocaleDateString()
    : null;
  
  // Handle migration guide click
  const handleMigrationGuideClick = async () => {
    if (!migrationGuideUrl) return;
    
    try {
      // Get the latest version
      const versionInfo = await (apiService as any)?.checkApiVersion?.();
      const latestVersion = versionInfo?.defaultVersion;
      
      // Get migration guide
      const guide = await (apiService as any)?.getMigrationGuide?.((apiService as any)?.getVersion?.(), latestVersion);
      
      // Open migration guide in new window or display in modal
      console.log('Migration guide:', guide);
      // Implementation for displaying guide would go here
    } catch (_error) {
      console.error("Error:", err);
    }
  };
  
  // Handle dismiss click
  const handleDismissClick = () => {
    dispatch(dismissVersionWarningBanner());
  };
  
  return (
    <Alert 
      severity="warning"
      icon={<InfoIcon />}
      action={
        <Button 
          color="inherit" 
          size="small" 
          onClick={handleDismissClick}
          startIcon={<CloseIcon />}
        >
          Dismiss
        </Button>
      }
      sx={{ 
        borderRadius: 0,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Box>
        <Typography variant="body2" component="div">
          <strong>API Version Warning:</strong> {apiVersionWarning.message}
          {formattedSunsetDate && (
            <span> This version will be discontinued on {formattedSunsetDate}.</span>
          )}
        </Typography>
        {migrationGuideUrl && (
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleMigrationGuideClick}
            sx={{ textDecoration: 'underline', ml: 1 }}
          >
            View Migration Guide
          </Button>
        )}
      </Box>
    </Alert>
  );
};

export default ApiVersionWarningBanner; 