import React from 'react';

export interface PieChartData {
  [key: string]: string | number;
}

export interface PieChartProps {
  data: PieChartData[];
  valueKey: string;
  nameKey: string;
  width?: number;
  height?: number;
  colors?: string[];
  label?: string;
}

/**
 * Best-in-class PieChart component. Uses SVG for rendering.
 * Replace with recharts or another library for production if desired.
 */
const PieChart: React.FC<PieChartProps> = ({
  data,
  valueKey,
  nameKey,
  width = 300,
  height = 300,
  colors = ['#1976d2', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4'],
  label = ''
}) => {
  if (!data || data.length === 0) return <div>No data</div>;

  const total = data.reduce((sum, d) => sum + Number(d[valueKey]), 0);
  let cumulative = 0;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 16;

  // Helper to describe an SVG arc
  const describeArc = (startAngle: number, endAngle: number) => {
    const start = {
      x: cx + r * Math.cos((startAngle - 90) * (Math.PI / 180)),
      y: cy + r * Math.sin((startAngle - 90) * (Math.PI / 180))
    };
    const end = {
      x: cx + r * Math.cos((endAngle - 90) * (Math.PI / 180)),
      y: cy + r * Math.sin((endAngle - 90) * (Math.PI / 180))
    };
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z'].
    join(' ');
  };

  return (
    <svg width={width} height={height} aria-label={label || 'Pie chart'} role="img">
      {data.map((d, i: any) => {
        const value = Number(d[valueKey]);
        const startAngle = cumulative / total * 360;
        const endAngle = (cumulative + value) / total * 360;
        const path = describeArc(startAngle, endAngle);
        cumulative += value;
        return (
          <path
            key={i}
            d={path}
            fill={colors[i % colors.length]}
            aria-label={`${d[nameKey]}: ${d[valueKey]}`} />);


      })}
      
      {data.map((d, i: any) => {
        const value = Number(d[valueKey]);
        const angle = (cumulative - value / 2) / total * 360;
        const rad = (angle - 90) * (Math.PI / 180);
        const x = cx + r / 1.5 * Math.cos(rad);
        const y = cy + r / 1.5 * Math.sin(rad);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={12}
            fill="#fff"
            style={{ pointerEvents: 'none' }}>

            {d[nameKey]}
          </text>);

      })}
      {label &&
      <text x={cx} y={cy} textAnchor="middle" fontSize={16} fill="#444">
          {label}
        </text>
      }
    </svg>);

};

export default PieChart;