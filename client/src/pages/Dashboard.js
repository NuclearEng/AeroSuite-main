import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  LinearProgress,
  useTheme,
  Container,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import useResponsive from '../hooks/useResponsive';
import useOfflineMode from '../hooks/useOfflineMode';
import { VisuallyHidden } from '../components/common/AccessibilityHelpers';

const Dashboard = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isOffline, isFeatureEnabled } = useOfflineMode();
  const theme = useTheme();

  // Mock data for dashboard
  const stats = {
    suppliers: {
      total: 128,
      active: 112,
      pending: 8,
      blacklisted: 8,
      trend: +5.2
    },
    customers: {
      total: 64,
      active: 58,
      pending: 4,
      inactive: 2,
      trend: -1.8
    },
    inspections: {
      total: 342,
      completed: 298,
      inProgress: 32,
      scheduled: 12,
      trend: +12.4
    },
    alerts: {
      total: 18,
      critical: 3,
      high: 7,
      medium: 5,
      low: 3
    }
  };

  const StatCard = ({ title, value, subtext, icon, trend, color }) => (
    <Card sx={{ height: '100%' }} component="section" aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 2,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Box>
            <Typography 
              variant="h6" 
              component="h2" 
              color="text.secondary"
              id={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}
            >
              {title}
            </Typography>
            <Typography 
              variant={isMobile ? "h4" : "h3"} 
              component="div" 
              sx={{ mt: 1 }}
              aria-label={`${value} ${title}`}
            >
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtext}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            justifyContent: 'center',
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            width: 56,
            height: 56,
            mt: isMobile ? 2 : 0,
            mb: isMobile ? 2 : 0
          }}
          aria-hidden="true" // Icon is decorative
          >
            {icon}
          </Box>
        </Box>
        <Box 
          sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
          aria-live="polite"
          aria-atomic="true"
        >
          {trend > 0 ? (
            <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 1 }} aria-hidden="true" />
          ) : (
            <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 1 }} aria-hidden="true" />
          )}
          <Typography 
            variant="body2" 
            color={trend > 0 ? 'success.main' : 'error.main'}
          >
            {Math.abs(trend)}% {trend > 0 ? 'increase' : 'decrease'} from last month
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // Dashboard cards
  const dashboardCards = [
    {
      title: "Supplier Performance",
      description: "Track and analyze supplier performance metrics.",
      action: "/suppliers",
      actionText: "View Details"
    },
    {
      title: "Inspection Status",
      description: "Monitor ongoing and completed inspections.",
      action: "/inspections",
      actionText: "View Details"
    },
    {
      title: "Customer Orders",
      description: "Track customer orders and delivery status.",
      action: "/customers",
      actionText: "View Details"
    },
    {
      title: "Quality Metrics",
      description: "Review quality control metrics and trends.",
      action: "/reports",
      actionText: "View Details"
    }
  ];

  return (
    <Box component="main" sx={{ p: 3 }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        sx={{ mb: isMobile ? 2 : 4 }}
        component="h1"
        tabIndex="-1"
      >
        Dashboard
      </Typography>
      
      {isOffline && (
        <Box 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'warning.light', 
            borderRadius: 1,
            color: 'warning.dark'
          }}
          role="alert"
          aria-live="polite"
        >
          <Typography variant="body2">
            You're viewing cached dashboard data while offline. Some features may be limited.
          </Typography>
        </Box>
      )}
      
      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Summary Stats */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Total Suppliers" 
            value={stats.suppliers.total} 
            subtext={`${stats.suppliers.active} active`}
            icon={<BusinessIcon sx={{ color: 'primary.main', fontSize: isMobile ? 24 : 32 }} />}
            trend={stats.suppliers.trend}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Total Customers" 
            value={stats.customers.total} 
            subtext={`${stats.customers.active} active`}
            icon={<PersonIcon sx={{ color: 'info.main', fontSize: isMobile ? 24 : 32 }} />}
            trend={stats.customers.trend}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Inspections" 
            value={stats.inspections.total} 
            subtext={`${stats.inspections.completed} completed`}
            icon={<AssignmentIcon sx={{ color: 'success.main', fontSize: isMobile ? 24 : 32 }} />}
            trend={stats.inspections.trend}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Alerts" 
            value={stats.alerts.total} 
            subtext={`${stats.alerts.critical} critical`}
            icon={<WarningIcon sx={{ color: 'warning.main', fontSize: isMobile ? 24 : 32 }} />}
            trend={0}
            color="warning"
          />
        </Grid>

        {/* Dashboard Cards */}
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {card.description}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  href={card.action}
                >
                  {card.actionText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 