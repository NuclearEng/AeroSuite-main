/**
 * Analysis module type definitions
 * Contains interfaces and types used for data analysis functionality
 */

/**
 * Analysis options configuration interface
 */
export interface AnalysisOptions {
  /** Type of analysis to perform */
  analysisType: 'auto' | 'numeric' | 'categorical' | 'time-series';
  /** Whether to include outliers in analysis */
  includeOutliers: boolean;
  /** Whether to include detailed statistics */
  detailedStats: boolean;
}

/**
 * Statistical summary interface
 */
export interface StatsSummary {
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Mean (average) value */
  mean: number;
  /** Median value (optional) */
  median?: number;
  /** Standard deviation (optional) */
  stdDev?: number;
  /** Raw values array (optional) */
  values?: number[];
}

/**
 * Outlier data point interface
 */
export interface Outlier {
  /** Field name containing the outlier */
  field: string;
  /** Outlier value */
  value: unknown;
  /** Reason why it's considered an outlier */
  reason: string;
  /** Z-score or other statistical measure (optional) */
  score?: number;
}

/**
 * Time series data point interface
 */
export interface TimeSeriesPoint {
  /** Label for the data point (usually a timestamp or category) */
  name: string;
  /** Numeric value */
  value: number;
}

/**
 * Analysis API response interface
 */
export interface AnalysisResult {
  /** Type of data received */
  receivedType: 'array' | 'object' | 'string' | 'number';
  /** Number of items in the dataset */
  itemCount: number;
  /** Summary statistics by field */
  summary: Record<string, StatsSummary>;
  /** Analysis message */
  message: string;
  /** Suggested further analysis (optional) */
  suggestedAnalysis?: string;
  /** Detected outliers (optional) */
  outliers?: Outlier[];
  /** Time series analysis results (optional) */
  timeSeriesAnalysis?: {
    points: TimeSeriesPoint[];
    trend?: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    seasonality?: boolean;
    forecasts?: TimeSeriesPoint[];
  };
  /** Correlation analysis (optional) */
  correlations?: Array<{
    field1: string;
    field2: string;
    coefficient: number;
    strength: 'strong' | 'moderate' | 'weak' | 'none';
  }>;
}

/**
 * Chart data for visualization
 */
export interface ChartData {
  /** Field name to visualize */
  field: string;
  /** Chart type */
  type: 'bar' | 'line' | 'pie' | 'scatter';
  /** Data points for the chart */
  data: Array<{ name: string; value: number }>;
}

/**
 * Histogram bucket for distribution visualization
 */
export interface HistogramBucket {
  /** Bucket name/label */
  name: string;
  /** Count of values in this bucket */
  value: number;
}

/**
 * API request payload type
 */
export interface AnalysisRequestPayload {
  /** Data to analyze */
  data: unknown;
  /** Analysis configuration options */
  options: AnalysisOptions;
}

/**
 * API response type
 */
export interface AnalysisApiResponse {
  /** Analysis results */
  analysis: AnalysisResult;
  /** Processing time in milliseconds (optional) */
  processingTimeMs?: number;
  /** Status of the analysis */
  status: 'success' | 'partial' | 'error';
} 