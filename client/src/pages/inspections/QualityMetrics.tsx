import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Divider,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Filter as FilterIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  BugReport as BugReportIcon,
  VerifiedUser as VerifiedIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

interface QualityMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  category: 'performance' | 'reliability' | 'compliance' | 'efficiency';
  description: string;
  lastUpdated: string;
}

interface QualityIncident {
  id: string;
  date: string;
  type: 'defect' | 'non-compliance' | 'process-deviation' | 'safety';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  affectedProducts: string[];
  rootCause?: string;
  correctiveAction?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo: string;
}

interface SupplierQualityRating {
  supplierId: string;
  supplierName: string;
  overallRating: number;
  defectRate: number;
  onTimeDelivery: number;
  complianceScore: number;
  responseTime: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

const QualityMetrics: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock quality metrics data
  const [qualityMetrics] = useState<QualityMetric[]>([
    {
      id: '1',
      name: 'First Pass Yield',
      value: 94.2,
      target: 95.0,
      unit: '%',
      trend: 'up',
      status: 'good',
      category: 'performance',
      description: 'Percentage of products passing inspection on first attempt',
      lastUpdated: '2024-01-25'
    },
    {
      id: '2',
      name: 'Defect Rate',
      value: 0.8,
      target: 1.0,
      unit: '%',
      trend: 'down',
      status: 'excellent',
      category: 'reliability',
      description: 'Percentage of products with quality defects',
      lastUpdated: '2024-01-25'
    },
    {
      id: '3',
      name: 'Inspection Efficiency',
      value: 87.5,
      target: 90.0,
      unit: '%',
      trend: 'stable',
      status: 'warning',
      category: 'efficiency',
      description: 'Ratio of planned vs actual inspection time',
      lastUpdated: '2024-01-25'
    },
    {
      id: '4',
      name: 'Compliance Score',
      value: 98.7,
      target: 99.0,
      unit: '%',
      trend: 'up',
      status: 'excellent',
      category: 'compliance',
      description: 'Adherence to regulatory and internal standards',
      lastUpdated: '2024-01-25'
    },
    {
      id: '5',
      name: 'Corrective Action Time',
      value: 3.2,
      target: 3.0,
      unit: 'days',
      trend: 'up',
      status: 'warning',
      category: 'efficiency',
      description: 'Average time to implement corrective actions',
      lastUpdated: '2024-01-25'
    },
    {
      id: '6',
      name: 'Customer Satisfaction',
      value: 4.6,
      target: 4.5,
      unit: '/5',
      trend: 'up',
      status: 'excellent',
      category: 'performance',
      description: 'Average customer quality rating',
      lastUpdated: '2024-01-25'
    }
  ]);

  // Mock quality incidents
  const [qualityIncidents] = useState<QualityIncident[]>([
    {
      id: '1',
      date: '2024-01-20',
      type: 'defect',
      severity: 'major',
      description: 'Surface finish not meeting specification on turbine blades',
      affectedProducts: ['TRB-001', 'TRB-002'],
      rootCause: 'Machining parameter drift',
      correctiveAction: 'Recalibrated CNC machines, updated inspection frequency',
      status: 'resolved',
      assignedTo: 'Quality Team A'
    },
    {
      id: '2',
      date: '2024-01-18',
      type: 'non-compliance',
      severity: 'critical',
      description: 'Missing material certificates for aerospace-grade titanium',
      affectedProducts: ['MAT-TI-001'],
      rootCause: 'Supplier documentation process gap',
      correctiveAction: 'Enhanced supplier audit protocol',
      status: 'closed',
      assignedTo: 'Compliance Officer'
    },
    {
      id: '3',
      date: '2024-01-22',
      type: 'process-deviation',
      severity: 'minor',
      description: 'Heat treatment temperature variance outside tolerance',
      affectedProducts: ['HTR-001', 'HTR-002', 'HTR-003'],
      status: 'investigating',
      assignedTo: 'Process Engineer'
    }
  ]);

  // Mock supplier quality ratings
  const [supplierRatings] = useState<SupplierQualityRating[]>([
    {
      supplierId: '1',
      supplierName: 'Aerospace Components Ltd.',
      overallRating: 4.3,
      defectRate: 0.6,
      onTimeDelivery: 96.5,
      complianceScore: 98.2,
      responseTime: 4.1,
      improvementTrend: 'improving'
    },
    {
      supplierId: '2',
      supplierName: 'Precision Manufacturing Inc.',
      overallRating: 4.1,
      defectRate: 0.9,
      onTimeDelivery: 94.2,
      complianceScore: 97.8,
      responseTime: 5.2,
      improvementTrend: 'stable'
    },
    {
      supplierId: '3',
      supplierName: 'Advanced Materials Corp.',
      overallRating: 3.8,
      defectRate: 1.2,
      onTimeDelivery: 91.8,
      complianceScore: 96.5,
      responseTime: 6.8,
      improvementTrend: 'declining'
    }
  ]);

  useEffect(() => {
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'major': return theme.palette.warning.main;
      case 'minor': return theme.palette.info.main;
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

  const filteredMetrics = qualityMetrics.filter(metric => 
    categoryFilter === 'all' || metric.category === categoryFilter
  );

  // Chart data for quality trends
  const qualityTrendData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'First Pass Yield (%)',
        data: [92.1, 93.4, 94.8, 93.2, 94.1, 94.2],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
      },
      {
        label: 'Target (95%)',
        data: Array(6).fill(95),
        borderColor: theme.palette.error.main,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
      }
    ]
  };

  // Defect distribution chart
  const defectDistributionData = {
    labels: ['Surface Defects', 'Dimensional', 'Material', 'Assembly', 'Documentation'],
    datasets: [
      {
        data: [35, 25, 15, 20, 5],
        backgroundColor: [
          theme.palette.error.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.success.main,
          theme.palette.grey[400],
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // Supplier quality radar chart
  const supplierRadarData = {
    labels: ['Defect Rate', 'On-Time Delivery', 'Compliance', 'Response Time', 'Overall Rating'],
    datasets: supplierRatings.slice(0, 3).map((supplier, index) => ({
      label: supplier.supplierName,
      data: [
        100 - supplier.defectRate * 10, // Invert for better visualization
        supplier.onTimeDelivery,
        supplier.complianceScore,
        100 - supplier.responseTime * 10, // Invert for better visualization
        supplier.overallRating * 20
      ],
      backgroundColor: `${[theme.palette.primary.main, theme.palette.secondary.main, theme.palette.info.main][index]}20`,
      borderColor: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.info.main][index],
      borderWidth: 2,
    }))
  };

  const renderOverviewTab = () => (
    <Box sx={{ mt: 3 }}>
      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {filteredMetrics.map((metric) => (
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
                  <Box sx={{ ml: 'auto' }}>
                    {getTrendIcon(metric.trend, metric.status)}
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.unit}
                  </Typography>
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

                <Box display="flex" justifyContent="between" alignItems="center" mt={1}>
                  <Chip
                    label={metric.category}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Updated: {metric.lastUpdated}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Quality Incidents */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Recent Quality Incidents
            </Typography>
            <Button variant="outlined" size="small">
              View All
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qualityIncidents.slice(0, 5).map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>{incident.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={incident.type.replace('-', ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
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
                        color={incident.status === 'closed' ? 'success' : 
                               incident.status === 'resolved' ? 'info' : 'warning'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{incident.assignedTo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Quality Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Performance Trend
              </Typography>
              <Box sx={{ height: 350 }}>
                <Line 
                  data={qualityTrendData} 
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

        {/* Defect Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Defect Type Distribution
              </Typography>
              <Box sx={{ height: 350 }}>
                <Doughnut 
                  data={defectDistributionData}
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

        {/* Supplier Quality Comparison */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Supplier Quality Comparison
              </Typography>
              <Box sx={{ height: 400 }}>
                <Radar
                  data={supplierRadarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      r: {
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
      </Grid>
    </Box>
  );

  const renderSuppliersTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {supplierRatings.map((supplier) => (
          <Grid item xs={12} md={4} key={supplier.supplierId}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main, mr: 2 }}>
                    {supplier.supplierName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {supplier.supplierName}
                    </Typography>
                    <Rating value={supplier.overallRating} readOnly precision={0.1} size="small" />
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ '& > div': { mb: 1 } }}>
                  <Box display="flex" justifyContent="between">
                    <Typography variant="body2">Defect Rate:</Typography>
                    <Typography variant="body2" color={supplier.defectRate <= 1 ? 'success.main' : 'warning.main'}>
                      {supplier.defectRate}%
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="between">
                    <Typography variant="body2">On-Time Delivery:</Typography>
                    <Typography variant="body2" color={supplier.onTimeDelivery >= 95 ? 'success.main' : 'warning.main'}>
                      {supplier.onTimeDelivery}%
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="between">
                    <Typography variant="body2">Compliance Score:</Typography>
                    <Typography variant="body2" color={supplier.complianceScore >= 98 ? 'success.main' : 'warning.main'}>
                      {supplier.complianceScore}%
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="between">
                    <Typography variant="body2">Response Time:</Typography>
                    <Typography variant="body2" color={supplier.responseTime <= 4 ? 'success.main' : 'warning.main'}>
                      {supplier.responseTime} hrs
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="between" alignItems="center">
                  <Chip
                    label={`${supplier.improvementTrend}`}
                    size="small"
                    color={
                      supplier.improvementTrend === 'improving' ? 'success' :
                      supplier.improvementTrend === 'declining' ? 'error' : 'default'
                    }
                    sx={{ textTransform: 'capitalize' }}
                  />
                  <Button size="small" variant="outlined">
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading quality metrics...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Quality Metrics Dashboard"
        subtitle="Comprehensive quality performance tracking and analytics"
        actions={
          <Box display="flex" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="reliability">Reliability</MenuItem>
                <MenuItem value="compliance">Compliance</MenuItem>
                <MenuItem value="efficiency">Efficiency</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Period"
              >
                <MenuItem value="1month">1 Month</MenuItem>
                <MenuItem value="3months">3 Months</MenuItem>
                <MenuItem value="6months">6 Months</MenuItem>
                <MenuItem value="1year">1 Year</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<RefreshIcon />}>
              Refresh
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Export
            </Button>
          </Box>
        }
      />

      {/* Quality Status Summary */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2">
          Quality Status: Overall performance is <strong>Good</strong> with 94.2% first pass yield. 
          Focus areas: Inspection efficiency improvement needed to reach 90% target.
        </Typography>
      </Alert>

      {/* Quality Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" icon={<AssessmentIcon />} />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
          <Tab label="Supplier Quality" icon={<VerifiedIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderOverviewTab()}
      {tabValue === 1 && renderAnalyticsTab()}
      {tabValue === 2 && renderSuppliersTab()}
    </Box>
  );
};

export default QualityMetrics;
