import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  useTheme,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  AssessmentTwoTone as AssessmentIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Filter as FilterIcon
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  unit: string;
  description: string;
}

interface QualityIncident {
  id: string;
  date: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  resolution: string;
  status: 'open' | 'resolved' | 'in-progress';
}

interface DeliveryPerformance {
  month: string;
  onTimeDelivery: number;
  totalDeliveries: number;
  averageLeadTime: number;
}

const SupplierPerformance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<PerformanceMetric | null>(null);

  // Mock supplier data
  const supplier = {
    id: '1',
    name: 'Aerospace Components Ltd.',
    code: 'ACL001',
    overallRating: 4.2,
    contractedSince: '2019-03-15',
    totalOrders: 247,
    activeContracts: 5
  };

  // Mock performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    {
      id: '1',
      name: 'On-Time Delivery',
      value: 96.5,
      target: 95.0,
      trend: 'up',
      status: 'excellent',
      unit: '%',
      description: 'Percentage of orders delivered on or before scheduled date'
    },
    {
      id: '2',
      name: 'Quality Score',
      value: 4.3,
      target: 4.0,
      trend: 'stable',
      status: 'excellent',
      unit: '/5',
      description: 'Average quality rating based on inspections and customer feedback'
    },
    {
      id: '3',
      name: 'Lead Time',
      value: 14.2,
      target: 15.0,
      trend: 'down',
      status: 'good',
      unit: 'days',
      description: 'Average time from order placement to delivery'
    },
    {
      id: '4',
      name: 'Cost Performance',
      value: 102.1,
      target: 100.0,
      trend: 'up',
      status: 'warning',
      unit: '%',
      description: 'Cost performance vs. baseline (100% = on budget)'
    },
    {
      id: '5',
      name: 'Defect Rate',
      value: 0.8,
      target: 1.0,
      trend: 'down',
      status: 'good',
      unit: '%',
      description: 'Percentage of delivered items with quality issues'
    },
    {
      id: '6',
      name: 'Response Time',
      value: 4.5,
      target: 8.0,
      trend: 'stable',
      status: 'excellent',
      unit: 'hours',
      description: 'Average time to respond to inquiries or issues'
    }
  ]);

  // Mock quality incidents
  const qualityIncidents: QualityIncident[] = [
    {
      id: '1',
      date: '2024-01-15',
      severity: 'minor',
      description: 'Surface finish not meeting specification on 3 parts',
      resolution: 'Parts reworked and quality process updated',
      status: 'resolved'
    },
    {
      id: '2',
      date: '2024-01-08',
      severity: 'major',
      description: 'Dimensional tolerance exceeded on critical component',
      resolution: 'Root cause analysis conducted, tooling calibrated',
      status: 'resolved'
    },
    {
      id: '3',
      date: '2024-01-20',
      severity: 'critical',
      description: 'Material certification missing for batch SN-2024-001',
      resolution: 'Investigation in progress, batch quarantined',
      status: 'in-progress'
    }
  ];

  // Mock delivery performance data
  const deliveryPerformance: DeliveryPerformance[] = [
    { month: 'Jul', onTimeDelivery: 18, totalDeliveries: 20, averageLeadTime: 15.2 },
    { month: 'Aug', onTimeDelivery: 22, totalDeliveries: 25, averageLeadTime: 14.8 },
    { month: 'Sep', onTimeDelivery: 19, totalDeliveries: 20, averageLeadTime: 13.9 },
    { month: 'Oct', onTimeDelivery: 26, totalDeliveries: 28, averageLeadTime: 14.1 },
    { month: 'Nov', onTimeDelivery: 24, totalDeliveries: 25, averageLeadTime: 13.6 },
    { month: 'Dec', onTimeDelivery: 29, totalDeliveries: 30, averageLeadTime: 14.2 }
  ];

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return theme.palette.success.main;
      case 'good': return theme.palette.info.main;
      case 'warning': return theme.palette.warning.main;
      case 'critical': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getTrendIcon = (trend: string, status: string) => {
    const color = getStatusColor(status);
    switch (trend) {
      case 'up': return <TrendingUpIcon sx={{ color }} />;
      case 'down': return <TrendingDownIcon sx={{ color }} />;
      default: return <TimelineIcon sx={{ color }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'major': return theme.palette.warning.main;
      case 'minor': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  // Chart data for delivery performance
  const deliveryChartData = {
    labels: deliveryPerformance.map(d => d.month),
    datasets: [
      {
        label: 'On-Time Delivery %',
        data: deliveryPerformance.map(d => (d.onTimeDelivery / d.totalDeliveries) * 100),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
      },
      {
        label: 'Target (95%)',
        data: Array(deliveryPerformance.length).fill(95),
        borderColor: theme.palette.error.main,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
      }
    ]
  };

  // Chart data for lead time
  const leadTimeChartData = {
    labels: deliveryPerformance.map(d => d.month),
    datasets: [
      {
        label: 'Average Lead Time (days)',
        data: deliveryPerformance.map(d => d.averageLeadTime),
        backgroundColor: theme.palette.secondary.light,
        borderColor: theme.palette.secondary.main,
        borderWidth: 1,
      }
    ]
  };

  // Quality distribution chart
  const qualityDistributionData = {
    labels: ['Excellent (5)', 'Good (4)', 'Average (3)', 'Poor (2)', 'Unacceptable (1)'],
    datasets: [
      {
        data: [45, 30, 15, 8, 2],
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main,
          theme.palette.error.light,
          theme.palette.error.main,
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const handleEditMetric = (metric: PerformanceMetric) => {
    setSelectedMetric(metric);
    setEditDialogOpen(true);
  };

  const handleSaveMetric = () => {
    if (selectedMetric) {
      setPerformanceMetrics(prev => 
        prev.map(m => m.id === selectedMetric.id ? selectedMetric : m)
      );
      setEditDialogOpen(false);
      setSelectedMetric(null);
    }
  };

  const renderOverviewTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Performance Metrics Cards */}
        {performanceMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} key={metric.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: `2px solid ${getStatusColor(metric.status)}`,
                borderRadius: 2
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {metric.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditMetric(metric)}
                    sx={{ mt: -1 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.unit}
                  </Typography>
                  <Box sx={{ ml: 'auto' }}>
                    {getTrendIcon(metric.trend, metric.status)}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  Target: {metric.target}{metric.unit}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={Math.min((metric.value / metric.target) * 100, 100)}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStatusColor(metric.status)
                    }
                  }}
                />

                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderChartsTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delivery Performance Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line 
                  data={deliveryChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Rating Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut 
                  data={qualityDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead Time Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={leadTimeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
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
    </Box>
  );

  const renderIncidentsTab = () => (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Quality Incidents
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
            >
              Report Incident
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Resolution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qualityIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>{incident.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={incident.severity}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(incident.severity),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>{incident.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={incident.status}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{incident.resolution}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading supplier performance data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${supplier.name} - Performance Analytics`}
        subtitle="Comprehensive supplier performance tracking and metrics"
        actions={
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              size="small"
            >
              Export Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/suppliers/${id}`)}
              size="small"
            >
              Back to Supplier
            </Button>
          </Box>
        }
      />

      {/* Supplier Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 60, height: 60, bgcolor: theme.palette.primary.main }}>
                {supplier.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {supplier.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Code: {supplier.code} | Contracted since: {supplier.contractedSince}
              </Typography>
            </Grid>
            <Grid item>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {supplier.overallRating}
                </Typography>
                <Rating value={supplier.overallRating} readOnly precision={0.1} />
                <Typography variant="caption" display="block">
                  Overall Rating
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {supplier.totalOrders}
                </Typography>
                <Typography variant="caption" display="block">
                  Total Orders
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {supplier.activeContracts}
                </Typography>
                <Typography variant="caption" display="block">
                  Active Contracts
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" icon={<AssessmentIcon />} />
          <Tab label="Charts & Trends" icon={<TimelineIcon />} />
          <Tab label="Quality Incidents" icon={<WarningIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderOverviewTab()}
      {tabValue === 1 && renderChartsTab()}
      {tabValue === 2 && renderIncidentsTab()}

      {/* Edit Metric Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Performance Metric</DialogTitle>
        <DialogContent>
          {selectedMetric && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Current Value"
                type="number"
                value={selectedMetric.value}
                onChange={(e) => setSelectedMetric({
                  ...selectedMetric,
                  value: parseFloat(e.target.value)
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Target Value"
                type="number"
                value={selectedMetric.target}
                onChange={(e) => setSelectedMetric({
                  ...selectedMetric,
                  target: parseFloat(e.target.value)
                })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedMetric.status}
                  onChange={(e) => setSelectedMetric({
                    ...selectedMetric,
                    status: e.target.value as any
                  })}
                  label="Status"
                >
                  <MenuItem value="excellent">Excellent</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={selectedMetric.description}
                onChange={(e) => setSelectedMetric({
                  ...selectedMetric,
                  description: e.target.value
                })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMetric} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierPerformance;
