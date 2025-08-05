import React from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  useMediaQuery,
  Theme
} from '@mui/material';
import { Dashboard as DashboardIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { toggleCustomizationMode } from '../../redux/slices/dashboard.slice';

interface DashboardCustomizeButtonProps {
  compact?: boolean;
}

const DashboardCustomizeButton: React.FC<DashboardCustomizeButtonProps> = ({ compact = false }) => {
  const dispatch = useAppDispatch();
  const { isCustomizing } = useAppSelector(state => state.dashboard);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  const handleToggleCustomization = () => {
    dispatch(toggleCustomizationMode());
  };
  
  if (compact || isMobile) {
    return (
      <Tooltip title={isCustomizing ? "Exit Customization Mode" : "Customize Dashboard"}>
        <IconButton
          color={isCustomizing ? "primary" : "default"}
          onClick={handleToggleCustomization}
          sx={{
            backgroundColor: isCustomizing ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
          }}
        >
          {isCustomizing ? <DashboardIcon /> : <SettingsIcon />}
        </IconButton>
      </Tooltip>
    );
  }
  
  return (
    <Button
      variant={isCustomizing ? "contained" : "outlined"}
      color="primary"
      onClick={handleToggleCustomization}
      startIcon={isCustomizing ? <DashboardIcon /> : <SettingsIcon />}
      size="small"
    >
      {isCustomizing ? "Exit Customize Mode" : "Customize Dashboard"}
    </Button>
  );
};

export default DashboardCustomizeButton; 