import { ReactNode } from 'react';
import InspectionsSummary from './InspectionsSummary';
import UpcomingInspections from './UpcomingInspections';
import PerformanceMetricsDashboard from './PerformanceMetricsDashboard';
import AIInsightsWidget from './AIInsightsWidget';
import AnomalyDetectionWidget from './AnomalyDetectionWidget';
import CalendarWidget from './CalendarWidget';
import QualityMetricsWidget from './QualityMetricsWidget';

// Define widget metadata interface
export interface WidgetMeta {
  id: string;
  title: string;
  description: string;
  category: 'inspections' | 'suppliers' | 'analytics' | 'general' | 'custom' | 'ai' | 'quality';
  defaultSize: 'small' | 'medium' | 'large';
  minHeight?: number;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  previewImage?: string;
  isCustom?: boolean;
}

// Registry of all available widgets
const widgetRegistry: Record<string, WidgetMeta> = {
  'inspections-summary': {
    id: 'inspections-summary',
    title: 'Inspections Summary',
    description: 'Overview of inspection status and completion rates',
    category: 'inspections',
    defaultSize: 'medium',
    component: InspectionsSummary,
  },
  'upcoming-inspections': {
    id: 'upcoming-inspections',
    title: 'Upcoming Inspections',
    description: 'List of upcoming scheduled inspections',
    category: 'inspections',
    defaultSize: 'large',
    minHeight: 300,
    component: UpcomingInspections,
  },
  'performance-metrics': {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    description: 'Key performance indicators and metrics',
    category: 'analytics',
    defaultSize: 'large',
    minHeight: 400,
    component: PerformanceMetricsDashboard,
  },
  'ai-insights': {
    id: 'ai-insights',
    title: 'AI-Powered Insights',
    description: 'Intelligent insights and recommendations powered by AI',
    category: 'ai',
    defaultSize: 'large',
    minHeight: 400,
    component: AIInsightsWidget,
  },
  'anomaly-detection': {
    id: 'anomaly-detection',
    title: 'Anomaly Detection',
    description: 'AI-powered anomaly detection for time series data',
    category: 'ai',
    defaultSize: 'large',
    minHeight: 500,
    component: AnomalyDetectionWidget,
  },
  calendar: {
    id: 'calendar',
    title: 'Calendar',
    description: 'Calendar widget',
    category: 'general',
    defaultSize: 'medium',
    component: CalendarWidget,
  },
  'quality-metrics': {
    id: 'quality-metrics',
    title: 'Quality Metrics',
    description: 'Key quality metrics and trends for manufacturing processes',
    category: 'quality',
    defaultSize: 'large',
    minHeight: 400,
    component: QualityMetricsWidget,
  }
};

// Function to register a custom widget
export const registerCustomWidget = (widget: WidgetMeta): void => {
  if (widgetRegistry[widget.id]) {
    console.warn(`Widget with ID ${widget.id} already exists and will be overwritten`);
  }
  
  widgetRegistry[widget.id] = {
    ...widget,
    isCustom: true,
  };
};

// Function to get a widget by ID
export const getWidget = (id: string): WidgetMeta | undefined => {
  return widgetRegistry[id];
};

// Function to get all widgets
export const getAllWidgets = (): WidgetMeta[] => {
  return Object.values(widgetRegistry);
};

// Function to get widgets by category
export const getWidgetsByCategory = (category: string): WidgetMeta[] => {
  return Object.values(widgetRegistry).filter(widget => widget.category === category);
};

export default widgetRegistry; 