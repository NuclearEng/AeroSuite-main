import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid as MuiGrid,
  Paper,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Tab,
  Tabs,
  useTheme,
  Skeleton,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow } from
'@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  LocalShipping as ShippingIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Link as LinkIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  MapsHomeWork as BuildingIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  FactCheck as FactCheckIcon,
  MilitaryTech as CertificationIcon,
  Inventory as InventoryIcon,
  Notes as NotesIcon,
  Analytics as AnalyticsIcon,
  VerifiedUser as QualityIcon } from
'@mui/icons-material';
import {
  PageHeader,
  Chart,
  DataTable,
  StatusBadge,
  ConfirmationDialog } from
'../../components/common';
import { StatusType } from '../../components/common/StatusBadge';
import supplierService, { Supplier } from '../../services/supplier.service';
import { format } from 'date-fns';
import { SupplierAnalytics } from './components/SupplierAnalytics';
import SupplierQualification from './components/SupplierQualification';
import SupplierMetricsCard from '../../components/suppliers/SupplierMetricsCard';

// TabPanel component for the tabbed interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`supplier-tabpanel-${index}`}
      aria-labelledby={`supplier-tab-${index}`}
      {...other}
      style={{ paddingTop: '16px' }}>

      {value === index &&
      <Box>{children}</Box>
      }
    </div>);

}

const SupplierDetail: React.FC = () => {
  const { id } = useParams<{id: string;}>();
  const navigate = useNavigate();
  const theme = useTheme();

  // State
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [inspections, setInspections] = useState<any>([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
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

  // Load supplier data
  useEffect(() => {
    const loadSupplier = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const data = await supplierService.getSupplier(id);
        setSupplier(data);
      } catch (err: any) {
        console.error("Error:", error);
        setError(err.message || 'Failed to load supplier');
      } finally {
        setLoading(false);
      }
    };

    loadSupplier();
  }, [id]);

  // Load performance metrics when tab changes to metrics
  useEffect(() => {
    const loadPerformanceMetrics = async () => {
      if (!id || tabValue !== 1) return;

      try {
        const data = await supplierService.getSupplierPerformance(id);
        setPerformanceMetrics(data);
      } catch (err: any) {
        console.error("Error:", error);
        // Don't set error state as this is secondary data
      }
    };

    loadPerformanceMetrics();
  }, [id, tabValue]);

  // Load inspections when tab changes to inspections
  useEffect(() => {
    const loadInspections = async () => {
      if (!id || tabValue !== 2) return;

      try {
        setInspectionsLoading(true);
        const data = await supplierService.getSupplierInspections(id);
        setInspections(data.inspections || []);
      } catch (err: any) {
        console.error("Error:", error);
        // Don't set error state as this is secondary data
      } finally {
        setInspectionsLoading(false);
      }
    };

    loadInspections();
  }, [id, tabValue]);

  // Handle tab change
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 4) {// Analytics tab
      navigate(`/suppliers/${id}/analytics`);
      return;
    }
    setTabValue(newValue);
  };

  // Handle delete supplier
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    try {
      setLoading(true);
      await supplierService.deleteSupplier(id);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Supplier deleted successfully',
        severity: 'success'
      });

      // Navigate back to supplier list after a short delay
      setTimeout(() => {
        navigate('/suppliers');
      }, 1500);
    } catch (err: any) {
      console.error("Error:", error);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to delete supplier',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Handle edit supplier
  const handleEditSupplier = () => {
    navigate(`/suppliers/${id}/edit`);
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Format address
  const formatAddress = (address?: Supplier['address']) => {
    if (!address) return 'No address provided';

    const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country].
    filter(Boolean);

    return parts.join(', ');
  };

  // Loading state
  if (loading && !supplier) {
    return (
      <Box>
        <PageHeader
          title="Loading..."
          subtitle="Please wait"
          breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Suppliers', href: '/suppliers' },
          { label: 'Loading...' }]
          } />

        <MuiGrid container spacing={3}>
          <MuiGrid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} />
          </MuiGrid>
          <MuiGrid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={300} />
          </MuiGrid>
        </MuiGrid>
      </Box>);

  }

  // Error state
  if (error) {
    return (
      <Box>
        <PageHeader
          title="Error"
          subtitle="Failed to load supplier"
          breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Suppliers', href: '/suppliers' },
          { label: 'Error' }]
          } />

        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/suppliers')}
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}>

          Back to Suppliers
        </Button>
      </Box>);

  }

  // Performance metrics chart data
  const performanceChartData = performanceMetrics ? {
    labels: performanceMetrics.monthlyData?.map((item: any) => item.month) || [],
    datasets: [
    {
      label: 'On-Time Delivery',
      data: performanceMetrics.monthlyData?.map((item: any) => item.onTimeDelivery) || [],
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.main + '20'
    },
    {
      label: 'Quality Rating',
      data: performanceMetrics.monthlyData?.map((item: any) => item.qualityRating) || [],
      borderColor: theme.palette.secondary.main,
      backgroundColor: theme.palette.secondary.main + '20'
    }]

  } : {
    labels: [],
    datasets: []
  };

  // Inspection columns
  const inspectionColumns = [
  { id: 'inspectionId', label: 'ID', numeric: false },
  { id: 'inspectionDate', label: 'Date', numeric: false,
    format: (value: string) => format(new Date(value), 'MMM dd, yyyy') },
  { id: 'inspectionType', label: 'Type', numeric: false },
  { id: 'inspector', label: 'Inspector', numeric: false },
  { id: 'status', label: 'Status', numeric: false,
    format: (value: string) => <StatusBadge status={value as any} /> },
  { id: 'score', label: 'Score', numeric: true }];


  return (
    <Box sx={{ pb: 4 }}>
      
      <PageHeader
        title={supplier?.name || 'Supplier Details'}
        subtitle={supplier?.code || ''}
        breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Suppliers', href: '/suppliers' },
        { label: supplier?.name || 'Supplier Details' }]
        }
        onBack={() => navigate('/suppliers')}
        actions={
        <>
            <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            onClick={() => navigate(`/suppliers/${id}/analytics`)}
            sx={{ mr: 1 }}>

              Analytics
            </Button>
            <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditSupplier}
            sx={{ mr: 1 }}>

              Edit
            </Button>
            <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}>

              Delete
            </Button>
          </>
        } />


      
      <Box sx={{ mb: 3 }}>
        <StatusBadge
          status={(supplier?.status || 'inactive') as StatusType}
          size="medium" />

      </Box>

      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          aria-label="supplier tabs"
          variant="scrollable"
          scrollButtons="auto">

          <Tab label="Overview" icon={<BusinessIcon />} iconPosition="start" />
          <Tab label="Performance" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Inspections" icon={<FactCheckIcon />} iconPosition="start" />
          <Tab label="Certifications" icon={<CertificationIcon />} iconPosition="start" />
          <Tab label="Analytics" icon={<AnalyticsIcon />} iconPosition="start" />
          <Tab label="Quality Management" icon={<QualityIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      
      <TabPanel value={tabValue} index={0}>
        <MuiGrid container spacing={3}>
          
          <MuiGrid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                {supplier?.logo ?
                <Avatar
                  src={supplier.logo}
                  alt={supplier.name}
                  sx={{
                    width: 120,
                    height: 120,
                    margin: '0 auto',
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }} /> :


                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    margin: '0 auto',
                    mb: 2,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '3rem'
                  }}>

                    {supplier?.name?.charAt(0)}
                  </Avatar>
                }
                <Typography variant="h5" gutterBottom>
                  {supplier?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {supplier?.code}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <StatusBadge status={supplier?.status as any} />
                </Box>
                {supplier?.industry &&
                <Chip
                  label={supplier.industry}
                  sx={{ mt: 1 }}
                  icon={<BuildingIcon />} />

                }
                {supplier?.overallRating !== undefined &&
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                    <Rating
                    value={supplier.overallRating}
                    precision={0.1}
                    readOnly />

                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {supplier.overallRating.toFixed(1)}
                    </Typography>
                  </Box>
                }
              </CardContent>
              <Divider />
              <List dense>
                {supplier?.primaryContactName &&
                <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main }}>
                        {supplier.primaryContactName.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                    primary={supplier.primaryContactName}
                    secondary="Primary Contact" />

                  </ListItem>
                }
                {supplier?.primaryContactEmail &&
                <ListItem>
                    <ListItemIcon>
                      <EmailIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                    primary={supplier.primaryContactEmail}
                    secondary="Email" />

                  </ListItem>
                }
                {supplier?.phone &&
                <ListItem>
                    <ListItemIcon>
                      <PhoneIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                    primary={supplier.phone}
                    secondary="Phone" />

                  </ListItem>
                }
                {supplier?.address &&
                <ListItem>
                    <ListItemIcon>
                      <LocationIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                    primary={formatAddress(supplier.address)}
                    secondary="Address" />

                  </ListItem>
                }
                {supplier?.website &&
                <ListItem>
                    <ListItemIcon>
                      <WebsiteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                    primary={
                    <a
                      href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>

                          {supplier.website}
                        </a>
                    }
                    secondary="Website" />

                  </ListItem>
                }
              </List>
            </Card>
          </MuiGrid>
          
          
          <MuiGrid item xs={12} md={8}>
            
            <Card sx={{ mb: 3 }}>
              <CardHeader
                title="Description" />

              <CardContent>
                {supplier?.description ?
                <Typography variant="body1">
                    {supplier.description}
                  </Typography> :

                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No description provided
                  </Typography>
                }
              </CardContent>
            </Card>
            
            
            <Card sx={{ mb: 3 }}>
              <CardHeader
                title="Tags" />

              <CardContent>
                {supplier?.tags && supplier.tags.length > 0 ?
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {supplier.tags.map((tag: any) =>
                  <Chip
                    key={tag}
                    label={tag}
                    variant="outlined"
                    size="small" />

                  )}
                  </Box> :

                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No tags assigned
                  </Typography>
                }
              </CardContent>
            </Card>
            
            
            <Card>
              <CardHeader
                title="Certifications"
                action={
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/suppliers/${id}/certifications/add`)}>

                    Add
                  </Button>
                } />

              <CardContent>
                {supplier?.certifications && supplier.certifications.length > 0 ?
                <List>
                    {supplier.certifications.map((cert: any, index: number) =>
                  <ListItem key={index} divider={index < supplier.certifications!.length - 1}>
                        <ListItemIcon>
                          <LinkIcon />
                        </ListItemIcon>
                        <ListItemText
                      primary={cert.name}
                      secondary={`Issued: ${format(new Date(cert.issuedDate), 'MMM dd, yyyy')}${
                      cert.expiryDate ? ` • Expires: ${format(new Date(cert.expiryDate), 'MMM dd, yyyy')}` : ''}`
                      } />

                        <StatusBadge status={cert.status as StatusType} />
                      </ListItem>
                  )}
                  </List> :

                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No certifications added
                  </Typography>
                }
              </CardContent>
            </Card>
          </MuiGrid>
        </MuiGrid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MuiGrid container spacing={3}>
          
          <MuiGrid item xs={12}>
            <Card>
              <CardHeader title="Performance Metrics" />
              <CardContent>
                {performanceMetrics ?
                <MuiGrid container spacing={3}>
                    <MuiGrid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography color="text.secondary" gutterBottom>
                            Overall Rating
                          </Typography>
                          <Typography variant="h3" color="primary">
                            {performanceMetrics.overallRating?.toFixed(1) || 'N/A'}
                          </Typography>
                          <Rating
                          value={performanceMetrics.overallRating || 0}
                          precision={0.1}
                          readOnly
                          sx={{ mt: 1 }} />

                        </CardContent>
                      </Card>
                    </MuiGrid>
                    <MuiGrid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography color="text.secondary" gutterBottom>
                            On-Time Delivery
                          </Typography>
                          <Typography variant="h3" color="primary">
                            {performanceMetrics.onTimeDelivery ? `${(performanceMetrics.onTimeDelivery * 100).toFixed(1)}%` : 'N/A'}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress
                            variant="determinate"
                            value={performanceMetrics.onTimeDelivery ? performanceMetrics.onTimeDelivery * 100 : 0}
                            size={40} />

                          </Box>
                        </CardContent>
                      </Card>
                    </MuiGrid>
                    <MuiGrid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography color="text.secondary" gutterBottom>
                            Quality Score
                          </Typography>
                          <Typography variant="h3" color="primary">
                            {performanceMetrics.qualityScore ? `${performanceMetrics.qualityScore.toFixed(1)}` : 'N/A'}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress
                            variant="determinate"
                            value={performanceMetrics.qualityScore ? performanceMetrics.qualityScore / 5 * 100 : 0}
                            size={40}
                            color="secondary" />

                          </Box>
                        </CardContent>
                      </Card>
                    </MuiGrid>
                  </MuiGrid> :

                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                }
              </CardContent>
            </Card>
          </MuiGrid>
          
          
          <MuiGrid item xs={12}>
            <Chart
              type="line"
              data={performanceChartData}
              title="Performance Trends"
              subtitle="Monthly performance metrics"
              height={400}
              variant="outlined"
              loading={!performanceMetrics}
              emptyMessage="No performance data available"
              options={{
                scales: {
                  y: {
                    min: 0,
                    max: 5,
                    title: {
                      display: true,
                      text: 'Rating (0-5)'
                    }
                  }
                }
              }} />

          </MuiGrid>
        </MuiGrid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/inspections/schedule?supplierId=${id}`)}>

            Schedule Inspection
          </Button>
        </Box>
        
        <DataTable
          rows={inspections}
          headCells={inspectionColumns}
          loading={inspectionsLoading}
          pagination
          defaultSortBy="inspectionDate"
          defaultOrder="desc"
          onRowClick={(inspection) => navigate(`/inspections/${inspection.id}`)}
          emptyStateMessage="No inspections found for this supplier" />

      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        
        {id && <SupplierQualification supplierId={id} />}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        
        {supplier &&
        <SupplierAnalytics supplierId={supplier._id} />
        }
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<QualityIcon />}
            onClick={() => navigate(`/suppliers/${id}/quality`)}
            sx={{ mb: 2 }}>

            View Quality Management System
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            Access the full quality management system to view certifications, metrics, non-conformances, and more.
          </Typography>
        </Box>
      </TabPanel>

      
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Supplier"
        message={`Are you sure you want to delete ${supplier?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialogOpen(false)}
        confirmButtonText="Delete"
        confirmButtonProps={{ color: "error" }} />


      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>

        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {tabValue === 4 &&
      <Box mt={3}>
          <SupplierMetricsCard supplierId={id || ''} />
        </Box>
      }
    </Box>);

};

export default SupplierDetail;