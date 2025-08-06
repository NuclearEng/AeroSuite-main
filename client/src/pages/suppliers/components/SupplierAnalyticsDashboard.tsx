import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  Chip,
  IconButton,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip } from
'@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  LocalShipping as LocalShippingIcon,
  CompareArrows as CompareArrowsIcon,
  Print as PrintIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon } from
'@mui/icons-material';
import { useSupplierAnalytics } from '../hooks/useSupplierAnalytics';
import SupplierPerformanceCharts from './SupplierPerformanceCharts';
import SupplierComparisonTool from './SupplierComparisonTool';
import ErrorHandler from '../../../components/common/ErrorHandler';

// TabPanel component for tab content
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}>

      {value === index &&
      <Box sx={{ p: 3 }}>
          {children}
        </Box>
      }
    </div>);

}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`
  };
}

interface SupplierAnalyticsDashboardProps {
  supplierId: string;
}

const SupplierAnalyticsDashboard: React.FC<SupplierAnalyticsDashboardProps> = ({ supplierId }) => {
  const { t } = useTranslation();
  // State
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState<'3months' | '6months' | '1year' | '2years'>('6months');
  const [comparisonMode, setComparisonMode] = useState(false);

  // Use the supplier analytics hook
  const {
    analyticsData,
    loading,
    error,
    loadAnalyticsData,
    calculatePerformanceScore,
    getRiskLevel,
    getRecommendedActions
  } = useSupplierAnalytics({
    supplierId,
    period
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle period change
  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value as '3months' | '6months' | '1year' | '2years');
  };

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadAnalyticsData();
  };

  // Handle export
  const handleExport = () => {
    // Implementation for exporting analytics data
    alert('Export functionality will be implemented');
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Calculate performance score
  const performanceScore = useMemo(() => {
    return calculatePerformanceScore();
  }, [calculatePerformanceScore]);

  // Get risk level
  const riskLevel = useMemo(() => {
    return getRiskLevel();
  }, [getRiskLevel]);

  // Get recommended actions
  const recommendedActions = useMemo(() => {
    return getRecommendedActions();
  }, [getRecommendedActions]);

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get trend direction
  const getTrendDirection = (trend: number) => {
    if (trend > 0) return 'up';
    if (trend < 0) return 'down';
    return 'stable';
  };

  // Get trend icon
  const GetTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return null;
    }
  };

  // Render key performance indicators
  const RenderKPIs = () => {
    if (!analyticsData?.metrics) {
      return (
        <Alert severity="info">
          <AlertTitle>{t('common.noData')}</AlertTitle>
          {t('suppliers.analytics.noPerformanceData')}
        </Alert>);

    }

    const { metrics } = analyticsData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {t('suppliers.analytics.overallPerformance')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={performanceScore}
                    size={60}
                    thickness={5}
                    color={
                    performanceScore >= 80 ? 'success' :
                    performanceScore >= 60 ? 'primary' :
                    performanceScore >= 40 ? 'warning' : 'error'
                    } />

                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>

                    <Typography variant="caption" component="div" color="text.secondary">
                      {`${Math.round(performanceScore)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h5">
                    {performanceScore >= 80 ? t('suppliers.analytics.excellent') :
                    performanceScore >= 60 ? t('suppliers.analytics.good') :
                    performanceScore >= 40 ? t('suppliers.analytics.average') : t('suppliers.analytics.poor')}
                  </Typography>
                  {metrics.trend &&
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {GetTrendIcon(getTrendDirection(metrics.trend))}
                      <Typography variant="body2" color={
                    metrics.trend > 0 ? 'success.main' :
                    metrics.trend < 0 ? 'error.main' : 'text.secondary'
                    }>
                        {metrics.trend > 0 ? '+' : ''}{metrics.trend.toFixed(1)}% {t('suppliers.analytics.vsPrevious')}
                      </Typography>
                    </Box>
                  }
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {t('suppliers.analytics.qualityScore')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon color={metrics.quality >= 80 ? 'success' : 'warning'} sx={{ mr: 1 }} />
                  <Typography variant="h5">
                    {metrics.quality.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics.quality}
                  color={metrics.quality >= 80 ? 'success' : 'warning'}
                  sx={{ mt: 1, mb: 1, height: 8, borderRadius: 4 }} />

                {metrics.qualityTrend &&
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {GetTrendIcon(getTrendDirection(metrics.qualityTrend))}
                    <Typography variant="body2" color={
                  metrics.qualityTrend > 0 ? 'success.main' :
                  metrics.qualityTrend < 0 ? 'error.main' : 'text.secondary'
                  }>
                      {metrics.qualityTrend > 0 ? '+' : ''}{metrics.qualityTrend.toFixed(1)}%
                    </Typography>
                  </Box>
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {t('suppliers.analytics.onTimeDelivery')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalShippingIcon color={metrics.delivery >= 80 ? 'success' : 'warning'} sx={{ mr: 1 }} />
                  <Typography variant="h5">
                    {metrics.delivery.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics.delivery}
                  color={metrics.delivery >= 80 ? 'success' : 'warning'}
                  sx={{ mt: 1, mb: 1, height: 8, borderRadius: 4 }} />

                {metrics.deliveryTrend &&
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {GetTrendIcon(getTrendDirection(metrics.deliveryTrend))}
                    <Typography variant="body2" color={
                  metrics.deliveryTrend > 0 ? 'success.main' :
                  metrics.deliveryTrend < 0 ? 'error.main' : 'text.secondary'
                  }>
                      {metrics.deliveryTrend > 0 ? '+' : ''}{metrics.deliveryTrend.toFixed(1)}%
                    </Typography>
                  </Box>
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {t('suppliers.analytics.riskAssessment')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {riskLevel === 'high' ?
                  <WarningIcon color="error" sx={{ mr: 1 }} /> :
                  riskLevel === 'medium' ?
                  <WarningIcon color="warning" sx={{ mr: 1 }} /> :

                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  }
                  <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
                    {t(`suppliers.analytics.risk.${riskLevel}`)}
                  </Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={t(`suppliers.analytics.risk.${riskLevel}`)}
                    color={getRiskLevelColor(riskLevel) as any}
                    size="small"
                    sx={{ mr: 1, textTransform: 'capitalize' }} />

                  {analyticsData.riskAssessment?.factors?.length > 0 &&
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('suppliers.analytics.riskFactorsIdentified', { count: analyticsData.riskAssessment.factors.length })}
                    </Typography>
                  }
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>);

  };

  // Render recommended actions
  const RenderRecommendedActions = () => {
    if (!recommendedActions || recommendedActions.length === 0) {
      return null;
    }

    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Recommended Actions" />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {recommendedActions.map((action, index) =>
            <Grid item xs={12} md={6} key={index}>
                <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>

                  <Typography variant="body1">{action}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>);

  };

  // Render risk factors
  const RenderRiskFactors = () => {
    if (!analyticsData?.riskAssessment?.factors || analyticsData.riskAssessment.factors.length === 0) {
      return null;
    }

    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Risk Factors" />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Risk Factor</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Impact</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData.riskAssessment.factors.map((factor: {name: string;level: string;impact: string;description: string;}, index: number) =>
              <TableRow key={index}>
                  <TableCell>{factor.name}</TableCell>
                  <TableCell>
                    <Chip
                    label={factor.level}
                    color={getRiskLevelColor(factor.level) as any}
                    size="small"
                    sx={{ textTransform: 'capitalize' }} />

                  </TableCell>
                  <TableCell>
                    <Chip
                    label={factor.impact}
                    color={getRiskLevelColor(factor.impact) as any}
                    size="small"
                    sx={{ textTransform: 'capitalize' }} />

                  </TableCell>
                  <TableCell>{factor.description}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>);

  };

  // Main render
  return (
    <ErrorHandler context={t('suppliers.analytics.dashboard')}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              {t('suppliers.analytics.dashboard')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('suppliers.analytics.description')}
            </Typography>
          </Box>
          <Box>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 1 }}>
              <InputLabel id="period-select-label">{t('common.period')}</InputLabel>
              <Select
                labelId="period-select-label"
                id="period-select"
                value={period}
                onChange={handlePeriodChange}
                label={t('common.period')}>

                <MenuItem value="3months">{t('suppliers.analytics.period.3months')}</MenuItem>
                <MenuItem value="6months">{t('suppliers.analytics.period.6months')}</MenuItem>
                <MenuItem value="1year">{t('suppliers.analytics.period.1year')}</MenuItem>
                <MenuItem value="2years">{t('suppliers.analytics.period.2years')}</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title={t('common.refresh')}>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.export')}>
              <IconButton onClick={handleExport}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.print')}>
              <IconButton onClick={handlePrint}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {loading ?
        <Box sx={{ width: '100%', p: 3 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              {t('suppliers.analytics.loading')}
            </Typography>
          </Box> :
        error ?
        <Box sx={{ p: 3 }}>
            <Alert severity="error">
              <AlertTitle>{t('common.error')}</AlertTitle>
              {error}
            </Alert>
          </Box> :

        <>
            <Box sx={{ p: 3 }}>
              {RenderKPIs()}
              {RenderRecommendedActions()}
              {RenderRiskFactors()}
            </Box>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label={t('suppliers.analytics.tabs.label')}
              variant="scrollable"
              scrollButtons="auto">

                <Tab label={t('suppliers.analytics.tabs.performanceTrends')} icon={<TimelineIcon />} iconPosition="start" {...a11yProps(0)} />
                <Tab label={t('suppliers.analytics.tabs.detailedMetrics')} icon={<AssessmentIcon />} iconPosition="start" {...a11yProps(1)} />
                <Tab label={t('suppliers.analytics.tabs.supplierComparison')} icon={<CompareArrowsIcon />} iconPosition="start" {...a11yProps(2)} />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <SupplierPerformanceCharts supplierId={supplierId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                {t('suppliers.analytics.detailedMetrics')}
              </Typography>
              {analyticsData ?
            <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title={t('suppliers.analytics.qualityMetrics')} />
                      <Divider />
                      <CardContent>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.passRate')}</TableCell>
                                <TableCell align="right">{analyticsData.metrics?.quality.toFixed(1)}%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.defectRate')}</TableCell>
                                <TableCell align="right">{(100 - analyticsData.metrics?.quality).toFixed(1)}%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.inspectionsPassed')}</TableCell>
                                <TableCell align="right">{analyticsData.qualityDetails?.inspectionsPassed || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.totalInspections')}</TableCell>
                                <TableCell align="right">{analyticsData.qualityDetails?.inspectionsTotal || 0}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title={t('suppliers.analytics.deliveryMetrics')} />
                      <Divider />
                      <CardContent>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.onTimeDeliveryRate')}</TableCell>
                                <TableCell align="right">{analyticsData.metrics?.delivery.toFixed(1)}%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.lateDeliveryRate')}</TableCell>
                                <TableCell align="right">{(100 - analyticsData.metrics?.delivery).toFixed(1)}%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.onTimeDeliveries')}</TableCell>
                                <TableCell align="right">{analyticsData.deliveryDetails?.deliveriesOnTime || 0}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.totalDeliveries')}</TableCell>
                                <TableCell align="right">{analyticsData.deliveryDetails?.deliveriesTotal || 0}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title={t('suppliers.analytics.responsivenessMetrics')} />
                      <Divider />
                      <CardContent>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.responsivenessScore')}</TableCell>
                                <TableCell align="right">{analyticsData.metrics?.responsiveness.toFixed(1)}%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.averageResponseTime')}</TableCell>
                                <TableCell align="right">{analyticsData.responsivenessDetails?.responseTime || 0} hours</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.issueResolutionTime')}</TableCell>
                                <TableCell align="right">{analyticsData.responsivenessDetails?.resolutionTime || 0} days</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardHeader title={t('suppliers.analytics.costMetrics')} />
                      <Divider />
                      <CardContent>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.costEfficiencyScore')}</TableCell>
                                <TableCell align="right">{analyticsData.metrics?.cost.toFixed(1)}%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.priceVariance')}</TableCell>
                                <TableCell align="right">{analyticsData.costDetails?.priceVariance || 0}%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell component="th" scope="row">{t('suppliers.analytics.costSavings')}</TableCell>
                                <TableCell align="right">${analyticsData.costDetails?.costSavings || 0}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid> :

            <Alert severity="info">
                  <AlertTitle>{t('common.noData')}</AlertTitle>
                  {t('suppliers.analytics.noDetailedMetrics')}
                </Alert>
            }
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <SupplierComparisonTool currentSupplierId={supplierId} />
            </TabPanel>
          </>
        }
      </Paper>
    </ErrorHandler>);

};

export default SupplierAnalyticsDashboard;