import React, { ChangeEvent, useState, useEffect, useMemo } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Button,
  Alert,
  Tab,
  Tabs,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  BubbleChart as BubbleChartIcon,
  StackedBarChart as StackedBarChartIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Compare as CompareIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, PolarArea, Radar, Bubble, Scatter } from 'react-chartjs-2';
import { format, parseISO, subMonths } from 'date-fns';
import supplierService from '../../../services/supplier.service';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface SupplierPerformanceChartsProps {
  supplierId: string;
}

// Interface for chart data
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    pointBackgroundColor?: string | string[];
    pointBorderColor?: string | string[];
    pointHoverBackgroundColor?: string | string[];
    pointHoverBorderColor?: string | string[];
  }[];
}

// Generate random color with opacity
const getRandomColor = (opacity = 1) => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Chart theme colors
const chartColors = {
  primary: 'rgba(25, 118, 210, 0.7)',
  secondary: 'rgba(156, 39, 176, 0.7)',
  success: 'rgba(76, 175, 80, 0.7)',
  error: 'rgba(211, 47, 47, 0.7)',
  warning: 'rgba(255, 152, 0, 0.7)',
  info: 'rgba(3, 169, 244, 0.7)',
  grey: 'rgba(158, 158, 158, 0.7)'
};

const SupplierPerformanceCharts: React.FC<SupplierPerformanceChartsProps> = ({ supplierId }) => {
  // State
  const [period, setPeriod] = useState<any>('6months');
  const [chartType, setChartType] = useState<any>('line');
  const [metricType, setMetricType] = useState<any>('all');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [comparisonMode, setComparisonMode] = useState(false);

  // Fetch performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!supplierId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get performance data from service
        const data = await supplierService.getSupplierPerformance(supplierId, { 
          period: period === '3months' ? 'month' : period === '6months' ? 'month' : 'quarter' 
        });
        
        setPerformanceData(data);
      } catch (err: any) {
        console.error("Error:", error);
        setError(err.message || 'Failed to load supplier performance data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [supplierId, period]);

  // Handle period change
  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value as '3months' | '6months' | '1year' | '2years');
  };

  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'line' | 'bar' | 'radar' | 'polar' | null
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Handle metric type change
  const handleMetricTypeChange = (event: SelectChangeEvent) => {
    setMetricType(event.target.value as 'quality' | 'delivery' | 'responsiveness' | 'cost' | 'all');
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    setComparisonMode(prev => !prev);
  };

  // Prepare time series chart data
  const timeSeriesData = useMemo(() => {
    if (!performanceData || !performanceData.performanceHistory) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Sort performance history by period
    const sortedHistory = [...performanceData.performanceHistory].sort(
      (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    // Prepare labels (periods)
    const labels = sortedHistory.map(item => format(new Date(item.period), 'MMM yyyy'));
    
    // Create datasets based on selected metric type
    const datasets = [];
    
    if (metricType === 'all' || metricType === 'quality') {
      datasets.push({
        label: 'Quality Score',
        data: sortedHistory.map(item => (item.details.inspectionsPassed / item.details.inspectionsTotal) * 100),
        borderColor: chartColors.primary,
        backgroundColor: `${chartColors.primary}20`,
        tension: 0.3,
        fill: true
      });
    }
    
    if (metricType === 'all' || metricType === 'delivery') {
      datasets.push({
        label: 'On-Time Delivery',
        data: sortedHistory.map(item => (item.details.deliveriesOnTime / item.details.deliveriesTotal) * 100),
        borderColor: chartColors.success,
        backgroundColor: `${chartColors.success}20`,
        tension: 0.3,
        fill: true
      });
    }
    
    if (metricType === 'all' || metricType === 'responsiveness') {
      datasets.push({
        label: 'Responsiveness',
        data: sortedHistory.map(item => item.details.responseTime ? 100 - (item.details.responseTime / 48) * 100 : 0),
        borderColor: chartColors.info,
        backgroundColor: `${chartColors.info}20`,
        tension: 0.3,
        fill: true
      });
    }
    
    if (metricType === 'all' || metricType === 'cost') {
      datasets.push({
        label: 'Cost Efficiency',
        data: sortedHistory.map(item => item.details.costEfficiency || 0),
        borderColor: chartColors.secondary,
        backgroundColor: `${chartColors.secondary}20`,
        tension: 0.3,
        fill: true
      });
    }
    
    return { labels, datasets };
  }, [performanceData, metricType]);

  // Prepare comparison chart data (compares with industry average)
  const comparisonData = useMemo(() => {
    if (!performanceData || !performanceData.industryComparison) {
      return {
        labels: [],
        datasets: []
      };
    }

    const metrics = ['Quality', 'Delivery', 'Responsiveness', 'Cost', 'Overall'];
    
    // Extract supplier metrics
    const supplierMetrics = [
      performanceData.performanceHistory.length > 0 
        ? (performanceData.performanceHistory[performanceData.performanceHistory.length - 1].details.inspectionsPassed / 
           performanceData.performanceHistory[performanceData.performanceHistory.length - 1].details.inspectionsTotal) * 100
        : 0,
      performanceData.performanceHistory.length > 0 
        ? (performanceData.performanceHistory[performanceData.performanceHistory.length - 1].details.deliveriesOnTime / 
           performanceData.performanceHistory[performanceData.performanceHistory.length - 1].details.deliveriesTotal) * 100
        : 0,
      performanceData.performanceHistory.length > 0 
        ? (performanceData.performanceHistory[performanceData.performanceHistory.length - 1].details.responseTime 
           ? 100 - (performanceData.performanceHistory[performanceData.performanceHistory.length - 1].details.responseTime / 48) * 100 
           : 0)
        : 0,
      performanceData.performanceHistory.length > 0 
        ? (performanceData.performanceHistory[performanceData.performanceHistory.length - 1].details.costEfficiency || 0)
        : 0,
      performanceData.performanceHistory.length > 0 
        ? performanceData.performanceHistory[performanceData.performanceHistory.length - 1].score
        : 0
    ];
    
    // Extract industry average metrics (mock data since we don't have real industry data)
    const industryMetrics = [
      performanceData.industryComparison?.quality || 75,
      performanceData.industryComparison?.delivery || 80,
      performanceData.industryComparison?.responsiveness || 70,
      performanceData.industryComparison?.costEfficiency || 65,
      performanceData.industryComparison?.overall || 72
    ];
    
    // Extract top performer metrics (mock data)
    const topPerformerMetrics = [
      performanceData.industryComparison?.topPerformer?.quality || 92,
      performanceData.industryComparison?.topPerformer?.delivery || 95,
      performanceData.industryComparison?.topPerformer?.responsiveness || 90,
      performanceData.industryComparison?.topPerformer?.costEfficiency || 88,
      performanceData.industryComparison?.topPerformer?.overall || 91
    ];
    
    const datasets = [
      {
        label: 'This Supplier',
        data: supplierMetrics,
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1
      },
      {
        label: 'Industry Average',
        data: industryMetrics,
        backgroundColor: chartColors.warning,
        borderColor: chartColors.warning,
        borderWidth: 1
      }
    ];
    
    // Add top performer data if in comparison mode
    if (comparisonMode) {
      datasets.push({
        label: 'Top Performer',
        data: topPerformerMetrics,
        backgroundColor: chartColors.success,
        borderColor: chartColors.success,
        borderWidth: 1
      });
    }
    
    return { labels: metrics, datasets };
  }, [performanceData, comparisonMode]);

  // Prepare quality metrics chart data
  const qualityMetricsData = useMemo(() => {
    if (!performanceData || !performanceData.performanceHistory || performanceData.performanceHistory.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Get the latest performance data
    const latestPerformance = performanceData.performanceHistory[performanceData.performanceHistory.length - 1];
    
    // Quality-related metrics
    const labels = ['Pass Rate', 'Defect Rate', 'First-Time Quality', 'Documentation', 'Compliance'];
    
    // Calculate values from performance data
    const passRate = (latestPerformance.details.inspectionsPassed / latestPerformance.details.inspectionsTotal) * 100;
    const defectRate = latestPerformance.details.qualityIssues 
      ? 100 - (latestPerformance.details.qualityIssues / latestPerformance.details.inspectionsTotal) * 100
      : 80; // Fallback if not available
    const firstTimeQuality = latestPerformance.details.firstTimeQuality || 75; // Fallback if not available
    const documentation = latestPerformance.details.documentationScore || 85; // Fallback if not available
    const compliance = latestPerformance.details.complianceScore || 90; // Fallback if not available
    
    return {
      labels,
      datasets: [
        {
          label: 'Quality Metrics',
          data: [passRate, defectRate, firstTimeQuality, documentation, compliance],
          backgroundColor: [
            chartColors.success,
            chartColors.error,
            chartColors.info,
            chartColors.secondary,
            chartColors.warning
          ],
          borderColor: [
            chartColors.success,
            chartColors.error,
            chartColors.info,
            chartColors.secondary,
            chartColors.warning
          ],
          borderWidth: 1
        }
      ]
    };
  }, [performanceData]);

  // Prepare delivery metrics chart data
  const deliveryMetricsData = useMemo(() => {
    if (!performanceData || !performanceData.performanceHistory || performanceData.performanceHistory.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Get the latest performance data
    const latestPerformance = performanceData.performanceHistory[performanceData.performanceHistory.length - 1];
    
    // Delivery-related metrics
    const labels = ['On-Time', 'Late', 'Very Late', 'Cancelled'];
    
    // Calculate values from performance data
    const onTime = (latestPerformance.details.deliveriesOnTime / latestPerformance.details.deliveriesTotal) * 100;
    const late = latestPerformance.details.deliveriesLate 
      ? (latestPerformance.details.deliveriesLate / latestPerformance.details.deliveriesTotal) * 100
      : 15; // Fallback if not available
    const veryLate = latestPerformance.details.deliveriesVeryLate 
      ? (latestPerformance.details.deliveriesVeryLate / latestPerformance.details.deliveriesTotal) * 100
      : 5; // Fallback if not available
    const cancelled = latestPerformance.details.deliveriesCancelled 
      ? (latestPerformance.details.deliveriesCancelled / latestPerformance.details.deliveriesTotal) * 100
      : 2; // Fallback if not available
    
    return {
      labels,
      datasets: [
        {
          label: 'Delivery Metrics',
          data: [onTime, late, veryLate, cancelled],
          backgroundColor: [
            chartColors.success,
            chartColors.warning,
            chartColors.error,
            chartColors.grey
          ],
          borderColor: [
            chartColors.success,
            chartColors.warning,
            chartColors.error,
            chartColors.grey
          ],
          borderWidth: 1
        }
      ]
    };
  }, [performanceData]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Supplier Performance Metrics',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
    },
  };

  // Polar and radar chart options (no scales)
  const polarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Supplier Performance Metrics',
      },
    },
  };

  // Loading state
  if (loading && !performanceData) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading supplier performance charts...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mr: 2 }}>
            Performance Charts
          </Typography>
          <Tooltip title="Performance data collected from inspections, deliveries, and communication records">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} label="Period" onChange={handlePeriodChange}>
              <MenuItem value="3months">Last 3 Months</MenuItem>
              <MenuItem value="6months">Last 6 Months</MenuItem>
              <MenuItem value="1year">Last Year</MenuItem>
              <MenuItem value="2years">Last 2 Years</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Metric</InputLabel>
            <Select value={metricType} label="Metric" onChange={handleMetricTypeChange}>
              <MenuItem value="all">All Metrics</MenuItem>
              <MenuItem value="quality">Quality</MenuItem>
              <MenuItem value="delivery">Delivery</MenuItem>
              <MenuItem value="responsiveness">Responsiveness</MenuItem>
              <MenuItem value="cost">Cost</MenuItem>
            </Select>
          </FormControl>
          
          <ToggleButtonGroup
            size="small"
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
          >
            <ToggleButton value="line">
              <Tooltip title="Line Chart">
                <TimelineIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="bar">
              <Tooltip title="Bar Chart">
                <BarChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="radar">
              <Tooltip title="Radar Chart">
                <BubbleChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="polar">
              <Tooltip title="Polar Area Chart">
                <PieChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<CompareIcon />}
            onClick={toggleComparisonMode}
            color={comparisonMode ? "primary" : "inherit"}
          >
            {comparisonMode ? "Hide Top Performer" : "Show Top Performer"}
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="chart tabs">
          <Tab label="Performance Trends" />
          <Tab label="Industry Comparison" />
          <Tab label="Quality Metrics" />
          <Tab label="Delivery Metrics" />
        </Tabs>
      </Box>
      
      <Box role="tabpanel" hidden={tabValue !== 0} sx={{ height: 400 }}>
        {tabValue === 0 && (
          <>
            {chartType === 'line' && <Line data={timeSeriesData} options={chartOptions} />}
            {chartType === 'bar' && <Bar data={timeSeriesData} options={chartOptions} />}
            {chartType === 'radar' && <Radar data={timeSeriesData} options={polarChartOptions} />}
            {chartType === 'polar' && <PolarArea data={timeSeriesData} options={polarChartOptions} />}
          </>
        )}
      </Box>
      
      <Box role="tabpanel" hidden={tabValue !== 1} sx={{ height: 400 }}>
        {tabValue === 1 && (
          <>
            {chartType === 'line' && <Line data={comparisonData} options={chartOptions} />}
            {chartType === 'bar' && <Bar data={comparisonData} options={chartOptions} />}
            {chartType === 'radar' && <Radar data={comparisonData} options={polarChartOptions} />}
            {chartType === 'polar' && <PolarArea data={comparisonData} options={polarChartOptions} />}
          </>
        )}
      </Box>
      
      <Box role="tabpanel" hidden={tabValue !== 2} sx={{ height: 400 }}>
        {tabValue === 2 && (
          <>
            {chartType === 'line' && <Line data={qualityMetricsData} options={chartOptions} />}
            {chartType === 'bar' && <Bar data={qualityMetricsData} options={chartOptions} />}
            {chartType === 'radar' && <Radar data={qualityMetricsData} options={polarChartOptions} />}
            {chartType === 'polar' && <PolarArea data={qualityMetricsData} options={polarChartOptions} />}
          </>
        )}
      </Box>
      
      <Box role="tabpanel" hidden={tabValue !== 3} sx={{ height: 400 }}>
        {tabValue === 3 && (
          <>
            {chartType === 'line' && <Line data={deliveryMetricsData} options={chartOptions} />}
            {chartType === 'bar' && <Bar data={deliveryMetricsData} options={chartOptions} />}
            {chartType === 'radar' && <Radar data={deliveryMetricsData} options={polarChartOptions} />}
            {chartType === 'polar' && <PolarArea data={deliveryMetricsData} options={polarChartOptions} />}
          </>
        )}
      </Box>
      
      {performanceData && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            size="small" 
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Add download functionality here
              alert('Download functionality would be implemented here');
            }}
          >
            Export Chart
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SupplierPerformanceCharts; 