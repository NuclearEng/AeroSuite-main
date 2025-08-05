import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Divider,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Stack
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Factory as FactoryIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import MockDataService from '../../services/mockDataService';
import type { Inspection, Supplier } from '../../services/mockDataService';

// Simple bar chart component
const BarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  height?: number;
  maxValue?: number;
}> = ({ data, height = 200, maxValue }) => {
  const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value), 1);
  
  return (
    <Box height={height} display="flex" alignItems="flex-end">
      {data.map((item, index) => (
        <Box 
          key={index} 
          sx={{ 
            flex: 1,
            mx: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box 
            sx={{ 
              width: '100%', 
              bgcolor: item.color,
              height: `${(item.value / calculatedMaxValue) * 100}%`,
              minHeight: 20,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.5s ease-in-out',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              color: 'white',
              fontWeight: 'bold',
              pt: 0.5
            }}
          >
            {item.value > 0 && item.value}
          </Box>
          <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Status summary card
const StatusSummaryCard: React.FC<{ inspections: Inspection[] }> = ({ inspections }) => {
  const scheduled = inspections.filter(i => i.status === 'scheduled').length;
  const inProgress = inspections.filter(i => i.status === 'in-progress').length;
  const completed = inspections.filter(i => i.status === 'completed').length;
  const cancelled = inspections.filter(i => i.status === 'cancelled').length;
  
  const data = [
    { label: 'Scheduled', value: scheduled, color: '#2196f3' },
    { label: 'In Progress', value: inProgress, color: '#ff9800' },
    { label: 'Completed', value: completed, color: '#4caf50' },
    { label: 'Cancelled', value: cancelled, color: '#f44336' }
  ];
  
  return (
    <Card>
      <CardHeader title="Inspection Status" />
      <CardContent>
        <BarChart data={data} />
        <Stack direction="row" spacing={1} mt={2} justifyContent="center">
          {data.map((item, index) => (
            <Chip 
              key={index}
              label={`${item.label}: ${item.value}`}
              sx={{ bgcolor: item.color, color: 'white' }}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

// Result summary card
const ResultSummaryCard: React.FC<{ inspections: Inspection[] }> = ({ inspections }) => {
  const completedInspections = inspections.filter(i => i.status === 'completed');
  const pass = completedInspections.filter(i => i.result === 'pass').length;
  const fail = completedInspections.filter(i => i.result === 'fail').length;
  const conditional = completedInspections.filter(i => i.result === 'conditional').length;
  
  const data = [
    { label: 'Pass', value: pass, color: '#4caf50' },
    { label: 'Conditional', value: conditional, color: '#ff9800' },
    { label: 'Fail', value: fail, color: '#f44336' }
  ];

  // Calculate pass rate as a percentage
  const passRate = completedInspections.length > 0
    ? Math.round((pass / completedInspections.length) * 100)
    : 0;
  
  return (
    <Card>
      <CardHeader 
        title="Inspection Results" 
        subheader={`${completedInspections.length} completed inspections`} 
      />
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
          <Box position="relative" display="inline-flex" alignItems="center">
            <Box
              sx={{
                position: 'relative',
                display: 'inline-flex',
                width: 120,
                height: 120,
              }}
            >
              <CircularProgressWithLabel value={passRate} />
            </Box>
          </Box>
        </Box>
        <BarChart data={data} height={150} />
      </CardContent>
    </Card>
  );
};

// Circular progress with label
const CircularProgressWithLabel: React.FC<{ value: number }> = ({ value }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: '#e0e0e0',
          position: 'absolute'
        }}
      />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          borderRadius: '50%',
          background: `conic-gradient(#4caf50 ${value}%, transparent ${value}%, transparent 100%)`,
        }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '75%',
            height: '75%',
            borderRadius: '50%',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" component="div" color="text.secondary">
            {`${value}%`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// Supplier performance card
const SupplierPerformanceCard: React.FC<{ inspections: Inspection[], suppliers: Supplier[] }> = ({ inspections, suppliers }) => {
  // Get supplier performance metrics
  const supplierPerformance = suppliers.map(supplier => {
    const supplierInspections = inspections.filter(i => 
      i.supplier._id === supplier._id && i.status === 'completed'
    );
    
    const total = supplierInspections.length;
    const passed = supplierInspections.filter(i => i.result === 'pass').length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    
    return {
      id: supplier._id,
      name: supplier.name,
      code: supplier.code,
      total,
      passed,
      passRate: Math.round(passRate)
    };
  }).filter(s => s.total > 0)
    .sort((a, b) => b.passRate - a.passRate);

  return (
    <Card>
      <CardHeader title="Supplier Performance" />
      <CardContent>
        <List>
          {supplierPerformance.length > 0 ? (
            supplierPerformance.map((supplier, index) => (
              <React.Fragment key={supplier.id}>
                {index > 0 && <Divider variant="inset" component="li" />}
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: supplier.passRate >= 80 ? 'success.main' : supplier.passRate >= 60 ? 'warning.main' : 'error.main' }}>
                      <FactoryIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={supplier.name}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {supplier.code}
                        </Typography>
                        {` — Pass Rate: ${supplier.passRate}% (${supplier.passed}/${supplier.total})`}
                      </React.Fragment>
                    }
                  />
                  {supplier.passRate > 70 ? (
                    <TrendingUpIcon color="success" />
                  ) : (
                    <TrendingDownIcon color="error" />
                  )}
                </ListItem>
              </React.Fragment>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No completed inspections available for analysis
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

// Upcoming inspections card
const UpcomingInspectionsCard: React.FC<{ inspections: Inspection[] }> = ({ inspections }) => {
  const navigate = useNavigate();
  
  // Get upcoming inspections (scheduled inspections with the earliest dates)
  const upcoming = [...inspections]
    .filter(i => i.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <Card>
      <CardHeader 
        title="Upcoming Inspections" 
        action={
          <Button size="small" onClick={() => navigate('/inspections')}>
            View All
          </Button>
        }
      />
      <CardContent>
        <List sx={{ width: '100%' }}>
          {upcoming.length > 0 ? (
            upcoming.map((inspection, index) => (
              <React.Fragment key={inspection._id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/inspections/${inspection._id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <CalendarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={inspection.title}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          {inspection.inspectionNumber}
                        </Typography>
                        {` — ${formatDate(inspection.scheduledDate)}`}
                      </React.Fragment>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No upcoming inspections scheduled
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

// Stats card
const StatsCard: React.FC<{ 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color = 'primary.main' }) => {
  return (
    <Card>
      <CardContent sx={{ py: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Initialize mock data service
    MockDataService.initialize();
    
    // Load data
    setInspections(MockDataService.getInspections());
    setSuppliers(MockDataService.getSuppliers());
    setLoading(false);
  }, []);
  
  // Calculate stats
  const totalInspections = inspections.length;
  const scheduledInspections = inspections.filter(i => i.status === 'scheduled').length;
  const inProgressInspections = inspections.filter(i => i.status === 'in-progress').length;
  const completedInspections = inspections.filter(i => i.status === 'completed').length;
  
  // Calculate pass rate
  const passedInspections = inspections.filter(i => i.status === 'completed' && i.result === 'pass').length;
  const passRate = completedInspections > 0 
    ? Math.round((passedInspections / completedInspections) * 100) 
    : 0;
  
  if (loading) {
    return <LinearProgress />;
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inspection Dashboard
        </Typography>
        <Box>
          <Button 
            variant="outlined"
            onClick={() => navigate('/inspections')}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to List
          </Button>
          <Button 
            variant="contained"
            onClick={() => navigate('/inspections/schedule')}
          >
            Schedule Inspection
          </Button>
        </Box>
      </Box>
      
      {/* Stats summary */}
      <Grid container spacing={3} mb={3}>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <StatsCard 
            title="Total Inspections" 
            value={totalInspections} 
            icon={<AssignmentIcon />} 
          />
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <StatsCard 
            title="Scheduled" 
            value={scheduledInspections} 
            icon={<HourglassEmptyIcon />} 
            color="info.main"
          />
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <StatsCard 
            title="Completed" 
            value={completedInspections} 
            icon={<CheckCircleIcon />} 
            color="success.main"
          />
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <StatsCard 
            title="Pass Rate" 
            value={`${passRate}%`} 
            icon={passRate >= 80 ? <TrendingUpIcon /> : <TrendingDownIcon />} 
            color={passRate >= 80 ? 'success.main' : 'error.main'}
          />
        </Grid>
      </Grid>
      
      {/* Charts and Lists */}
      <Grid container spacing={3}>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <StatusSummaryCard inspections={inspections} />
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <ResultSummaryCard inspections={inspections} />
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <UpcomingInspectionsCard inspections={inspections} />
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <SupplierPerformanceCard inspections={inspections} suppliers={suppliers} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 