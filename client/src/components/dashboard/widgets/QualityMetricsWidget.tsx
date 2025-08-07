import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  IconButton,
  Tooltip,
  Divider } from
'@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon } from
'@mui/icons-material';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell } from 'recharts';

// Mock data for quality metrics
const mockQualityData = {
  defectRateHistory: [
  { month: 'Jan', rate: 2.3 },
  { month: 'Feb', rate: 2.1 },
  { month: 'Mar', rate: 2.5 },
  { month: 'Apr', rate: 1.8 },
  { month: 'May', rate: 1.5 },
  { month: 'Jun', rate: 1.2 }],

  firstTimeYieldHistory: [
  { month: 'Jan', yield: 92.5 },
  { month: 'Feb', yield: 93.1 },
  { month: 'Mar', yield: 92.8 },
  { month: 'Apr', yield: 94.2 },
  { month: 'May', yield: 95.0 },
  { month: 'Jun', yield: 95.8 }],

  inspectionResults: [
  { name: 'Pass', value: 85 },
  { name: 'Fail', value: 8 },
  { name: 'Conditional', value: 7 }],

  currentMetrics: {
    defectRate: 1.2,
    firstTimeYield: 95.8,
    onTimeDelivery: 97.2,
    supplierQuality: 89.5
  }
};

// Chart colors
const CHART_COLORS = {
  primary: '#1976d2',
  secondary: '#9c27b0',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#03a9f4',
  grey: '#9e9e9e'
};

// Pie chart colors
const PIE_COLORS = ['#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metrics-tabpanel-${index}`}
      aria-labelledby={`metrics-tab-${index}`}
      {...other}>

      {value === index &&
      <Box sx={{ p: 1 }}>
          {children}
        </Box>
      }
    </div>);

};

interface QualityMetricsWidgetProps {
  height?: number;
  showHeader?: boolean;
  compact?: boolean;
  widgetId?: string;
}

const QualityMetricsWidget: React.FC<QualityMetricsWidgetProps> = ({
  height = 400,
  showHeader = true,
  compact = false,
  widgetId
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('6m');
  const [qualityData, setQualityData] = useState(mockQualityData);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load quality metrics data
  const loadQualityMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would be an API call
      // const response = await api.get('/api/v1/quality-metrics', { params: { timeRange } });
      // setQualityData(response.data);

      // Using mock data for now
      setTimeout(() => {
        setQualityData(mockQualityData);
        setLoading(false);
      }, 800);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || 'Failed to load quality metrics');
      setLoading(false);
    }
  };

  // Load data on component mount and when time range changes
  useEffect(() => {
    loadQualityMetrics();
  }, [timeRange]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      intervalId = setInterval(() => {
        loadQualityMetrics();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  return (
    <Card sx={{ height: height, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {showHeader &&
      <CardHeader
        title="Quality Metrics"
        action={
        <Box sx={{ display: 'flex' }}>
              <FormControl sx={{ minWidth: 120, mr: 1 }} size="small">
                <InputLabel id="time-range-label">Time Range</InputLabel>
                <Select
              labelId="time-range-label"
              id="time-range-select"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
              size="small">

                  <MenuItem value="1m">Last Month</MenuItem>
                  <MenuItem value="3m">Last 3 Months</MenuItem>
                  <MenuItem value="6m">Last 6 Months</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}>
                <IconButton
              onClick={toggleAutoRefresh}
              color={autoRefresh ? "success" : "default"}
              size="small">

                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton
              onClick={loadQualityMetrics}
              disabled={loading}
              size="small">

                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
        } />

      }
      
      <CardContent sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {error &&
        <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        }

        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <Card variant="outlined" sx={{ p: compact ? 1 : 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Defect Rate
              </Typography>
              <Typography variant="h5" component="div" color={qualityData.currentMetrics.defectRate < 2 ? "success.main" : "error.main"}>
                {qualityData.currentMetrics.defectRate}%
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined" sx={{ p: compact ? 1 : 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                First Time Yield
              </Typography>
              <Typography variant="h5" component="div" color={qualityData.currentMetrics.firstTimeYield > 95 ? "success.main" : "warning.main"}>
                {qualityData.currentMetrics.firstTimeYield}%
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined" sx={{ p: compact ? 1 : 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                On-Time Delivery
              </Typography>
              <Typography variant="h5" component="div" color={qualityData.currentMetrics.onTimeDelivery > 95 ? "success.main" : "warning.main"}>
                {qualityData.currentMetrics.onTimeDelivery}%
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined" sx={{ p: compact ? 1 : 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Supplier Quality
              </Typography>
              <Typography variant="h5" component="div" color={qualityData.currentMetrics.supplierQuality > 85 ? "success.main" : "warning.main"}>
                {qualityData.currentMetrics.supplierQuality}%
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="quality metrics tabs"
            variant="scrollable"
            scrollButtons="auto"
            size="small">

            <Tab label="Trend Analysis" />
            <Tab label="Inspection Results" />
          </Tabs>
        </Box>
        
        {loading ?
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box> :

        <>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ height: compact ? 200 : 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qualityData.defectRateHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis name="Defect Rate (%)" />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                    type="monotone"
                    dataKey="rate"
                    name="Defect Rate (%)"
                    stroke={CHART_COLORS.error}
                    activeDot={{ r: 8 }} />

                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </TabPanel>

            
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ height: compact ? 200 : 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                    data={qualityData.inspectionResults}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">

                      {qualityData.inspectionResults.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    )}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${value} inspections`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </TabPanel>
          </>
        }
      </CardContent>
    </Card>);

};

export default QualityMetricsWidget;