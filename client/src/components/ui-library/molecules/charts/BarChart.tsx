import React from 'react';

export interface BarChartProps {
  data: Array<Record<string, number | string>>;
  xKey: string;
  yKey: string;
  width?: number;
  height?: number;
  color?: string;
  xLabel?: string;
  yLabel?: string;
}

/**
 * Best-in-class BarChart component. Uses SVG for rendering.
 * Replace with recharts or another library for production if desired.
 */
const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  width = 400,
  height = 300,
  color = '#1976d2',
  xLabel = '',
  yLabel = ''
}) => {
  if (!data || data.length === 0) return <div>No data</div>;

  // Find max for scaling
  const yVals = data.map((d) => Number(d[yKey]));
  const maxY = Math.max(...yVals, 1);

  // Padding for axes
  const pad = 40;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const barWidth = plotW / data.length;

  // Scale functions
  const scaleY = (y: number) => plotH * (y / maxY);

  return (
    <svg width={width} height={height} aria-label="Bar chart" role="img">
      
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#888" strokeWidth={2} />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#888" strokeWidth={2} />
      
      {xLabel &&
      <text x={width / 2} y={height - 5} textAnchor="middle" fontSize={14} fill="#444">{xLabel}</text>
      }
      {yLabel &&
      <text x={15} y={height / 2} textAnchor="middle" fontSize={14} fill="#444" transform={`rotate(-90 15,${height / 2})`}>
          {yLabel}
        </text>
      }
      
      {data.map((d, i) => {
        const x = pad + i * barWidth;
        const y = height - pad - scaleY(Number(d[yKey]));
        const h = scaleY(Number(d[yKey]));
        return (
          <g key={i}>
            <rect
              x={x + 8}
              y={y}
              width={barWidth - 16}
              height={h}
              fill={color}
              aria-label={`Bar ${d[xKey]}: ${d[yKey]}`} />

            <text
              x={x + barWidth / 2}
              y={height - pad + 16}
              textAnchor="middle"
              fontSize={12}
              fill="#444">

              {d[xKey]}
            </text>
          </g>);

      })}
    </svg>);

};

export default BarChart;