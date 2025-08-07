import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, PieChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RechartsLegend, ResponsiveContainer, Cell, Pie, Area, ScatterChart, Scatter, ZAxis } from "../../components/charts/RechartsWrappers";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Divider,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
  TextField,
  CircularProgress,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Paper,
  Container } from
'@mui/material';
import { BarChart, LineChart, PieChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RechartsLegend, ResponsiveContainer, Cell, Pie, Area, ScatterChart, Scatter, ZAxis } from "../../components/charts/RechartsWrappers";
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  CompareArrows as CompareIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  BugReport as BugReportIcon,
  AccessTime as AccessTimeIcon } from
'@mui/icons-material';
import { BarChart, LineChart, PieChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RechartsLegend, ResponsiveContainer, Cell, Pie, Area, ScatterChart, Scatter, ZAxis } from "../../components/charts/RechartsWrappers";
import { PageHeader } from '../../components/common';
import { BarChart, LineChart, PieChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RechartsLegend, ResponsiveContainer, Cell, Pie, Area, ScatterChart, Scatter, ZAxis } from "../../components/charts/RechartsWrappers";
import {
  BarChart,
  LineChart,
  PieChart,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Cell,
  Pie,
  Area,
  ScatterChart,
  Scatter,
  ZAxis } from
'recharts';
import api from '../../services/api';
import { BarChart, LineChart, PieChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RechartsLegend, ResponsiveContainer, Cell, Pie, Area, ScatterChart, Scatter, ZAxis } from "../../components/charts/RechartsWrappers";
import { format, subMonths } from 'date-fns';
import InspectionStatsDashboard from '../../components/inspections/InspectionStatsDashboard';

// TabPanel component
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}>

      {value === index &&
      <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      }
    </div>);

};

const InspectionAnalytics: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [filters, setFilters] = useState({
    customerId: '',
    supplierId: ''
  });
  const [analyticsData, setAnalyticsData] = useState<any>({
    summary: {
      statusCounts: {},
      resultCounts: {},
      total: 0
    },
    trends: [],
    supplierPerformance: [],
    defects: {
      byType: [],
      bySeverity: [],
      totalDefects: 0
    },
    timeline: {
      durations: [],
      scheduledVsActual: {}
    }
  });

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);

      if (filters.customerId) {
        params.append('customerId', filters.customerId);
      }

      if (filters.supplierId) {
        params.append('supplierId', filters.supplierId);
      }

      const response = await api.get(`/inspections/analytics?${params.toString()}`);
      setAnalyticsData(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle export menu
  const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  // Handle date range change
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({
      ...dateRange,
      [event.target.name]: event.target.value
    });
  };

  // Handle filter change
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value
    });
  };

  // Apply filters and refresh data
  const handleApplyFilters = () => {
    fetchAnalyticsData();
    handleFilterClose();
  };

  // Get status colors
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      scheduled: theme.palette.info.main,
      'in-progress': theme.palette.warning.main,
      completed: theme.palette.success.main,
      cancelled: theme.palette.error.main
    };

    return statusColors[status] || theme.palette.grey[500];
  };

  // Get result colors
  const getResultColor = (result: string) => {
    const resultColors: Record<string, string> = {
      pass: theme.palette.success.main,
      fail: theme.palette.error.main,
      conditional: theme.palette.warning.main
    };

    return resultColors[result] || theme.palette.grey[500];
  };

  // Generate status chart data
  const statusChartData = Object.entries(analyticsData.summary.statusCounts || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count as number,
    color: getStatusColor(status)
  }));

  // Generate result chart data
  const resultChartData = Object.entries(analyticsData.summary.resultCounts || {}).map(([result, count]) => ({
    name: result.charAt(0).toUpperCase() + result.slice(1),
    value: count as number,
    color: getResultColor(result)
  }));

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Inspection Analytics
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Comprehensive view of inspection data and trends
        </Typography>
      </Box>

      <InspectionStatsDashboard />
      
      <Box sx={{ pb: 5 }}>
        <PageHeader
          title="Inspection Analytics"
          subtitle="Comprehensive analytics and insights for inspection data"
          icon={<AssessmentIcon fontSize="large" />} />

        
        
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap'
            }}>

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}>

              Filter
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left'
              }}
              PaperProps={{
                sx: { width: 300, p: 2 }
              }}>

              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Filter Options
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth />

              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  label="End Date"
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth />

              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  label="Customer ID"
                  name="customerId"
                  value={filters.customerId}
                  onChange={handleFilterChange}
                  fullWidth />

              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  label="Supplier ID"
                  name="supplierId"
                  value={filters.supplierId}
                  onChange={handleFilterChange}
                  fullWidth />

              </FormControl>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}>

                  Apply Filters
                </Button>
              </Box>
            </Menu>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAnalyticsData}>

              Refresh
            </Button>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}>

            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}>

            <MenuItem onClick={handleExportClose}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export as PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleExportClose}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export as CSV</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
        
        
        {loading &&
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        }
        
        
        {!loading && error &&
        <Paper
          sx={{
            p: 3,
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.main,
            mb: 3
          }}>

            <Typography>
              Error loading analytics data: {error}
            </Typography>
            <Button
            variant="outlined"
            color="error"
            sx={{ mt: 2 }}
            onClick={fetchAnalyticsData}>

              Retry
            </Button>
          </Paper>
        }
        
        
        {!loading && !error &&
        <>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AssessmentIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.primary.main,
                      mb: 1
                    }} />

                    <Typography variant="h4" fontWeight={600}>
                      {analyticsData.summary.total || 0}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Total Inspections
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <BarChartIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.success.main,
                      mb: 1
                    }} />

                    <Typography variant="h4" fontWeight={600}>
                      {analyticsData.summary.resultCounts && analyticsData.summary.total ?
                    ((analyticsData.summary.resultCounts.pass || 0) / analyticsData.summary.total * 100).toFixed(1) + '%' :
                    '0%'
                    }
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Pass Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccessTimeIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.info.main,
                      mb: 1
                    }} />

                    <Typography variant="h4" fontWeight={600}>
                      {analyticsData.timeline.scheduledVsActual?.onTimePercentage?.toFixed(1) || 0}%
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      On-Time Completion
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <BugReportIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.warning.main,
                      mb: 1
                    }} />

                    <Typography variant="h4" fontWeight={600}>
                      {analyticsData.defects.totalDefects || 0}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Total Defects
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="analytics tabs"
              centered>

                <Tab
                label="Overview"
                icon={<AssessmentIcon />}
                iconPosition="start" />

                <Tab
                label="Supplier Performance"
                icon={<BusinessIcon />}
                iconPosition="start" />

                <Tab
                label="Defect Analysis"
                icon={<BugReportIcon />}
                iconPosition="start" />

                <Tab
                label="Time Analysis"
                icon={<AccessTimeIcon />}
                iconPosition="start" />

              </Tabs>
            </Box>
            
            
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Inspection Status Distribution" />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>

                              {statusChartData.map((entry, index) =>
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            )}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Inspection Result Distribution" />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                            data={resultChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>

                              {resultChartData.map((entry, index) =>
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            )}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Monthly Inspection Trends" />
                    <CardContent>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                          data={analyticsData.trends}
                          margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20
                          }}>

                            <CartesianGrid stroke="#f5f5f5" />
                            <XAxis
                            dataKey="month"
                            scale="band"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value, index) => `${value} ${analyticsData.trends[index]?.year}`} />

                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="total" name="Total Inspections" fill={theme.palette.primary.main} barSize={20} />
                            <Bar yAxisId="left" dataKey="passed" name="Passed" fill={theme.palette.success.main} barSize={20} />
                            <Bar yAxisId="left" dataKey="failed" name="Failed" fill={theme.palette.error.main} barSize={20} />
                            <Line yAxisId="right" type="monotone" dataKey="passRate" name="Pass Rate (%)" stroke="#ff7300" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
            
            
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Supplier Quality Performance" />
                    <CardContent>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                          data={analyticsData.supplierPerformance.slice(0, 10)} // Top 10 suppliers
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5
                          }}
                          layout="vertical">

                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="supplierName" type="category" scale="band" width={150} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="passRate" name="Pass Rate (%)" fill={theme.palette.success.main} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Supplier Inspection Volumes" />
                    <CardContent>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                          data={analyticsData.supplierPerformance.slice(0, 10)} // Top 10 suppliers
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5
                          }}>

                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="supplierName" scale="band" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="passed" name="Passed" stackId="a" fill={theme.palette.success.main} />
                            <Bar dataKey="failed" name="Failed" stackId="a" fill={theme.palette.error.main} />
                            <Bar dataKey="conditional" name="Conditional" stackId="a" fill={theme.palette.warning.main} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
            
            
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Defects by Type" />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                          data={analyticsData.defects.byType}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5
                          }}>

                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="defectType" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="Number of Defects" fill={theme.palette.error.main} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Defects by Severity" />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                            data={analyticsData.defects.bySeverity}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>

                              <Cell key="cell-critical" fill={theme.palette.error.dark} />
                              <Cell key="cell-major" fill={theme.palette.error.main} />
                              <Cell key="cell-minor" fill={theme.palette.error.light} />
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
            
            
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Inspection Duration by Type" />
                    <CardContent>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                          data={analyticsData.timeline.durations}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5
                          }}>

                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="inspectionType" />
                            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="avgDuration" name="Average Duration (Hours)" fill={theme.palette.primary.main} />
                            <Bar dataKey="minDuration" name="Minimum Duration (Hours)" fill={theme.palette.success.main} />
                            <Bar dataKey="maxDuration" name="Maximum Duration (Hours)" fill={theme.palette.error.main} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="On-Time vs. Delayed Inspections" />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                            data={[
                            {
                              name: 'On-Time',
                              value: analyticsData.timeline.scheduledVsActual?.onTimePercentage || 0
                            },
                            {
                              name: 'Delayed',
                              value: analyticsData.timeline.scheduledVsActual?.delayedPercentage || 0
                            }]
                            }
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>

                              <Cell key="cell-ontime" fill={theme.palette.success.main} />
                              <Cell key="cell-delayed" fill={theme.palette.warning.main} />
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Average Delay" />
                    <CardContent sx={{ textAlign: 'center' }}>
                      <AccessTimeIcon
                      sx={{
                        fontSize: 64,
                        color:
                        analyticsData.timeline.scheduledVsActual?.avgDifference > 0 ?
                        theme.palette.warning.main :
                        theme.palette.success.main,
                        mb: 2
                      }} />

                      <Typography variant="h4" fontWeight={600}>
                        {Math.abs(analyticsData.timeline.scheduledVsActual?.avgDifference || 0).toFixed(1)} days
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        {analyticsData.timeline.scheduledVsActual?.avgDifference > 0 ? 'Average Delay' : 'Average Early Completion'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </>
        }
      </Box>
    </Container>);

};

export default InspectionAnalytics;