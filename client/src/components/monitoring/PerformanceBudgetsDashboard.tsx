import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  useTheme } from
'@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon } from
'@mui/icons-material';
import { useTranslation } from 'react-i18next';
import performanceMonitoringService, { PerformanceBudget } from '../../services/performanceMonitoring.service';

// Define sample performance budgets
const sampleBudgets: PerformanceBudget[] = [
{ metric: 'firstContentfulPaint', threshold: 1000, condition: 'less-than' },
{ metric: 'largestContentfulPaint', threshold: 2500, condition: 'less-than' },
{ metric: 'firstInputDelay', threshold: 100, condition: 'less-than' },
{ metric: 'cumulativeLayoutShift', threshold: 0.1, condition: 'less-than' },
{ metric: 'total', threshold: 3000, condition: 'less-than' },
{ metric: 'domInteractive', threshold: 1500, condition: 'less-than' }];


// Sample metrics data
const sampleMetrics = {
  firstContentfulPaint: 850,
  largestContentfulPaint: 2200,
  firstInputDelay: 85,
  cumulativeLayoutShift: 0.05,
  total: 2800,
  domInteractive: 1200
};

interface BudgetViolation {
  metric: string;
  current: number;
  threshold: number;
  condition: string;
}

interface PerformanceBudgetsDashboardProps {
  budgets?: PerformanceBudget[];
  metrics?: Record<string, number>;
  onRefresh?: () => void;
}

const PerformanceBudgetsDashboard: React.FC<PerformanceBudgetsDashboardProps> = ({
  budgets = sampleBudgets,
  metrics = sampleMetrics,
  onRefresh
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [violations, setViolations] = useState<BudgetViolation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Check for budget violations
  useEffect(() => {
    const result = performanceMonitoringService.checkPerformanceBudgets(metrics);
    setViolations(result.violations);
  }, [metrics]);

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      setLoading(true);
      onRefresh();
      setTimeout(() => setLoading(false), 1000);
    }
  };

  // Format metric value based on its name
  const formatMetricValue = (name: string, value: number): string => {
    if (name === 'cumulativeLayoutShift') {
      return value.toFixed(2);
    }

    if (name.includes('Time') || name.includes('Duration') ||
    name.includes('Paint') || name.includes('Input') ||
    name.includes('Interactive') || name.includes('total')) {
      return `${value.toFixed(0)} ms`;
    }

    return value.toFixed(2);
  };

  // Get percentage of current value relative to threshold
  const getPercentage = (current: number, threshold: number, condition: string): number => {
    if (condition === 'less-than') {
      return current / threshold * 100;
    } else if (condition === 'greater-than') {
      return threshold / current * 100;
    }
    return 0;
  };

  // Get color based on percentage
  const getColor = (percentage: number, condition: string): string => {
    if (condition === 'less-than') {
      if (percentage <= 75) return theme.palette.success.main;
      if (percentage <= 90) return theme.palette.warning.main;
      return theme.palette.error.main;
    } else if (condition === 'greater-than') {
      if (percentage >= 125) return theme.palette.success.main;
      if (percentage >= 110) return theme.palette.warning.main;
      return theme.palette.error.main;
    }
    return theme.palette.info.main;
  };

  // Get status chip for a metric
  const GetStatusChip = (metric: string, current: number, threshold: number, condition: string) => {
    const percentage = getPercentage(current, threshold, condition);
    let color: 'success' | 'warning' | 'error' | 'default' = 'default';
    let icon = <InfoIcon fontSize="small" />;
    let label = t('performanceBudgets.unknown');

    if (condition === 'less-than') {
      if (current < threshold) {
        color = 'success';
        icon = <CheckCircleIcon fontSize="small" />;
        label = t('performanceBudgets.passing');
      } else if (current < threshold * 1.2) {
        color = 'warning';
        icon = <WarningIcon fontSize="small" />;
        label = t('performanceBudgets.warning');
      } else {
        color = 'error';
        icon = <ErrorIcon fontSize="small" />;
        label = t('performanceBudgets.failing');
      }
    } else if (condition === 'greater-than') {
      if (current > threshold) {
        color = 'success';
        icon = <CheckCircleIcon fontSize="small" />;
        label = t('performanceBudgets.passing');
      } else if (current > threshold * 0.8) {
        color = 'warning';
        icon = <WarningIcon fontSize="small" />;
        label = t('performanceBudgets.warning');
      } else {
        color = 'error';
        icon = <ErrorIcon fontSize="small" />;
        label = t('performanceBudgets.failing');
      }
    }

    return (
      <Chip
        size="small"
        color={color}
        icon={icon}
        label={label} />);


  };

  // Format condition for display
  const formatCondition = (condition: string): string => {
    switch (condition) {
      case 'less-than':
        return '<';
      case 'greater-than':
        return '>';
      case 'equals':
        return '=';
      default:
        return condition;
    }
  };

  return (
    <Card>
      <CardHeader
        title={t('performanceBudgets.title')}
        action={
        <Tooltip title={t('common.refresh')}>
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        } />

      <Divider />
      {loading && <LinearProgress />}
      <CardContent>
        {violations.length > 0 &&
        <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              {t('performanceBudgets.violationsDetected', { count: violations.length })}
            </Typography>
          </Alert>
        }
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('performanceBudgets.metric')}</TableCell>
                <TableCell align="right">{t('performanceBudgets.current')}</TableCell>
                <TableCell align="center">{t('performanceBudgets.condition')}</TableCell>
                <TableCell align="right">{t('performanceBudgets.threshold')}</TableCell>
                <TableCell align="center">{t('performanceBudgets.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.map((budget) => {
                const currentValue = metrics[budget.metric] || 0;
                const percentage = getPercentage(currentValue, budget.threshold, budget.condition);
                const color = getColor(percentage, budget.condition);

                return (
                  <TableRow key={budget.metric} hover>
                    <TableCell component="th" scope="row">
                      {budget.metric}
                    </TableCell>
                    <TableCell align="right">
                      {formatMetricValue(budget.metric, currentValue)}
                    </TableCell>
                    <TableCell align="center">
                      {formatCondition(budget.condition)}
                    </TableCell>
                    <TableCell align="right">
                      {formatMetricValue(budget.metric, budget.threshold)}
                    </TableCell>
                    <TableCell align="center">
                      {GetStatusChip(budget.metric, currentValue, budget.threshold, budget.condition)}
                    </TableCell>
                  </TableRow>);

              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('performanceBudgets.budgetProgress')}
          </Typography>
          <Grid container spacing={2}>
            {budgets.map((budget) => {
              const currentValue = metrics[budget.metric] || 0;
              const percentage = getPercentage(currentValue, budget.threshold, budget.condition);
              const color = getColor(percentage, budget.condition);

              return (
                <Grid item xs={12} sm={6} md={4} key={budget.metric}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" component="div" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{budget.metric}</span>
                      <span>
                        {formatMetricValue(budget.metric, currentValue)} / {formatMetricValue(budget.metric, budget.threshold)}
                      </span>
                    </Typography>
                    <Box sx={{ width: '100%', position: 'relative' }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(percentage, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: color,
                            borderRadius: 4
                          }
                        }} />

                    </Box>
                  </Box>
                </Grid>);

            })}
          </Grid>
        </Box>
      </CardContent>
    </Card>);

};

export default PerformanceBudgetsDashboard;