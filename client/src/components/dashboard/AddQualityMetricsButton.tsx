import React from 'react';
import { Button, Tooltip, SxProps, Theme } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { addWidget } from '../../redux/slices/dashboard.slice';

interface AddQualityMetricsButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  sx?: SxProps<Theme>;
}

const AddQualityMetricsButton: React.FC<AddQualityMetricsButtonProps> = ({ 
  variant = 'contained', 
  size = 'medium',
  sx
}) => {
  const dispatch = useAppDispatch();
  const dashboardWidgets = useAppSelector(state => state.dashboard.widgets);
  
  // Check if the widget is already in the dashboard
  const isAlreadyAdded = 'quality-metrics' in dashboardWidgets;
  
  const handleAddWidget = () => {
    // If widget already exists but is not visible, make it visible
    if (isAlreadyAdded && !dashboardWidgets['quality-metrics'].visible) {
      dispatch({
        type: 'dashboard/toggleWidgetVisibility',
        payload: 'quality-metrics'
      });
      return;
    }
    
    // If widget doesn't exist, add it
    if (!isAlreadyAdded) {
      dispatch(addWidget({
        id: 'quality-metrics',
        visible: true,
        position: Object.keys(dashboardWidgets).length,
        size: 'large'
      }));
    }
  };
  
  return (
    <Tooltip title={isAlreadyAdded ? "Quality Metrics widget is already in your dashboard" : "Add Quality Metrics widget to your dashboard"}>
      <span>
        <Button
          variant={variant}
          size={size}
          startIcon={<AssessmentIcon />}
          onClick={handleAddWidget}
          disabled={isAlreadyAdded && dashboardWidgets['quality-metrics'].visible}
          color="primary"
          sx={sx}
        >
          {isAlreadyAdded && dashboardWidgets['quality-metrics'].visible 
            ? "Quality Metrics Added" 
            : "Add Quality Metrics"}
        </Button>
      </span>
    </Tooltip>
  );
};

export default AddQualityMetricsButton; 