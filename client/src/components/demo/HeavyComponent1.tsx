import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Avatar } from '@mui/material';
import { blue } from '@mui/material/colors';

// Mock large component that would be expensive to load
const HeavyComponent1: React.FC = () => {
  // Simulate a heavy component by creating a large array
  const largeDataset = Array.from({ length: 50 }, (_, index) => ({
    id: index,
    name: `Item ${index}`,
    value: Math.floor(Math.random() * 1000),
    category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
  }));
  
  // Safe color mapping function for the avatar background
  const getBlueColor = (index: number) => {
    const colorKeys = [400, 500, 600, 700, 800] as const;
    const colorKey = colorKeys[index % colorKeys.length];
    return blue[colorKey];
  };
  
  return (
    <Box width="100%">
      <Typography variant="h5" gutterBottom color="primary">
        Data Visualization Component
      </Typography>
      <Typography variant="body2" paragraph>
        This component simulates a heavy data visualization that would be expensive to load upfront.
        It's dynamically imported only when needed.
      </Typography>
      
      <Grid container spacing={2}>
        {largeDataset.slice(0, 8).map(item => (
          <Grid item xs={12} sm={6} md={3} key={item.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Avatar 
                    sx={{ 
                      bgcolor: getBlueColor(item.id),
                      width: 40, 
                      height: 40,
                      mr: 2
                    }}
                  >
                    {item.category}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Value: {item.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Paper 
        sx={{ 
          p: 2, 
          mt: 3, 
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          border: '1px solid rgba(25, 118, 210, 0.2)',
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Component Size Metrics
        </Typography>
        <Typography variant="body2">
          • Bundle Size: ~45KB (when built)<br />
          • Renders: 8 cards from a dataset of 50 items<br />
          • Dependencies: MUI Card, Grid, Avatar components<br />
          • Time Saved: ~150ms on initial page load
        </Typography>
      </Paper>
    </Box>
  );
};

export default HeavyComponent1; 