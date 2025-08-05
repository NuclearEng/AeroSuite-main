import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import MockDataService from '../../services/mockDataService';
import type { Supplier, Inspection } from '../../services/mockDataService';

// Define colors for different tiers
const tierColors = {
  tier1: '#4caf50',
  tier2: '#2196f3',
  tier3: '#ff9800'
};

// Define colors for the pie chart
const COLORS = ['#4caf50', '#ff9800', '#f44336'];

interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  tier?: string;
  inspectionCount: number;
  passRate: number;
  defectCount: number;
  onTimeDelivery: number;
  qualityScore: number;
  responsiveness: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const SupplierAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [performanceData, setPerformanceData] = useState<SupplierPerformance[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('passRate');

  useEffect(() => {
    const loadData = async () => {
      try {
        MockDataService.initialize();
        const supplierData = MockDataService.getSuppliers();
        const inspectionData = MockDataService.getInspections();
        
        setSuppliers(supplierData);
        setInspections(inspectionData);
        
        // Generate performance metrics
        const performance = generatePerformanceMetrics(supplierData, inspectionData);
        setPerformanceData(performance);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generatePerformanceMetrics = (
    supplierData: Supplier[],
    inspectionData: Inspection[]
  ): SupplierPerformance[] => {
    return supplierData.map(supplier => {
      // Get all inspections for this supplier
      const supplierInspections = inspectionData.filter(
        inspection => inspection.supplier._id === supplier._id
      );
      
      // Calculate metrics
      const inspectionCount = supplierInspections.length;
      
      // If no inspections, return default values
      if (inspectionCount === 0) {
        return {
          supplierId: supplier._id,
          supplierName: supplier.name,
          supplierCode: supplier.code,
          tier: (supplier as any).tier,
          inspectionCount: 0,
          passRate: 0,
          defectCount: 0,
          onTimeDelivery: 0,
          qualityScore: 0,
          responsiveness: 0,
          riskLevel: 'medium'
        };
      }
      
      // Calculate pass rate
      const passedInspections = supplierInspections.filter(
        inspection => inspection.result === 'pass'
      ).length;
      const passRate = (passedInspections / inspectionCount) * 100;
      
      // Count defects
      const defectCount = supplierInspections.reduce(
        (total, inspection) => total + inspection.defects.length,
        0
      );
      
      // Generate some random metrics for demonstration purposes
      // In a real application, these would come from actual data
      const onTimeDelivery = Math.floor(Math.random() * 30) + 70; // 70-100%
      const qualityScore = Math.floor(Math.random() * 40) + 60; // 60-100
      const responsiveness = Math.floor(Math.random() * 30) + 70; // 70-100%
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      const averageScore = (passRate + onTimeDelivery + qualityScore + responsiveness) / 4;
      if (averageScore > 85) {
        riskLevel = 'low';
      } else if (averageScore < 75) {
        riskLevel = 'high';
      }
      
      return {
        supplierId: supplier._id,
        supplierName: supplier.name,
        supplierCode: supplier.code,
        tier: (supplier as any).tier,
        inspectionCount,
        passRate,
        defectCount,
        onTimeDelivery,
        qualityScore,
        responsiveness,
        riskLevel
      };
    });
  };

  const handleTierChange = (event: SelectChangeEvent) => {
    setSelectedTier(event.target.value);
  };

  const handleMetricChange = (event: SelectChangeEvent) => {
    setSelectedMetric(event.target.value);
  };

  // Filter data based on selected tier
  const filteredData = selectedTier === 'all'
    ? performanceData
    : performanceData.filter(item => item.tier === selectedTier);

  // Prepare data for the tier distribution pie chart
  const tierDistribution = [
    { name: 'Tier 1', value: suppliers.filter(s => (s as any).tier === 'tier1').length },
    { name: 'Tier 2', value: suppliers.filter(s => (s as any).tier === 'tier2').length },
    { name: 'Tier 3', value: suppliers.filter(s => (s as any).tier === 'tier3').length }
  ];

  // Prepare data for the risk distribution chart
  const riskDistribution = [
    { name: 'Low Risk', value: performanceData.filter(s => s.riskLevel === 'low').length },
    { name: 'Medium Risk', value: performanceData.filter(s => s.riskLevel === 'medium').length },
    { name: 'High Risk', value: performanceData.filter(s => s.riskLevel === 'high').length }
  ];

  // Prepare data for radar chart (top 5 suppliers by performance)
  const topSuppliers = [...performanceData]
    .sort((a, b) => {
      const scoreA = (a.passRate + a.onTimeDelivery + a.qualityScore + a.responsiveness) / 4;
      const scoreB = (b.passRate + b.onTimeDelivery + b.qualityScore + b.responsiveness) / 4;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const radarData = [
    { subject: 'Pass Rate', fullMark: 100 },
    { subject: 'On-Time Delivery', fullMark: 100 },
    { subject: 'Quality Score', fullMark: 100 },
    { subject: 'Responsiveness', fullMark: 100 }
  ].map(item => {
    const result: any = { ...item };
    topSuppliers.forEach(supplier => {
      let value = 0;
      switch (item.subject) {
        case 'Pass Rate':
          value = supplier.passRate;
          break;
        case 'On-Time Delivery':
          value = supplier.onTimeDelivery;
          break;
        case 'Quality Score':
          value = supplier.qualityScore;
          break;
        case 'Responsiveness':
          value = supplier.responsiveness;
          break;
      }
      result[supplier.supplierCode] = value;
    });
    return result;
  });

  // Prepare data for bar chart
  const barChartData = filteredData.map(item => {
    const result: any = {
      name: item.supplierCode,
      tier: item.tier || 'unknown'
    };
    
    switch (selectedMetric) {
      case 'passRate':
        result.value = item.passRate;
        break;
      case 'defectCount':
        result.value = item.defectCount;
        break;
      case 'onTimeDelivery':
        result.value = item.onTimeDelivery;
        break;
      case 'qualityScore':
        result.value = item.qualityScore;
        break;
      case 'responsiveness':
        result.value = item.responsiveness;
        break;
      default:
        result.value = item.passRate;
    }
    
    return result;
  }).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10

  // Get metric label for chart
  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'passRate':
        return 'Pass Rate (%)';
      case 'defectCount':
        return 'Defect Count';
      case 'onTimeDelivery':
        return 'On-Time Delivery (%)';
      case 'qualityScore':
        return 'Quality Score';
      case 'responsiveness':
        return 'Responsiveness (%)';
      default:
        return 'Value';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Supplier Analytics
      </Typography>
      
      <Typography variant="body1" paragraph>
        Monitor supplier performance metrics, analyze trends, and identify risks in your supply chain.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Suppliers
              </Typography>
              <Typography variant="h3">
                {suppliers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Inspections
              </Typography>
              <Typography variant="h3">
                {inspections.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Avg. Pass Rate
              </Typography>
              <Typography variant="h3">
                {performanceData.length === 0
                  ? 'N/A'
                  : `${Math.round(
                      performanceData.reduce((sum, item) => sum + item.passRate, 0) / performanceData.length
                    )}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                High Risk Suppliers
              </Typography>
              <Typography variant="h3">
                {performanceData.filter(s => s.riskLevel === 'high').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tier Distribution Chart */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Supplier Tier Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Risk Distribution Chart */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Supplier Risk Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#4caf50" /> {/* Low risk - green */}
                    <Cell fill="#ff9800" /> {/* Medium risk - orange */}
                    <Cell fill="#f44336" /> {/* High risk - red */}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Top Supplier Performance Radar */}
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top 5 Supplier Performance Comparison
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {topSuppliers.map((supplier, index) => (
                    <Radar
                      key={supplier.supplierId}
                      name={supplier.supplierCode}
                      dataKey={supplier.supplierCode}
                      stroke={supplier.tier ? tierColors[supplier.tier as keyof typeof tierColors] : '#8884d8'}
                      fill={supplier.tier ? tierColors[supplier.tier as keyof typeof tierColors] : '#8884d8'}
                      fillOpacity={0.6}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Metric Comparison Bar Chart */}
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Supplier Metrics Comparison
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="tier-select-label">Filter by Tier</InputLabel>
                  <Select
                    labelId="tier-select-label"
                    value={selectedTier}
                    label="Filter by Tier"
                    onChange={handleTierChange}
                  >
                    <MenuItem value="all">All Tiers</MenuItem>
                    <MenuItem value="tier1">Tier 1</MenuItem>
                    <MenuItem value="tier2">Tier 2</MenuItem>
                    <MenuItem value="tier3">Tier 3</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="metric-select-label">Metric</InputLabel>
                  <Select
                    labelId="metric-select-label"
                    value={selectedMetric}
                    label="Metric"
                    onChange={handleMetricChange}
                  >
                    <MenuItem value="passRate">Pass Rate</MenuItem>
                    <MenuItem value="defectCount">Defect Count</MenuItem>
                    <MenuItem value="onTimeDelivery">On-Time Delivery</MenuItem>
                    <MenuItem value="qualityScore">Quality Score</MenuItem>
                    <MenuItem value="responsiveness">Responsiveness</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: getMetricLabel(), angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value, name, props) => {
                    if (name === 'value') {
                      return [value, getMetricLabel()];
                    }
                    return [value, name];
                  }} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name={getMetricLabel()}
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                  >
                    {barChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.tier && tierColors[entry.tier as keyof typeof tierColors] || '#8884d8'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Risk Assessment */}
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Supplier Risk Assessment
            </Typography>
            
            <Grid container spacing={2}>
              {performanceData
                .filter(supplier => supplier.riskLevel === 'high')
                .slice(0, 3)
                .map(supplier => (
                  <Grid key={supplier.supplierId} sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
                    <Card variant="outlined" sx={{ 
                      borderColor: supplier.riskLevel === 'high' ? '#f44336' : 
                                   supplier.riskLevel === 'medium' ? '#ff9800' : '#4caf50'
                    }}>
                      <CardHeader
                        title={supplier.supplierName}
                        subheader={supplier.supplierCode}
                        action={
                          <Chip 
                            label={supplier.tier === 'tier1' ? 'Tier 1' : 
                                  supplier.tier === 'tier2' ? 'Tier 2' : 'Tier 3'} 
                            color="primary"
                            size="small"
                          />
                        }
                      />
                      <Divider />
                      <CardContent>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Pass Rate:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {supplier.passRate.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Defect Count:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {supplier.defectCount}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">On-Time Delivery:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {supplier.onTimeDelivery}%
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">Quality Score:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {supplier.qualityScore}
                            </Typography>
                          </Box>
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">Risk Level:</Typography>
                          <Chip 
                            label={supplier.riskLevel.toUpperCase()} 
                            color={supplier.riskLevel === 'high' ? 'error' : 
                                  supplier.riskLevel === 'medium' ? 'warning' : 'success'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
            
            {performanceData.filter(supplier => supplier.riskLevel === 'high').length === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                No high-risk suppliers detected in your supply chain.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SupplierAnalytics; 