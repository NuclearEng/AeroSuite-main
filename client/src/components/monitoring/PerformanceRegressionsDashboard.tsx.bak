import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import performanceMonitoringService from '../../services/performanceMonitoring.service';

// Sample baseline metrics
const sampleBaselineMetrics = {
  firstContentfulPaint: 800,
  largestContentfulPaint: 2000,
  firstInputDelay: 80,
  cumulativeLayoutShift: 0.04,
  total: 2600,
  domInteractive: 1100,
};

// Sample current metrics
const sampleCurrentMetrics = {
  firstContentfulPaint: 850,
  largestContentfulPaint: 2200,
  firstInputDelay: 85,
  cumulativeLayoutShift: 0.05,
  total: 2800,
  domInteractive: 1200,
};

// Sample historical data
const sampleHistoricalData = {
  dates: ['2023-01-01', '2023-02-01', '2023-03-01', '2023-04-01', '2023-05-01', '2023-06-01'],
  metrics: {
    firstContentfulPaint: [780, 790, 810, 820, 830, 850],
    largestContentfulPaint: [1900, 1950, 2000, 2050, 2100, 2200],
    firstInputDelay: [75, 76, 78, 80, 82, 85],
    cumulativeLayoutShift: [0.03, 0.035, 0.04, 0.042, 0.045, 0.05],
    total: [2500, 2550, 2600, 2650, 2700, 2800],
    domInteractive: [1000, 1020, 1050, 1080, 1150, 1200],
  }
};

interface Regression {
  metric: string;
  currentValue: number;
  baselineValue: number;
  percentChange: number;
  threshold: number;
}

interface PerformanceRegressionsDashboardProps {
  baselineMetrics?: Record<string, number>;
  currentMetrics?: Record<string, number>;
  historicalData?: {
    dates: string[];
    metrics: Record<string, number[]>;
  };
  threshold?: number;
  onRefresh?: () => void;
}

const PerformanceRegressionsDashboard: React.FC<PerformanceRegressionsDashboardProps> = ({
  baselineMetrics = sampleBaselineMetrics,
  currentMetrics = sampleCurrentMetrics,
  historicalData = sampleHistoricalData,
  threshold = 10,
  onRefresh
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [regressions, setRegressions] = useState<Regression[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('firstContentfulPaint');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Detect regressions
  useEffect(() => {
    const result = performanceMonitoringService.detectRegressions(
      currentMetrics,
      baselineMetrics,
      threshold
    );
    setRegressions(result);
  }, [currentMetrics, baselineMetrics, threshold]);
  
  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      setLoading(true);
      onRefresh();
      setTimeout(() => setLoading(false), 1000);
    }
  };
  
  // Handle metric selection change
  const handleMetricChange = (event: SelectChangeEvent) => {
    setSelectedMetric(event.target.value);
  };
  
  // Format metric value based on its name
  const formatMetricValue = (name: string, value: number): string => {
    if (name === 'cumulativeLayoutShift') {
      return value.toFixed(2);
    }
    
    if (name.includes('Time') || name.includes('Duration') || 
        name.includes('Paint') || name.includes('Input') || 
        name.includes('Interactive') || name.includes('total')) {
      return `${value.toFixed(0)} ms`;
    }
    
    return value.toFixed(2);
  };
  
  // Format percentage change
  const formatPercentChange = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  // Get color based on percentage change
  const getChangeColor = (percentChange: number): string => {
    if (percentChange <= 5) return theme.palette.success.main;
    if (percentChange <= 10) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Prepare chart data
  const chartData = {
    labels: historicalData.dates,
    datasets: [
      {
        label: selectedMetric,
        data: historicalData.metrics[selectedMetric] || [],
        fill: false,
        borderColor: theme.palette.primary.main,
        tension: 0.1,
        pointBackgroundColor: theme.palette.primary.main,
      }
    ]
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: selectedMetric === 'cumulativeLayoutShift' ? 'Value' : 'Time (ms)'
        }
      },
      x: {
        title: {
          display: true,
          text: t('performanceRegressions.date')
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += selectedMetric === 'cumulativeLayoutShift' 
                ? context.parsed.y.toFixed(2)
                : context.parsed.y.toFixed(0) + ' ms';
            }
            return label;
          }
        }
      }
    }
  };
  
  return (
    <Card>
      <CardHeader
        title={t('performanceRegressions.title')}
        action={
          <Tooltip title={t('common.refresh')}>
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent>
        {regressions.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              {t('performanceRegressions.regressionsDetected', { count: regressions.length })}
            </Typography>
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              {t('performanceRegressions.detectedRegressions')}
            </Typography>
            
            {regressions.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('performanceRegressions.metric')}</TableCell>
                      <TableCell align="right">{t('performanceRegressions.baseline')}</TableCell>
                      <TableCell align="right">{t('performanceRegressions.current')}</TableCell>
                      <TableCell align="right">{t('performanceRegressions.change')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {regressions.map((regression) => (
                      <TableRow key={regression.metric} hover>
                        <TableCell component="th" scope="row">
                          {regression.metric}
                        </TableCell>
                        <TableCell align="right">
                          {formatMetricValue(regression.metric, regression.baselineValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatMetricValue(regression.metric, regression.currentValue)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {regression.percentChange > 0 ? (
                              <TrendingUpIcon fontSize="small" sx={{ color: theme.palette.error.main, mr: 0.5 }} />
                            ) : (
                              <TrendingDownIcon fontSize="small" sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: getChangeColor(Math.abs(regression.percentChange)),
                                fontWeight: 'bold'
                              }}
                            >
                              {formatPercentChange(regression.percentChange)}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success" variant="outlined">
                {t('performanceRegressions.noRegressions')}
              </Alert>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">
                {t('performanceRegressions.metricTrend')}
              </Typography>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="metric-select-label">{t('performanceRegressions.selectMetric')}</InputLabel>
                <Select
                  labelId="metric-select-label"
                  id="metric-select"
                  value={selectedMetric}
                  label={t('performanceRegressions.selectMetric')}
                  onChange={handleMetricChange}
                >
                  {Object.keys(historicalData.metrics).map((metric) => (
                    <MenuItem key={metric} value={metric}>{metric}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ height: 300 }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              {t('performanceRegressions.comparisonTable')}
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('performanceRegressions.metric')}</TableCell>
                    <TableCell align="right">{t('performanceRegressions.baseline')}</TableCell>
                    <TableCell align="right">{t('performanceRegressions.current')}</TableCell>
                    <TableCell align="right">{t('performanceRegressions.change')}</TableCell>
                    <TableCell align="center">{t('performanceRegressions.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(baselineMetrics).map((metric) => {
                    const baselineValue = baselineMetrics[metric];
                    const currentValue = currentMetrics[metric] || 0;
                    const percentChange = ((currentValue - baselineValue) / baselineValue) * 100;
                    const isRegression = percentChange > threshold;
                    
                    return (
                      <TableRow key={metric} hover>
                        <TableCell component="th" scope="row">
                          {metric}
                        </TableCell>
                        <TableCell align="right">
                          {formatMetricValue(metric, baselineValue)}
                        </TableCell>
                        <TableCell align="right">
                          {formatMetricValue(metric, currentValue)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {percentChange > 0 ? (
                              <TrendingUpIcon fontSize="small" sx={{ 
                                color: percentChange > threshold ? theme.palette.error.main : theme.palette.warning.main,
                                mr: 0.5 
                              }} />
                            ) : (
                              <TrendingDownIcon fontSize="small" sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: getChangeColor(Math.abs(percentChange)),
                                fontWeight: 'bold'
                              }}
                            >
                              {formatPercentChange(percentChange)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            color={isRegression ? 'error' : 'success'}
                            icon={isRegression ? <WarningIcon /> : undefined}
                            label={isRegression ? t('performanceRegressions.regression') : t('performanceRegressions.stable')}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceRegressionsDashboard; 