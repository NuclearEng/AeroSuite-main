import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Button,
  Grid,
  TextField,
  Tooltip,
  IconButton } from
'@mui/material';
import {
  TimelineOutlined,
  WarningAmber,
  TrendingUp,
  ShowChart,
  Refresh,
  Info,
  ErrorOutline,
  CheckCircleOutline } from
'@mui/icons-material';
import axios from 'axios';
import { formatDistance } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * Anomaly Detection Widget
 * 
 * This widget displays anomaly detection results for time series data
 * and provides visualization of anomalies with their severity.
 * 
 * Part of: AI005 - Anomaly Detection System
 * Related to: AI016 - AI-Powered Data Insights
 */
const AnomalyDetectionWidget: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [component, setComponent] = useState<string>('C-1042');
  const [data, setData] = useState<any>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('1w'); // 1d, 1w, 1m, 3m
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch anomaly data from the API
  const fetchAnomalyData = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real application, this would fetch from your API
      // const response = await axios.get(`/api/v1/ai/anomaly-detection/measurements/${component}?timeRange=${timeRange}`);
      // setData(response.data.data);

      // For demonstration, we'll use mock data
      const mockData = generateMockAnomalyData(component, timeRange);
      setData(mockData);

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching anomaly data:', err);
      setError('Failed to load anomaly detection data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockAnomalyData = (componentId: string, timeRange: string) => {
    // Generate measurements
    const points = timeRange === '1d' ? 24 : timeRange === '1w' ? 168 : timeRange === '1m' ? 300 : 500;
    const measurements = [];
    const anomalies = {
      low: [],
      medium: [],
      high: [],
      critical: []
    };

    const now = new Date();
    const baseValue = parseInt(componentId.replace(/\D/g, '')) % 100 || 50;

    for (let i = 0; i < points; i++) {
      const timestamp = new Date(now.getTime() - (points - i) * 3600000);

      // Generate normal measurement with some noise
      let value = baseValue + (Math.random() * 2 - 1) * 0.5;

      // Add seasonal component
      value += Math.sin(i / 24) * 2;

      // Add slight trend
      value += i * 0.002;

      const dataPoint = {
        timestamp: timestamp.toISOString(),
        value: parseFloat(value.toFixed(3)),
        isAnomaly: false,
        severity: null
      };

      // Add anomalies
      if (i % 50 === 0) {
        // Critical anomaly
        dataPoint.value += 8 + Math.random() * 2;
        dataPoint.isAnomaly = true;
        dataPoint.severity = 'critical';
        anomalies.critical.push({ ...dataPoint });
      } else if (i % 40 === 0) {
        // High anomaly
        dataPoint.value += 5 + Math.random() * 2;
        dataPoint.isAnomaly = true;
        dataPoint.severity = 'high';
        anomalies.high.push({ ...dataPoint });
      } else if (i % 30 === 0) {
        // Medium anomaly
        dataPoint.value += 3 + Math.random() * 1;
        dataPoint.isAnomaly = true;
        dataPoint.severity = 'medium';
        anomalies.medium.push({ ...dataPoint });
      } else if (i % 25 === 0) {
        // Low anomaly
        dataPoint.value += 1.5 + Math.random() * 1;
        dataPoint.isAnomaly = true;
        dataPoint.severity = 'low';
        anomalies.low.push({ ...dataPoint });
      }

      measurements.push(dataPoint);
    }

    // Create insights based on detected anomalies
    const insights = [
    {
      type: 'pattern',
      title: 'Recurring Anomaly Pattern',
      description: 'Regular anomalies detected every 30-50 hours, suggesting cyclical issue',
      severity: 'medium'
    },
    {
      type: 'trend',
      title: 'Increasing Trend in Values',
      description: 'Gradual upward trend in measurements, potentially indicating calibration drift',
      severity: 'low'
    }];


    // If there are critical anomalies, add a critical insight
    if (anomalies.critical.length > 0) {
      insights.unshift({
        type: 'alert',
        title: 'Critical Anomalies Detected',
        description: `${anomalies.critical.length} critical anomalies detected, immediate investigation required`,
        severity: 'critical'
      });
    }

    return {
      componentId,
      measurements,
      anomalies,
      insights,
      summary: {
        totalMeasurements: measurements.length,
        totalAnomalies: Object.values(anomalies).flat().length,
        criticalAnomalies: anomalies.critical.length,
        highAnomalies: anomalies.high.length,
        mediumAnomalies: anomalies.medium.length,
        lowAnomalies: anomalies.low.length,
        anomalyRate: (Object.values(anomalies).flat().length / measurements.length * 100).toFixed(2) + '%'
      }
    };
  };

  // Handle component change
  const handleComponentChange = (event: React.ChangeEvent<{value: unknown;}>) => {
    setComponent(event.target.value as string);
  };

  // Handle time range change
  const handleTimeRangeChange = (event: React.ChangeEvent<{value: unknown;}>) => {
    setTimeRange(event.target.value as string);
  };

  // Handle severity filter change
  const handleSeverityChange = (event: React.ChangeEvent<{value: unknown;}>) => {
    setSelectedSeverity(event.target.value as string);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchAnomalyData();
  };

  // Get color for severity
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#d32f2f'; // red
      case 'high':
        return '#f57c00'; // orange
      case 'medium':
        return '#ffc107'; // amber
      case 'low':
        return '#2196f3'; // blue
      default:
        return '#757575'; // grey
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    try {
      return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
    } catch (err) {
      return 'Unknown time';
    }
  };

  // Get filtered anomalies based on selected severity
  const getFilteredAnomalies = () => {
    if (!data) return [];

    if (selectedSeverity === 'all') {
      return Object.values(data.anomalies).flat();
    }

    return data.anomalies[selectedSeverity] || [];
  };

  // Get severity icon
  const GetSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorOutline color="error" />;
      case 'high':
        return <WarningAmber sx={{ color: 'orange' }} />;
      case 'medium':
        return <WarningAmber sx={{ color: 'gold' }} />;
      case 'low':
        return <InfoOutlined sx={{ color: 'primary' }} />;
      default:
        return <Info />;
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchAnomalyData();

    // Set up a refresh interval
    const interval = setInterval(() => {
      fetchAnomalyData();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [component, timeRange]);

  // Render chart
  const RenderChart = () => {
    if (!data || !data.measurements) return null;

    // Prepare data for chart
    const chartData = data.measurements.map((point: any) => ({
      timestamp: new Date(point.timestamp).getTime(),
      value: point.value,
      isAnomaly: point.isAnomaly,
      severity: point.severity
    }));

    // Calculate min and max for better visualization
    let min = Math.min(...chartData.map((d: any) => d.value));
    let max = Math.max(...chartData.map((d: any) => d.value));
    const padding = (max - min) * 0.1;
    min -= padding;
    max += padding;

    // Custom tooltip content
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <Paper sx={{ p: 1, boxShadow: 3 }}>
            <Typography variant="body2">
              {new Date(data.timestamp).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Value: {data.value.toFixed(3)}
            </Typography>
            {data.isAnomaly &&
            <Typography variant="body2" sx={{ color: getSeverityColor(data.severity) }}>
                Anomaly Detected ({data.severity})
              </Typography>
            }
          </Paper>);

      }
      return null;
    };

    return (
      <Box sx={{ height: 250, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(tick) => new Date(tick).toLocaleDateString()} />

            <YAxis domain={[min, max]} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              dot={(props: any) => {
                const { cx, cy, payload } = props;

                if (payload.isAnomaly) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={getSeverityColor(payload.severity)}
                      stroke="white"
                      strokeWidth={2} />);


                }

                return null; // Don't render normal points
              }}
              activeDot={{ r: 8 }} />

          </LineChart>
        </ResponsiveContainer>
      </Box>);

  };

  // Render anomaly card
  const RenderAnomalyCard = (anomaly: any) => {
    return (
      <Card
        key={anomaly.timestamp}
        sx={{
          mb: 1,
          borderLeft: 4,
          borderColor: getSeverityColor(anomaly.severity)
        }}>

        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" fontWeight="bold">
              Value: {anomaly.value.toFixed(3)}
            </Typography>
            <Tooltip title={new Date(anomaly.timestamp).toLocaleString()}>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(anomaly.timestamp)}
              </Typography>
            </Tooltip>
          </Box>
          <Typography variant="caption" sx={{ color: getSeverityColor(anomaly.severity) }}>
            {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)} severity anomaly
          </Typography>
        </CardContent>
      </Card>);

  };

  // Render insight card
  const RenderInsightCard = (insight: any, index: number) => {
    return (
      <Card
        key={index}
        sx={{
          mb: 1,
          borderLeft: 4,
          borderColor: getSeverityColor(insight.severity)
        }}>

        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
          <Typography variant="body2" fontWeight="bold">
            {insight.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {insight.description}
          </Typography>
        </CardContent>
      </Card>);

  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center">
          <TimelineOutlined sx={{ mr: 1 }} />
          Anomaly Detection
        </Typography>
        
        <Box display="flex" alignItems="center">
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={loading}
            sx={{ ml: 1 }}>

            <Refresh />
          </IconButton>
        </Box>
      </Box>
      
      <Box display="flex" mb={2} gap={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="component-select-label">Component</InputLabel>
          <Select
            labelId="component-select-label"
            value={component}
            label="Component"
            onChange={handleComponentChange}>

            <MenuItem value="C-1042">C-1042</MenuItem>
            <MenuItem value="C-2394">C-2394</MenuItem>
            <MenuItem value="C-3761">C-3761</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="time-range-select-label">Time Range</InputLabel>
          <Select
            labelId="time-range-select-label"
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}>

            <MenuItem value="1d">1 Day</MenuItem>
            <MenuItem value="1w">1 Week</MenuItem>
            <MenuItem value="1m">1 Month</MenuItem>
            <MenuItem value="3m">3 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {loading ?
      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
          <CircularProgress />
        </Box> :
      error ?
      <Alert severity="error">{error}</Alert> :
      data ?
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Total Anomalies</Typography>
                <Typography variant="h6">{data.summary.totalAnomalies}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Critical</Typography>
                <Typography variant="h6" color="error">{data.summary.criticalAnomalies}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">High</Typography>
                <Typography variant="h6" color="warning.dark">{data.summary.highAnomalies}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Anomaly Rate</Typography>
                <Typography variant="h6">{data.summary.anomalyRate}</Typography>
              </Paper>
            </Grid>
          </Grid>
          
          
          {RenderChart()}
          
          <Divider sx={{ my: 2 }} />
          
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" mb={1}>AI Insights</Typography>
              {data.insights.map((insight: any, index: number) =>
            RenderInsightCard(insight, index)
            )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">Detected Anomalies</Typography>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                  value={selectedSeverity}
                  onChange={handleSeverityChange}
                  displayEmpty
                  variant="standard">

                    <MenuItem value="all">All Severities</MenuItem>
                    <MenuItem value="critical">Critical Only</MenuItem>
                    <MenuItem value="high">High Only</MenuItem>
                    <MenuItem value="medium">Medium Only</MenuItem>
                    <MenuItem value="low">Low Only</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                {getFilteredAnomalies().length === 0 ?
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                    No anomalies found for selected criteria
                  </Typography> :

              getFilteredAnomalies().map((anomaly: any) => RenderAnomalyCard(anomaly))
              }
              </Box>
            </Grid>
          </Grid>
        </Box> :

      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
          <Typography color="text.secondary">No data available</Typography>
        </Box>
      }
      
      {lastUpdated &&
      <Box mt={2} textAlign="right">
          <Typography variant="caption" color="text.secondary">
            Last updated: {formatTimestamp(lastUpdated)}
          </Typography>
        </Box>
      }
    </Box>);

};

export default AnomalyDetectionWidget;