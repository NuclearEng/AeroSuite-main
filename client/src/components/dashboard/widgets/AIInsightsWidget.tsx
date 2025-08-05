import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Tabs, Tab, Divider, Chip, Alert, Button, Tooltip } from '@mui/material';
import { InsightsOutlined, TrendingUp, WarningAmber, CheckCircleOutline, AutoGraph } from '@mui/icons-material';
import axios from 'axios';
import { formatDistance } from 'date-fns';

// Types for AI insights
interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  severity: 'info' | 'warning' | 'critical';
  category: string;
  timestamp: string;
  source: string;
  confidence: number;
  metadata?: Record<string, any>;
}

interface InsightGroup {
  category: string;
  insights: Insight[];
}

/**
 * AI Insights Widget
 * 
 * This widget displays AI-powered insights about quality, efficiency, and other 
 * key metrics derived from inspection and manufacturing data.
 * 
 * Part of: AI-Powered Data Insights (AI016)
 */
const AIInsightsWidget: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [insightGroups, setInsightGroups] = useState<InsightGroup[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Tab options
  const tabs = ['All Insights', 'Critical', 'Trends', 'Recommendations'];

  // Fetch insights data from the API
  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real application, this would come from your API
      // const response = await axios.get('/api/v1/ai/insights');
      // const data = response.data;
      
      // For this example, we'll use sample data
      const data = getSampleInsights();
      
      setInsights(data);
      setLastUpdated(new Date().toISOString());
      
      // Group insights by category
      const grouped: Record<string, Insight[]> = {};
      data.forEach(insight => {
        if (!grouped[insight.category]) {
          grouped[insight.category] = [];
        }
        grouped[insight.category].push(insight);
      });
      
      setInsightGroups(
        Object.keys(grouped).map(category => ({
          category,
          insights: grouped[category]
        }))
      );
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Failed to load insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh insights data
  const handleRefresh = () => {
    fetchInsights();
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  
  // Filter insights based on selected tab
  const getFilteredInsights = (): Insight[] => {
    switch (currentTab) {
      case 1: // Critical
        return insights.filter(insight => insight.severity === 'critical');
      case 2: // Trends
        return insights.filter(insight => insight.type === 'trend');
      case 3: // Recommendations
        return insights.filter(insight => insight.type === 'recommendation');
      default: // All
        return insights;
    }
  };
  
  // Get icon for insight type
  const getInsightIcon = (type: string, severity: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp color={severity === 'critical' ? 'error' : 'primary'} />;
      case 'anomaly':
        return <WarningAmber color={severity === 'critical' ? 'error' : 'warning'} />;
      case 'recommendation':
        return <CheckCircleOutline color="success" />;
      case 'prediction':
        return <AutoGraph color="info" />;
      default:
        return <InsightsOutlined />;
    }
  };
  
  // Get color for severity
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };
  
  // Format insight timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
    } catch (err) {
      return 'Unknown time';
    }
  };
  
  // Load insights on component mount
  useEffect(() => {
    fetchInsights();
    
    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(() => {
      fetchInsights();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Sample insights data for demonstration
  const getSampleInsights = (): Insight[] => {
    return [
      {
        id: 'ins-001',
        title: 'Increasing defect rate in component A-2045',
        description: 'Detection of a 15% increase in surface defects over the past week compared to the previous month',
        type: 'trend',
        severity: 'critical',
        category: 'Quality Control',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        source: 'defect-detection',
        confidence: 0.92,
        metadata: {
          defectType: 'surface',
          affectedComponent: 'A-2045',
          trend: '+15%',
          timespan: '7 days'
        }
      },
      {
        id: 'ins-002',
        title: 'Process optimization opportunity',
        description: 'Reducing curing time by 12% could improve efficiency without affecting quality based on historical data analysis',
        type: 'recommendation',
        severity: 'info',
        category: 'Process Optimization',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        source: 'process-optimization',
        confidence: 0.85,
        metadata: {
          process: 'curing',
          currentValue: '45 minutes',
          recommendedValue: '39.6 minutes',
          potentialSavings: '5.4 minutes per cycle'
        }
      },
      {
        id: 'ins-003',
        title: 'Dimensional drift detected',
        description: 'Gradual drift in critical dimension D-5 detected across multiple inspections',
        type: 'anomaly',
        severity: 'warning',
        category: 'Dimensional Accuracy',
        timestamp: new Date(Date.now() - 129600000).toISOString(),
        source: 'dimensional-analysis',
        confidence: 0.89,
        metadata: {
          dimension: 'D-5',
          specification: '25.4mm ±0.1mm',
          latestAverage: '25.52mm',
          trend: 'Increasing'
        }
      },
      {
        id: 'ins-004',
        title: 'Predictive maintenance alert',
        description: 'Machine CNC-07 is showing early signs of spindle wear based on vibration analysis',
        type: 'prediction',
        severity: 'warning',
        category: 'Equipment Maintenance',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        source: 'ts-anomaly-detection',
        confidence: 0.78,
        metadata: {
          equipment: 'CNC-07',
          component: 'Spindle',
          estimatedTimeToFailure: '18-21 days',
          recommendedAction: 'Schedule maintenance'
        }
      },
      {
        id: 'ins-005',
        title: 'Supplier quality correlation',
        description: 'Components from Supplier XYZ show 23% fewer defects after recent process change',
        type: 'trend',
        severity: 'info',
        category: 'Supplier Quality',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        source: 'quality-analytics',
        confidence: 0.94,
        metadata: {
          supplier: 'Supplier XYZ',
          components: ['A-1024', 'B-5436'],
          improvement: '23%',
          processChange: 'New heat treatment protocol'
        }
      }
    ];
  };
  
  // Render insight card
  const renderInsightCard = (insight: Insight) => {
    return (
      <Paper 
        key={insight.id} 
        elevation={1} 
        sx={{ 
          p: 2, 
          mb: 2, 
          borderLeft: 4, 
          borderColor: `${getSeverityColor(insight.severity)}.main` 
        }}
      >
        <Box display="flex" alignItems="center" mb={1}>
          <Box mr={1}>{getInsightIcon(insight.type, insight.severity)}</Box>
          <Typography variant="subtitle1" fontWeight="bold">{insight.title}</Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          {insight.description}
        </Typography>
        
        <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center">
          <Box>
            <Chip 
              size="small" 
              label={insight.category} 
              sx={{ mr: 1, mb: 1 }} 
            />
            <Chip 
              size="small" 
              label={`${(insight.confidence * 100).toFixed(0)}% confidence`} 
              variant="outlined" 
              sx={{ mr: 1, mb: 1 }} 
            />
          </Box>
          <Tooltip title={new Date(insight.timestamp).toLocaleString()}>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(insight.timestamp)}
            </Typography>
          </Tooltip>
        </Box>
      </Paper>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center">
          <InsightsOutlined sx={{ mr: 1 }} />
          AI-Powered Insights
        </Typography>
        
        <Button 
          size="small" 
          onClick={handleRefresh} 
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      <Tabs 
        value={currentTab} 
        onChange={handleTabChange} 
        variant="scrollable" 
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab} />
        ))}
      </Tabs>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : getFilteredInsights().length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">No insights available for this filter</Typography>
          </Box>
        ) : (
          getFilteredInsights().map(insight => renderInsightCard(insight))
        )}
      </Box>
      
      {lastUpdated && (
        <Box mt={2} textAlign="right">
          <Typography variant="caption" color="text.secondary">
            Last updated: {formatTimestamp(lastUpdated)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AIInsightsWidget; 