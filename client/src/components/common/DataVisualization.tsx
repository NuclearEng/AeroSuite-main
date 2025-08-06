import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  alpha } from
'@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  BubbleChart as BubbleChartIcon,
  DonutLarge as DonutIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon } from
'@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler } from
'chart.js';
import { Line, Bar, Pie, Doughnut, PolarArea, Radar, Bubble, Scatter } from 'react-chartjs-2';
import { saveAs } from 'file-saver';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polar' | 'bubble' | 'scatter';

export interface DataPoint {
  x: string | number;
  y: number;
  z?: number; // For bubble charts
  label?: string;
  color?: string;
}

export interface DataSeries {
  id: string;
  label: string;
  data: DataPoint[];
  color?: string;
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
  fill?: boolean;
}

export interface DataVisualizationProps {
  title?: string;
  description?: string;
  series: DataSeries[];
  defaultChartType?: ChartType;
  availableChartTypes?: ChartType[];
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  xAxisLabel?: string;
  yAxisLabel?: string;
  onRefresh?: () => void;
}

const chartTypeIcons: Record<ChartType, React.ReactNode> = {
  bar: <BarChartIcon />,
  line: <LineChartIcon />,
  pie: <PieChartIcon />,
  doughnut: <DonutIcon />,
  radar: <BubbleChartIcon />,
  polar: <BubbleChartIcon />,
  bubble: <BubbleChartIcon />,
  scatter: <BubbleChartIcon />
};

const DataVisualization: React.FC<DataVisualizationProps> = ({
  title = 'Data Visualization',
  description,
  series,
  defaultChartType = 'bar',
  availableChartTypes = ['bar', 'line', 'pie', 'doughnut', 'radar'],
  height = 400,
  loading = false,
  error = null,
  xAxisLabel,
  yAxisLabel,
  onRefresh
}) => {
  const theme = useTheme();
  const chartRef = useRef<any>(null);

  // State
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [animationDuration, setAnimationDuration] = useState<number>(1000);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [stacked, setStacked] = useState<boolean>(false);

  // Prepare chart data based on props
  const chartData = useMemo(() => {
    // For pie/doughnut charts, we need a different data structure
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polar') {
      // For these charts, we can only display one series
      const activeSeries = series[0] || { data: [] };

      return {
        labels: activeSeries.data.map((point) => point.label || point.x.toString()),
        datasets: [
        {
          label: activeSeries.label,
          data: activeSeries.data.map((point) => point.y),
          backgroundColor: activeSeries.data.map((point) => point.color || getRandomColor()),
          borderColor: theme.palette.background.paper,
          borderWidth: 1
        }]

      };
    }

    // For bubble and scatter charts
    if (chartType === 'bubble' || chartType === 'scatter') {
      return {
        datasets: series.map((s) => ({
          label: s.label,
          data: s.data.map((point) => ({
            x: typeof point.x === 'string' ? parseFloat(point.x) || 0 : point.x,
            y: point.y,
            r: point.z || 5 // Bubble size
          })),
          backgroundColor: alpha(s.color || getRandomColor(), 0.7)
        }))
      };
    }

    // For other charts (bar, line, radar)
    const labels = Array.from(
      new Set(series.flatMap((s) => s.data.map((d) => d.x.toString())))
    ).sort();

    return {
      labels,
      datasets: series.map((s) => {
        // Create a map for quick lookup of y values by x
        const dataMap = new Map(s.data.map((d) => [d.x.toString(), d]));

        return {
          label: s.label,
          data: labels.map((label) => dataMap.get(label)?.y || 0),
          backgroundColor: s.backgroundColor || s.color || getRandomColor(0.7),
          borderColor: s.borderColor || s.color || getRandomColor(),
          borderWidth: 1,
          tension: s.tension || 0.4,
          fill: s.fill !== undefined ? s.fill : chartType === 'line'
        };
      })
    };
  }, [series, chartType, theme]);

  // Prepare chart options based on chart type
  const chartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: animationDuration
      },
      plugins: {
        legend: {
          display: showLegend,
          position: 'top' as const
        },
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          enabled: true
        }
      }
    };

    // For pie, doughnut, radar and polar charts, we don't need scales
    if (['pie', 'doughnut', 'radar', 'polar'].includes(chartType)) {
      return baseOptions;
    }

    // For other charts, add scales
    return {
      ...baseOptions,
      scales: {
        x: {
          title: {
            display: !!xAxisLabel,
            text: xAxisLabel
          }
        },
        y: {
          title: {
            display: !!yAxisLabel,
            text: yAxisLabel
          },
          stacked: stacked
        }
      }
    };
  }, [chartType, title, xAxisLabel, yAxisLabel, animationDuration, showLegend, stacked]);

  // Handle chart type change
  const handleChartTypeChange = (
  event: React.MouseEvent<HTMLElement>,
  newChartType: ChartType | null) =>
  {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  // Handle animation duration change
  const handleAnimationDurationChange = (event: Event, newValue: number | number[]) => {
    setAnimationDuration(newValue as number);
  };

  // Handle legend toggle
  const handleLegendToggle = () => {
    setShowLegend((prev) => !prev);
  };

  // Handle stacked toggle
  const handleStackedToggle = () => {
    setStacked((prev) => !prev);
  };

  // Handle export as image
  const handleExportImage = () => {
    if (!chartRef.current) return;

    const canvas = chartRef.current.canvas;
    if (!canvas) return;

    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        saveAs(blob, `${title || 'chart'}.png`);
      }
    });
  };

  // Generate a random color with opacity
  function getRandomColor(opacity = 1) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Render the appropriate chart based on chartType
  const RenderChart = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress size={40} />
        </Box>);

    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (!series.length || !series.some((s) => s.data.length > 0)) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography color="text.secondary">No data available for visualization</Typography>
        </Box>);

    }

    switch (chartType) {
      case 'bar':
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
      case 'line':
        return <Line ref={chartRef} data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie ref={chartRef} data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut ref={chartRef} data={chartData} options={chartOptions} />;
      case 'radar':
        return <Radar ref={chartRef} data={chartData} options={chartOptions} />;
      case 'polar':
        return <PolarArea ref={chartRef} data={chartData} options={chartOptions} />;
      case 'bubble':
        return <Bubble ref={chartRef} data={chartData} options={chartOptions} />;
      case 'scatter':
        return <Scatter ref={chartRef} data={chartData} options={chartOptions} />;
      default:
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
    }
  };

  return (
    <Paper sx={{ p: 2, height: height, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            
            {description &&
            <Tooltip title={description}>
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          </Stack>
          
          {description &&
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description.length > 70 ? `${description.substring(0, 70)}...` : description}
            </Typography>
          }
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Export as image">
            <IconButton onClick={handleExportImage} disabled={loading || !!error}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          {onRefresh &&
          <Tooltip title="Refresh data">
              <IconButton onClick={onRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
        </Stack>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              aria-label="chart type"
              size="small">

              {availableChartTypes.map((type) =>
              <ToggleButton key={type} value={type} aria-label={type}>
                  <Tooltip title={`${type.charAt(0).toUpperCase() + type.slice(1)} chart`}>
                    {chartTypeIcons[type]}
                  </Tooltip>
                </ToggleButton>
              )}
            </ToggleButtonGroup>
          </Grid>
          
          {(chartType === 'bar' || chartType === 'line') &&
          <Grid item>
              <Tooltip title={stacked ? "Unstacked" : "Stacked"}>
                <IconButton size="small" onClick={handleStackedToggle} color={stacked ? "primary" : "default"}>
                  <BarChartIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          }
          
          <Grid item>
            <Tooltip title={showLegend ? "Hide legend" : "Show legend"}>
              <IconButton size="small" onClick={handleLegendToggle} color={showLegend ? "primary" : "default"}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        {RenderChart()}
      </Box>
    </Paper>);

};

export default DataVisualization;