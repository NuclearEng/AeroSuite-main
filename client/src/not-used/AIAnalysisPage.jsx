import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Container, 
  Divider, 
  FormControl, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Tab, 
  Tabs, 
  TextField, 
  Typography,
  Tooltip,
  Skeleton,
  IconButton
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import Papa from 'papaparse';
import { z } from 'zod';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

/**
 * AI-assisted Data Analysis Page
 * 
 * Allows users to upload or paste data and get AI-powered analysis
 * Part of TS374: AI-assisted data analysis integration
 */
const AIAnalysisPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  
  // State management
  const [inputMethod, setInputMethod] = useState('paste');
  const [inputData, setInputData] = useState('');
  const [dataFormat, setDataFormat] = useState('json');
  const [analysisOptions, setAnalysisOptions] = useState({
    analysisType: 'auto',
    includeOutliers: true,
    detailedStats: true
  });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [inputError, setInputError] = useState('');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  
  const DataArraySchema = z.array(z.object({}).passthrough());
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  const SAMPLE_DATA = '[{"value":1},{"value":2},{"value":3}]';
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle input method change
  const handleInputMethodChange = (event) => {
    setInputMethod(event.target.value);
    setInputData('');
    setAnalysis(null);
    setInputError('');
  };
  
  // Handle data format change
  const handleDataFormatChange = (event) => {
    setDataFormat(event.target.value);
    setAnalysis(null);
    setInputData('');
    setInputError('');
  };
  
  // Handle options change
  const handleOptionChange = (event) => {
    setAnalysisOptions({
      ...analysisOptions,
      [event.target.name]: event.target.value
    });
  };
  
  // Handle checkbox options
  const handleCheckboxChange = (event) => {
    setAnalysisOptions({
      ...analysisOptions,
      [event.target.name]: event.target.checked
    });
  };
  
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setInputError('File is too large (max 5MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputData(e.target.result);
      setInputError('');
    };
    reader.onerror = () => {
      setInputError('Failed to read file.');
    };
    reader.readAsText(file);
  };
  
  // Parse input data based on format
  const parseInputData = () => {
    try {
      let parsed;
      if (dataFormat === 'json') {
        parsed = JSON.parse(inputData);
      } else if (dataFormat === 'csv') {
        const result = Papa.parse(inputData, { header: true, dynamicTyping: true });
        parsed = result.data;
      }
      if (!validateInput(parsed)) return null;
      return parsed;
    } catch (_error) {
      setInputError(`Error parsing ${dataFormat.toUpperCase()} data: ${error.message}`);
      enqueueSnackbar(`Error parsing ${dataFormat.toUpperCase()} data: ${error.message}`, { variant: 'error' });
      return null;
    }
  };
  
  const validateInput = (data) => {
    if (!data || (typeof data === 'string' && data.trim() === '')) {
      setInputError('Input cannot be empty or whitespace.');
      return false;
    }
    try {
      DataArraySchema.parse(data);
      setInputError('');
      return true;
    } catch (_e) {
      setInputError('Input data must be an array of objects.');
      return false;
    }
  };
  
  // Submit data for analysis
  const handleSubmit = async () => {
    const parsedData = parseInputData();
    if (!parsedData) return;
    
    setLoading(true);
    try {
      const response = await axios.post('/api/v1/ai/analysis', {
        data: parsedData,
        options: analysisOptions
      });
      
      setAnalysis(response.data.analysis);
      enqueueSnackbar('Analysis completed successfully', { variant: 'success' });
    } catch (_error) {
      enqueueSnackbar(`Analysis failed: ${error.response?.data?.message || error.message}`, { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render summary statistics as cards
  const renderSummaryStats = () => {
    if (!analysis || !analysis.summary) return null;
    
    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {Object.entries(analysis.summary).map(([key, stats]) => (
          <Grid item xs={12} md={6} lg={4} key={key}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {key}
                </Typography>
                <Typography variant="body2">Min: {stats.min}</Typography>
                <Typography variant="body2">Max: {stats.max}</Typography>
                <Typography variant="body2">Mean: {stats.mean}</Typography>
                {stats.median && (
                  <Typography variant="body2">Median: {stats.median}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Add a utility function to compute histogram if needed
  function computeHistogram(values, bucketCount = 10) {
    if (!Array.isArray(values) || values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const size = range / bucketCount;
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      name: `${(min + i * size).toFixed(1)}-${(min + (i + 1) * size).toFixed(1)}`,
      value: 0
    }));
    values.forEach(v => {
      if (typeof v !== 'number') return;
      let idx = Math.floor((v - min) / size);
      if (idx === bucketCount) idx--;
      if (idx >= 0 && idx < bucketCount) buckets[idx].value++;
    });
    return buckets;
  }
  
  // Render charts based on analysis data
  const renderCharts = () => {
    if (!analysis || !analysis.summary) return null;
    const chartData = [];
    if (analysis.receivedType === 'array' && analysis.itemCount > 0) {
      Object.entries(analysis.summary).forEach(([key, stats]) => {
        if (Array.isArray(stats.values) && stats.values.length > 0) {
          // Use actual values to compute histogram
          chartData.push({
            field: key,
            type: 'bar',
            data: computeHistogram(stats.values)
          });
        }
      });
      if (analysis.timeSeriesAnalysis && Array.isArray(analysis.timeSeriesAnalysis.points)) {
        chartData.push({
          field: 'Time Series',
          type: 'line',
          data: analysis.timeSeriesAnalysis.points
        });
      }
    }
    
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Data Visualization
        </Typography>
        <Grid container spacing={3}>
          {chartData.map((chart, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {chart.field}
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  {chart.type === 'bar' ? (
                    <BarChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill={theme.palette.primary.main} />
                    </BarChart>
                  ) : (
                    <LineChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={theme.palette.secondary.main} 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };
  
  // Render insights and recommendations
  const renderInsights = () => {
    if (!analysis) return null;
    
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          AI Insights
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1" paragraph>
            {analysis.message}
          </Typography>
          
          {analysis.suggestedAnalysis && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Suggested Analysis
              </Typography>
              <Typography variant="body2" paragraph>
                {analysis.suggestedAnalysis}
              </Typography>
            </>
          )}
          
          {analysis.outliers && analysis.outliers.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Outliers Detected
              </Typography>
              <ul>
                {analysis.outliers.map((outlier, index) => (
                  <li key={index}>
                    <Typography variant="body2">
                      {outlier.field}: {outlier.value} ({outlier.reason})
                    </Typography>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Paper>
      </Box>
    );
  };
  
  const handleInputChange = (value) => {
    setHistory((h) => [...h, inputData]);
    setFuture([]);
    setInputData(value);
    setShowPreview(true);
    tryAutoDetectFormat(value);
  };
  
  const handleUndo = () => {
    if (history.length === 0) return;
    setFuture((f) => [inputData, ...f]);
    setInputData(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };
  
  const handleRedo = () => {
    if (future.length === 0) return;
    setHistory((h) => [...h, inputData]);
    setInputData(future[0]);
    setFuture((f) => f.slice(1));
  };
  
  const handleClearAll = () => {
    setInputData('');
    setAnalysis(null);
    setInputError('');
    setPreviewData(null);
    setShowPreview(false);
    setValidationErrors([]);
    setHistory([]);
    setFuture([]);
  };
  
  const handleTrySampleData = () => {
    handleInputChange(SAMPLE_DATA);
    setShowPreview(true);
  };
  
  const tryAutoDetectFormat = (value) => {
    if (!value) return;
    if (value.trim().startsWith('[') || value.trim().startsWith('{')) {
      setDataFormat('json');
    } else if (value.includes(',') && value.includes('\n')) {
      setDataFormat('csv');
    }
  };
  
  const handlePreview = () => {
    try {
      let parsed;
      if (dataFormat === 'json') {
        parsed = JSON.parse(inputData);
      } else if (dataFormat === 'csv') {
        const result = Papa.parse(inputData, { header: true, dynamicTyping: true });
        parsed = result.data;
      }
      setPreviewData(parsed);
      setShowPreview(true);
      if (Array.isArray(parsed) && parsed.length > 1000) {
        enqueueSnackbar('Warning: Large dataset, results may be slow to display.', { variant: 'warning' });
      }
    } catch (_e) {
      setPreviewData(null);
      setShowPreview(false);
    }
  };
  
  const handleDownloadResults = (type = 'json') => {
    if (!analysis) return;
    let dataStr = '';
    let filename = 'analysis-results.' + type;
    if (type === 'json') {
      dataStr = JSON.stringify(analysis, null, 2);
    } else {
      // Simple CSV export for summary
      const keys = Object.keys(analysis.summary || {});
      const rows = keys.map(k => {
        const s = analysis.summary[k];
        return `${k},${s.min},${s.max},${s.mean},${s.median || ''}`;
      });
      dataStr = 'Field,Min,Max,Mean,Median\n' + rows.join('\n');
      filename = 'analysis-summary.csv';
    }
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI-Assisted Data Analysis
      </Typography>
      <Typography variant="body1" paragraph>
        Upload or paste your data for AI-powered analysis and insights.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Input Data
              <Tooltip title="Paste or upload your data. Format will be auto-detected.">
                <HelpOutlineIcon fontSize="small" sx={{ ml: 1 }} />
              </Tooltip>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Tooltip title="Undo">
                <span><IconButton aria-label="Undo" onClick={handleUndo} disabled={history.length === 0}><UndoIcon /></IconButton></span>
              </Tooltip>
              <Tooltip title="Redo">
                <span><IconButton aria-label="Redo" onClick={handleRedo} disabled={future.length === 0}><RedoIcon /></IconButton></span>
              </Tooltip>
              <Tooltip title="Clear All">
                <span><IconButton aria-label="Clear All" onClick={handleClearAll}><DeleteSweepIcon /></IconButton></span>
              </Tooltip>
              <Tooltip title="Try Sample Data">
                <span><IconButton aria-label="Try Sample Data" onClick={handleTrySampleData}><InsertDriveFileIcon /></IconButton></span>
              </Tooltip>
              <Tooltip title="Preview Data">
                <span><IconButton aria-label="Preview Data" onClick={handlePreview} disabled={!inputData}><InsertDriveFileIcon color={showPreview ? 'primary' : 'inherit'} /></IconButton></span>
              </Tooltip>
            </Box>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="input-method-label">Input Method</InputLabel>
              <Select
                labelId="input-method-label"
                value={inputMethod}
                label="Input Method"
                onChange={handleInputMethodChange}
                aria-label="Input Method"
              >
                <MenuItem value="paste">Paste Data</MenuItem>
                <MenuItem value="upload">Upload File</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="data-format-label">Data Format</InputLabel>
              <Select
                labelId="data-format-label"
                value={dataFormat}
                label="Data Format"
                onChange={handleDataFormatChange}
                aria-label="Data Format"
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
            
            {inputMethod === 'paste' ? (
              <TextField
                label={`Paste ${dataFormat.toUpperCase()} Data`}
                aria-label="Paste Data"
                multiline
                rows={10}
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                margin="normal"
                fullWidth
                variant="outlined"
                placeholder={dataFormat === 'json' ? '[ { "key": "value" } ]' : 'header1,header2\nvalue1,value2'}
                aria-invalid={!!inputError}
                aria-describedby="input-error-text"
                inputProps={{ tabIndex: 0 }}
                sx={{ '&:focus-within': { outline: '2px solid #1976d2' } }}
              />
            ) : (
              <Button
                variant="contained"
                component="label"
                sx={{ mt: 2, '&:focus': { outline: '2px solid #1976d2' } }}
                tabIndex={0}
                aria-label={`Upload ${dataFormat.toUpperCase()} File`}
              >
                Upload {dataFormat.toUpperCase()} File
                <input
                  type="file"
                  accept={dataFormat === 'json' ? '.json' : '.csv'}
                  hidden
                  onChange={handleFileUpload}
                  tabIndex={-1}
                />
              </Button>
            )}
            
            {inputError && (
              <Typography id="input-error-text" color="error" variant="body2" sx={{ mt: 1 }} role="alert">
                {inputError}
              </Typography>
            )}
            
            {showPreview && previewData && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: '#f9f9f9' }}>
                <Typography variant="subtitle2">Preview ({Array.isArray(previewData) ? previewData.length : 0} rows)</Typography>
                {Array.isArray(previewData) && previewData.length > 1000 && (
                  <Typography color="warning.main" variant="body2">Warning: Large dataset, results may be slow to display.</Typography>
                )}
                <pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(previewData, null, 2)}</pre>
              </Paper>
            )}
            
            {validationErrors.length > 0 && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: '#fff3e0' }}>
                <Typography color="error" variant="body2">Validation Errors:</Typography>
                <ul>{validationErrors.map((err, i) => <li key={i}><Typography color="error" variant="body2">{err}</Typography></li>)}</ul>
              </Paper>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Analysis Options
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Analysis Type</InputLabel>
              <Select
                name="analysisType"
                value={analysisOptions.analysisType}
                label="Analysis Type"
                onChange={handleOptionChange}
              >
                <MenuItem value="auto">Auto-detect</MenuItem>
                <MenuItem value="numeric">Numeric</MenuItem>
                <MenuItem value="categorical">Categorical</MenuItem>
                <MenuItem value="time-series">Time Series</MenuItem>
              </Select>
            </FormControl>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Include Outliers</InputLabel>
                  <Select
                    name="includeOutliers"
                    value={analysisOptions.includeOutliers}
                    label="Include Outliers"
                    onChange={handleCheckboxChange}
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Detailed Stats</InputLabel>
                  <Select
                    name="detailedStats"
                    value={analysisOptions.detailedStats}
                    label="Detailed Stats"
                    onChange={handleCheckboxChange}
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!inputData || loading}
              sx={{ mt: 3 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Analyze Data'}
            </Button>
          </Paper>
        </Grid>
        
        {/* Results Section */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Analysis Results
              <Tooltip title="Results will appear here after analysis. You can download them as JSON or CSV.">
                <HelpOutlineIcon fontSize="small" sx={{ ml: 1 }} />
              </Tooltip>
              {analysis && (
                <Tooltip title="Download as JSON">
                  <span><IconButton onClick={() => handleDownloadResults('json')}><DownloadIcon /></IconButton></span>
                </Tooltip>
              )}
              {analysis && (
                <Tooltip title="Download as CSV">
                  <span><IconButton onClick={() => handleDownloadResults('csv')}><DownloadIcon /></IconButton></span>
                </Tooltip>
              )}
            </Typography>
            
            {loading ? (
              <Skeleton variant="rectangular" height={300} sx={{ my: 4 }} />
            ) : analysis ? (
              <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Summary" />
                    <Tab label="Visualizations" />
                    <Tab label="Insights" />
                    <Tab label="Raw Data" />
                  </Tabs>
                </Box>
                
                {/* Summary Tab */}
                {activeTab === 0 && (
                  <Box sx={{ pt: 2 }}>
                    <Typography variant="subtitle1">
                      Data Type: <strong>{analysis.receivedType}</strong>
                    </Typography>
                    {analysis.receivedType === 'array' && (
                      <Typography variant="subtitle1">
                        Item Count: <strong>{analysis.itemCount}</strong>
                      </Typography>
                    )}
                    {renderSummaryStats()}
                  </Box>
                )}
                
                {/* Visualizations Tab */}
                {activeTab === 1 && (
                  <Box sx={{ pt: 2 }}>
                    {renderCharts()}
                  </Box>
                )}
                
                {/* Insights Tab */}
                {activeTab === 2 && (
                  <Box sx={{ pt: 2 }}>
                    {renderInsights()}
                  </Box>
                )}
                
                {/* Raw Data Tab */}
                {activeTab === 3 && (
                  <Box sx={{ pt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Raw Analysis Results
                    </Typography>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        maxHeight: 400, 
                        overflow: 'auto',
                        bgcolor: theme.palette.mode === 'dark' ? '#1E1E1E' : '#F5F5F5'
                      }}
                    >
                      <pre style={{ margin: 0 }}>
                        {JSON.stringify(analysis, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ my: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Enter your data and click "Analyze Data" to see results
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIAnalysisPage; 