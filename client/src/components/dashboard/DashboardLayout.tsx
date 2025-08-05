import React from 'react';
import { Box, Grid } from '@mui/material';
import { useAppSelector } from '../../redux/store';
import { DashboardWidgetConfig } from '../../redux/slices/dashboard.slice';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { layout, widgets } = useAppSelector(state => state.dashboard);
  
  // Get visible widgets sorted by position
  const visibleWidgets = Object.values(widgets)
    .filter(widget => widget.visible)
    .sort((a, b) => a.position - b.position);
  
  // Get column configuration based on layout
  const getColumnConfig = (columnCount: number) => {
    switch (columnCount) {
      case 1: return 12;
      case 2: return 6;
      case 3: return 4;
      case 4: return 3;
      default: return 6;
    }
  };
  
  // Calculate column size based on widget size and layout
  const getWidgetSize = (widget: DashboardWidgetConfig) => {
    const baseColumnSize = getColumnConfig(layout.columnCount);
    
    switch (widget.size) {
      case 'small':
        return layout.columnCount <= 2 ? baseColumnSize : baseColumnSize;
      case 'medium':
        return layout.columnCount === 1 ? 12 : 
               layout.columnCount === 2 ? 6 : 
               layout.columnCount >= 3 ? 6 : 6;
      case 'large':
        return layout.columnCount === 1 ? 12 : 
               layout.columnCount === 2 ? 12 : 
               layout.columnCount >= 3 ? 8 : 12;
      default:
        return baseColumnSize;
    }
  };
  
  return (
    <Box
      sx={{
        width: '100%',
        transition: 'all 0.3s ease',
      }}
    >
      <Grid 
        container 
        spacing={layout.compactView ? 2 : 3}
        sx={{ 
          mt: 0,
          // Disable animations if setting is off
          '& .MuiPaper-root': {
            transition: layout.showAnimations ? 'all 0.3s ease' : 'none',
          }
        }}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;
          
          const widgetData = visibleWidgets[index];
          if (!widgetData) return null;
          
          const columnSize = getWidgetSize(widgetData);
          
          return (
            <Grid 
              item 
              xs={12} 
              sm={12} 
              md={columnSize} 
              lg={columnSize}
              sx={{ 
                transition: 'all 0.3s ease',
                height: layout.compactView ? 'auto' : null,
              }}
            >
              {child}
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default DashboardLayout; 