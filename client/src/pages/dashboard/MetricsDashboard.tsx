import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link, Button } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import PerformanceMetricsDashboard from '../../components/dashboard/widgets/PerformanceMetricsDashboard';

/**
 * Metrics Dashboard Page
 * 
 * Displays the application performance metrics dashboard.
 * This is a simplified view that redirects to the full dashboard in the monitoring section.
 */
const MetricsDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const handleViewFullDashboard = () => {
    navigate('/monitoring/performance');
  };
  
  return (
    <>
      <Helmet>
        <title>Application Metrics | AeroSuite</title>
      </Helmet>
      
      <Container maxWidth="xl">
        <Box sx={{ pt: 2, pb: 4 }}>
          {/* Breadcrumbs */}
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link color="inherit" href="/dashboard">
              Dashboard
            </Link>
            <Typography color="text.primary">Application Metrics</Typography>
          </Breadcrumbs>
          
          {/* Page Title */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Application Metrics Dashboard
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleViewFullDashboard}
            >
              View Full Dashboard
            </Button>
          </Box>
          <Typography variant="body1" color="text.secondary" paragraph>
            Real-time monitoring of system and application performance metrics.
          </Typography>
          
          {/* Main Content */}
          <Box sx={{ mt: 3 }}>
            <PerformanceMetricsDashboard simplified={true} />
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default MetricsDashboard; 