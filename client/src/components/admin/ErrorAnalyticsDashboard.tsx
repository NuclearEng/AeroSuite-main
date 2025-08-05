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
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon,
  BugReport as BugIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
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
import { formatLocalizedDate, formatLocalizedDateTime } from '../../utils/formatters';

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

// Interface for error data
interface ErrorData {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  browser?: string;
  os?: string;
  device?: string;
  errorType?: string;
  errorSource?: string;
  metadata?: Record<string, any>;
}

// Interface for error analytics data
interface ErrorAnalyticsData {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySource: Record<string, number>;
  errorsByBrowser: Record<string, number>;
  errorsByOs: Record<string, number>;
  errorsByDevice: Record<string, number>;
  errorsByPage: Record<string, number>;
  errorsTrend: {
    labels: string[];
    data: number[];
  };
  recentErrors: ErrorData[];
}

// Mock data for development
const mockErrorAnalyticsData: ErrorAnalyticsData = {
  totalErrors: 156,
  errorsByType: {
    'TypeError': 48,
    'SyntaxError': 12,
    'ReferenceError': 32,
    'NetworkError': 45,
    'Other': 19
  },
  errorsBySource: {
    'React Component': 67,
    'API Call': 45,
    'Event Handler': 23,
    'External Library': 15,
    'Other': 6
  },
  errorsByBrowser: {
    'Chrome': 78,
    'Firefox': 35,
    'Safari': 25,
    'Edge': 15,
    'Other': 3
  },
  errorsByOs: {
    'Windows': 68,
    'macOS': 45,
    'iOS': 23,
    'Android': 15,
    'Linux': 5
  },
  errorsByDevice: {
    'Desktop': 98,
    'Mobile': 48,
    'Tablet': 10
  },
  errorsByPage: {
    '/suppliers': 35,
    '/customers': 28,
    '/inspections': 42,
    '/dashboard': 15,
    '/reports': 22,
    'Other': 14
  },
  errorsTrend: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    data: [12, 19, 15, 25, 22, 30, 33]
  },
  recentErrors: [
    {
      id: '1',
      message: 'Cannot read property \'data\' of undefined',
      url: '/suppliers',
      timestamp: '2023-07-15T10:23:45Z',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      errorType: 'TypeError',
      errorSource: 'React Component',
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop'
    },
    {
      id: '2',
      message: 'Network request failed',
      url: '/customers',
      timestamp: '2023-07-15T09:45:12Z',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      errorType: 'NetworkError',
      errorSource: 'API Call',
      browser: 'Safari',
      os: 'macOS',
      device: 'Desktop'
    },
    {
      id: '3',
      message: 'Expected identifier',
      url: '/inspections',
      timestamp: '2023-07-14T16:30:22Z',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      errorType: 'SyntaxError',
      errorSource: 'External Library',
      browser: 'Safari',
      os: 'iOS',
      device: 'Mobile'
    },
    {
      id: '4',
      message: 'x is not defined',
      url: '/dashboard',
      timestamp: '2023-07-14T14:15:30Z',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      errorType: 'ReferenceError',
      errorSource: 'Event Handler',
      browser: 'Firefox',
      os: 'Windows',
      device: 'Desktop'
    },
    {
      id: '5',
      message: 'Failed to fetch',
      url: '/reports',
      timestamp: '2023-07-14T11:05:18Z',
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      errorType: 'NetworkError',
      errorSource: 'API Call',
      browser: 'Chrome',
      os: 'Android',
      device: 'Mobile'
    }
  ]
};

// Error severity mapping
const getSeverityColor = (errorType: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (errorType) {
    case 'TypeError':
    case 'ReferenceError':
    case 'NetworkError':
      return 'error';
    case 'SyntaxError':
      return 'warning';
    default:
      return 'info';
  }
};

// Error icon mapping
const getErrorIcon = (errorType: string) => {
  switch (errorType) {
    case 'TypeError':
    case 'ReferenceError':
      return <ErrorIcon color="error" />;
    case 'NetworkError':
      return <WarningIcon color="error" />;
    case 'SyntaxError':
      return <WarningIcon color="warning" />;
    default:
      return <InfoIcon color="info" />;
  }
};

// Time period options
type TimePeriod = '24h' | '7d' | '30d' | '90d' | 'all';

const ErrorAnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<ErrorAnalyticsData | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d');
  
  // Load error analytics data
  useEffect(() => {
    loadErrorAnalytics();
  }, [timePeriod]);
  
  // Function to load error analytics
  const loadErrorAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real application, this would be an API call
      // const response = await fetch(`/api/monitoring/error-analytics?period=${timePeriod}`);
      // const data = await response.json();
      // setAnalyticsData(data);
      
      // Using mock data for development
      setTimeout(() => {
        setAnalyticsData(mockErrorAnalyticsData);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message || t('errorAnalytics.loadError'));
      setLoading(false);
    }
  };
  
  // Handle time period change
  const handlePeriodChange = (event: SelectChangeEvent) => {
    setTimePeriod(event.target.value as TimePeriod);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadErrorAnalytics();
  };
  
  // Handle export
  const handleExport = () => {
    // Implementation for exporting error analytics data
    alert(t('errorAnalytics.exportNotImplemented'));
  };
  
  // Prepare chart data for errors by type
  const errorsByTypeChartData = {
    labels: analyticsData ? Object.keys(analyticsData.errorsByType) : [],
    datasets: [
      {
        label: t('errorAnalytics.errorCount'),
        data: analyticsData ? Object.values(analyticsData.errorsByType) : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare chart data for errors by source
  const errorsBySourceChartData = {
    labels: analyticsData ? Object.keys(analyticsData.errorsBySource) : [],
    datasets: [
      {
        label: t('errorAnalytics.errorCount'),
        data: analyticsData ? Object.values(analyticsData.errorsBySource) : [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 205, 86)',
          'rgb(255, 159, 64)',
          'rgb(255, 99, 132)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare chart data for errors trend
  const errorsTrendChartData = {
    labels: analyticsData?.errorsTrend.labels || [],
    datasets: [
      {
        label: t('errorAnalytics.errorCount'),
        data: analyticsData?.errorsTrend.data || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
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
          {t('errorAnalytics.title')}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-period-label">{t('errorAnalytics.period')}</InputLabel>
            <Select
              labelId="time-period-label"
              id="time-period-select"
              value={timePeriod}
              label={t('errorAnalytics.period')}
              onChange={handlePeriodChange}
            >
              <MenuItem value="24h">{t('errorAnalytics.last24Hours')}</MenuItem>
              <MenuItem value="7d">{t('errorAnalytics.last7Days')}</MenuItem>
              <MenuItem value="30d">{t('errorAnalytics.last30Days')}</MenuItem>
              <MenuItem value="90d">{t('errorAnalytics.last90Days')}</MenuItem>
              <MenuItem value="all">{t('errorAnalytics.allTime')}</MenuItem>
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
      
      {analyticsData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t('errorAnalytics.totalErrors')}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                    {analyticsData.totalErrors}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t('errorAnalytics.topErrorType')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getErrorIcon(Object.keys(analyticsData.errorsByType)[0])}
                    <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                      {Object.keys(analyticsData.errorsByType)[0]}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t('errorAnalytics.topErrorSource')}
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ mt: 1 }}>
                    {Object.keys(analyticsData.errorsBySource)[0]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t('errorAnalytics.topErrorPage')}
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ mt: 1 }}>
                    {Object.keys(analyticsData.errorsByPage)[0]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title={t('errorAnalytics.errorsTrend')} />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    <Line data={errorsTrendChartData} options={{ maintainAspectRatio: false }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title={t('errorAnalytics.errorsByType')} />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    <Pie data={errorsByTypeChartData} options={{ maintainAspectRatio: false }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title={t('errorAnalytics.errorsBySource')} />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    <Bar 
                      data={errorsBySourceChartData} 
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
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title={t('errorAnalytics.errorsByBrowser')} />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    <Bar 
                      data={{
                        labels: Object.keys(analyticsData.errorsByBrowser),
                        datasets: [{
                          label: t('errorAnalytics.errorCount'),
                          data: Object.values(analyticsData.errorsByBrowser),
                          backgroundColor: 'rgba(54, 162, 235, 0.6)',
                          borderColor: 'rgb(54, 162, 235)',
                          borderWidth: 1
                        }]
                      }} 
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
          </Grid>
          
          {/* Recent Errors Table */}
          <Card>
            <CardHeader 
              title={t('errorAnalytics.recentErrors')} 
              action={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterListIcon />}
                >
                  {t('common.filter')}
                </Button>
              }
            />
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('errorAnalytics.errorType')}</TableCell>
                    <TableCell>{t('errorAnalytics.message')}</TableCell>
                    <TableCell>{t('errorAnalytics.source')}</TableCell>
                    <TableCell>{t('errorAnalytics.page')}</TableCell>
                    <TableCell>{t('errorAnalytics.browser')}</TableCell>
                    <TableCell>{t('errorAnalytics.timestamp')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.recentErrors.map((error) => (
                    <TableRow key={error.id} hover>
                      <TableCell>
                        <Chip
                          icon={getErrorIcon(error.errorType || 'Other')}
                          label={error.errorType || 'Unknown'}
                          color={getSeverityColor(error.errorType || 'Other')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={error.message}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {error.message}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{error.errorSource || 'Unknown'}</TableCell>
                      <TableCell>
                        <Tooltip title={error.url}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {error.url}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{`${error.browser} / ${error.os}`}</TableCell>
                      <TableCell>{formatLocalizedDateTime(error.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );
};

export default ErrorAnalyticsDashboard; 