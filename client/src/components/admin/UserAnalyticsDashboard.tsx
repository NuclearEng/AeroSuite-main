import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapVert as SwapVertIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  PieController,
  LineController,
  BarController
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { formatLocalizedDate } from '../../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  PieController,
  LineController,
  BarController
);

// Mock data for user analytics
const mockUserAnalytics = {
  totalUsers: 1245,
  activeUsers: {
    daily: 432,
    weekly: 876,
    monthly: 1032
  },
  pageViews: {
    total: 15678,
    unique: 8765
  },
  topPages: [
    { path: '/dashboard', views: 3245 },
    { path: '/suppliers', views: 1876 },
    { path: '/customers', views: 1543 },
    { path: '/inspections', views: 1432 },
    { path: '/reports', views: 987 }
  ],
  userEngagement: {
    avgSessionDuration: 340, // seconds
    avgPagesPerSession: 4.5,
    bounceRate: 0.32
  },
  userRetention: {
    daily: 0.45,
    weekly: 0.65,
    monthly: 0.78
  },
  userGrowth: [
    { date: '2023-01-01', users: 980 },
    { date: '2023-02-01', users: 1050 },
    { date: '2023-03-01', users: 1120 },
    { date: '2023-04-01', users: 1180 },
    { date: '2023-05-01', users: 1245 }
  ],
  eventsByCategory: {
    page_view: 8765,
    interaction: 6543,
    form: 3456,
    feature_usage: 2345,
    conversion: 1234,
    error: 543
  }
};

// Mock data for event analytics
const mockEventAnalytics = {
  totalEvents: 8765,
  eventsByAction: {
    click: 3456,
    view: 2345,
    submit: 1234,
    search: 876,
    filter: 654,
    sort: 200
  },
  eventTrend: [
    { date: '2023-07-01', count: 245 },
    { date: '2023-07-02', count: 256 },
    { date: '2023-07-03', count: 234 },
    { date: '2023-07-04', count: 267 },
    { date: '2023-07-05', count: 278 },
    { date: '2023-07-06', count: 289 },
    { date: '2023-07-07', count: 301 }
  ],
  topLabels: [
    { label: 'supplier-list', count: 543 },
    { label: 'customer-form', count: 432 },
    { label: 'inspection-details', count: 345 },
    { label: 'dashboard-widget', count: 234 },
    { label: 'report-export', count: 123 }
  ]
};

// Mock data for funnel analytics
const mockFunnelAnalytics = {
  supplierCreation: {
    name: 'Supplier Creation Funnel',
    steps: [
      { name: 'View Supplier List', count: 1200, dropoff: 0 },
      { name: 'Click Create Supplier', count: 450, dropoff: 0.625 },
      { name: 'Fill Supplier Form', count: 380, dropoff: 0.156 },
      { name: 'Submit Supplier Form', count: 320, dropoff: 0.158 },
      { name: 'Supplier Created', count: 300, dropoff: 0.063 }
    ],
    conversionRate: 0.25,
    averageTimeToComplete: 340 // seconds
  },
  inspectionWorkflow: {
    name: 'Inspection Workflow Funnel',
    steps: [
      { name: 'View Inspections', count: 800, dropoff: 0 },
      { name: 'Schedule Inspection', count: 350, dropoff: 0.563 },
      { name: 'Assign Inspector', count: 320, dropoff: 0.086 },
      { name: 'Conduct Inspection', count: 280, dropoff: 0.125 },
      { name: 'Complete Report', count: 250, dropoff: 0.107 }
    ],
    conversionRate: 0.313,
    averageTimeToComplete: 1200 // seconds
  }
};

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// Format time in seconds to human-readable format
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hr ${remainingMinutes} min`;
  }
};

// Format percentage
const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

// User Analytics Dashboard Component
const UserAnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('7d');
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [funnelId, setFunnelId] = useState<string>('supplierCreation');
  
  // Handle time period change
  const handlePeriodChange = (event: SelectChangeEvent) => {
    setTimePeriod(event.target.value);
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  
  // Handle funnel change
  const handleFunnelChange = (event: SelectChangeEvent) => {
    setFunnelId(event.target.value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    // In a real app, this would fetch fresh data
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  
  // Handle export
  const handleExport = () => {
    // Implementation for exporting analytics data
    alert(t('userAnalytics.exportNotImplemented'));
  };
  
  // Prepare chart data for user growth
  const userGrowthChartData = {
    labels: mockUserAnalytics.userGrowth.map(item => formatLocalizedDate(item.date)),
    datasets: [
      {
        label: t('userAnalytics.users'),
        data: mockUserAnalytics.userGrowth.map(item => item.users),
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };
  
  // Prepare chart data for events by category
  const eventsByCategoryChartData = {
    labels: Object.keys(mockUserAnalytics.eventsByCategory).map(key => 
      t(`userAnalytics.eventCategories.${key}`)
    ),
    datasets: [
      {
        label: t('userAnalytics.eventCount'),
        data: Object.values(mockUserAnalytics.eventsByCategory),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare chart data for event trend
  const eventTrendChartData = {
    labels: mockEventAnalytics.eventTrend.map(item => formatLocalizedDate(item.date)),
    datasets: [
      {
        label: t('userAnalytics.events'),
        data: mockEventAnalytics.eventTrend.map(item => item.count),
        fill: false,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1
      }
    ]
  };
  
  // Prepare chart data for events by action
  const eventsByActionChartData = {
    labels: Object.keys(mockEventAnalytics.eventsByAction),
    datasets: [
      {
        label: t('userAnalytics.eventCount'),
        data: Object.values(mockEventAnalytics.eventsByAction),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  };
  
  // Get current funnel data
  const currentFunnel = mockFunnelAnalytics[funnelId as keyof typeof mockFunnelAnalytics];
  
  // Prepare chart data for funnel
  const funnelChartData = {
    labels: currentFunnel.steps.map(step => step.name),
    datasets: [
      {
        label: t('userAnalytics.users'),
        data: currentFunnel.steps.map(step => step.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }
    ]
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>{t('common.error')}</AlertTitle>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          {t('userAnalytics.title')}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-period-label">{t('userAnalytics.period')}</InputLabel>
            <Select
              labelId="time-period-label"
              id="time-period-select"
              value={timePeriod}
              label={t('userAnalytics.period')}
              onChange={handlePeriodChange}
            >
              <MenuItem value="24h">{t('userAnalytics.last24Hours')}</MenuItem>
              <MenuItem value="7d">{t('userAnalytics.last7Days')}</MenuItem>
              <MenuItem value="30d">{t('userAnalytics.last30Days')}</MenuItem>
              <MenuItem value="90d">{t('userAnalytics.last90Days')}</MenuItem>
              <MenuItem value="all">{t('userAnalytics.allTime')}</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title={t('common.refresh')}>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('common.export')}>
            <IconButton onClick={handleExport} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {t('userAnalytics.totalUsers')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h4" component="div">
                  {mockUserAnalytics.totalUsers.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {t('userAnalytics.activeUsers')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h4" component="div">
                  {mockUserAnalytics.activeUsers.daily.toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                {t('userAnalytics.daily')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {t('userAnalytics.pageViews')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VisibilityIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h4" component="div">
                  {mockUserAnalytics.pageViews.total.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {t('userAnalytics.userRetention')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SwapVertIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h4" component="div">
                  {formatPercentage(mockUserAnalytics.userRetention.monthly)}
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                {t('userAnalytics.monthly')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label={t('userAnalytics.tabs.overview')} />
          <Tab label={t('userAnalytics.tabs.events')} />
          <Tab label={t('userAnalytics.tabs.funnels')} />
        </Tabs>
      </Box>
      
      {/* Overview Tab */}
      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={3}>
          {/* User Growth Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title={t('userAnalytics.userGrowth')} />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Line data={userGrowthChartData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Events by Category Chart */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title={t('userAnalytics.eventsByCategory')} />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Pie data={eventsByCategoryChartData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* User Engagement */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title={t('userAnalytics.userEngagement')} />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" component="div">
                        {formatTime(mockUserAnalytics.userEngagement.avgSessionDuration)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {t('userAnalytics.avgSessionDuration')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" component="div">
                        {mockUserAnalytics.userEngagement.avgPagesPerSession.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {t('userAnalytics.avgPagesPerSession')}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" component="div">
                        {formatPercentage(mockUserAnalytics.userEngagement.bounceRate)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {t('userAnalytics.bounceRate')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Top Pages */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title={t('userAnalytics.topPages')} />
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('userAnalytics.page')}</TableCell>
                      <TableCell align="right">{t('userAnalytics.views')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockUserAnalytics.topPages.map((page) => (
                      <TableRow key={page.path} hover>
                        <TableCell>{page.path}</TableCell>
                        <TableCell align="right">{page.views.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Events Tab */}
      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={3}>
          {/* Event Trend Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title={t('userAnalytics.eventTrend')} />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Line data={eventTrendChartData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Events by Action Chart */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title={t('userAnalytics.eventsByAction')} />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={eventsByActionChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      indexAxis: 'y' as const,
                      scales: {
                        x: {
                          beginAtZero: true
                        }
                      }
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Top Event Labels */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title={t('userAnalytics.topEventLabels')} />
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('userAnalytics.label')}</TableCell>
                      <TableCell align="right">{t('userAnalytics.count')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockEventAnalytics.topLabels.map((item) => (
                      <TableRow key={item.label} hover>
                        <TableCell>{item.label}</TableCell>
                        <TableCell align="right">{item.count.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Funnels Tab */}
      <TabPanel value={tabIndex} index={2}>
        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="funnel-label">{t('userAnalytics.selectFunnel')}</InputLabel>
            <Select
              labelId="funnel-label"
              id="funnel-select"
              value={funnelId}
              label={t('userAnalytics.selectFunnel')}
              onChange={handleFunnelChange}
            >
              <MenuItem value="supplierCreation">{t('userAnalytics.funnels.supplierCreation')}</MenuItem>
              <MenuItem value="inspectionWorkflow">{t('userAnalytics.funnels.inspectionWorkflow')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Grid container spacing={3}>
          {/* Funnel Chart */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title={currentFunnel.name} 
                subheader={`${t('userAnalytics.conversionRate')}: ${formatPercentage(currentFunnel.conversionRate)} | ${t('userAnalytics.avgTimeToComplete')}: ${formatTime(currentFunnel.averageTimeToComplete)}`}
              />
              <Divider />
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <Bar 
                    data={funnelChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Funnel Steps */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title={t('userAnalytics.funnelSteps')} />
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('userAnalytics.step')}</TableCell>
                      <TableCell align="right">{t('userAnalytics.users')}</TableCell>
                      <TableCell align="right">{t('userAnalytics.dropoff')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentFunnel.steps.map((step, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{step.name}</TableCell>
                        <TableCell align="right">{step.count.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {index === 0 ? '-' : formatPercentage(step.dropoff)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default UserAnalyticsDashboard; 