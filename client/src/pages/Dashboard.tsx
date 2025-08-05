import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Assignment as InspectionIcon,
  Business as CustomerIcon,
  Factory as SupplierIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Event as EventIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { PageHeader, StatusBadge } from '../components/common';
import inspectionService from '../services/inspection.service';

// Mock data for statistics
const mockStats = {
  totalInspections: 382,
  scheduledInspections: 42,
  inProgressInspections: 18,
  completedInspections: 322,
  customers: 14,
  suppliers: 28,
  passRate: 89
};

// Mock data for upcoming inspections
const mockUpcomingInspections = [
  {
    id: 'INS-5432',
    supplierName: 'Aerospace Parts Inc.',
    inspectionType: 'quality_audit',
    inspectionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: 'scheduled',
    priority: 'high'
  },
  {
    id: 'INS-5433',
    supplierName: 'Global Aviation Technologies',
    inspectionType: 'process_audit',
    inspectionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'scheduled',
    priority: 'medium'
  },
  {
    id: 'INS-5435',
    supplierName: 'Precision Manufacturing Ltd',
    inspectionType: 'first_article',
    inspectionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'scheduled',
    priority: 'medium'
  }
];

// Mock data for recent inspections
const mockRecentInspections = [
  {
    id: 'INS-5429',
    supplierName: 'MetalWorks Industries',
    inspectionType: 'receiving_inspection',
    inspectionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'completed',
    score: 92
  },
  {
    id: 'INS-5428',
    supplierName: 'Electronic Components Co.',
    inspectionType: 'quality_audit',
    inspectionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    status: 'completed',
    score: 78
  },
  {
    id: 'INS-5427',
    supplierName: 'Aerospace Parts Inc.',
    inspectionType: 'certification_audit',
    inspectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: 'completed',
    score: 95
  }
];

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [inspectionStats, setInspectionStats] = useState(mockStats);
  const [upcomingInspections, setUpcomingInspections] = useState(mockUpcomingInspections);
  const [recentInspections, setRecentInspections] = useState(mockRecentInspections);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleScheduleInspection = () => {
    navigate('/inspections/schedule');
  };

  const handleViewAllInspections = () => {
    navigate('/inspections');
  };

  const handleViewInspection = (id: string) => {
    navigate(`/inspections/${id}`);
  };

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your inspection activities"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleScheduleInspection}
          >
            Schedule Inspection
          </Button>
        }
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats summary cards */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Inspections
                        </Typography>
                        <Typography variant="h4">
                          {inspectionStats.totalInspections}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <InspectionIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Scheduled
                        </Typography>
                        <Typography variant="h4">
                          {inspectionStats.scheduledInspections}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                        <CalendarIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Suppliers
                        </Typography>
                        <Typography variant="h4">
                          {inspectionStats.suppliers}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                        <SupplierIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Pass Rate
                        </Typography>
                        <Typography variant="h4">
                          {inspectionStats.passRate}%
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                        <CheckCircleIcon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Upcoming and Recent Inspections */}
          <Grid container spacing={3}>
            {/* Upcoming Inspections */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Upcoming Inspections" 
                  action={
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={handleViewAllInspections}
                    >
                      View All
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {upcomingInspections.map((inspection) => (
                      <ListItem 
                        key={inspection.id}
                        divider
                        button
                        onClick={() => handleViewInspection(inspection.id)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                            <InspectionIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1">{inspection.supplierName}</Typography>
                              <Chip 
                                size="small" 
                                label={inspection.priority} 
                                color={inspection.priority === 'high' ? 'error' : (inspection.priority === 'medium' ? 'warning' : 'success')}
                                sx={{ ml: 1 }}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {formatDate(inspection.inspectionDate)}
                              </Typography>
                              <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                                • {inspection.inspectionType.replace('_', ' ')}
                              </Typography>
                            </>
                          }
                        />
                        <StatusBadge 
                          status="warning" 
                          label="Scheduled" 
                        />
                      </ListItem>
                    ))}
                    {upcomingInspections.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary="No upcoming inspections"
                          secondary="Schedule a new inspection to get started"
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Inspections */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Recently Completed" 
                  action={
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={handleViewAllInspections}
                    >
                      View All
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {recentInspections.map((inspection) => (
                      <ListItem 
                        key={inspection.id}
                        divider
                        button
                        onClick={() => handleViewInspection(inspection.id)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getScoreColor(inspection.score) }}>
                            {inspection.score}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={inspection.supplierName}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {formatDate(inspection.inspectionDate)}
                              </Typography>
                              <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                                • {inspection.inspectionType.replace('_', ' ')}
                              </Typography>
                            </>
                          }
                        />
                        <StatusBadge 
                          status="success" 
                          label="Completed" 
                        />
                      </ListItem>
                    ))}
                    {recentInspections.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary="No recent inspections"
                          secondary="Completed inspections will appear here"
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

// Helper function to get color based on score
const getScoreColor = (score: number) => {
  if (score >= 90) return '#4caf50'; // green
  if (score >= 70) return '#ff9800'; // orange
  return '#f44336'; // red
};

export default Dashboard; 