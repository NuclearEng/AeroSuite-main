import React, { ChangeEvent, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Stack } from
'@mui/material';
import {
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon } from
'@mui/icons-material';
import { format } from 'date-fns';
import useQualityManagement from '../hooks/useQualityManagement';
import LoadingIndicator from '../../../components/common/LoadingIndicator';
import ErrorAlert from '../../../components/common/ErrorAlert';
import StatusChip from '../../../components/common/StatusChip';
import LineChart from '../../../components/common/LineChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`qms-tabpanel-${index}`}
      aria-labelledby={`qms-tab-${index}`}
      {...other}>

      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>);

};

const QualityManagement: React.FC = () => {
  const { supplierId } = useParams<{supplierId: string;}>();
  const {
    qmsData,
    complianceSummary,
    loading,
    error,
    fetchQMS,
    fetchComplianceSummary,
    updateMetric,
    addNonConformance,
    updateNonConformance,
    addQualityDocument,
    deleteQualityDocument,
    syncAudits
  } = useQualityManagement();

  const [tabValue, setTabValue] = useState(0);
  const [openMetricDialog, setOpenMetricDialog] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<any>('');
  const [metricValue, setMetricValue] = useState<any>(0);
  const [openNcDialog, setOpenNcDialog] = useState(false);
  const [ncFormData, setNcFormData] = useState({
    description: '',
    severity: 'minor',
    category: 'product',
    reportedBy: ''
  });
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [docFormData, setDocFormData] = useState({
    name: '',
    description: '',
    type: 'procedure',
    url: '',
    version: ''
  });

  useEffect(() => {
    if (supplierId) {
      fetchQMS(supplierId);
      fetchComplianceSummary(supplierId);
    }
  }, [supplierId, fetchQMS, fetchComplianceSummary]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefreshData = () => {
    if (supplierId) {
      fetchQMS(supplierId);
      fetchComplianceSummary(supplierId);
    }
  };

  const handleSyncAudits = async () => {
    if (supplierId) {
      await syncAudits(supplierId);
    }
  };

  // Metric dialog handlers
  const handleOpenMetricDialog = (metricName: string, currentValue: number) => {
    setCurrentMetric(metricName);
    setMetricValue(currentValue);
    setOpenMetricDialog(true);
  };

  const handleCloseMetricDialog = () => {
    setOpenMetricDialog(false);
  };

  const handleUpdateMetric = async () => {
    if (supplierId && currentMetric) {
      await updateMetric(supplierId, currentMetric, metricValue);
      setOpenMetricDialog(false);
    }
  };

  // Non-conformance dialog handlers
  const handleOpenNcDialog = () => {
    setNcFormData({
      description: '',
      severity: 'minor',
      category: 'product',
      reportedBy: ''
    });
    setOpenNcDialog(true);
  };

  const handleCloseNcDialog = () => {
    setOpenNcDialog(false);
  };

  const handleNcFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNcFormData({
      ...ncFormData,
      [name]: value
    });
  };

  const handleAddNonConformance = async () => {
    if (supplierId) {
      await addNonConformance(supplierId, ncFormData);
      setOpenNcDialog(false);
    }
  };

  // Document dialog handlers
  const handleOpenDocDialog = () => {
    setDocFormData({
      name: '',
      description: '',
      type: 'procedure',
      url: '',
      version: ''
    });
    setOpenDocDialog(true);
  };

  const handleCloseDocDialog = () => {
    setOpenDocDialog(false);
  };

  const handleDocFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDocFormData({
      ...docFormData,
      [name]: value
    });
  };

  const handleAddDocument = async () => {
    if (supplierId) {
      await addQualityDocument(supplierId, docFormData);
      setOpenDocDialog(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (supplierId && window.confirm('Are you sure you want to delete this document?')) {
      await deleteQualityDocument(supplierId, documentId);
    }
  };

  const RenderCertificationStatus = () => {
    if (!qmsData) return null;

    const { qmsType, qmsCertification } = qmsData;
    const statusColors = {
      active: 'success',
      expired: 'error',
      suspended: 'warning',
      pending: 'info',
      'not-applicable': 'default'
    };

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">QMS Certification</Typography>
            <Chip
              label={qmsCertification.status}
              color={statusColors[qmsCertification.status] as any}
              size="small" />

          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">QMS Type</Typography>
              <Typography variant="body1">{qmsType}</Typography>
            </Grid>
            {qmsCertification.certificationNumber &&
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Certificate Number</Typography>
                <Typography variant="body1">{qmsCertification.certificationNumber}</Typography>
              </Grid>
            }
            {qmsCertification.issuer &&
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Issuer</Typography>
                <Typography variant="body1">{qmsCertification.issuer}</Typography>
              </Grid>
            }
            {qmsCertification.issueDate &&
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Issue Date</Typography>
                <Typography variant="body1">
                  {format(new Date(qmsCertification.issueDate), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
            }
            {qmsCertification.expiryDate &&
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Expiry Date</Typography>
                <Typography variant="body1">
                  {format(new Date(qmsCertification.expiryDate), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
            }
          </Grid>
          {qmsCertification.documentUrl &&
          <Button
            variant="text"
            href={qmsCertification.documentUrl}
            target="_blank"
            sx={{ mt: 2 }}>

              View Certificate
            </Button>
          }
        </CardContent>
      </Card>);

  };

  const RenderComplianceSummary = () => {
    if (!complianceSummary) return null;

    const statusColors = {
      compliant: 'success',
      'minor-issues': 'warning',
      'major-issues': 'error',
      'non-compliant': 'error',
      'pending-review': 'info'
    };

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Compliance Summary</Typography>
            <Chip
              label={complianceSummary.complianceStatus}
              color={statusColors[complianceSummary.complianceStatus as keyof typeof statusColors] as any}
              size="small" />

          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary">Compliance Score</Typography>
              <Typography variant="h6">{complianceSummary.complianceScore}/100</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary">Open Non-Conformances</Typography>
              <Typography variant="h6">{complianceSummary.openNonConformances.count}</Typography>
              {complianceSummary.openNonConformances.count > 0 &&
              <Typography variant="caption" color="text.secondary">
                  Critical: {complianceSummary.openNonConformances.critical}, 
                  Major: {complianceSummary.openNonConformances.major}, 
                  Minor: {complianceSummary.openNonConformances.minor}
                </Typography>
              }
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="textSecondary">Active Improvement Plans</Typography>
              <Typography variant="h6">{complianceSummary.activeImprovementPlans}</Typography>
            </Grid>
            {complianceSummary.lastReviewDate &&
            <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="textSecondary">Last Review</Typography>
                <Typography variant="body1">
                  {format(new Date(complianceSummary.lastReviewDate), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
            }
            {complianceSummary.nextReviewDate &&
            <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="textSecondary">Next Review</Typography>
                <Typography variant="body1">
                  {format(new Date(complianceSummary.nextReviewDate), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
            }
          </Grid>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={handleSyncAudits}
            sx={{ mt: 2 }}>

            Sync with Audits
          </Button>
        </CardContent>
      </Card>);

  };

  const RenderQualityMetrics = () => {
    if (!qmsData || !qmsData.qualityMetrics) return null;

    const metrics = qmsData.qualityMetrics;
    const metricDisplayNames = {
      defectRate: 'Defect Rate',
      firstTimeYield: 'First Time Yield',
      onTimeDelivery: 'On-Time Delivery',
      ncmrCount: 'NCMR Count',
      correctionResponseTime: 'Correction Response Time'
    };

    return (
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Quality Metrics</Typography>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={handleRefreshData}>

            Refresh
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {Object.entries(metrics).map(([key, metric]: any) =>
          <Grid item xs={12} md={6} lg={4} key={key}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {metricDisplayNames[key as keyof typeof metricDisplayNames]}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="textSecondary">Current</Typography>
                    <Typography variant="h6" color={metric.current <= metric.target ? 'success.main' : 'error.main'}>
                      {metric.current}
                      {key === 'firstTimeYield' || key === 'onTimeDelivery' ? '%' : ''}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="textSecondary">Target</Typography>
                    <Typography variant="body1">
                      {metric.target}
                      {key === 'firstTimeYield' || key === 'onTimeDelivery' ? '%' : ''}
                    </Typography>
                  </Box>
                  
                  {metric.history && metric.history.length > 0 &&
                <Box height={100} mt={2}>
                      <LineChart
                    data={metric.history.map((h: any) => ({
                      x: new Date(h.date),
                      y: h.value
                    }))}
                    color={metric.current <= metric.target ? '#4caf50' : '#f44336'} />

                    </Box>
                }
                  
                  <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenMetricDialog(key, metric.current)}
                  sx={{ mt: 2 }}>

                    Update
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </>);

  };

  const RenderNonConformances = () => {
    if (!qmsData || !qmsData.nonConformances) return null;

    const { nonConformances } = qmsData;
    const statusColors = {
      open: 'error',
      'in-progress': 'warning',
      closed: 'success',
      verified: 'success'
    };
    const severityColors = {
      critical: 'error',
      major: 'error',
      minor: 'warning',
      observation: 'info'
    };

    return (
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Non-Conformances</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={handleOpenNcDialog}>

            Add New
          </Button>
        </Box>
        
        {nonConformances.length === 0 ?
        <Alert severity="info">No non-conformances recorded</Alert> :

        <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>NC Number</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reported Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nonConformances.map((nc: any) =>
              <TableRow key={nc.ncNumber}>
                    <TableCell>{nc.ncNumber}</TableCell>
                    <TableCell>{nc.description}</TableCell>
                    <TableCell>
                      <Chip
                    label={nc.severity}
                    color={severityColors[nc.severity as keyof typeof severityColors] as any}
                    size="small" />

                    </TableCell>
                    <TableCell>{nc.category}</TableCell>
                    <TableCell>
                      <Chip
                    label={nc.status}
                    color={statusColors[nc.status as keyof typeof statusColors] as any}
                    size="small" />

                    </TableCell>
                    <TableCell>
                      {format(new Date(nc.reportedDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
              )}
              </TableBody>
            </Table>
          </TableContainer>
        }
      </>);

  };

  const RenderQualityDocuments = () => {
    if (!qmsData || !qmsData.qualityDocuments) return null;

    const { qualityDocuments } = qmsData;
    const documentTypeIcons = {
      manual: <DescriptionIcon />,
      procedure: <DescriptionIcon />,
      'work-instruction': <DescriptionIcon />,
      form: <DescriptionIcon />,
      record: <DescriptionIcon />,
      certificate: <DescriptionIcon />,
      report: <AssessmentIcon />,
      other: <DescriptionIcon />
    };

    return (
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Quality Documents</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            size="small"
            onClick={handleOpenDocDialog}>

            Add Document
          </Button>
        </Box>
        
        {qualityDocuments.length === 0 ?
        <Alert severity="info">No quality documents uploaded</Alert> :

        <List>
            {qualityDocuments.map((doc: any) =>
          <ListItem
            key={doc._id}
            secondaryAction={
            <IconButton edge="end" onClick={() => handleDeleteDocument(doc._id)}>
                    <DeleteIcon />
                  </IconButton>
            }>

                <ListItemText
              primary={doc.name}
              secondary={
              <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {doc.type} {doc.version ? `- v${doc.version}` : ''}
                      </Typography>
                      {' — '}{doc.description}
                      <br />
                      {`Uploaded: ${format(new Date(doc.uploadDate), 'MMM dd, yyyy')}`}
                      {doc.expiryDate && ` • Expires: ${format(new Date(doc.expiryDate), 'MMM dd, yyyy')}`}
                    </>
              } />

                {doc.url &&
            <Button variant="text" href={doc.url} target="_blank" sx={{ ml: 2 }}>
                    View
                  </Button>
            }
              </ListItem>
          )}
          </List>
        }
      </>);

  };

  const RenderAuditHistory = () => {
    if (!qmsData || !qmsData.auditHistory) return null;

    const { auditHistory } = qmsData;

    return (
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Audit History</Typography>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={handleSyncAudits}>

            Sync Audits
          </Button>
        </Box>
        
        {auditHistory.length === 0 ?
        <Alert severity="info">No audit history available</Alert> :

        <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Audit Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditHistory.map((audit: any) =>
              <TableRow key={audit.auditId}>
                    <TableCell>
                      {format(new Date(audit.auditDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{audit.auditType}</TableCell>
                    <TableCell>{audit.result}</TableCell>
                    <TableCell>{audit.score}</TableCell>
                  </TableRow>
              )}
              </TableBody>
            </Table>
          </TableContainer>
        }
      </>);

  };

  if (loading && !qmsData) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <Box>
      <Paper>
        <Box p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h2" gutterBottom>
              Quality Management System
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              variant="outlined"
              onClick={handleRefreshData}>

              Refresh Data
            </Button>
          </Box>

          {RenderCertificationStatus()}
          {RenderComplianceSummary()}

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="quality management tabs">
              <Tab
                icon={<AssessmentIcon />}
                iconPosition="start"
                label="Metrics"
                id="qms-tab-0"
                aria-controls="qms-tabpanel-0" />

              <Tab
                icon={<WarningIcon />}
                iconPosition="start"
                label="Non-Conformances"
                id="qms-tab-1"
                aria-controls="qms-tabpanel-1" />

              <Tab
                icon={<DescriptionIcon />}
                iconPosition="start"
                label="Documents"
                id="qms-tab-2"
                aria-controls="qms-tabpanel-2" />

              <Tab
                icon={<TimelineIcon />}
                iconPosition="start"
                label="Audit History"
                id="qms-tab-3"
                aria-controls="qms-tabpanel-3" />

            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {RenderQualityMetrics()}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {RenderNonConformances()}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {RenderQualityDocuments()}
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            {RenderAuditHistory()}
          </TabPanel>
        </Box>
      </Paper>

      
      <Dialog open={openMetricDialog} onClose={handleCloseMetricDialog}>
        <DialogTitle>Update Metric</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Value"
            type="number"
            fullWidth
            value={metricValue}
            onChange={(e) => setMetricValue(Number(e.target.value))} />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMetricDialog}>Cancel</Button>
          <Button onClick={handleUpdateMetric} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      
      <Dialog open={openNcDialog} onClose={handleCloseNcDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Non-Conformance</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={ncFormData.description}
            onChange={handleNcFormChange}
            sx={{ mb: 2 }} />

          <TextField
            select
            margin="dense"
            name="severity"
            label="Severity"
            fullWidth
            value={ncFormData.severity}
            onChange={handleNcFormChange}
            sx={{ mb: 2 }}>

            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="major">Major</MenuItem>
            <MenuItem value="minor">Minor</MenuItem>
            <MenuItem value="observation">Observation</MenuItem>
          </TextField>
          <TextField
            select
            margin="dense"
            name="category"
            label="Category"
            fullWidth
            value={ncFormData.category}
            onChange={handleNcFormChange}
            sx={{ mb: 2 }}>

            <MenuItem value="product">Product</MenuItem>
            <MenuItem value="process">Process</MenuItem>
            <MenuItem value="system">System</MenuItem>
            <MenuItem value="documentation">Documentation</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            name="reportedBy"
            label="Reported By"
            type="text"
            fullWidth
            value={ncFormData.reportedBy}
            onChange={handleNcFormChange} />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNcDialog}>Cancel</Button>
          <Button
            onClick={handleAddNonConformance}
            variant="contained"
            disabled={!ncFormData.description}>

            Add
          </Button>
        </DialogActions>
      </Dialog>

      
      <Dialog open={openDocDialog} onClose={handleCloseDocDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Quality Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Document Name"
            type="text"
            fullWidth
            value={docFormData.name}
            onChange={handleDocFormChange}
            sx={{ mb: 2 }} />

          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={docFormData.description}
            onChange={handleDocFormChange}
            sx={{ mb: 2 }} />

          <TextField
            select
            margin="dense"
            name="type"
            label="Document Type"
            fullWidth
            value={docFormData.type}
            onChange={handleDocFormChange}
            sx={{ mb: 2 }}>

            <MenuItem value="manual">Manual</MenuItem>
            <MenuItem value="procedure">Procedure</MenuItem>
            <MenuItem value="work-instruction">Work Instruction</MenuItem>
            <MenuItem value="form">Form</MenuItem>
            <MenuItem value="record">Record</MenuItem>
            <MenuItem value="certificate">Certificate</MenuItem>
            <MenuItem value="report">Report</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            name="url"
            label="Document URL"
            type="text"
            fullWidth
            value={docFormData.url}
            onChange={handleDocFormChange}
            sx={{ mb: 2 }} />

          <TextField
            margin="dense"
            name="version"
            label="Version"
            type="text"
            fullWidth
            value={docFormData.version}
            onChange={handleDocFormChange} />

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDocDialog}>Cancel</Button>
          <Button
            onClick={handleAddDocument}
            variant="contained"
            disabled={!docFormData.name}>

            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>);

};

export default QualityManagement;