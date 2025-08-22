import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Card, 
  CardContent,
  Chip,
  TextField,
  CircularProgress
} from '@mui/material';
import { 
  Psychology, 
  TrendingUp, 
  Warning, 
  CheckCircle,
  Analytics
} from '@mui/icons-material';

const AIAnalysis: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const insights = [
    {
      type: 'opportunity',
      title: 'Cost Optimization Opportunity',
      description: 'Analysis shows potential 15% cost reduction by consolidating orders with Supplier ABC',
      confidence: 92,
      icon: <TrendingUp />,
      color: '#4caf50'
    },
    {
      type: 'risk',
      title: 'Supply Chain Risk Detected',
      description: 'Supplier XYZ shows declining performance metrics over the last quarter',
      confidence: 78,
      icon: <Warning />,
      color: '#ff9800'
    },
    {
      type: 'compliance',
      title: 'Compliance Check Passed',
      description: 'All active suppliers meet AS9100 certification requirements',
      confidence: 100,
      icon: <CheckCircle />,
      color: '#2196f3'
    }
  ];

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            AI Analysis
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Intelligent insights and predictions for your supply chain
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <Psychology />}
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Latest Insights
          </Typography>
          {insights.map((insight, index: any) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="flex-start">
                  <Box sx={{ color: insight.color, mr: 2 }}>
                    {insight.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {insight.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {insight.description}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip 
                        label={`${insight.confidence}% confidence`} 
                        size="small" 
                        color={insight.confidence > 80 ? 'success' : 'warning'}
                      />
                      <Typography variant="caption" color="textSecondary">
                        Generated 2 hours ago
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ask AI Assistant
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Ask a question about your supply chain data..."
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="outlined" startIcon={<Analytics />}>
              Get Answer
            </Button>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Analysis Categories
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip label="Cost Optimization" variant="outlined" />
              <Chip label="Risk Assessment" variant="outlined" />
              <Chip label="Quality Predictions" variant="outlined" />
              <Chip label="Demand Forecasting" variant="outlined" />
              <Chip label="Supplier Performance" variant="outlined" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAnalysis;