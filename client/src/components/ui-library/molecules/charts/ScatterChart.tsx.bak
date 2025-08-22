import React from 'react';

export interface ScatterChartProps {
  data: Array<Record<string, number>>;
  xKey: string;
  yKey: string;
  width?: number;
  height?: number;
  color?: string;
  xLabel?: string;
  yLabel?: string;
}

/**
 * Best-in-class ScatterChart component. Uses SVG for rendering.
 * Replace with recharts or another library for production if desired.
 */
const ScatterChart: React.FC<ScatterChartProps> = ({
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

  // Find min/max for scaling
  const xVals = data.map((d) => d[xKey]);
  const yVals = data.map((d) => d[yKey]);
  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);

  // Padding for axes
  const pad = 40;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;

  // Scale functions
  const scaleX = (x: number) => pad + (x - minX) / (maxX - minX || 1) * plotW;
  const scaleY = (y: number) => height - pad - (y - minY) / (maxY - minY || 1) * plotH;

  return (
    <svg width={width} height={height} aria-label="Scatter chart" role="img">
      
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
      
      {data.map((d, i) =>
      <circle
        key={i}
        cx={scaleX(d[xKey])}
        cy={scaleY(d[yKey])}
        r={5}
        fill={color}
        aria-label={`Point (${d[xKey]}, ${d[yKey]})`} />

      )}
    </svg>);

};

export default ScatterChart;