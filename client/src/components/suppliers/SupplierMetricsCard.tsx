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
  ListItemIcon,
  Chip,
  useTheme
} from '@mui/material';
import { 
  LocalShipping, 
  CheckCircle, 
  AccessTime, 
  Gavel,
  Assignment
} from '@mui/icons-material';
import { useSupplierMetrics } from '../../pages/suppliers/hooks/useSupplierMetrics';

interface SupplierMetricsCardProps {
  supplierId: string;
}

/**
 * Component for displaying supplier metrics in a card format
 */
const SupplierMetricsCard: React.FC<SupplierMetricsCardProps> = ({ supplierId }) => {
  const { metrics, loading, error } = useSupplierMetrics(supplierId);
  const theme = useTheme();

  if (loading) {
    return (
      <Card>
        <CardHeader title="Supplier Performance" />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Supplier Performance" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader title="Supplier Performance" />
        <CardContent>
          <Typography>No metrics available for this supplier.</Typography>
        </CardContent>
      </Card>
    );
  }

  const getColorForMetric = (value: number): string => {
    if (value >= 90) return theme.palette.success.main;
    if (value >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card>
      <CardHeader 
        title="Supplier Performance" 
        subheader={`Last updated: ${new Date(metrics.lastUpdated).toLocaleString()}`}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>Key Metrics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Box position="relative" display="inline-flex">
                      <CircularProgress
                        variant="determinate"
                        value={metrics.metrics.onTimeDeliveryRate}
                        size={80}
                        thickness={4}
                        sx={{ color: getColorForMetric(metrics.metrics.onTimeDeliveryRate) }}
                      />
                      <Box
                        top={0}
                        left={0}
                        bottom={0}
                        right={0}
                        position="absolute"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography variant="body1" component="div" color="textSecondary">
                          {`${metrics.metrics.onTimeDeliveryRate}%`}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary" align="center" mt={1}>
                      On-Time Delivery
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Box position="relative" display="inline-flex">
                      <CircularProgress
                        variant="determinate"
                        value={metrics.metrics.qualityRate}
                        size={80}
                        thickness={4}
                        sx={{ color: getColorForMetric(metrics.metrics.qualityRate) }}
                      />
                      <Box
                        top={0}
                        left={0}
                        bottom={0}
                        right={0}
                        position="absolute"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Typography variant="body1" component="div" color="textSecondary">
                          {`${metrics.metrics.qualityRate}%`}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary" align="center" mt={1}>
                      Quality Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>Additional Metrics</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AccessTime />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Response Time" 
                    secondary={`${metrics.metrics.responseTime} hours`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Gavel />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Compliance Score" 
                    secondary={`${metrics.metrics.complianceScore}%`} 
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Recent Inspections</Typography>
            {metrics.recentInspections.length > 0 ? (
              <List dense>
                <Divider />
                {metrics.recentInspections.map((inspection: any) => (
                  <React.Fragment key={inspection.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Assignment />
                      </ListItemIcon>
                      <ListItemText
                        primary={inspection.title}
                        secondary={`${new Date(inspection.date).toLocaleDateString()} - ${inspection.type}`}
                      />
                      <Chip 
                        label={inspection.status} 
                        size="small"
                        color={
                          inspection.status === 'completed' ? 'success' :
                          inspection.status === 'in-progress' ? 'primary' :
                          'default'
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No recent inspections found.
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SupplierMetricsCard; 