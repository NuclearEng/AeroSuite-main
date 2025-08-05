import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  InsertChart as InsertChartIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';

/**
 * Features Overview Step
 * 
 * The fourth step in the onboarding flow that introduces users to 
 * key features of the system.
 */
const FeaturesOverviewStep: React.FC = () => {
  const theme = useTheme();

  // Define features
  const features = [
    {
      title: 'Dashboard',
      description: 'Get a quick overview of all your important metrics and data in one place.',
      icon: <DashboardIcon fontSize="large" color="primary" />
    },
    {
      title: 'Inspection Management',
      description: 'Schedule, conduct, and track quality inspections with our comprehensive tools.',
      icon: <AssignmentIcon fontSize="large" color="primary" />
    },
    {
      title: 'Supplier Management',
      description: 'Track and manage your suppliers, including performance metrics and risk assessments.',
      icon: <LocalShippingIcon fontSize="large" color="primary" />
    },
    {
      title: 'Customer Management',
      description: 'Maintain detailed records of your customers and their requirements.',
      icon: <PeopleIcon fontSize="large" color="primary" />
    },
    {
      title: 'Analytics & Reporting',
      description: 'Generate insightful reports and visualize data to make informed decisions.',
      icon: <InsertChartIcon fontSize="large" color="primary" />
    },
    {
      title: 'Company Integration',
      description: 'Connect with other business systems for a seamless workflow.',
      icon: <BusinessIcon fontSize="large" color="primary" />
    }
  ];

  return (
    <Box>
      <Typography variant="h5" align="center" gutterBottom>
        Key Features
      </Typography>
      
      <Typography variant="body1" align="center" paragraph sx={{ mb: 4 }}>
        AeroSuite offers a wide range of tools to help you manage quality control and supplier relationships.
        Here are some key features you'll be using:
      </Typography>
      
      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.shadows[4]
                }
              }}
              elevation={2}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2 
                  }}
                >
                  {feature.icon}
                  <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
        You'll find detailed guides for each feature in the help section once you're logged in.
      </Typography>
    </Box>
  );
};

export default FeaturesOverviewStep; 