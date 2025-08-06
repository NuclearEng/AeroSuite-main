import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  Alert } from
'@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Factory as FactoryIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon } from
'@mui/icons-material';
import type { Inspection } from '../../services/mockDataService';
import MockDataService from '../../services/mockDataService';

// Status chip component
const StatusChip = ({ status }: {status: string;}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { color: 'info', label: 'Scheduled' };
      case 'in-progress':
        return { color: 'warning', label: 'In Progress' };
      case 'completed':
        return { color: 'success', label: 'Completed' };
      case 'cancelled':
        return { color: 'error', label: 'Cancelled' };
      default:
        return { color: 'default', label: status };
    }
  };

  const config = getStatusConfig(status);
  return (
    <Chip
      label={config.label}
      color={config.color as 'info' | 'warning' | 'success' | 'error' | 'default'}
      size="small" />);


};

// Result chip
const ResultChip = ({ result }: {result: string;}) => {
  const getResultConfig = (result: string) => {
    switch (result) {
      case 'pass':
        return { color: 'success', label: 'Pass' };
      case 'fail':
        return { color: 'error', label: 'Fail' };
      case 'conditional':
        return { color: 'warning', label: 'Conditional' };
      case 'pending':
        return { color: 'default', label: 'Pending' };
      default:
        return { color: 'default', label: result };
    }
  };

  const config = getResultConfig(result);
  return (
    <Chip
      label={config.label}
      color={config.color as 'success' | 'error' | 'warning' | 'default'}
      size="small" />);


};

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const InspectionDetail: React.FC = () => {
  const { id } = useParams<{id: string;}>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mock data service
    MockDataService.initialize();

    if (!id) {
      setError('No inspection ID provided');
      setLoading(false);
      return;
    }

    // Load inspection data
    const inspectionData = MockDataService.getInspectionById(id);

    if (inspectionData) {
      setInspection(inspectionData);
    } else {
      setError('Inspection not found');
    }

    setLoading(false);
  }, [id]);

  if (loading) {
    return <LinearProgress />;
  }

  if (error || !inspection) {
    return (
      <Box mt={3}>
        <Alert severity="error">
          {error || 'Failed to load inspection details'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inspections')}
          sx={{ mt: 2 }}>

          Back to Inspections
        </Button>
      </Box>);

  }

  return (
    <Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => navigate('/inspections')}
            sx={{ mr: 2 }}>

            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              {inspection.title}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <Chip
                label={inspection.inspectionNumber}
                color="primary"
                sx={{ mr: 1 }} />

              <StatusChip status={inspection.status} />
              <Box ml={1}>
                <ResultChip result={inspection.result} />
              </Box>
            </Box>
          </Box>
        </Box>
        <Box>
          {inspection.status === 'scheduled' &&
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/inspections/${id}/edit`)}
            sx={{ mr: 1 }}>

              Edit
            </Button>
          }
          {['scheduled', 'in-progress'].includes(inspection.status) &&
          <Button
            variant="contained"
            color="primary"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate(`/inspections/${id}/conduct`)}>

              {inspection.status === 'scheduled' ? 'Start Inspection' : 'Continue Inspection'}
            </Button>
          }
        </Box>
      </Box>

      
      <Grid container spacing={3}>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Inspection Details
            </Typography>
            <Typography variant="body1" paragraph>
              {inspection.description || 'No description provided.'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" flexWrap="wrap" gap={4}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Inspection Type
                </Typography>
                <Typography variant="body1">
                  {inspection.inspectionType.charAt(0).toUpperCase() + inspection.inspectionType.slice(1)} Inspection
                </Typography>
              </Box>
              {inspection.purchaseOrderNumber &&
              <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Purchase Order
                  </Typography>
                  <Typography variant="body1">
                    {inspection.purchaseOrderNumber}
                  </Typography>
                </Box>
              }
              {inspection.partNumber &&
              <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Part Number
                  </Typography>
                  <Typography variant="body1">
                    {inspection.partNumber} {inspection.revision && `Rev ${inspection.revision}`}
                  </Typography>
                </Box>
              }
              {inspection.quantity &&
              <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1">
                    {inspection.quantity} units
                  </Typography>
                </Box>
              }
            </Box>
          </Paper>
          
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Checklist Items ({inspection.checklistItems.length})
            </Typography>
            
            {inspection.checklistItems.length > 0 ?
            <List>
                {inspection.checklistItems.map((item) =>
              <ListItem key={item.id} divider>
                    <ListItemIcon>
                      {item.result === 'pass' ?
                  <CheckCircleIcon color="success" /> :
                  item.result === 'fail' ?
                  <CancelIcon color="error" /> :

                  <WarningIcon color="warning" />
                  }
                    </ListItemIcon>
                    <ListItemText
                  primary={item.description}
                  secondary={item.notes} />

                    <Chip
                  label={item.result.toUpperCase()}
                  color={
                  item.result === 'pass' ? 'success' :
                  item.result === 'fail' ? 'error' :
                  'default'
                  }
                  size="small" />

                  </ListItem>
              )}
              </List> :

            <Typography variant="body2" color="text.secondary">
                No checklist items available.
              </Typography>
            }
          </Paper>
          
          
          {inspection.notes &&
          <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body1">
                {inspection.notes}
              </Typography>
            </Paper>
          }
        </Grid>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer
              </Typography>
              <Box display="flex" alignItems="center">
                <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  {inspection.customer.name}
                </Typography>
              </Box>
              <Chip
                label={inspection.customer.code}
                size="small"
                sx={{ mt: 1 }} />

            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Supplier
              </Typography>
              <Box display="flex" alignItems="center">
                <FactoryIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="body1">
                  {inspection.supplier.name}
                </Typography>
              </Box>
              <Chip
                label={inspection.supplier.code}
                size="small"
                sx={{ mt: 1 }} />

            </CardContent>
          </Card>
          
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Scheduled"
                    secondary={formatDate(inspection.scheduledDate)} />

                </ListItem>
                
                {inspection.startDate &&
                <ListItem>
                    <ListItemIcon>
                      <CalendarIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                    primary="Started"
                    secondary={formatDate(inspection.startDate)} />

                  </ListItem>
                }
                
                {inspection.completionDate &&
                <ListItem>
                    <ListItemIcon>
                      <CalendarIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                    primary="Completed"
                    secondary={formatDate(inspection.completionDate)} />

                  </ListItem>
                }
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>);

};

export default InspectionDetail;