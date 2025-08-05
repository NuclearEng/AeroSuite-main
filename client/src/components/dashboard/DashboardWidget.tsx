import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Box,
  Tooltip,
  Divider,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  VisibilityOff as HideIcon,
  MoreVert as MoreIcon,
  AspectRatio as SizeIcon,
  Delete as RemoveIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  toggleWidgetVisibility,
  updateWidgetSize,
  DashboardWidgetConfig
} from '../../redux/slices/dashboard.slice';

interface DashboardWidgetProps {
  widgetId: string;
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widgetId,
  title,
  children,
  loading = false
}) => {
  const dispatch = useAppDispatch();
  const { isCustomizing, widgets } = useAppSelector(state => state.dashboard);
  
  // Get widget config from state
  const widget = widgets[widgetId];
  
  if (!widget || !widget.visible) {
    return null;
  }
  
  // Handle hiding widget
  const handleHideWidget = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleWidgetVisibility(widgetId));
  };
  
  // Handle changing widget size
  const handleChangeSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cycle through sizes: small -> medium -> large -> small
    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(widget.size);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    
    dispatch(updateWidgetSize({ id: widgetId, size: nextSize }));
  };
  
  // Calculate widget width based on size
  const getWidgetWidth = (size: DashboardWidgetConfig['size']) => {
    switch (size) {
      case 'small':
        return { xs: '100%', sm: '100%', md: '50%', lg: '33.33%' };
      case 'medium':
        return { xs: '100%', sm: '100%', md: '100%', lg: '50%' };
      case 'large':
        return { xs: '100%', sm: '100%', md: '100%', lg: '100%' };
      default:
        return { xs: '100%', sm: '100%', md: '50%', lg: '50%' };
    }
  };
  
  return (
    <Fade in={true} timeout={300}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          position: 'relative',
          ...(isCustomizing && {
            boxShadow: '0 0 0 2px #2196f3',
            '&:hover': {
              boxShadow: '0 0 0 3px #2196f3',
            }
          })
        }}
      >
        {/* Show customization overlay in customization mode */}
        {isCustomizing && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              p: 1,
              zIndex: 10,
              display: 'flex',
              gap: 0.5,
              bgcolor: 'rgba(33, 150, 243, 0.1)'
            }}
          >
            <Tooltip title="Change size">
              <IconButton size="small" onClick={handleChangeSize}>
                <SizeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hide widget">
              <IconButton size="small" onClick={handleHideWidget}>
                <HideIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        
        <CardHeader
          title={title}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          action={
            !isCustomizing && (
              <IconButton size="small">
                <MoreIcon fontSize="small" />
              </IconButton>
            )
          }
          sx={{ pb: 1 }}
        />
        <Divider />
        
        <CardContent
          sx={{
            flexGrow: 1,
            position: 'relative',
            overflow: 'auto',
            p: widget.size === 'small' ? 1 : 2
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                minHeight: 150
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default DashboardWidget; 