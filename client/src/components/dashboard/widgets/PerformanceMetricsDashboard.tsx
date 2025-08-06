import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Divider,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  Badge,
  Alert,
  Chip,
  alpha } from
'@mui/material';
import {
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon } from
'@mui/icons-material';
import { Link } from 'react-router-dom';
import DataVisualization from '../../common/DataVisualization';
import metricsService from '../../../services/metricsService';

/**
 * Performance Metrics Dashboard Component
 * 
 * Displays application performance metrics using visualizations and cards.
 * Can be used in simplified mode for the dashboard or full mode for the monitoring page.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.simplified - Whether to show a simplified version of the dashboard
 */
const PerformanceMetricsDashboard = ({ simplified = false }) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [formattedMetrics, setFormattedMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Function to fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await metricsService.getAllMetrics();
      setMetrics(data);
      setFormattedMetrics(metricsService.formatMetricsForVisualization(data));
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load performance metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    fetchMetrics();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [fetchMetrics]);

  // Handle auto-refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMetrics();
      }, 10000); // Refresh every 10 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, fetchMetrics]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchMetrics();
  };

  // Handle auto-refresh toggle
  const handleAutoRefreshToggle = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Render metric cards for simplified view
  const RenderSimplifiedMetricCards = () => {
    if (!metrics) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: metrics.cpu.usage > 80 ?
              alpha(theme.palette.error.main, 0.1) :
              metrics.cpu.usage > 60 ?
              alpha(theme.palette.warning.main, 0.1) :
              alpha(theme.palette.success.main, 0.1)
            }}>

            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">CPU Usage</Typography>
                <Typography variant="h4" component="div">
                  {metrics.cpu.usage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {metrics.cpu.cores} Cores
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: metrics.cpu.usage > 80 ?
                  alpha(theme.palette.error.main, 0.2) :
                  metrics.cpu.usage > 60 ?
                  alpha(theme.palette.warning.main, 0.2) :
                  alpha(theme.palette.success.main, 0.2)
                }}>

                <SpeedIcon
                  color={
                  metrics.cpu.usage > 80 ?
                  "error" :
                  metrics.cpu.usage > 60 ?
                  "warning" :
                  "success"
                  } />

              </Box>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: metrics.memory.usedPercent > 80 ?
              alpha(theme.palette.error.main, 0.1) :
              metrics.memory.usedPercent > 60 ?
              alpha(theme.palette.warning.main, 0.1) :
              alpha(theme.palette.success.main, 0.1)
            }}>

            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Memory Usage</Typography>
                <Typography variant="h4" component="div">
                  {metrics.memory.usedPercent.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {(metrics.memory.used / 1024).toFixed(1)} GB / {(metrics.memory.total / 1024).toFixed(1)} GB
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: metrics.memory.usedPercent > 80 ?
                  alpha(theme.palette.error.main, 0.2) :
                  metrics.memory.usedPercent > 60 ?
                  alpha(theme.palette.warning.main, 0.2) :
                  alpha(theme.palette.success.main, 0.2)
                }}>

                <MemoryIcon
                  color={
                  metrics.memory.usedPercent > 80 ?
                  "error" :
                  metrics.memory.usedPercent > 60 ?
                  "warning" :
                  "success"
                  } />

              </Box>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Request Rate</Typography>
                <Typography variant="h4" component="div">
                  {metrics.requests.perSecond.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Requests per second
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.2)
                }}>

                <TimelineIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Avg Response Time</Typography>
                <Typography variant="h4" component="div">
                  {metrics.responses.responseTime.avg.toFixed(0)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  milliseconds
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.info.main, 0.2)
                }}>

                <ScheduleIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>);

  };

  // Render metric cards
  const RenderMetricCards = () => {
    if (!metrics) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: metrics.cpu.usage > 80 ?
              alpha(theme.palette.error.main, 0.1) :
              metrics.cpu.usage > 60 ?
              alpha(theme.palette.warning.main, 0.1) :
              alpha(theme.palette.success.main, 0.1)
            }}>

            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">CPU Usage</Typography>
                <Typography variant="h4" component="div">
                  {metrics.cpu.usage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {metrics.cpu.cores} Cores
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: metrics.cpu.usage > 80 ?
                  alpha(theme.palette.error.main, 0.2) :
                  metrics.cpu.usage > 60 ?
                  alpha(theme.palette.warning.main, 0.2) :
                  alpha(theme.palette.success.main, 0.2)
                }}>

                <SpeedIcon
                  color={
                  metrics.cpu.usage > 80 ?
                  "error" :
                  metrics.cpu.usage > 60 ?
                  "warning" :
                  "success"
                  } />

              </Box>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: metrics.memory.usedPercent > 80 ?
              alpha(theme.palette.error.main, 0.1) :
              metrics.memory.usedPercent > 60 ?
              alpha(theme.palette.warning.main, 0.1) :
              alpha(theme.palette.success.main, 0.1)
            }}>

            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Memory Usage</Typography>
                <Typography variant="h4" component="div">
                  {metrics.memory.usedPercent.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {(metrics.memory.used / 1024).toFixed(1)} GB / {(metrics.memory.total / 1024).toFixed(1)} GB
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: metrics.memory.usedPercent > 80 ?
                  alpha(theme.palette.error.main, 0.2) :
                  metrics.memory.usedPercent > 60 ?
                  alpha(theme.palette.warning.main, 0.2) :
                  alpha(theme.palette.success.main, 0.2)
                }}>

                <MemoryIcon
                  color={
                  metrics.memory.usedPercent > 80 ?
                  "error" :
                  metrics.memory.usedPercent > 60 ?
                  "warning" :
                  "success"
                  } />

              </Box>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Request Rate</Typography>
                <Typography variant="h4" component="div">
                  {metrics.requests.perSecond.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Requests per second
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.2)
                }}>

                <TimelineIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Avg Response Time</Typography>
                <Typography variant="h4" component="div">
                  {metrics.responses.responseTime.avg.toFixed(0)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  milliseconds
                </Typography>
              </Box>
              <Box
                sx={{
                  borderRadius: '50%',
                  width: 50,
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.info.main, 0.2)
                }}>

                <ScheduleIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>);

  };

  // Render simplified dashboard
  const RenderSimplifiedDashboard = () => {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">System Performance Overview</Typography>
          <Box>
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading}>

              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        {loading &&
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        }
        
        {error &&
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        }
        
        {!loading && !error && metrics && RenderSimplifiedMetricCards()}
        
        {!loading && !error && formattedMetrics &&
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Response Time Trends</Typography>
                <DataVisualization
                type="line"
                data={formattedMetrics.requests.performance}
                height={200}
                options={{
                  showLegend: false,
                  showGrid: true
                }} />

              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Request Distribution</Typography>
                <DataVisualization
                type="pie"
                data={formattedMetrics.requests.statusCodes}
                height={200}
                options={{
                  showLegend: true,
                  showGrid: false
                }} />

              </Paper>
            </Grid>
          </Grid>
        }
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            component={Link}
            to="/monitoring/performance"
            endIcon={<ArrowForwardIcon />}>

            View Detailed Metrics
          </Button>
        </Box>
      </Paper>);

  };

  // Render system metrics tab
  const RenderSystemMetricsDashboard = () => {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">System Performance</Typography>
          <Box>
            <Button
              size="small"
              variant={autoRefresh ? "contained" : "outlined"}
              color={autoRefresh ? "primary" : "inherit"}
              onClick={handleAutoRefreshToggle}
              sx={{ mr: 1 }}>

              {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
            </Button>
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading}>

              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        {loading &&
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        }
        
        {error &&
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        }
        
        {!loading && !error && metrics && RenderMetricCards()}
        
        {!loading && !error && formattedMetrics &&
        <Box sx={{ mt: 4 }}>
            <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            aria-label="metrics tabs">

              <Tab label="System" {...a11yProps(0)} />
              <Tab label="Requests" {...a11yProps(1)} />
              <Tab label="Errors" {...a11yProps(2)} />
              <Tab label="Database" {...a11yProps(3)} />
            </Tabs>
            
            <TabPanel value={activeTab} index={0}>
              {RenderSystemMetricsTab()}
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              {RenderRequestMetricsTab()}
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              {RenderErrorMetricsTab()}
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              {RenderDatabaseMetricsTab()}
            </TabPanel>
          </Box>
        }
      </Paper>);

  };

  // Tab panel component
  function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`metrics-tabpanel-${index}`}
        aria-labelledby={`metrics-tab-${index}`}
        {...other}>

        {value === index &&
        <Box sx={{ pt: 3 }}>
            {children}
          </Box>
        }
      </div>);

  }

  // Helper function for tab accessibility
  function a11yProps(index) {
    return {
      id: `metrics-tab-${index}`,
      'aria-controls': `metrics-tabpanel-${index}`
    };
  }

  // Render system metrics tab
  const RenderSystemMetricsTab = () => {
    if (!formattedMetrics) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>CPU Usage</Typography>
            <DataVisualization
              type="bar"
              data={formattedMetrics.system.cpu}
              height={250}
              options={{
                showLegend: false,
                showGrid: true
              }} />

          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Memory Usage</Typography>
            <DataVisualization
              type="pie"
              data={formattedMetrics.system.memory}
              height={250}
              options={{
                showLegend: true,
                showGrid: false
              }} />

          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Disk Usage</Typography>
            <DataVisualization
              type="pie"
              data={formattedMetrics.system.disk}
              height={250}
              options={{
                showLegend: true,
                showGrid: false
              }} />

          </Paper>
        </Grid>
      </Grid>);

  };

  // Render request metrics tab
  const RenderRequestMetricsTab = () => {
    if (!formattedMetrics) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Response Status Codes</Typography>
            <DataVisualization
              type="bar"
              data={formattedMetrics.requests.statusCodes}
              height={250}
              options={{
                showLegend: false,
                showGrid: true
              }} />

          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Top Endpoints</Typography>
            <DataVisualization
              type="bar"
              data={formattedMetrics.requests.endpoints}
              height={250}
              options={{
                showLegend: false,
                showGrid: true,
                horizontal: true
              }} />

          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Response Times</Typography>
            <DataVisualization
              type="bar"
              data={formattedMetrics.requests.performance}
              height={250}
              options={{
                showLegend: false,
                showGrid: true
              }} />

          </Paper>
        </Grid>
      </Grid>);

  };

  // Render error metrics tab
  const RenderErrorMetricsTab = () => {
    if (!formattedMetrics) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Errors by Type</Typography>
            <DataVisualization
              type="pie"
              data={formattedMetrics.errors}
              height={250}
              options={{
                showLegend: true,
                showGrid: false
              }} />

          </Paper>
        </Grid>
      </Grid>);

  };

  // Render database metrics tab
  const RenderDatabaseMetricsTab = () => {
    if (!formattedMetrics) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Query Times</Typography>
            <DataVisualization
              type="bar"
              data={formattedMetrics.database.performance}
              height={250}
              options={{
                showLegend: false,
                showGrid: true
              }} />

          </Paper>
        </Grid>
      </Grid>);

  };

  return simplified ? RenderSimplifiedDashboard() : RenderSystemMetricsDashboard();
};

export default PerformanceMetricsDashboard;