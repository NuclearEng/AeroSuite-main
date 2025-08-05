import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface DataPoint {
  x: Date;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showPoints?: boolean;
  fillArea?: boolean;
}

/**
 * Simple line chart component optimized for time series data like quality metrics
 */
const LineChart: React.FC<LineChartProps> = ({
  data,
  color = '#4caf50',
  height = 100,
  showPoints = false,
  fillArea = true
}) => {
  const theme = useTheme();

  // Sort data by date
  const sortedData = [...data].sort((a, b) => a.x.getTime() - b.x.getTime());

  const chartData = {
    datasets: [
      {
        data: sortedData,
        borderColor: color,
        backgroundColor: fillArea ? `${color}20` : 'transparent',
        borderWidth: 2,
        fill: fillArea,
        tension: 0.4,
        pointRadius: showPoints ? 3 : 0,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.grey[800] 
          : theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: (items: any) => {
            if (!items.length) return '';
            const date = new Date(items[0].parsed.x);
            return date.toLocaleDateString();
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'month' as const,
          displayFormats: {
            month: 'MMM yy',
          },
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          display: false,
        },
      },
    },
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default LineChart; 