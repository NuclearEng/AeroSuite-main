import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import { Speed, Memory, Storage, CloudQueue } from '@mui/icons-material';

const ApplicationMetrics: React.FC = () => {
  const metrics = [
    { 
      title: 'CPU Usage', 
      value: 45, 
      unit: '%', 
      icon: <Speed />, 
      color: '#1976d2',
      description: 'Average CPU utilization'
    },
    { 
      title: 'Memory Usage', 
      value: 62, 
      unit: '%', 
      icon: <Memory />, 
      color: '#388e3c',
      description: 'RAM consumption'
    },
    { 
      title: 'Storage', 
      value: 78, 
      unit: '%', 
      icon: <Storage />, 
      color: '#f57c00',
      description: 'Disk space used'
    },
    { 
      title: 'API Latency', 
      value: 120, 
      unit: 'ms', 
      icon: <CloudQueue />, 
      color: '#7b1fa2',
      description: 'Average response time'
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Application Metrics
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Monitor system performance and resource utilization
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {metrics.map((metric, index: any) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box sx={{ color: metric.color, mr: 2 }}>
                    {metric.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6">
                      {metric.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {metric.description}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {metric.value}{metric.unit}
                </Typography>
                {metric.unit === '%' && (
                  <LinearProgress 
                    variant="determinate" 
                    value={metric.value} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: metric.color
                      }
                    }} 
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Timeline
            </Typography>
            <Typography color="textSecondary">
              Real-time performance metrics chart will be displayed here
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>
                Database: <strong style={{ color: '#4caf50' }}>Healthy</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                API Server: <strong style={{ color: '#4caf50' }}>Running</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Cache: <strong style={{ color: '#4caf50' }}>Active</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Queue: <strong style={{ color: '#ff9800' }}>3 jobs pending</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApplicationMetrics;