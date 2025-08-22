import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Chip,
  Button,
  IconButton,
  Avatar,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  Tooltip,
  LinearProgress,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating } from
'@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
  PlayArrow as PlayArrowIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon } from
'@mui/icons-material';
import {
  PageHeader,
  StatusBadge,
  ConfirmationDialog,
  GenerateReportButton } from
'../../components/common';
import { format } from 'date-fns';

// Mock inspection data
const mockInspection = {
  id: 'INS-001',
  title: 'Quality Audit - Aerospace Parts Inc.',
  inspectionType: 'Quality Audit',
  status: 'scheduled',
  priority: 'high',
  supplierId: '1',
  supplierName: 'Aerospace Parts Inc.',
  customerName: 'Boeing',
  inspectionDate: '2023-06-15T09:00:00Z',
  location: 'Supplier Facility - Seattle, WA',
  inspectorId: '101',
  inspector: 'Jane Doe',
  description: 'Comprehensive quality audit of manufacturing processes and controls for Boeing aerospace components.',
  notes: 'Focus on recent updates to quality management system and corrective actions from previous findings.',
  createdAt: '2023-05-20T14:30:00Z',
  checklistItems: [
  { id: '1', title: 'Document Control', description: 'Review document control system', status: 'pending' },
  { id: '2', title: 'Employee Training', description: 'Verify employee training records', status: 'pending' },
  { id: '3', title: 'Calibration', description: 'Check calibration of measuring equipment', status: 'pending' },
  { id: '4', title: 'Process Controls', description: 'Verify process controls are in place', status: 'pending' },
  { id: '5', title: 'Non-conformance Process', description: 'Review non-conformance handling process', status: 'pending' }],

  history: [
  {
    timestamp: '2023-05-20T14:30:00Z',
    action: 'created',
    user: 'John Smith',
    details: 'Inspection scheduled'
  },
  {
    timestamp: '2023-05-25T10:15:00Z',
    action: 'updated',
    user: 'Jane Doe',
    details: 'Inspector assigned'
  },
  {
    timestamp: '2023-05-30T16:45:00Z',
    action: 'updated',
    user: 'John Smith',
    details: 'Added checklist items'
  }]

};

// Format date helper
const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
};

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
      id={`inspection-tabpanel-${index}`}
      aria-labelledby={`inspection-tab-${index}`}
      {...other}>

      {value === index &&
      <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      }
    </div>);

};

const InspectionDetail: React.FC = () => {
  const { id } = useParams<{id: string;}>();
  const navigate = useNavigate();
  const theme = useTheme();

  // State
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load inspection data
  useEffect(() => {
    setLoading(true);
    // Simulate API call to get inspection data
    setTimeout(() => {
      try {
        setInspection(mockInspection);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load inspection data');
      } finally {
        setLoading(false);
      }
    }, 1000);
  }, [id]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle delete dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // Delete logic - replace with API call
    console.log(`Deleting inspection ${id}`);

    // Show success message
    setSnackbar({
      open: true,
      message: 'Inspection deleted successfully',
      severity: 'success'
    });

    navigate('/inspections');
  };

  // Handle start inspection
  const handleStartInspection = () => {
    navigate(`/inspections/${id}/conduct`);
  };

  // Handle edit inspection
  const handleEditInspection = () => {
    navigate(`/inspections/${id}/edit`);
  };

  // Handle cancel inspection
  const handleCancelInspection = () => {
    // Cancel logic - replace with API call
    console.log(`Cancelling inspection ${id}`);

    setInspection({
      ...inspection,
      status: 'cancelled'
    });

    // Show success message
    setSnackbar({
      open: true,
      message: 'Inspection cancelled successfully',
      severity: 'success'
    });
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>);

  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inspections')}
          sx={{ mt: 2 }}>

          Back to Inspections
        </Button>
      </Box>);

  }

  if (!inspection) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="warning">Inspection not found</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inspections')}
          sx={{ mt: 2 }}>

          Back to Inspections
        </Button>
      </Box>);

  }

  const GetStatusActions = () => {
    switch (inspection.status) {
      case 'scheduled':
        return (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartInspection}
              sx={{ mr: 1 }}>

              Start Inspection
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancelInspection}>

              Cancel Inspection
            </Button>
          </>);

      case 'in_progress':
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStartInspection}>

            Continue Inspection
          </Button>);

      case 'completed':
        return (
          <GenerateReportButton
            inspectionId={inspection.id}
            variant="contained"
            color="primary" />);


      default:
        return null;
    }
  };

  return (
    <Box>
      <PageHeader
        title={inspection.title}
        subtitle={`Inspection ID: ${inspection.id}`}
        breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Inspections', href: '/inspections' },
        { label: inspection.id }]
        }
        actions={
        <>
            <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/inspections')}
            sx={{ mr: 1 }}>

              Back
            </Button>
            {inspection.status !== 'completed' && inspection.status !== 'cancelled' &&
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditInspection}
            sx={{ mr: 1 }}>

                Edit
              </Button>
          }
            <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}>

              Delete
            </Button>
          </>
        } />


      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StatusBadge
          status={inspection.status}
          size="medium" />

        <Box>
          {GetStatusActions()}
        </Box>
      </Box>

      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="inspection tabs">

          <Tab label="Overview" id="inspection-tab-0" aria-controls="inspection-tabpanel-0" />
          <Tab label="Checklist" id="inspection-tab-1" aria-controls="inspection-tabpanel-1" />
          <Tab label="History" id="inspection-tab-2" aria-controls="inspection-tabpanel-2" />
        </Tabs>
      </Box>

      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Inspection Details"
                avatar={<AssignmentIcon color="primary" />} />

              <Divider />
              <CardContent>
                <List disablePadding>
                  <ListItem divider>
                    <ListItemIcon>
                      <EventIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Date & Time"
                      secondary={formatDateTime(inspection.inspectionDate)} />

                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <LocationIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Location"
                      secondary={inspection.location} />

                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <DescriptionIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Type"
                      secondary={inspection.inspectionType} />

                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <FlagIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Priority"
                      secondary={
                      <Chip
                        label={inspection.priority}
                        color={inspection.priority === 'high' ? 'error' : inspection.priority === 'medium' ? 'warning' : 'success'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }} />

                      } />

                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TimeIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Created On"
                      secondary={formatDateTime(inspection.createdAt)} />

                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Associated Entities"
                avatar={<BusinessIcon color="primary" />} />

              <Divider />
              <CardContent>
                <List disablePadding>
                  <ListItem divider>
                    <ListItemIcon>
                      <BusinessIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Supplier"
                      secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="primary"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/suppliers/${inspection.supplierId}`)}>

                          {inspection.supplierName}
                        </Typography>
                      } />

                  </ListItem>
                  <ListItem divider>
                    <ListItemIcon>
                      <BusinessIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Customer"
                      secondary={inspection.customerName} />

                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Inspector"
                      secondary={inspection.inspector} />

                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Description & Notes"
                avatar={<NotesIcon color="primary" />} />

              <Divider />
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" paragraph>
                  {inspection.description}
                </Typography>

                {inspection.notes &&
                <>
                    <Typography variant="subtitle1" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">
                      {inspection.notes}
                    </Typography>
                  </>
                }
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardHeader
            title="Inspection Checklist"
            subheader={`${inspection.checklistItems?.length || 0} items`}
            action={
            inspection.status === 'scheduled' &&
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartInspection}>

                  Start Inspection
                </Button>

            } />

          <Divider />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="5%">#</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell width="15%">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inspection.checklistItems.map((item: any, index: number) =>
                  <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardHeader
            title="Inspection History"
            subheader="Timeline of inspection activities" />

          <Divider />
          <CardContent>
            <List>
              {inspection.history.map((entry: any, index: number) =>
              <ListItem key={index} divider={index < inspection.history.length - 1}>
                  <ListItemIcon>
                    {entry.action === 'created' ?
                  <AssignmentIcon color="primary" /> :

                  <EditIcon color="secondary" />
                  }
                  </ListItemIcon>
                  <ListItemText
                  primary={
                  <Typography variant="body1">
                        {entry.details}
                      </Typography>
                  }
                  secondary={
                  <Typography variant="body2" color="text.secondary">
                        {formatDateTime(entry.timestamp)} by {entry.user}
                      </Typography>
                  } />

                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inspection"
        message="Are you sure you want to delete this inspection? This action cannot be undone."
        confirmButtonText="Delete"
        confirmButtonColor="error" />


      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>

        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}>

          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>);

};

export default InspectionDetail;