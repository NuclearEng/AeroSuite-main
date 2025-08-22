import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Button } from
'@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import performanceMonitoringService, { initPerformanceMonitoring } from '../../services/performanceMonitoring.service';
import PerformanceBudgetsDashboard from '../../components/monitoring/PerformanceBudgetsDashboard';
import PerformanceRegressionsDashboard from '../../components/monitoring/PerformanceRegressionsDashboard';

// Define tab interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metrics-tabpanel-${index}`}
      aria-labelledby={`metrics-tab-${index}`}
      {...other}
      style={{ width: '100%' }}>

      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>);

}

// Helper function for tab accessibility
function a11yProps(index: number) {
  return {
    id: `metrics-tab-${index}`,
    'aria-controls': `metrics-tabpanel-${index}`
  };
}

// Main component
const PerformanceMetricsDashboard: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [loading, setLoading] = useState<any>(true);
  const [error, setError] = useState<any>(null);
  const [tabIndex, setTabIndex] = useState<any>(0);
  const [metrics, setMetrics] = useState<any>({});
  const [baselineMetrics, setBaselineMetrics] = useState<any>({});
  const [historicalData, setHistoricalData] = useState<any>({
    dates: [],
    metrics: {}
  });

  // Fetch performance metrics
  const fetchPerformanceMetrics = async () => {
    setLoading(true);
    try {
      // In a real implementation, we would fetch from the API
      // For now, we'll use mock data
      const response = await performanceMonitoringService.getPerformanceMetrics('7d');

      // Process the metrics
      setMetrics(response.currentMetrics || {});
      setBaselineMetrics(response.baselineMetrics || {});
      setHistoricalData(response.historicalData || { dates: [], metrics: {} });

      setError(null);
    } catch (_err) {
      console.error("Error:", error);
      setError('Failed to load performance metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize performance monitoring
  useEffect(() => {
    // Initialize performance monitoring
    initPerformanceMonitoring();

    // Fetch initial metrics
    fetchPerformanceMetrics();
  }, []);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Render loading state
  if (loading && !metrics.firstContentfulPaint) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress />
        </Box>
      </Container>);

  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('performanceMetrics.title')}
          </Typography>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb">

            <Link component={RouterLink} color="inherit" to="/">
              {t('navigation.dashboard')}
            </Link>
            <Link component={RouterLink} color="inherit" to="/monitoring">
              {t('navigation.monitoring')}
            </Link>
            <Typography color="text.primary">{t('performanceMetrics.title')}</Typography>
          </Breadcrumbs>
        </Box>
        
        {error &&
        <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            <Button
            color="inherit"
            size="small"
            onClick={fetchPerformanceMetrics}
            sx={{ ml: 2 }}>

              {t('common.retry')}
            </Button>
          </Alert>
        }
        
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              aria-label="performance metrics tabs"
              variant="scrollable"
              scrollButtons="auto">

              <Tab label={t('performanceMetrics.tabs.overview')} {...a11yProps(0)} />
              <Tab label={t('performanceMetrics.tabs.budgets')} {...a11yProps(1)} />
              <Tab label={t('performanceMetrics.tabs.regressions')} {...a11yProps(2)} />
              <Tab label={t('performanceMetrics.tabs.resources')} {...a11yProps(3)} />
              <Tab label={t('performanceMetrics.tabs.userExperience')} {...a11yProps(4)} />
            </Tabs>
          </Box>
          
          
          <TabPanel value={tabIndex} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <PerformanceBudgetsDashboard
                  metrics={metrics}
                  onRefresh={fetchPerformanceMetrics} />

              </Grid>
              <Grid item xs={12} md={6}>
                <PerformanceRegressionsDashboard
                  currentMetrics={metrics}
                  baselineMetrics={baselineMetrics}
                  historicalData={historicalData}
                  onRefresh={fetchPerformanceMetrics} />

              </Grid>
            </Grid>
          </TabPanel>
          
          
          <TabPanel value={tabIndex} index={1}>
            <PerformanceBudgetsDashboard
              metrics={metrics}
              onRefresh={fetchPerformanceMetrics} />

          </TabPanel>
          
          
          <TabPanel value={tabIndex} index={2}>
            <PerformanceRegressionsDashboard
              currentMetrics={metrics}
              baselineMetrics={baselineMetrics}
              historicalData={historicalData}
              onRefresh={fetchPerformanceMetrics} />

          </TabPanel>
          
          
          <TabPanel value={tabIndex} index={3}>
            <Typography variant="h6" gutterBottom>
              {t('performanceMetrics.resourceMetrics')}
            </Typography>
            <Typography>
              {t('performanceMetrics.resourceMetricsDescription')}
            </Typography>
            
          </TabPanel>
          
          
          <TabPanel value={tabIndex} index={4}>
            <Typography variant="h6" gutterBottom>
              {t('performanceMetrics.userExperienceMetrics')}
            </Typography>
            <Typography>
              {t('performanceMetrics.userExperienceMetricsDescription')}
            </Typography>
            
          </TabPanel>
        </Paper>
      </Box>
    </Container>);

};

export default PerformanceMetricsDashboard;