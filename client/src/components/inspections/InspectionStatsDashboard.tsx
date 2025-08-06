import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  useTheme } from
'@mui/material';
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
import useInspectionStats from '../../pages/inspections/hooks/useInspectionStats';

/**
 * Component for displaying inspection statistics in a dashboard format
 */
const InspectionStatsDashboard: React.FC = () => {
  const { stats, loading, error } = useInspectionStats();
  const theme = useTheme();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>);

  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>);

  }

  if (!stats) {
    return (
      <Box p={2}>
        <Typography>No statistics available.</Typography>
      </Box>);

  }

  // Prepare data for pie chart
  const statusData = Object.entries(stats.statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  }));

  const typeData = Object.entries(stats.typeCounts).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }));

  // Colors for pie charts
  const statusColors = [
  theme.palette.primary.main,
  theme.palette.secondary.main,
  theme.palette.success.main,
  theme.palette.error.main];


  const typeColors = [
  theme.palette.info.main,
  theme.palette.warning.main,
  theme.palette.success.light];


  return (
    <Grid container spacing={3}>
      
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardHeader title="Total Scheduled" />
          <CardContent>
            <Typography variant="h3" align="center">
              {stats.statusCounts.scheduled}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardHeader title="In Progress" />
          <CardContent>
            <Typography variant="h3" align="center">
              {stats.statusCounts['in-progress']}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardHeader title="Completed" />
          <CardContent>
            <Typography variant="h3" align="center">
              {stats.statusCounts.completed}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardHeader title="Cancelled" />
          <CardContent>
            <Typography variant="h3" align="center">
              {stats.statusCounts.cancelled}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      
      <Grid item xs={12} lg={8}>
        <Card>
          <CardHeader title="Monthly Inspection Trends" />
          <CardContent>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.monthlyTrends}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }}>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill={theme.palette.success.main} name="Completed" />
                  <Bar dataKey="scheduled" fill={theme.palette.primary.main} name="Scheduled" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardHeader title="Inspection Status Distribution" />
          <CardContent>
            <Box height={300} display="flex" justifyContent="center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">

                    {statusData.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardHeader title="Inspection Type Distribution" />
          <CardContent>
            <Box height={300} display="flex" justifyContent="center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">

                    {typeData.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={typeColors[index % typeColors.length]} />
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6} lg={8}>
        <Card>
          <CardHeader title="Top Supplier Performance" />
          <CardContent>
            <List>
              {stats.supplierPerformance.map((supplier) =>
              <React.Fragment key={supplier.id}>
                  <ListItem>
                    <ListItemText
                    primary={supplier.name}
                    secondary={`${supplier.inspectionCount} inspections`} />

                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Pass Rate:
                      </Typography>
                      <Chip
                      label={`${supplier.passRate}%`}
                      color={
                      supplier.passRate >= 90 ? 'success' :
                      supplier.passRate >= 70 ? 'warning' :
                      'error'
                      }
                      size="small" />

                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>);

};

export default InspectionStatsDashboard;