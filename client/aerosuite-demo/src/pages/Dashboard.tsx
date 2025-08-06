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
  CardActionArea } from
'@mui/material';
import {
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Factory as FactoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Event as EventIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Map as MapIcon,
  Assessment as AnalyticsIcon,
  Security as RiskIcon } from
'@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell } from
'recharts';
import type { Inspection } from '../services/mockDataService';
import MockDataService from '../services/mockDataService';

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

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for statistics
  const stats = {
    totalInspections: 0,
    scheduledInspections: 0,
    inProgressInspections: 0,
    completedInspections: 0,
    customers: 3,
    suppliers: 3,
    passRate: 0
  };

  // Load data
  useEffect(() => {
    MockDataService.initialize();
    const data = MockDataService.getInspections();
    setInspections(data);
    setLoading(false);
  }, []);

  // Calculate statistics
  useEffect(() => {
    if (inspections.length > 0) {
      const completed = inspections.filter((i) => i.status === 'completed');
      stats.totalInspections = inspections.length;
      stats.scheduledInspections = inspections.filter((i) => i.status === 'scheduled').length;
      stats.inProgressInspections = inspections.filter((i) => i.status === 'in-progress').length;
      stats.completedInspections = completed.length;
      stats.passRate = completed.length > 0 ?
      Math.round(completed.filter((i) => i.result === 'pass').length / completed.length * 100) :
      0;
    }
  }, [inspections]);

  // Data for inspection status chart
  const statusData = [
  { name: 'Scheduled', value: stats.scheduledInspections, color: '#1976d2' },
  { name: 'In Progress', value: stats.inProgressInspections, color: '#ff9800' },
  { name: 'Completed', value: stats.completedInspections, color: '#4caf50' }];


  // Data for monthly inspections chart
  const monthlyData = [
  { name: 'Jan', scheduled: 4, completed: 3 },
  { name: 'Feb', scheduled: 5, completed: 5 },
  { name: 'Mar', scheduled: 6, completed: 4 },
  { name: 'Apr', scheduled: 8, completed: 7 },
  { name: 'May', scheduled: 10, completed: 9 },
  { name: 'Jun', scheduled: 3, completed: 1 }];


  return (
    <Box>
      
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome to AeroSuite. Here's an overview of your inspection activities.
        </Typography>
      </Box>

      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Inspections
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalInspections}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Scheduled
                  </Typography>
                  <Typography variant="h4">
                    {stats.scheduledInspections}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <EventIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Customers
                  </Typography>
                  <Typography variant="h4">
                    {stats.customers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <BusinessIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Suppliers
                  </Typography>
                  <Typography variant="h4">
                    {stats.suppliers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <FactoryIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Supply Chain Management
        </Typography>
        <Grid container spacing={3}>
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
            <Card>
              <CardActionArea onClick={() => navigate('/suppliers/network')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <MapIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Supplier Network
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    View your supplier network on an interactive map and visualize supply chain relationships.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
            <Card>
              <CardActionArea onClick={() => navigate('/suppliers/analytics')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <AnalyticsIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Supplier Analytics
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Analyze supplier performance metrics and gain insights into your supply chain.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
            <Card>
              <CardActionArea onClick={() => navigate('/suppliers/risk-assessment')}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                      <RiskIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Risk Assessment
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Evaluate and mitigate supply chain risks with comprehensive risk assessments.
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Box>

      
      <Grid container spacing={3}>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Monthly Inspections
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scheduled" name="Scheduled" fill="#1976d2" />
                  <Bar dataKey="completed" name="Completed" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Inspection Status
            </Typography>
            <Box height={300} display="flex" flexDirection="column" justifyContent="center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>

                    {statusData.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    )}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Inspections']} />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" justifyContent="center" gap={2}>
                {statusData.map((entry) =>
                <Box key={entry.name} display="flex" alignItems="center">
                    <Box
                    sx={{
                      width: 12,
                      height: 12,
                      bgcolor: entry.color,
                      mr: 1,
                      borderRadius: '50%'
                    }} />

                    <Typography variant="body2">{entry.name}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Card>
            <CardHeader
              title="Recent Inspections"
              action={
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/inspections')}>

                  View All
                </Button>
              } />

            <Divider />
            <List sx={{ p: 0 }}>
              {inspections.slice(0, 5).map((inspection) =>
              <React.Fragment key={inspection._id}>
                  <ListItem
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/inspections/${inspection._id}`)}>

                    <ListItemAvatar>
                      <Avatar>
                        {inspection.status === 'completed' ?
                      inspection.result === 'pass' ? <CheckCircleIcon /> : <ErrorIcon /> :
                      <WarningIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                    primary={inspection.title}
                    secondary={
                    <>
                          <Typography component="span" variant="body2" color="textPrimary">
                            {inspection.customer.name}
                          </Typography>
                          {` — ${formatDate(inspection.scheduledDate)}`}
                        </>
                    } />

                    <Box ml={2}>
                      <StatusChip status={inspection.status} />
                    </Box>
                    <IconButton edge="end" size="small" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/inspections/${inspection._id}`);
                  }}>
                      <ArrowForwardIcon />
                    </IconButton>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              )}
              {inspections.length === 0 &&
              <ListItem>
                  <ListItemText
                  primary="No recent inspections"
                  secondary="Schedule a new inspection to get started" />

                </ListItem>
              }
            </List>
            <Box p={2} display="flex" justifyContent="center">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/inspections/schedule')}>

                Schedule Inspection
              </Button>
            </Box>
          </Card>
        </Grid>

        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inspection Success Rate
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" height={150}>
                <Box position="relative" display="inline-flex">
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-flex',
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: `conic-gradient(#4caf50 ${stats.passRate}%, #f44336 0)`
                    }} />

                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>

                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>

                      <Typography variant="h4" component="div">
                        {stats.passRate}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Box mt={2}>
                <Typography variant="body2" align="center">
                  {stats.completedInspections} completed inspections
                </Typography>
                <Box display="flex" justifyContent="center" mt={1} gap={2}>
                  <Chip label="Pass" color="success" size="small" />
                  <Chip label="Fail" color="error" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>);

};

export default Dashboard;