// Task: TS030 - Dashboard Core Framework
import React, { useState, useEffect, useCallback, useMemo, useContext, createContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import GridLayout from 'react-grid-layout';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Paper, 
  IconButton, 
  Menu, 
  MenuItem, 
  Tooltip,
  Fab,
  Drawer,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Chip,
  Badge,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Widgets as WidgetsIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { WidgetFactory } from './widgets/WidgetFactory';
import { WidgetConfigDialog } from './widgets/WidgetConfigDialog';
import { DashboardSettingsDialog } from './DashboardSettingsDialog';
import { WidgetLibrary } from './WidgetLibrary';
import { dashboardService } from '../../services/dashboard.service';
import { widgetService } from '../../services/widget.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../hooks/useNotification';
import { useDebounce } from '../../hooks/useDebounce';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Dashboard Context
const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};

// Styled Components
const DashboardContainer = styled(Box)`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.palette.background.default};
  position: relative;
`;

const DashboardHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const DashboardContent = styled(Box)`
  flex: 1;
  overflow: auto;
  padding: ${({ theme }) => theme.spacing(2)};
  position: relative;
`;

const WidgetContainer = styled(Paper)`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: ${({ isLocked }) => (isLocked ? 'default' : 'move')};
  
  &:hover {
    box-shadow: ${({ theme, isLocked }) => 
      !isLocked && theme.shadows[8]};
  }
`;

const WidgetHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(1, 2)};
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
`;

const WidgetContent = styled(Box)`
  flex: 1;
  padding: ${({ theme }) => theme.spacing(2)};
  overflow: auto;
`;

const FloatingActionButton = styled(Fab)`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing(3)};
  right: ${({ theme }) => theme.spacing(3)};
  z-index: 1000;
`;

// Dashboard Core Component
export const DashboardCore = ({ dashboardId, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const notification = useNotification();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [layouts, setLayouts] = useState({});
  const [isLocked, setIsLocked] = useState(readOnly);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [widgetLibraryOpen, setWidgetLibraryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [fullscreenWidget, setFullscreenWidget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // WebSocket for real-time updates
  const { subscribe, unsubscribe } = useWebSocket();

  // Debounced layout save
  const debouncedLayouts = useDebounce(layouts, 1000);

  // Load dashboard and widgets
  useEffect(() => {
    loadDashboard();
  }, [dashboardId]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAllWidgets();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Save layouts when changed
  useEffect(() => {
    if (debouncedLayouts && dashboard && !isLocked) {
      saveDashboardLayout();
    }
  }, [debouncedLayouts]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (dashboard) {
      const unsubscribeFns = [];

      // Subscribe to dashboard updates
      unsubscribeFns.push(
        subscribe(`dashboard:${dashboardId}`, handleDashboardUpdate)
      );

      // Subscribe to widget updates
      widgets.forEach(widget => {
        unsubscribeFns.push(
          subscribe(`widget:${widget.id}`, handleWidgetUpdate)
        );
      });

      return () => {
        unsubscribeFns.forEach(fn => fn());
      };
    }
  }, [dashboard, widgets]);

  // Load dashboard data
  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getDashboard(dashboardId);
      setDashboard(data.dashboard);
      setWidgets(data.widgets);
      setLayouts(data.layouts || generateDefaultLayouts(data.widgets));
      setIsLocked(data.dashboard.isLocked || readOnly);
    } catch (error) {
      notification.error('Failed to load dashboard');
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate default layouts for widgets
  const generateDefaultLayouts = (widgets) => {
    const cols = getBreakpointCols();
    const layouts = {};
    
    Object.keys(cols).forEach(breakpoint => {
      layouts[breakpoint] = widgets.map((widget, index) => ({
        i: widget.id,
        x: (index % cols[breakpoint]) * 4,
        y: Math.floor(index / cols[breakpoint]) * 4,
        w: widget.defaultWidth || 4,
        h: widget.defaultHeight || 4,
        minW: widget.minWidth || 2,
        minH: widget.minHeight || 2,
        maxW: widget.maxWidth || 12,
        maxH: widget.maxHeight || 12
      }));
    });
    
    return layouts;
  };

  // Get breakpoint columns
  const getBreakpointCols = () => ({
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2
  });

  // Handle layout change
  const handleLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
  };

  // Save dashboard layout
  const saveDashboardLayout = async () => {
    try {
      await dashboardService.updateDashboardLayout(dashboardId, {
        layouts: debouncedLayouts
      });
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  // Add widget to dashboard
  const addWidget = async (widgetType, config = {}) => {
    try {
      const widget = await widgetService.createWidget({
        dashboardId,
        type: widgetType,
        config,
        position: findAvailablePosition()
      });
      
      setWidgets([...widgets, widget]);
      
      // Add to layouts
      const newLayouts = { ...layouts };
      Object.keys(newLayouts).forEach(breakpoint => {
        newLayouts[breakpoint].push({
          i: widget.id,
          x: widget.position.x,
          y: widget.position.y,
          w: widget.position.w,
          h: widget.position.h,
          minW: widget.minWidth || 2,
          minH: widget.minHeight || 2
        });
      });
      setLayouts(newLayouts);
      
      notification.success('Widget added successfully');
    } catch (error) {
      notification.error('Failed to add widget');
      console.error('Add widget error:', error);
    }
  };

  // Find available position for new widget
  const findAvailablePosition = () => {
    const cols = getBreakpointCols().lg;
    const layout = layouts.lg || [];
    
    let y = 0;
    if (layout.length > 0) {
      y = Math.max(...layout.map(item => item.y + item.h));
    }
    
    return { x: 0, y, w: 4, h: 4 };
  };

  // Update widget configuration
  const updateWidget = async (widgetId, updates) => {
    try {
      const updatedWidget = await widgetService.updateWidget(widgetId, updates);
      setWidgets(widgets.map(w => w.id === widgetId ? updatedWidget : w));
      notification.success('Widget updated successfully');
    } catch (error) {
      notification.error('Failed to update widget');
      console.error('Update widget error:', error);
    }
  };

  // Remove widget
  const removeWidget = async (widgetId) => {
    try {
      await widgetService.deleteWidget(widgetId);
      setWidgets(widgets.filter(w => w.id !== widgetId));
      
      // Remove from layouts
      const newLayouts = { ...layouts };
      Object.keys(newLayouts).forEach(breakpoint => {
        newLayouts[breakpoint] = newLayouts[breakpoint].filter(
          item => item.i !== widgetId
        );
      });
      setLayouts(newLayouts);
      
      notification.success('Widget removed successfully');
    } catch (error) {
      notification.error('Failed to remove widget');
      console.error('Remove widget error:', error);
    }
  };

  // Refresh all widgets
  const refreshAllWidgets = () => {
    setRefreshKey(prev => prev + 1);
    notification.info('Dashboard refreshed');
  };

  // Handle real-time dashboard update
  const handleDashboardUpdate = (data) => {
    if (data.type === 'update') {
      setDashboard(data.dashboard);
    }
  };

  // Handle real-time widget update
  const handleWidgetUpdate = (data) => {
    if (data.type === 'update') {
      setWidgets(widgets.map(w => 
        w.id === data.widget.id ? data.widget : w
      ));
    } else if (data.type === 'delete') {
      setWidgets(widgets.filter(w => w.id !== data.widgetId));
    }
  };

  // Export dashboard
  const exportDashboard = async () => {
    try {
      const data = await dashboardService.exportDashboard(dashboardId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${dashboardId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notification.success('Dashboard exported successfully');
    } catch (error) {
      notification.error('Failed to export dashboard');
      console.error('Export error:', error);
    }
  };

  // Share dashboard
  const shareDashboard = async () => {
    try {
      const { shareUrl } = await dashboardService.shareDashboard(dashboardId);
      await navigator.clipboard.writeText(shareUrl);
      notification.success('Share link copied to clipboard');
    } catch (error) {
      notification.error('Failed to share dashboard');
      console.error('Share error:', error);
    }
  };

  // Render widget
  const renderWidget = (widget) => {
    const isFullscreen = fullscreenWidget === widget.id;
    
    return (
      <WidgetContainer
        key={widget.id}
        elevation={3}
        isLocked={isLocked}
        className={isFullscreen ? 'fullscreen-widget' : ''}
      >
        <WidgetHeader>
          <Typography variant="subtitle1" noWrap>
            {widget.title || widget.type}
          </Typography>
          <Box>
            {!isLocked && (
              <>
                <Tooltip title="Configure">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedWidget(widget);
                      setConfigDialogOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => removeWidget(widget.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton
                size="small"
                onClick={() => setFullscreenWidget(
                  isFullscreen ? null : widget.id
                )}
              >
                {isFullscreen ? (
                  <FullscreenExitIcon fontSize="small" />
                ) : (
                  <FullscreenIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </WidgetHeader>
        <WidgetContent>
          <WidgetFactory
            widget={widget}
            refreshKey={refreshKey}
            isFullscreen={isFullscreen}
          />
        </WidgetContent>
      </WidgetContainer>
    );
  };

  // Context value
  const contextValue = {
    dashboard,
    widgets,
    isLocked,
    addWidget,
    updateWidget,
    removeWidget,
    refreshAllWidgets
  };

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      <DashboardContainer>
        <DashboardHeader>
          <Box display="flex" alignItems="center" gap={2}>
            <DashboardIcon />
            <Typography variant="h6">
              {dashboard?.name || 'Dashboard'}
            </Typography>
            {dashboard?.description && (
              <Chip 
                label={dashboard.description} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={refreshAllWidgets}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}>
              <IconButton 
                onClick={() => setAutoRefresh(!autoRefresh)}
                color={autoRefresh ? "primary" : "default"}
              >
                <Badge 
                  badgeContent={autoRefresh ? "ON" : null} 
                  color="success"
                  variant="dot"
                >
                  <RefreshIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {!readOnly && (
              <>
                <Tooltip title={isLocked ? "Unlock Layout" : "Lock Layout"}>
                  <IconButton onClick={() => setIsLocked(!isLocked)}>
                    {isLocked ? <LockIcon /> : <LockOpenIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Dashboard Settings">
                  <IconButton onClick={() => setSettingsOpen(true)}>
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Export Dashboard">
                  <IconButton onClick={exportDashboard}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Share Dashboard">
                  <IconButton onClick={shareDashboard}>
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </DashboardHeader>
        
        <DashboardContent>
          <GridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            cols={getBreakpointCols()}
            rowHeight={60}
            isDraggable={!isLocked}
            isResizable={!isLocked}
            containerPadding={[16, 16]}
            margin={[16, 16]}
            useCSSTransforms={true}
            transformScale={1}
            preventCollision={false}
            compactType="vertical"
          >
            {widgets.map(renderWidget)}
          </GridLayout>
        </DashboardContent>
        
        {!readOnly && !isLocked && (
          <FloatingActionButton
            color="primary"
            onClick={() => setWidgetLibraryOpen(true)}
          >
            <AddIcon />
          </FloatingActionButton>
        )}
        
        <WidgetLibrary
          open={widgetLibraryOpen}
          onClose={() => setWidgetLibraryOpen(false)}
          onSelectWidget={(type) => {
            addWidget(type);
            setWidgetLibraryOpen(false);
          }}
        />
        
        {selectedWidget && (
          <WidgetConfigDialog
            open={configDialogOpen}
            widget={selectedWidget}
            onClose={() => {
              setConfigDialogOpen(false);
              setSelectedWidget(null);
            }}
            onSave={(updates) => {
              updateWidget(selectedWidget.id, updates);
              setConfigDialogOpen(false);
              setSelectedWidget(null);
            }}
          />
        )}
        
        <DashboardSettingsDialog
          open={settingsOpen}
          dashboard={dashboard}
          onClose={() => setSettingsOpen(false)}
          onSave={async (updates) => {
            await dashboardService.updateDashboard(dashboardId, updates);
            setDashboard({ ...dashboard, ...updates });
            setSettingsOpen(false);
            notification.success('Dashboard settings updated');
          }}
        />
      </DashboardContainer>
    </DashboardContext.Provider>
  );
};

// Dashboard Provider for app-level usage
export const DashboardProvider = ({ children }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
}; 