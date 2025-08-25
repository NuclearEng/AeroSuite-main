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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  useTheme,
  Alert,
  Divider,
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
  Rating,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  PhotoCamera as PhotoIcon,
  AttachFile as AttachFileIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { format } from 'date-fns';

interface InspectionItem {
  id: string;
  checklistItem: string;
  requirement: string;
  result: 'pass' | 'fail' | 'na' | 'pending';
  notes?: string;
  evidence?: string[];
  inspector: string;
  timestamp: string;
}

interface Inspection {
  id: string;
  inspectionNumber: string;
  type: 'source' | 'receiving' | 'in-process' | 'final' | 'audit';
  status: 'scheduled' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  supplier: {
    id: string;
    name: string;
    contact: string;
  };
  part: {
    partNumber: string;
    description: string;
    specification: string;
    quantity: number;
  };
  inspector: {
    name: string;
    certification: string;
    email: string;
  };
  scheduledDate: string;
  actualStartDate?: string;
  completedDate?: string;
  location: string;
  overallResult?: 'pass' | 'fail' | 'conditional';
  overallScore?: number;
  items: InspectionItem[];
  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedDate: string;
  }[];
  notes?: string;
  nextAction?: string;
}

const InspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Mock inspection data
  const [inspection, setInspection] = useState<Inspection>({
    id: '1',
    inspectionNumber: 'INS-2024-001',
    type: 'source',
    status: 'completed',
    priority: 'high',
    supplier: {
      id: '1',
      name: 'Aerospace Components Ltd.',
      contact: 'Michael Johnson'
    },
    part: {
      partNumber: 'ACL-TRB-001',
      description: 'Turbine Blade Assembly',
      specification: 'AS9100 Rev D compliant, Ti-6Al-4V material',
      quantity: 50
    },
    inspector: {
      name: 'Sarah Chen',
      certification: 'ASQ CQI, Level II',
      email: 'sarah.chen@aerosuite.com'
    },
    scheduledDate: '2024-01-15T09:00:00',
    actualStartDate: '2024-01-15T09:15:00',
    completedDate: '2024-01-15T14:30:00',
    location: 'Supplier Facility - Bay 3',
    overallResult: 'pass',
    overallScore: 92,
    items: [
      {
        id: '1',
        checklistItem: 'Material Certification',
        requirement: 'Material certificates must be provided for all raw materials',
        result: 'pass',
        notes: 'All Ti-6Al-4V certificates verified and comply with AMS 4911',
        evidence: ['cert-001.pdf', 'material-test-report.pdf'],
        inspector: 'Sarah Chen',
        timestamp: '2024-01-15T09:30:00'
      },
      {
        id: '2',
        checklistItem: 'Dimensional Inspection',
        requirement: 'Critical dimensions within ±0.002" tolerance',
        result: 'pass',
        notes: 'All dimensions measured within specification. CMM report attached.',
        evidence: ['cmm-report-001.pdf'],
        inspector: 'Sarah Chen',
        timestamp: '2024-01-15T11:00:00'
      },
      {
        id: '3',
        checklistItem: 'Surface Finish',
        requirement: 'Surface roughness Ra ≤ 32 μin on critical surfaces',
        result: 'fail',
        notes: 'Three samples exceeded roughness specification. Rework required.',
        evidence: ['surface-roughness-001.jpg', 'surface-roughness-002.jpg'],
        inspector: 'Sarah Chen',
        timestamp: '2024-01-15T12:15:00'
      },
      {
        id: '4',
        checklistItem: 'Heat Treatment Verification',
        requirement: 'Heat treatment per AMS 2801 with hardness 36-42 HRC',
        result: 'pass',
        notes: 'Hardness testing shows 38-40 HRC across all samples',
        evidence: ['heat-treatment-cert.pdf'],
        inspector: 'Sarah Chen',
        timestamp: '2024-01-15T13:45:00'
      },
      {
        id: '5',
        checklistItem: 'Documentation Review',
        requirement: 'Process sheets, test reports, and quality records complete',
        result: 'pass',
        notes: 'All required documentation present and properly signed',
        evidence: ['process-sheets.pdf', 'quality-records.pdf'],
        inspector: 'Sarah Chen',
        timestamp: '2024-01-15T14:00:00'
      }
    ],
    documents: [
      {
        id: '1',
        name: 'Inspection Checklist',
        type: 'PDF',
        url: '/documents/inspection-checklist-001.pdf',
        uploadedBy: 'Sarah Chen',
        uploadedDate: '2024-01-15T09:00:00'
      },
      {
        id: '2',
        name: 'CMM Measurement Report',
        type: 'PDF',
        url: '/documents/cmm-report-001.pdf',
        uploadedBy: 'Sarah Chen',
        uploadedDate: '2024-01-15T11:30:00'
      },
      {
        id: '3',
        name: 'Final Inspection Report',
        type: 'PDF',
        url: '/documents/final-inspection-001.pdf',
        uploadedBy: 'Sarah Chen',
        uploadedDate: '2024-01-15T14:45:00'
      }
    ],
    notes: 'Overall inspection successful with one non-conformance requiring rework. Supplier has 5 business days to complete surface finish correction.',
    nextAction: 'Follow-up inspection scheduled for January 22, 2024 to verify rework completion.'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'scheduled': return 'info';
      case 'on-hold': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'pass': return 'success';
      case 'fail': return 'error';
      case 'na': return 'default';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'pass': return <CheckCircleIcon color="success" />;
      case 'fail': return <ErrorIcon color="error" />;
      case 'pending': return <ScheduleIcon color="warning" />;
      default: return <WarningIcon color="action" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const getInspectionSteps = () => [
    'Scheduled',
    'In Progress',
    'Under Review',
    'Completed'
  ];

  const getActiveStep = (status: string) => {
    const statusMap: Record<string, number> = {
      'scheduled': 0,
      'in-progress': 1,
      'completed': 3,
      'on-hold': 1,
      'cancelled': 0
    };
    return statusMap[status] || 0;
  };

  const handleAddNote = () => {
    // Add note logic here
    setNoteDialogOpen(false);
    setNewNote('');
  };

  const renderOverviewTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Inspection Progress */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inspection Progress
              </Typography>
              <Stepper activeStep={getActiveStep(inspection.status)} orientation="horizontal">
                {getInspectionSteps().map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Inspection Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inspection Information
              </Typography>
              
              <Box sx={{ '& > div': { mb: 2 } }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    <strong>Type:</strong> {inspection.type.replace('-', ' ').toUpperCase()}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    <strong>Scheduled:</strong> {format(new Date(inspection.scheduledDate), 'PPP p')}
                  </Typography>
                </Box>
                
                {inspection.actualStartDate && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Started:</strong> {format(new Date(inspection.actualStartDate), 'PPP p')}
                    </Typography>
                  </Box>
                )}
                
                {inspection.completedDate && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2">
                      <strong>Completed:</strong> {format(new Date(inspection.completedDate), 'PPP p')}
                    </Typography>
                  </Box>
                )}
                
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    <strong>Location:</strong> {inspection.location}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    <strong>Inspector:</strong> {inspection.inspector.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({inspection.inspector.certification})
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {inspection.overallResult && (
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Typography variant="subtitle1">
                    <strong>Overall Result:</strong>
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={inspection.overallResult.toUpperCase()}
                      color={getResultColor(inspection.overallResult) as any}
                      icon={getResultIcon(inspection.overallResult)}
                    />
                    {inspection.overallScore && (
                      <Typography variant="h6" color="primary">
                        {inspection.overallScore}%
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Part Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Part Information
              </Typography>
              
              <Box sx={{ '& > div': { mb: 1 } }}>
                <Typography variant="body2">
                  <strong>Part Number:</strong> {inspection.part.partNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Description:</strong> {inspection.part.description}
                </Typography>
                <Typography variant="body2">
                  <strong>Specification:</strong> {inspection.part.specification}
                </Typography>
                <Typography variant="body2">
                  <strong>Quantity:</strong> {inspection.part.quantity}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Supplier Information
              </Typography>
              
              <Box sx={{ '& > div': { mb: 1 } }}>
                <Typography variant="body2">
                  <strong>Supplier:</strong> {inspection.supplier.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Contact:</strong> {inspection.supplier.contact}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes and Next Actions */}
        {(inspection.notes || inspection.nextAction) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes & Actions
                </Typography>
                
                {inspection.notes && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Inspector Notes:
                    </Typography>
                    <Typography variant="body2">
                      {inspection.notes}
                    </Typography>
                  </Alert>
                )}
                
                {inspection.nextAction && (
                  <Alert severity="warning">
                    <Typography variant="subtitle2" gutterBottom>
                      Next Action Required:
                    </Typography>
                    <Typography variant="body2">
                      {inspection.nextAction}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderChecklistTab = () => (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Inspection Checklist ({inspection.items.length} items)
            </Typography>
            <Button variant="outlined" size="small" onClick={() => setNoteDialogOpen(true)}>
              Add Note
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Requirement</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Inspector</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Evidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspection.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {item.checklistItem}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.requirement}
                      </Typography>
                      {item.notes && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Notes: {item.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.result.toUpperCase()}
                        color={getResultColor(item.result) as any}
                        icon={getResultIcon(item.result)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.inspector}</TableCell>
                    <TableCell>{format(new Date(item.timestamp), 'MMM dd, HH:mm')}</TableCell>
                    <TableCell>
                      {item.evidence && item.evidence.length > 0 && (
                        <Badge badgeContent={item.evidence.length} color="primary">
                          <AttachFileIcon color="action" />
                        </Badge>
                      )}
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

  const renderDocumentsTab = () => (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inspection Documents ({inspection.documents.length})
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Uploaded By</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspection.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AttachFileIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="subtitle2">
                          {doc.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={doc.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{doc.uploadedBy}</TableCell>
                    <TableCell>{format(new Date(doc.uploadedDate), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <DownloadIcon />
                      </IconButton>
                      <IconButton size="small">
                        <ShareIcon />
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading inspection details...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Inspection ${inspection.inspectionNumber}`}
        subtitle={`${inspection.type.replace('-', ' ').toUpperCase()} inspection for ${inspection.part.partNumber}`}
        actions={
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<PrintIcon />} size="small">
              Print Report
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} size="small">
              Download PDF
            </Button>
            <Button variant="outlined" startIcon={<EditIcon />} size="small">
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/inspections')}
              size="small"
            >
              Back to Inspections
            </Button>
          </Box>
        }
      />

      {/* Status Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 60, height: 60, bgcolor: theme.palette.primary.main }}>
                <AssignmentIcon fontSize="large" />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {inspection.inspectionNumber}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={inspection.status.replace('-', ' ').toUpperCase()}
                  color={getStatusColor(inspection.status) as any}
                />
                <Chip
                  label={inspection.priority.toUpperCase()}
                  sx={{
                    backgroundColor: getPriorityColor(inspection.priority),
                    color: 'white'
                  }}
                />
                <Chip
                  label={inspection.type.replace('-', ' ').toUpperCase()}
                  variant="outlined"
                />
              </Box>
            </Grid>
            {inspection.overallResult && (
              <Grid item>
                <Box textAlign="center">
                  <Typography variant="h4" color={getResultColor(inspection.overallResult) + '.main'}>
                    {inspection.overallScore}%
                  </Typography>
                  <Typography variant="caption" display="block">
                    Overall Score
                  </Typography>
                  <Rating value={inspection.overallScore ? inspection.overallScore / 20 : 0} readOnly />
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Inspection Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Checklist" />
          <Tab label="Documents" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderOverviewTab()}
      {tabValue === 1 && renderChecklistTab()}
      {tabValue === 2 && renderDocumentsTab()}

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Inspector Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter inspection note..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">Add Note</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InspectionDetail;