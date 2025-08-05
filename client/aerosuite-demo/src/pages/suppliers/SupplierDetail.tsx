import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  IconButton,
  Divider,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Factory as FactoryIcon,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Assignment as AssignmentIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import type { Supplier, Inspection } from '../../services/mockDataService';
import MockDataService from '../../services/mockDataService';

const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mock data service
    MockDataService.initialize();
    
    if (!id) {
      setError('No supplier ID provided');
      setLoading(false);
      return;
    }
    
    // Load supplier data
    const supplierData = MockDataService.getSuppliers().find(s => s._id === id);
    
    if (supplierData) {
      setSupplier(supplierData);
      
      // Get inspections for this supplier
      const supplierInspections = MockDataService.getInspections().filter(
        inspection => inspection.supplier._id === id
      );
      setInspections(supplierInspections);
    } else {
      setError('Supplier not found');
    }
    
    setLoading(false);
  }, [id]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error || !supplier) {
    return (
      <Box mt={3}>
        <Alert severity="error">
          {error || 'Failed to load supplier details'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/suppliers')}
          sx={{ mt: 2 }}
        >
          Back to Suppliers
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with back button and actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={() => navigate('/suppliers')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              {supplier.name}
            </Typography>
            <Chip 
              label={supplier.code} 
              color="secondary" 
              sx={{ mt: 1 }} 
            />
          </Box>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/suppliers/${id}/edit`)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Supplier details */}
      <Grid container spacing={3}>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Supplier Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {supplier.industry && (
                <ListItem>
                  <ListItemIcon>
                    <CategoryIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Industry"
                    secondary={supplier.industry}
                  />
                </ListItem>
              )}
              
              {supplier.location && (
                <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={supplier.location}
                  />
                </ListItem>
              )}
              
              {supplier.qualification && (
                <ListItem>
                  <ListItemIcon>
                    <VerifiedUserIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Qualification"
                    secondary={supplier.qualification}
                  />
                </ListItem>
              )}
              
              {supplier.contact && (
                <>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={supplier.contact.email}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phone"
                      secondary={supplier.contact.phone}
                    />
                  </ListItem>
                </>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Inspections
                </Typography>
                <Button
                  size="small"
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/inspections?supplier=' + id)}
                >
                  View All
                </Button>
              </Box>
              <Divider />
              
              {inspections.length > 0 ? (
                <List>
                  {inspections.slice(0, 5).map((inspection) => (
                    <ListItem 
                      key={inspection._id}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/inspections/${inspection._id}`)}
                      divider
                    >
                      <ListItemText
                        primary={inspection.title}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.primary">
                              {inspection.inspectionNumber}
                            </Typography>
                            {` — ${formatDate(inspection.scheduledDate)}`}
                          </React.Fragment>
                        }
                      />
                      <Chip 
                        label={inspection.status.toUpperCase()} 
                        color={
                          inspection.status === 'completed' ? 'success' :
                          inspection.status === 'in-progress' ? 'warning' :
                          inspection.status === 'scheduled' ? 'info' :
                          'default'
                        }
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box py={3} textAlign="center">
                  <Typography color="textSecondary">
                    No inspections found for this supplier
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AssignmentIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/inspections/schedule')}
                  >
                    Schedule Inspection
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Stats and metrics could go here in future enhancements */}
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Supplier Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary">
                    {inspections.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Inspections
                  </Typography>
                </Box>
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary">
                    {inspections.filter(i => i.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed Inspections
                  </Typography>
                </Box>
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary">
                    {(() => {
                      const completed = inspections.filter(i => i.status === 'completed');
                      const passed = completed.filter(i => i.result === 'pass');
                      return completed.length > 0 
                        ? Math.round((passed.length / completed.length) * 100) 
                        : 0;
                    })()}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pass Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SupplierDetail; 