import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface LineChartProps {
  data: any[];
  xKey: string;
  lineKey: string;
  lineName?: string;
  color?: string;
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, xKey, lineKey, lineName = 'Value', color = '#1976d2', height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} aria-label="Line Chart">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={lineKey} name={lineName} stroke={color} strokeWidth={2} dot={false} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart; 