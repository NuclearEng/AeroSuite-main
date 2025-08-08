/**
 * Model Performance Dashboard
 * - Select model, metric, and time window
 * - Compare two models/metrics
 * - Export chart to CSV/PNG
 * - Real-time update toggle
 */
import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = '/api/retraining';
const METRICS = [
  { value: 'latency', label: 'Latency (ms)' },
  { value: 'throughput', label: 'Throughput' },
  { value: 'error_rate', label: 'Error Rate' },
  { value: 'prediction_accuracy', label: 'Accuracy' },
  { value: 'memory_usage', label: 'Memory Usage (MB)' },
  { value: 'cpu_usage', label: 'CPU Usage (%)' },
];
const TIME_WINDOWS = [
  { value: '1h', label: 'Last Hour' },
  { value: '1d', label: 'Last Day' },
  { value: '1w', label: 'Last Week' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

interface Model {
  id?: string;
  name?: string;
  [key: string]: any;
}

interface DataPoint {
  timestamp: string;
  value: number;
  [key: string]: any;
}

/**
 * Export data to CSV
 */
function exportToCSV(data: DataPoint[], filename: string) {
  const csv = [
    'Timestamp,Value',
    ...data.map(dp => `${dp.timestamp},${dp.value}`)
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export chart as PNG
 */
function exportChartAsPNG(chartRef: React.RefObject<HTMLDivElement>, filename: string) {
  if (!chartRef.current) return;
  import('html-to-image').then(htmlToImage => {
    htmlToImage.toPng(chartRef.current!).then(dataUrl => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      a.click();
    });
  });
}

function PerformanceDashboard() {
  const [models, setModels] = useState<Model[]>([]);
  const [modelId, setModelId] = useState<string>('');
  const [metricType, setMetricType] = useState<string>('latency');
  const [timeWindow, setTimeWindow] = useState<string>('1d');
  const [data, setData] = useState<DataPoint[]>([]);
  const [compareModelId, setCompareModelId] = useState<string>('');
  const [compareMetricType, setCompareMetricType] = useState<string>('latency');
  const [compareData, setCompareData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [realTime, setRealTime] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API}/models`);
        const json = await res.json();
        setModels(json.models || []);
      } catch {
        setModels([]);
      }
    };
    fetchModels();
  }, []);

  // Fetch main data
  const fetchData = () => {
    if (!modelId || !metricType) return;
    setLoading(true);
    setError('');
    fetch(`${API}/${modelId}/metrics?metricType=${metricType}&timeWindow=${timeWindow}`)
      .then(res => res.json())
      .then(json => {
        const points = json.metrics?.dataPoints || [];
        setData(points.map(dp => ({ ...dp, time: new Date(dp.timestamp).toLocaleString() })));
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch metrics');
        setLoading(false);
      });
  };

  // Fetch comparison data
  const fetchCompareData = () => {
    if (!compareModelId || !compareMetricType) {
      setCompareData([]);
      return;
    }
    fetch(`${API}/${compareModelId}/metrics?metricType=${compareMetricType}&timeWindow=${timeWindow}`)
      .then(res => res.json())
      .then(json => {
        const points = json.metrics?.dataPoints || [];
        setCompareData(points.map(dp => ({ ...dp, time: new Date(dp.timestamp).toLocaleString() })));
      })
      .catch(() => {
        setCompareData([]);
      });
  };

  useEffect(() => {
    fetchData();
     
  }, [modelId, metricType, timeWindow]);

  useEffect(() => {
    fetchCompareData();
     
  }, [compareModelId, compareMetricType, timeWindow]);

  // Real-time polling
  useEffect(() => {
    if (realTime) {
      intervalRef.current = setInterval(() => {
        fetchData();
        fetchCompareData();
      }, 10000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
     
  }, [realTime, modelId, metricType, compareModelId, compareMetricType, timeWindow]);

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: 32, border: '1px solid #ccc', borderRadius: 12, background: '#fafbfc', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 24 }}>Model Performance Dashboard</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Model:</label>
          <select value={modelId} onChange={e => setModelId(e.target.value)} style={{ padding: 6, minWidth: 180 }}>
            <option value="">-- Choose a model --</option>
            {models.map(m => (
              <option key={m.id || m.name} value={m.id || m.name}>{m.name || m.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Metric:</label>
          <select value={metricType} onChange={e => setMetricType(e.target.value)} style={{ padding: 6, minWidth: 160 }}>
            {METRICS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Compare Model:</label>
          <select value={compareModelId} onChange={e => setCompareModelId(e.target.value)} style={{ padding: 6, minWidth: 180 }}>
            <option value="">-- None --</option>
            {models.filter(m => (m.id || m.name) !== modelId).map(m => (
              <option key={m.id || m.name} value={m.id || m.name}>{m.name || m.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Compare Metric:</label>
          <select value={compareMetricType} onChange={e => setCompareMetricType(e.target.value)} style={{ padding: 6, minWidth: 160 }}>
            {METRICS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Time Window:</label>
          <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)} style={{ padding: 6, minWidth: 140 }}>
            {TIME_WINDOWS.map(w => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontWeight: 500 }}>Real-Time</label>
          <input type="checkbox" checked={realTime} onChange={e => setRealTime(e.target.checked)} />
        </div>
        <button onClick={() => exportToCSV(data, `model-${modelId || 'main'}-${metricType}.csv`)} style={{ padding: '6px 12px', marginLeft: 8 }}>Export CSV</button>
        <button onClick={() => exportChartAsPNG(chartRef, `model-${modelId || 'main'}-${metricType}.png`)} style={{ padding: '6px 12px' }}>Export PNG</button>
      </div>
      {loading && <div style={{ color: '#888', marginBottom: 16 }}>Loading...</div>}
      {error && <div style={{ color: '#e53935', marginBottom: 16 }}>{error}</div>}
      <div ref={chartRef} style={{ width: '100%', height: 400 }}>
        {!loading && !error && data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" minTickGap={40} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#1976d2" dot={false} name={METRICS.find(m => m.value === metricType)?.label || metricType} />
              {compareData.length > 0 && (
                <Line type="monotone" dataKey="value" data={compareData} stroke="#e53935" dot={false} name={`Compare: ${METRICS.find(m => m.value === compareMetricType)?.label || compareMetricType}`} />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
        {!loading && !error && data.length === 0 && modelId && (
          <div style={{ color: '#888', marginTop: 32 }}>No data available for this metric and time window.</div>
        )}
      </div>
    </div>
  );
}

export default PerformanceDashboard; 