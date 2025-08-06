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
  LinearProgress } from
'@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Assignment as AssignmentIcon } from
'@mui/icons-material';
import type { Customer, Inspection } from '../../services/mockDataService';
import MockDataService from '../../services/mockDataService';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{id: string;}>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mock data service
    MockDataService.initialize();

    if (!id) {
      setError('No customer ID provided');
      setLoading(false);
      return;
    }

    // Load customer data
    const customerData = MockDataService.getCustomers().find((c) => c._id === id);

    if (customerData) {
      setCustomer(customerData);

      // Get inspections for this customer
      const customerInspections = MockDataService.getInspections().filter(
        (inspection) => inspection.customer._id === id
      );
      setInspections(customerInspections);
    } else {
      setError('Customer not found');
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

  if (error || !customer) {
    return (
      <Box mt={3}>
        <Alert severity="error">
          {error || 'Failed to load customer details'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}>

          Back to Customers
        </Button>
      </Box>);

  }

  return (
    <Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => navigate('/customers')}
            sx={{ mr: 2 }}>

            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              {customer.name}
            </Typography>
            <Chip
              label={customer.code}
              color="primary"
              sx={{ mt: 1 }} />

          </Box>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/customers/${id}/edit`)}
            sx={{ mr: 1 }}>

            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}>

            Delete
          </Button>
        </Box>
      </Box>

      
      <Grid container spacing={3}>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {customer.industry &&
              <ListItem>
                  <ListItemIcon>
                    <CategoryIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                  primary="Industry"
                  secondary={customer.industry} />

                </ListItem>
              }
              
              {customer.location &&
              <ListItem>
                  <ListItemIcon>
                    <LocationOnIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                  primary="Location"
                  secondary={customer.location} />

                </ListItem>
              }
              
              {customer.contact &&
              <>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                    primary="Email"
                    secondary={customer.contact.email} />

                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                    primary="Phone"
                    secondary={customer.contact.phone} />

                  </ListItem>
                </>
              }
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
                  onClick={() => navigate('/inspections?customer=' + id)}>

                  View All
                </Button>
              </Box>
              <Divider />
              
              {inspections.length > 0 ?
              <List>
                  {inspections.slice(0, 5).map((inspection) =>
                <ListItem
                  key={inspection._id}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/inspections/${inspection._id}`)}
                  divider>

                      <ListItemText
                    primary={inspection.title}
                    secondary={
                    <React.Fragment>
                            <Typography component="span" variant="body2" color="text.primary">
                              {inspection.inspectionNumber}
                            </Typography>
                            {` — ${formatDate(inspection.scheduledDate)}`}
                          </React.Fragment>
                    } />

                      <Chip
                    label={inspection.status.toUpperCase()}
                    color={
                    inspection.status === 'completed' ? 'success' :
                    inspection.status === 'in-progress' ? 'warning' :
                    inspection.status === 'scheduled' ? 'info' :
                    'default'
                    }
                    size="small" />

                    </ListItem>
                )}
                </List> :

              <Box py={3} textAlign="center">
                  <Typography color="textSecondary">
                    No inspections found for this customer
                  </Typography>
                  <Button
                  variant="contained"
                  startIcon={<AssignmentIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/inspections/schedule')}>

                    Schedule Inspection
                  </Button>
                </Box>
              }
            </CardContent>
          </Card>
        </Grid>
        
        
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Customer Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {inspections.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Inspections
                  </Typography>
                </Box>
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {inspections.filter((i) => i.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed Inspections
                  </Typography>
                </Box>
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {(() => {
                      const completed = inspections.filter((i) => i.status === 'completed');
                      const passed = completed.filter((i) => i.result === 'pass');
                      return completed.length > 0 ?
                      Math.round(passed.length / completed.length * 100) :
                      0;
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
    </Box>);

};

export default CustomerDetail;