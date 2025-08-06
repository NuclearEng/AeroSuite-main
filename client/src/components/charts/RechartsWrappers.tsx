import React from 'react';
import {
  BarChart as RbdBarChart,
  LineChart as RbdLineChart,
  PieChart as RbdPieChart,
  ComposedChart as RbdComposedChart,
  Bar as RbdBar,
  Line as RbdLine,
  XAxis as RbdXAxis,
  YAxis as RbdYAxis,
  CartesianGrid as RbdCartesianGrid,
  Tooltip as RbdTooltip,
  Legend as RbdLegend,
  ResponsiveContainer as RbdResponsiveContainer,
  Cell as RbdCell,
  Pie as RbdPie,
  Area as RbdArea,
  ScatterChart as RbdScatterChart,
  Scatter as RbdScatter,
  ZAxis as RbdZAxis
} from 'recharts';

// Create wrapper components for all Recharts components
export const BarChart: React.FC<any> = (props) => <RbdBarChart {...props} />;
export const LineChart: React.FC<any> = (props) => <RbdLineChart {...props} />;
export const PieChart: React.FC<any> = (props) => <RbdPieChart {...props} />;
export const ComposedChart: React.FC<any> = (props) => <RbdComposedChart {...props} />;
export const Bar: React.FC<any> = (props) => <RbdBar {...props} />;
export const Line: React.FC<any> = (props) => <RbdLine {...props} />;
export const XAxis: React.FC<any> = (props) => <RbdXAxis {...props} />;
export const YAxis: React.FC<any> = (props) => <RbdYAxis {...props} />;
export const CartesianGrid: React.FC<any> = (props) => <RbdCartesianGrid {...props} />;
export const Tooltip: React.FC<any> = (props) => <RbdTooltip {...props} />;
export const Legend: React.FC<any> = (props) => <RbdLegend {...props} />;
export const ResponsiveContainer: React.FC<any> = (props) => <RbdResponsiveContainer {...props} />;
export const Cell: React.FC<any> = (props) => <RbdCell {...props} />;
export const Pie: React.FC<any> = (props) => <RbdPie {...props} />;
export const Area: React.FC<any> = (props) => <RbdArea {...props} />;
export const ScatterChart: React.FC<any> = (props) => <RbdScatterChart {...props} />;
export const Scatter: React.FC<any> = (props) => <RbdScatter {...props} />;
export const ZAxis: React.FC<any> = (props) => <RbdZAxis {...props} />;
