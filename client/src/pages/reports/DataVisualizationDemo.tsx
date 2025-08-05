import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent,
  Slider,
  Stack,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { PageHeader } from '../../components/common';
import DataVisualization, { DataSeries, ChartType } from '../../components/common/DataVisualization';
import { useNavigate } from 'react-router-dom';

// Sample datasets
const sampleDatasets = {
  monthly: [
    {
      id: 'sales',
      label: 'Monthly Sales',
      data: [
        { x: 'Jan', y: 65, label: 'January' },
        { x: 'Feb', y: 59, label: 'February' },
        { x: 'Mar', y: 80, label: 'March' },
        { x: 'Apr', y: 81, label: 'April' },
        { x: 'May', y: 56, label: 'May' },
        { x: 'Jun', y: 55, label: 'June' },
        { x: 'Jul', y: 40, label: 'July' },
        { x: 'Aug', y: 70, label: 'August' },
        { x: 'Sep', y: 90, label: 'September' },
        { x: 'Oct', y: 81, label: 'October' },
        { x: 'Nov', y: 66, label: 'November' },
        { x: 'Dec', y: 91, label: 'December' }
      ],
      color: '#4caf50'
    },
    {
      id: 'expenses',
      label: 'Monthly Expenses',
      data: [
        { x: 'Jan', y: 42, label: 'January' },
        { x: 'Feb', y: 49, label: 'February' },
        { x: 'Mar', y: 35, label: 'March' },
        { x: 'Apr', y: 55, label: 'April' },
        { x: 'May', y: 45, label: 'May' },
        { x: 'Jun', y: 48, label: 'June' },
        { x: 'Jul', y: 30, label: 'July' },
        { x: 'Aug', y: 42, label: 'August' },
        { x: 'Sep', y: 65, label: 'September' },
        { x: 'Oct', y: 68, label: 'October' },
        { x: 'Nov', y: 52, label: 'November' },
        { x: 'Dec', y: 75, label: 'December' }
      ],
      color: '#f44336'
    }
  ],
  categories: [
    {
      id: 'categories',
      label: 'Sales by Category',
      data: [
        { x: 'Electronics', y: 35, label: 'Electronics', color: '#2196f3' },
        { x: 'Clothing', y: 28, label: 'Clothing', color: '#ff9800' },
        { x: 'Food', y: 15, label: 'Food', color: '#4caf50' },
        { x: 'Books', y: 12, label: 'Books', color: '#9c27b0' },
        { x: 'Other', y: 10, label: 'Other', color: '#795548' }
      ]
    }
  ],
  performance: [
    {
      id: 'quality',
      label: 'Quality Score',
      data: [
        { x: 'Supplier A', y: 90, label: 'Supplier A' },
        { x: 'Supplier B', y: 75, label: 'Supplier B' },
        { x: 'Supplier C', y: 85, label: 'Supplier C' },
        { x: 'Supplier D', y: 65, label: 'Supplier D' },
        { x: 'Supplier E', y: 92, label: 'Supplier E' }
      ],
      color: '#3f51b5'
    },
    {
      id: 'delivery',
      label: 'Delivery Performance',
      data: [
        { x: 'Supplier A', y: 85, label: 'Supplier A' },
        { x: 'Supplier B', y: 90, label: 'Supplier B' },
        { x: 'Supplier C', y: 70, label: 'Supplier C' },
        { x: 'Supplier D', y: 80, label: 'Supplier D' },
        { x: 'Supplier E', y: 88, label: 'Supplier E' }
      ],
      color: '#009688'
    },
    {
      id: 'cost',
      label: 'Cost Efficiency',
      data: [
        { x: 'Supplier A', y: 75, label: 'Supplier A' },
        { x: 'Supplier B', y: 85, label: 'Supplier B' },
        { x: 'Supplier C', y: 90, label: 'Supplier C' },
        { x: 'Supplier D', y: 60, label: 'Supplier D' },
        { x: 'Supplier E', y: 78, label: 'Supplier E' }
      ],
      color: '#ff5722'
    }
  ],
  bubble: [
    {
      id: 'suppliers',
      label: 'Supplier Performance',
      data: [
        { x: 85, y: 90, z: 12, label: 'Supplier A' },
        { x: 70, y: 80, z: 8, label: 'Supplier B' },
        { x: 90, y: 75, z: 15, label: 'Supplier C' },
        { x: 65, y: 95, z: 5, label: 'Supplier D' },
        { x: 80, y: 85, z: 10, label: 'Supplier E' }
      ],
      color: '#673ab7'
    }
  ]
};

// Available chart types
const availableChartTypes: ChartType[] = [
  'bar', 'line', 'pie', 'doughnut', 'radar', 'polar', 'bubble', 'scatter'
];

const DataVisualizationDemo: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [selectedDataset, setSelectedDataset] = useState<string>('monthly');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [randomize, setRandomize] = useState<boolean>(false);
  
  // Get current dataset
  const currentDataset = sampleDatasets[selectedDataset as keyof typeof sampleDatasets];
  
  // Randomize data if enabled
  const visualizationData = React.useMemo(() => {
    if (!randomize) return currentDataset;
    
    return currentDataset.map(series => ({
      ...series,
      data: series.data.map(point => ({
        ...point,
        y: point.y * (0.7 + Math.random() * 0.6) // Randomize by ±30%
      }))
    }));
  }, [currentDataset, randomize, refreshKey]);
  
  // Handle dataset change
  const handleDatasetChange = (event: SelectChangeEvent) => {
    setSelectedDataset(event.target.value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setLoading(false);
    }, 800);
  };
  
  // Handle randomize toggle
  const handleRandomizeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRandomize(event.target.checked);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader
        title="Interactive Data Visualization"
        subtitle="Explore and analyze data with interactive visualizations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports', href: '/reports' },
          { label: 'Data Visualization' }
        ]}
      />
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Visualization Controls
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="dataset-select-label">Dataset</InputLabel>
              <Select
                labelId="dataset-select-label"
                id="dataset-select"
                value={selectedDataset}
                label="Dataset"
                onChange={handleDatasetChange}
              >
                <MenuItem value="monthly">Monthly Performance</MenuItem>
                <MenuItem value="categories">Sales Categories</MenuItem>
                <MenuItem value="performance">Supplier Performance</MenuItem>
                <MenuItem value="bubble">Bubble Chart Data</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={randomize}
                  onChange={handleRandomizeToggle}
                />
              }
              label="Randomize data on refresh"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Data Visualizations
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Interactive charts allow you to visualize and analyze data in different ways.
          Try changing chart types, toggling options, and exporting charts.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DataVisualization
              title={selectedDataset === 'monthly' ? 'Monthly Performance Trends' : 
                     selectedDataset === 'categories' ? 'Sales by Category' :
                     selectedDataset === 'performance' ? 'Supplier Performance Analysis' :
                     'Supplier Performance Quadrant'}
              description="Interactive visualization with multiple chart types. Toggle between different views to analyze the data."
              series={visualizationData}
              defaultChartType={selectedDataset === 'bubble' ? 'bubble' :
                               selectedDataset === 'categories' ? 'pie' :
                               selectedDataset === 'performance' ? 'radar' : 'bar'}
              availableChartTypes={availableChartTypes}
              height={400}
              loading={loading}
              error={error}
              xAxisLabel={selectedDataset === 'monthly' ? 'Month' : 
                         selectedDataset === 'performance' ? 'Supplier' :
                         selectedDataset === 'bubble' ? 'Quality Score' : 'Category'}
              yAxisLabel={selectedDataset === 'monthly' ? 'Value ($K)' : 
                         selectedDataset === 'performance' ? 'Score (%)' :
                         selectedDataset === 'bubble' ? 'Delivery Performance' : 'Sales (%)'}
              onRefresh={handleRefresh}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DataVisualization
              title="Performance Comparison"
              series={visualizationData}
              defaultChartType="bar"
              availableChartTypes={['bar', 'line', 'radar']}
              height={350}
              loading={loading}
              error={error}
              onRefresh={handleRefresh}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DataVisualization
              title="Distribution Analysis"
              series={[visualizationData[0]]}
              defaultChartType="pie"
              availableChartTypes={['pie', 'doughnut', 'polar']}
              height={350}
              loading={loading}
              error={error}
              onRefresh={handleRefresh}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            About Interactive Data Visualization
          </Typography>
          
          <Typography variant="body2" paragraph>
            This component provides a powerful way to visualize and analyze data with interactive features:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Features:
              </Typography>
              <ul>
                <li>Multiple chart types (Bar, Line, Pie, Doughnut, Radar, etc.)</li>
                <li>Interactive controls for chart customization</li>
                <li>Export charts as images</li>
                <li>Responsive design that works on all device sizes</li>
                <li>Animated transitions between chart types</li>
                <li>Tooltips and hover effects for data exploration</li>
              </ul>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Use Cases:
              </Typography>
              <ul>
                <li>Performance dashboards</li>
                <li>Business intelligence reports</li>
                <li>Supplier and customer analytics</li>
                <li>Financial reporting</li>
                <li>Quality metrics visualization</li>
                <li>Trend analysis and forecasting</li>
              </ul>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate('/reports')}>
              Back to Reports
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default DataVisualizationDemo; 