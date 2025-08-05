import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Paper, 
  useTheme, 
  alpha,
  Fade,
  Grow,
  Chip,
  Avatar,
  Button,
  Stack,
  LinearProgress,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import InsightsIcon from '@mui/icons-material/Insights';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';

import StatCard from '../../components/dashboard/StatCard';
import DashboardSyncStatus from '../../components/dashboard/DashboardSyncStatus';
import useResponsive from '../../hooks/useResponsive';
import useDashboardSync from '../../hooks/useDashboardSync';
import { useAppSelector } from '../../redux/store';
import DashboardCustomization from '../../components/dashboard/DashboardCustomization';
import CustomWidgetManager from '../../components/dashboard/CustomWidgetManager';
import DashboardWidget from '../../components/dashboard/DashboardWidget';
import { getWidget } from '../../components/dashboard/widgets/WidgetRegistry';
import { exportToCSV, exportToExcel, exportToPDF, exportViaApi } from '../../utils/exportUtils';
import QualityMetricsWidget from '../../components/dashboard/widgets/QualityMetricsWidget';

// Sample data for inspections
const upcomingInspections = [
  { id: 1, supplier: 'Alpha Industries', date: '2023-06-15', status: 'scheduled', type: 'First Article' },
  { id: 2, supplier: 'Beta Manufacturing', date: '2023-06-16', status: 'scheduled', type: 'Routine' },
  { id: 3, supplier: 'Gamma Electronics', date: '2023-06-18', status: 'scheduled', type: 'Final' },
];

// Sample quality data
const qualityBySupplier = [
  { supplier: 'Alpha Industries', score: 92, change: 3 },
  { supplier: 'Beta Manufacturing', score: 87, change: -2 },
  { supplier: 'Gamma Electronics', score: 95, change: 1 },
  { supplier: 'Delta Systems', score: 78, change: -5 },
];

// Sample export data (key metrics)
const exportData = [
  { Metric: 'Total Inspections', Value: '1,243' },
  { Metric: 'Completed This Month', Value: '87' },
  { Metric: 'Active Suppliers', Value: '42' },
  { Metric: 'Quality Index', Value: '94.2%' },
];

// Add types for widgets and config
// You may want to refine these types based on your actual widget/config structure
export type WidgetConfig = {
  id: string;
  size: string;
  position: number;
  visible: boolean;
  [key: string]: any;
};
export type DashboardConfig = {
  columnCount: number;
  compactView: boolean;
  showAnimations: boolean;
  refreshInterval: number;
  [key: string]: any;
};

export type DashboardProps = {
  widgets?: Record<string, WidgetConfig>;
  layout?: DashboardConfig;
};

const Dashboard: React.FC<DashboardProps> = ({ widgets: widgetsProp, layout: layoutProp }) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const open = Boolean(anchorEl);
  // Use props if provided, otherwise fallback to Redux state
  const reduxDashboard = useAppSelector(state => state.dashboard);
  const widgets = widgetsProp ?? reduxDashboard.widgets;
  const layout = layoutProp ?? reduxDashboard.layout;
  const { loadFromServer, saveToServer } = useDashboardSync();
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Customization drawer handlers
  const handleOpenCustomization = () => {
    setCustomizationOpen(true);
  };

  const handleCloseCustomization = () => {
    setCustomizationOpen(false);
  };
  
  // Gather real dashboard data for export
  const exportData = Object.entries(widgets)
    .filter(([, config]) => config.visible)
    .map(([id, config]) => ({
      Widget: id,
      Size: config.size,
      Position: config.position,
      Visible: config.visible ? 'Yes' : 'No',
    }));
  const layoutData = [{
    ColumnCount: layout.columnCount,
    CompactView: layout.compactView ? 'Yes' : 'No',
    ShowAnimations: layout.showAnimations ? 'Yes' : 'No',
    RefreshInterval: layout.refreshInterval + 's',
  }];

  const handleExport = (type: 'csv' | 'excel' | 'pdf' | 'server') => {
    if (type === 'server') {
      // Use server-side export for large datasets
      exportViaApi('excel', 'dashboard', null, 'dashboard-complete');
      handleMenuClose();
      return;
    }
    
    if (type === 'csv') {
      exportToCSV(exportData, 'dashboard-widgets');
      exportToCSV(layoutData, 'dashboard-layout');
    }
    if (type === 'excel') {
      exportToExcel(exportData, 'dashboard-widgets');
      exportToExcel(layoutData, 'dashboard-layout');
    }
    if (type === 'pdf') {
      exportToPDF(exportData, 'dashboard-widgets');
      exportToPDF(layoutData, 'dashboard-layout');
    }
    handleMenuClose();
  };
  
  const renderWidget = (widgetId: string, config: WidgetConfig) => {
    let widgetContent;
    
    switch (widgetId) {
      case 'quality-metrics':
        widgetContent = (
          <QualityMetricsWidget 
            widgetId={widgetId}
            height={config.size === 'small' ? 300 : config.size === 'medium' ? 400 : 500}
            compact={layout.compactView}
          />
        );
        break;
        
      default:
        // Use the dynamic widget registry
        const widgetMeta = getWidget(widgetId);
        if (widgetMeta) {
          const WidgetComponent = widgetMeta.component;
          widgetContent = (
            <WidgetComponent
              widgetId={widgetId}
              height={config.size === 'small' ? 300 : config.size === 'medium' ? 400 : 500}
              compact={layout.compactView}
              {...(widgetMeta.props || {})}
            />
          );
        } else {
          return null;
        }
    }
    
    // Get the widget metadata for the title
    const widgetMeta = getWidget(widgetId);
    const title = widgetMeta?.title || widgetId;
    
    // Return the widget wrapped in the proper layout
    return (
      <Box 
        key={widgetId}
        sx={{ 
          width: { 
            xs: '100%', 
            md: config.size === 'small' ? '33.33%' : 
                 config.size === 'medium' ? '50%' : '100%' 
          }, 
          p: 1.5 
        }}
      >
        <DashboardWidget widgetId={widgetId} title={title}>
          {widgetContent}
        </DashboardWidget>
      </Box>
    );
  };

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ pb: 5 }}>
        {/* Page header */}
        <Box 
          sx={{ 
            mb: 4, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' }
          }}
        >
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here's what's happening with your inspections today.
            </Typography>
          </Box>
          
          <Stack 
            direction="row" 
            spacing={2} 
            sx={{ 
              mt: { xs: 2, sm: 0 },
              '& .MuiButton-root': {
                borderRadius: 2,
                px: 2
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <DashboardSyncStatus showControls={false} />
            </Box>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<SettingsIcon />}
              onClick={handleOpenCustomization}
              aria-label="Customize dashboard"
            >
              Customize
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<BarChartIcon />}
              aria-label="Generate dashboard report"
            >
              Generate Report
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleMenuClick}
              aria-haspopup="true"
              aria-controls="dashboard-export-menu"
              aria-label="Export dashboard"
            >
              Export
            </Button>
            <Menu
              id="dashboard-export-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              MenuListProps={{ 'aria-labelledby': 'export-button' }}
            >
              <MenuItem onClick={() => handleExport('csv')}>
                <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Export as CSV</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExport('excel')}>
                <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Export as Excel</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExport('pdf')}>
                <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Export as PDF</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExport('server')}>
                <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Export Complete Dashboard (Server)</ListItemText>
              </MenuItem>
            </Menu>
          </Stack>
        </Box>
        
        {/* Key metrics section */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            mx: -1.5, 
            mb: 4
          }}
        >
          <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5 }}>
            <StatCard
              title="Total Inspections"
              value="1,243"
              icon={<AssessmentIcon />}
              change={8.5}
              changePeriod="from last month"
              loading={loading}
              color="primary"
              tooltip="Total number of inspections conducted in the system"
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5 }}>
            <StatCard
              title="Completed This Month"
              value="87"
              icon={<TrendingUpIcon />}
              change={12.3}
              changePeriod="from previous month"
              loading={loading}
              color="success"
              tooltip="Number of inspections completed this month"
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5 }}>
            <StatCard
              title="Active Suppliers"
              value="42"
              icon={<BusinessIcon />}
              change={-2.5}
              changePeriod="from last quarter"
              loading={loading}
              color="info"
              tooltip="Number of active suppliers in the system"
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5 }}>
            <StatCard
              title="Quality Index"
              value="94.2%"
              icon={<InsightsIcon />}
              change={3.7}
              changePeriod="year over year"
              loading={loading}
              color="secondary"
              tooltip="Overall quality index based on inspection results"
            />
          </Box>
        </Box>
        
        {/* Dashboard customization drawer */}
        <DashboardCustomization 
          open={customizationOpen} 
          onClose={handleCloseCustomization} 
        />
        
        {/* Main content area */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
          {/* Render widgets from registry based on dashboard state */}
          {Object.entries(widgets)
            .filter(([id, config]) => config.visible)
            .sort(([, a], [, b]) => a.position - b.position)
            .map(([id, config]) => {
              return renderWidget(id, config);
            })}
        </Box>
        
        {/* Custom Widget Manager */}
        <CustomWidgetManager />

        {/* User-facing error UI for empty dashboard */}
        {Object.keys(widgets).length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">No widgets configured</Typography>
            <Typography variant="body2" color="text.secondary">Add widgets to get started with your dashboard.</Typography>
          </Box>
        )}

        {/* User-facing error UI for export with no data */}
        {exportData.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">No data to export</Typography>
            <Typography variant="body2" color="text.secondary">There's no data to export. Please add widgets to your dashboard.</Typography>
          </Box>
        )}

        {/* User-facing error UI for sync conflict */}
        {/* Add sync conflict handling logic here */}
      </Box>
    </Fade>
  );
};

export default Dashboard; 