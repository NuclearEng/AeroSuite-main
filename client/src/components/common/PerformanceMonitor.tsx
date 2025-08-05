import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme,
  alpha
} from '@mui/material';
import {
  DeleteOutline as ClearIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  BarChart as ChartIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { 
  PerformanceMetric, 
  getPerformanceMetrics, 
  clearPerformanceMetrics,
  subscribeToPerformanceMetrics,
  setPerformanceMonitoring
} from '../../hooks/usePerformanceMonitor';

/**
 * Format milliseconds into a readable format
 */
const formatTime = (ms: number): string => {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Get color for duration based on thresholds
 */
const getDurationColor = (duration: number, type: string): string => {
  // Different thresholds for different metric types
  if (type === 'render' || type === 'mount') {
    if (duration < 20) return '#10b981'; // Fast - green
    if (duration < 100) return '#f59e0b'; // Medium - amber
    return '#ef4444'; // Slow - red
  }
  
  if (type === 'load') {
    if (duration < 100) return '#10b981';
    if (duration < 300) return '#f59e0b';
    return '#ef4444';
  }
  
  // Default for other types
  if (duration < 50) return '#10b981';
  if (duration < 200) return '#f59e0b';
  return '#ef4444';
};

/**
 * Group metrics by component and type
 */
const groupMetrics = (metrics: PerformanceMetric[]) => {
  const groups: Record<string, PerformanceMetric[]> = {};
  
  metrics.forEach(metric => {
    const key = `${metric.componentName}-${metric.type}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(metric);
  });
  
  return groups;
};

/**
 * Calculate stats for a group of metrics
 */
const calculateStats = (metrics: PerformanceMetric[]) => {
  if (metrics.length === 0) return { avg: 0, min: 0, max: 0 };
  
  const durations = metrics.map(m => m.duration);
  
  return {
    avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    count: metrics.length,
  };
};

interface PerformanceMonitorProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultOpen?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  position = 'bottom-right',
  defaultOpen = false,
}) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [enabled, setEnabled] = useState(process.env.NODE_ENV !== 'production');
  const [view, setView] = useState<'details' | 'summary'>('summary');
  
  // Subscribe to metrics updates
  useEffect(() => {
    const unsubscribe = subscribeToPerformanceMetrics(newMetrics => {
      setMetrics([...newMetrics]);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Handle toggling monitoring on/off
  const handleToggleMonitoring = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = event.target.checked;
    setEnabled(newEnabled);
    setPerformanceMonitoring(newEnabled);
  };
  
  // Handle clearing metrics
  const handleClearMetrics = () => {
    clearPerformanceMetrics();
  };
  
  // Position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'top-right':
        return { top: 16, right: 16 };
      case 'top-left':
        return { top: 16, left: 16 };
      case 'bottom-right':
      default:
        return { bottom: 16, right: 16 };
    }
  };
  
  // Group metrics for summary view
  const groupedMetrics = groupMetrics(metrics);
  
  // Sort metrics for detailed view - most recent first
  const sortedMetrics = [...metrics].sort((a, b) => b.timestamp - a.timestamp);
  
  if (!isOpen) {
    return (
      <Tooltip title="Open Performance Monitor">
        <IconButton
          color="primary"
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            ...getPositionStyles(),
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            zIndex: theme.zIndex.drawer + 1,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
            },
          }}
        >
          <SpeedIcon />
        </IconButton>
      </Tooltip>
    );
  }
  
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        ...getPositionStyles(),
        width: 380,
        maxHeight: 500,
        zIndex: theme.zIndex.drawer + 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box display="flex" alignItems="center">
          <SpeedIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="medium">
            Performance Monitor
          </Typography>
        </Box>
        <Box display="flex">
          <Tooltip title="Toggle View">
            <IconButton
              size="small"
              onClick={() => setView(view === 'details' ? 'summary' : 'details')}
            >
              {view === 'details' ? <ChartIcon /> : <TimelineIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear Metrics">
            <IconButton size="small" onClick={handleClearMetrics}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={enabled}
              onChange={handleToggleMonitoring}
              color="primary"
            />
          }
          label="Enable monitoring"
          sx={{ mr: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          {metrics.length} metrics collected
        </Typography>
      </Box>
      
      {/* Content */}
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {metrics.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              height: 200,
              color: 'text.secondary',
            }}
          >
            <SpeedIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">No performance data collected yet</Typography>
            {!enabled && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setEnabled(true);
                  setPerformanceMonitoring(true);
                }}
                sx={{ mt: 2 }}
              >
                Enable Monitoring
              </Button>
            )}
          </Box>
        ) : view === 'summary' ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Component & Type</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Avg</TableCell>
                  <TableCell align="right">Min</TableCell>
                  <TableCell align="right">Max</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(groupedMetrics).map(([key, groupMetrics]) => {
                  const stats = calculateStats(groupMetrics);
                  const [componentName, type] = key.split('-');
                  
                  return (
                    <TableRow key={key} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium" noWrap>
                            {componentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{stats.count}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ color: getDurationColor(stats.avg, type) }}
                      >
                        {formatTime(stats.avg)}
                      </TableCell>
                      <TableCell align="right">{formatTime(stats.min)}</TableCell>
                      <TableCell align="right">{formatTime(stats.max)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Component</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Duration</TableCell>
                  <TableCell align="right">Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedMetrics.map((metric, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {metric.componentName}
                      </Typography>
                    </TableCell>
                    <TableCell>{metric.type}</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ color: getDurationColor(metric.duration, metric.type) }}
                    >
                      {formatTime(metric.duration)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
};

export default PerformanceMonitor; 