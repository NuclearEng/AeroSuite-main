import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import DataVisualization from '../../components/common/DataVisualization';

const DataVisualizationPage: React.FC = () => {
  // Sample data for different chart types
  const barChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [{
      label: 'Revenue',
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }]
  };

  const lineChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Performance',
      data: [12, 19, 3, 5],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const pieChartData = {
    labels: ['Completed', 'In Progress', 'Pending'],
    datasets: [{
      data: [300, 50, 100],
      backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384'],
    }]
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Data Visualization
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Interactive charts and analytics for your supply chain data
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Trends
            </Typography>
            <DataVisualization
              type="bar"
              data={barChartData}
              height={300}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Performance
            </Typography>
            <DataVisualization
              type="line"
              data={lineChartData}
              height={300}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Distribution
            </Typography>
            <DataVisualization
              type="pie"
              data={pieChartData}
              height={300}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Custom Analytics
            </Typography>
            <Typography color="textSecondary">
              Additional visualization options and custom reports will be available here
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataVisualizationPage;