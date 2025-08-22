import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper, Typography, useTheme, CircularProgress, Skeleton } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title,
  Filler } from
'chart.js';
import { Line, Bar, Pie, Doughnut, PolarArea, Radar, Scatter, Bubble } from 'react-chartjs-2';
// normalized to MUI transitions; legacy animations removed

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title,
  Filler
);

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'polarArea' | 'radar' | 'scatter' | 'bubble';

export interface ChartProps {
  type: ChartType;
  data: any;
  options?: any;
  width?: string | number;
  height?: string | number;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  variant?: 'default' | 'outlined' | 'elevation';
  elevation?: number;
  animation?: boolean;
  borderRadius?: number;
  padding?: number;
  responsive?: boolean;
  aspectRatio?: number;
  onChartClick?: (event: any, elements: any) => void;
}

const Chart: React.FC<ChartProps> = ({
  type,
  data,
  options = {},
  width = '100%',
  height,
  title,
  subtitle,
  loading = false,
  error,
  emptyMessage = 'No data available',
  variant = 'default',
  elevation = 0,
  animation = true,
  borderRadius = 8,
  padding = 16,
  responsive = true,
  aspectRatio = 2,
  onChartClick
}) => {
  const theme = useTheme();
  const chartRef = useRef<any>(null);
  const [chartHeight, setChartHeight] = useState<any>(height);

  // Calculate the canvas height based on aspectRatio if not explicitly set
  useEffect(() => {
    if (!height && responsive && chartRef.current) {
      const containerWidth = chartRef.current.canvas.parentElement?.clientWidth;
      if (containerWidth) {
        setChartHeight(containerWidth / aspectRatio);
      }
    }
  }, [height, responsive, aspectRatio]);

  // Apply theme colors to chart
  const themedData = {
    ...data,
    datasets: data.datasets?.map((dataset: any) => ({
      ...dataset,
      borderColor: dataset.borderColor || theme.palette.primary.main,
      backgroundColor: dataset.backgroundColor || (
      type === 'line' ? theme.palette.primary.main + '20' : theme.palette.primary.main),
      hoverBackgroundColor: dataset.hoverBackgroundColor || theme.palette.primary.dark,
      borderWidth: dataset.borderWidth || 2
    }))
  };

  // Merge default options with provided options
  const mergedOptions = {
    responsive,
    maintainAspectRatio: false,
    animation: animation ? {
      duration: 1000,
      easing: 'easeOutQuart'
    } : false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary,
          font: {
            family: theme.typography.fontFamily,
            size: 12
          },
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: theme.palette.mode === 'dark' ?
        theme.palette.grey[800] :
        theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        boxPadding: 6,
        bodyFont: {
          family: theme.typography.fontFamily
        },
        titleFont: {
          family: theme.typography.fontFamily,
          weight: 'bold'
        }
      }
    },
    scales: type !== 'pie' && type !== 'doughnut' && type !== 'polarArea' ? {
      x: {
        grid: {
          color: theme.palette.divider,
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily
          }
        }
      },
      y: {
        grid: {
          color: theme.palette.divider,
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily
          }
        }
      }
    } : undefined,
    ...options
  };

  // Handle chart click events
  const handleChartClick = (event: any) => {
    if (!onChartClick || !chartRef.current) return;

    const elements = chartRef.current.getElementsAtEventForMode(
      event,
      'nearest',
      { intersect: true },
      false
    );

    if (elements.length > 0) {
      onChartClick(event, elements);
    }
  };

  // Get chart component based on type
  const GetChartComponent = () => {
    const chartProps = {
      data: themedData,
      options: mergedOptions,
      onClick: onChartClick ? handleChartClick : undefined
    };

    switch (type) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'polarArea':
        return <PolarArea {...chartProps} />;
      case 'radar':
        return <Radar {...chartProps} />;
      case 'scatter':
        return <Scatter {...chartProps} />;
      case 'bubble':
        return <Bubble {...chartProps} />;
      default:
        return <Line {...chartProps} />;
    }
  };

  // Determine if the chart has data
  const hasData =
  data?.datasets &&
  data.datasets.length > 0 &&
  data.datasets.some((ds: any) => ds.data && ds.data.length > 0);

  // Check if the chart can be rendered
  const shouldRenderChart = !loading && !error && hasData;

  // Determine paper variant and elevation
  const paperProps =
  variant === 'outlined' ?
  { variant: 'outlined' as const } :
  { elevation: variant === 'elevation' ? elevation : 0 };

  return (
    <Paper
      {...paperProps}
      sx={{
        width,
        height: 'auto',
        borderRadius,
        overflow: 'hidden',
        transition: (theme) => theme.transitions.create(['background-color', 'box-shadow', 'transform'], {
          duration: theme.transitions.duration.short,
          easing: theme.transitions.easing.easeInOut,
        })
      }}>

      
      {(title || subtitle) &&
      <Box sx={{ p: padding, pb: subtitle ? padding / 2 : padding }}>
          {title &&
        <Typography variant="h6" component="h3" gutterBottom={!!subtitle}>
              {title}
            </Typography>
        }
          {subtitle &&
        <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
        }
        </Box>
      }
      
      
      <Box
        sx={{
          p: padding,
          pt: title || subtitle ? 0 : padding,
          height: chartHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>

        {loading ?
        <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
            <CircularProgress size={40} thickness={4} />
          </Box> :
        error ?
        <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
            <Typography color="error">{error}</Typography>
          </Box> :
        !hasData ?
        <Box sx={{ textAlign: 'center', py: 4, width: '100%' }}>
            <Typography color="text.secondary">{emptyMessage}</Typography>
          </Box> :

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: 200
          }}>

            {GetChartComponent()}
          </Box>
        }
      </Box>
    </Paper>);

};

export default Chart;