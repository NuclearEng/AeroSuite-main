import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Avatar,
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
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  BugReport as BugReportIcon,
  VerifiedUser as VerifiedIcon,
  Science as ScienceIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';

interface QualityAudit {
  id: string;
  auditNumber: string;
  date: string;
  type: 'initial' | 'surveillance' | 'special' | 'follow-up';
  scope: string[];
  auditor: string;
  overallScore: number;
  findings: QualityFinding[];
  status: 'planned' | 'in-progress' | 'completed' | 'closed';
  nextAuditDate?: string;
}

interface QualityFinding {
  id: string;
  category: 'major' | 'minor' | 'observation';
  clause: string;
  description: string;
  evidence: string;
  correctiveAction?: string;
  targetDate?: string;
  status: 'open' | 'in-progress' | 'verified' | 'closed';
  responsiblePerson: string;
}

interface CertificationStatus {
  id: string;
  name: string;
  certifyingBody: string;
  issueDate: string;
  expiryDate: string;
  status: 'current' | 'expiring-soon' | 'expired' | 'suspended';
  scope: string;
  certificateNumber: string;
}

interface QualityMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
  category: 'defects' | 'delivery' | 'process' | 'customer';
}

const SupplierQuality: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<QualityAudit | null>(null);

  // Mock supplier data
  const supplier = {
    id: '1',
    name: 'Aerospace Components Ltd.',
    code: 'ACL001',
    qualityRating: 4.3,
    certificationLevel: 'AS9100 Rev D',
    riskLevel: 'Low'
  };

  // Mock quality metrics
  const [qualityMetrics] = useState<QualityMetric[]>([
    {
      id: '1',
      name: 'Defect Rate',
      value: 0.6,
      target: 1.0,
      unit: '%',
      trend: 'improving',
      category: 'defects'
    },
    {
      id: '2',
      name: 'On-Time Delivery',
      value: 96.5,
      target: 95.0,
      unit: '%',
      trend: 'stable',
      category: 'delivery'
    },
    {
      id: '3',
      name: 'Process Capability',
      value: 1.45,
      target: 1.33,
      unit: 'Cpk',
      trend: 'improving',
      category: 'process'
    },
    {
      id: '4',
      name: 'Customer Complaints',
      value: 2,
      target: 5,
      unit: 'per month',
      trend: 'improving',
      category: 'customer'
    }
  ]);

  // Mock quality audits
  const [qualityAudits] = useState<QualityAudit[]>([
    {
      id: '1',
      auditNumber: 'QA-2024-001',
      date: '2024-01-10',
      type: 'surveillance',
      scope: ['Quality Management', 'Production Control', 'Material Control'],
      auditor: 'Jane Smith, Lead Auditor',
      overallScore: 92,
      status: 'completed',
      nextAuditDate: '2024-07-10',
      findings: [
        {
          id: '1',
          category: 'minor',
          clause: '8.5.1',
          description: 'Work instruction revision control needs improvement',
          evidence: 'Several work instructions found without current revision dates',
          correctiveAction: 'Implement automated revision control system',
          targetDate: '2024-02-15',
          status: 'in-progress',
          responsiblePerson: 'Quality Manager'
        },
        {
          id: '2',
          category: 'observation',
          clause: '8.4.1',
          description: 'Supplier evaluation frequency could be enhanced',
          evidence: 'Current evaluation cycle is 12 months, best practice is 6 months',
          status: 'open',
          responsiblePerson: 'Procurement Manager'
        }
      ]
    },
    {
      id: '2',
      auditNumber: 'QA-2023-003',
      date: '2023-07-15',
      type: 'surveillance',
      scope: ['Document Control', 'Training', 'Customer Communication'],
      auditor: 'John Davis, Senior Auditor',
      overallScore: 89,
      status: 'closed',
      nextAuditDate: '2024-01-15',
      findings: [
        {
          id: '3',
          category: 'major',
          clause: '7.5.3',
          description: 'Documented information control process non-conformance',
          evidence: 'Obsolete documents found in production area',
          correctiveAction: 'Enhanced document control procedures implemented',
          targetDate: '2023-09-01',
          status: 'verified',
          responsiblePerson: 'Document Controller'
        }
      ]
    }
  ]);

  // Mock certifications
  const [certifications] = useState<CertificationStatus[]>([
    {
      id: '1',
      name: 'AS9100 Rev D',
      certifyingBody: 'BSI Group',
      issueDate: '2022-03-15',
      expiryDate: '2025-03-14',
      status: 'current',
      scope: 'Design, development, and manufacturing of aerospace components',
      certificateNumber: 'AS9100-2022-001'
    },
    {
      id: '2',
      name: 'ISO 14001:2015',
      certifyingBody: 'TUV Rheinland',
      issueDate: '2022-06-20',
      expiryDate: '2025-06-19',
      status: 'current',
      scope: 'Environmental management systems',
      certificateNumber: 'ISO14001-2022-002'
    },
    {
      id: '3',
      name: 'NADCAP - Heat Treatment',
      certifyingBody: 'PRI',
      issueDate: '2023-01-10',
      expiryDate: '2024-01-10',
      status: 'expiring-soon',
      scope: 'Heat treatment of aerospace materials',
      certificateNumber: 'NADCAP-HT-2023-001'
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
      case 'current': return 'success';
      case 'expiring-soon': return 'warning';
      case 'expired':
      case 'suspended': return 'error';
      case 'completed':
      case 'verified':
      case 'closed': return 'success';
      case 'in-progress': return 'info';
      case 'open': return 'warning';
      default: return 'default';
    }
  };

  const getFindingColor = (category: string) => {
    switch (category) {
      case 'major': return theme.palette.error.main;
      case 'minor': return theme.palette.warning.main;
      case 'observation': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon color="success" />;
      case 'declining': return <TrendingDownIcon color="error" />;
      default: return <LinearProgress variant="determinate" value={50} sx={{ width: 20 }} />;
    }
  };

  const handleViewAudit = (audit: QualityAudit) => {
    setSelectedAudit(audit);
    setAuditDialogOpen(true);
  };

  // Chart data for quality trends
  const qualityTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Quality Score',
        data: [87, 89, 91, 88, 92, 94],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
      },
      {
        label: 'Target (90)',
        data: Array(6).fill(90),
        borderColor: theme.palette.success.main,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
      }
    ]
  };

  // Defect category distribution
  const defectCategoryData = {
    labels: ['Material', 'Process', 'Design', 'Handling', 'Documentation'],
    datasets: [
      {
        data: [30, 40, 15, 10, 5],
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

  const renderOverviewTab = () => (
    <Box sx={{ mt: 3 }}>
      {/* Quality Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {qualityMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {metric.name}
                  </Typography>
                  <Box sx={{ ml: 'auto' }}>
                    {getTrendIcon(metric.trend)}
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
                      backgroundColor: metric.trend === 'improving' ? theme.palette.success.main : 
                                       metric.trend === 'declining' ? theme.palette.error.main : 
                                       theme.palette.info.main
                    }
                  }}
                />

                <Chip
                  label={metric.category}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1, textTransform: 'capitalize' }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Audits */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Recent Quality Audits
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} size="small">
              Schedule Audit
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Audit #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Findings</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qualityAudits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>{audit.auditNumber}</TableCell>
                    <TableCell>{format(new Date(audit.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={audit.type}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={audit.scope.join(', ')}>
                        <Typography variant="body2">
                          {audit.scope.length} areas
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="h6" color="primary" sx={{ mr: 1 }}>
                          {audit.overallScore}%
                        </Typography>
                        <Rating value={audit.overallScore / 20} readOnly size="small" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={audit.findings.length} color="warning">
                        <BugReportIcon color="action" />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={audit.status}
                        color={getStatusColor(audit.status) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewAudit(audit)} size="small">
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderCertificationsTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {certifications.map((cert) => (
          <Grid item xs={12} md={6} key={cert.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: cert.status === 'expiring-soon' ? `2px solid ${theme.palette.warning.main}` : 'none'
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6">
                    {cert.name}
                  </Typography>
                  <Chip
                    label={cert.status.replace('-', ' ')}
                    color={getStatusColor(cert.status) as any}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>

                <Box sx={{ '& > div': { mb: 1 } }}>
                  <Typography variant="body2">
                    <strong>Certifying Body:</strong> {cert.certifyingBody}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Certificate #:</strong> {cert.certificateNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Issue Date:</strong> {format(new Date(cert.issueDate), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Expiry Date:</strong> {format(new Date(cert.expiryDate), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Scope:</strong> {cert.scope}
                  </Typography>
                </Box>

                {cert.status === 'expiring-soon' && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Certificate expires in {Math.ceil((new Date(cert.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </Alert>
                )}

                <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                  <Button size="small" variant="outlined">
                    View Certificate
                  </Button>
                  <Button size="small" variant="outlined">
                    Renew
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Performance Trend
              </Typography>
              <Box sx={{ height: 300 }}>
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

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Defect Categories
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut 
                  data={defectCategoryData}
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
                Quality Performance Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      94.2%
                    </Typography>
                    <Typography variant="caption">
                      First Pass Yield
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      0.6%
                    </Typography>
                    <Typography variant="caption">
                      Defect Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary.main">
                      1.45
                    </Typography>
                    <Typography variant="caption">
                      Process Capability (Cpk)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      2.1 days
                    </Typography>
                    <Typography variant="caption">
                      Avg. Correction Time
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading supplier quality data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${supplier.name} - Quality Management`}
        subtitle="Comprehensive quality tracking, audits, and certifications"
        actions={
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<DownloadIcon />} size="small">
              Quality Report
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

      {/* Quality Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 60, height: 60, bgcolor: theme.palette.primary.main }}>
                <VerifiedIcon fontSize="large" />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {supplier.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certification Level: {supplier.certificationLevel} | Risk Level: {supplier.riskLevel}
              </Typography>
            </Grid>
            <Grid item>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {supplier.qualityRating}
                </Typography>
                <Rating value={supplier.qualityRating} readOnly precision={0.1} />
                <Typography variant="caption" display="block">
                  Quality Rating
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Badge badgeContent={certifications.filter(c => c.status === 'expiring-soon').length} color="warning">
                <Chip label="Certifications" variant="outlined" />
              </Badge>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quality Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" icon={<AssessmentIcon />} />
          <Tab label="Certifications" icon={<VerifiedIcon />} />
          <Tab label="Analytics" icon={<ScienceIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderOverviewTab()}
      {tabValue === 1 && renderCertificationsTab()}
      {tabValue === 2 && renderAnalyticsTab()}

      {/* Audit Details Dialog */}
      <Dialog 
        open={auditDialogOpen} 
        onClose={() => setAuditDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Audit Details - {selectedAudit?.auditNumber}
        </DialogTitle>
        <DialogContent>
          {selectedAudit && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Audit Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Date:</strong> {format(new Date(selectedAudit.date), 'PPP')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedAudit.type}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Auditor:</strong> {selectedAudit.auditor}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Overall Score:</strong> {selectedAudit.overallScore}%
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Scope Areas
              </Typography>
              <Box sx={{ mb: 3 }}>
                {selectedAudit.scope.map((area, index) => (
                  <Chip key={index} label={area} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                Findings ({selectedAudit.findings.length})
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Clause</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedAudit.findings.map((finding) => (
                      <TableRow key={finding.id}>
                        <TableCell>
                          <Chip
                            label={finding.category}
                            size="small"
                            sx={{
                              backgroundColor: getFindingColor(finding.category),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>{finding.clause}</TableCell>
                        <TableCell>{finding.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={finding.status}
                            color={getStatusColor(finding.status) as any}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierQuality;
