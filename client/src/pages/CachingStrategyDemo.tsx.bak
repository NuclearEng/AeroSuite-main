import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  TextField,
  Tab,
  Tabs,
  Alert,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import {
  supplierService,
  customerService,
  inspectionService,
  reportService,
  TTL,
  apiCache,
  clearAllCaches,
  evictExpired
} from '../services/cachedApiService';
import { useCachedData, useCachedPreference } from '../hooks/useCachedData';
import { PageHeader } from '../components/common';
import { Cache } from '../utils/caching';

// Mock data for simulation
const mockApi = {
  getSuppliers: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return [
      { id: 1, name: 'Aerospace Components Inc.', location: 'Seattle, WA' },
      { id: 2, name: 'JetTech Systems', location: 'Dallas, TX' },
      { id: 3, name: 'Altitude Parts Co.', location: 'Denver, CO' },
      { id: 4, name: 'SkyHigh Manufacturing', location: 'Phoenix, AZ' },
      { id: 5, name: 'Precision Aero Parts', location: 'Cincinnati, OH' }
    ];
  },
  getCustomers: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return [
      { id: 1, name: 'American Airlines', location: 'Fort Worth, TX' },
      { id: 2, name: 'Delta Air Lines', location: 'Atlanta, GA' },
      { id: 3, name: 'United Airlines', location: 'Chicago, IL' },
      { id: 4, name: 'Southwest Airlines', location: 'Dallas, TX' },
      { id: 5, name: 'JetBlue Airways', location: 'New York, NY' }
    ];
  }
};

// Demo cache for visualization
const demoCache = new Cache<any>(10, 30 * 1000); // 30 seconds TTL for demo purposes

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`caching-tabpanel-${index}`}
      aria-labelledby={`caching-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const CachingStrategyDemo: React.FC = () => {
  const theme = useTheme();
  
  // State for demo
  const [tabValue, setTabValue] = useState(0);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [cachingEnabled, setCachingEnabled] = useState(true);
  const [selectedTTL, setSelectedTTL] = useState('SHORT');
  const [cacheEntries, setCacheEntries] = useState<Array<{ key: string; expires: Date }>>([]);
  const [dataSource, setDataSource] = useState<'suppliers' | 'customers'>('suppliers');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Demo user preference with persistent cache
  const [theme, setThemePreference] = useCachedPreference<'light' | 'dark'>('theme', 'light');
  const [fontSize, setFontSize] = useCachedPreference<number>('fontSize', 16);
  
  // Fetch data using the useCachedData hook for the React hook demo
  const {
    data: hookData,
    loading: hookLoading,
    error: hookError,
    refetch: refetchHookData
  } = useCachedData(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      return dataSource === 'suppliers'
        ? await mockApi.getSuppliers()
        : await mockApi.getCustomers();
    },
    [dataSource],
    TTL[selectedTTL as keyof typeof TTL]
  );
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle TTL selection change
  const handleTTLChange = (event: SelectChangeEvent) => {
    setSelectedTTL(event.target.value);
  };
  
  // Handle data source change
  const handleDataSourceChange = (event: SelectChangeEvent) => {
    setDataSource(event.target.value as 'suppliers' | 'customers');
  };
  
  // Toggle caching
  const handleToggleCaching = () => {
    setCachingEnabled(!cachingEnabled);
  };
  
  // Fetch data for manual API call demo
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    setApiCallCount(prev => prev + 1);
    
    try {
      let data;
      const startTime = performance.now();
      
      if (dataSource === 'suppliers') {
        // If caching is enabled, use our cache wrapper
        if (cachingEnabled) {
          data = await supplierService.getSuppliers();
        } else {
          // Otherwise directly call the mock API
          data = await mockApi.getSuppliers();
        }
      } else {
        // If caching is enabled, use our cache wrapper
        if (cachingEnabled) {
          data = await customerService.getCustomers();
        } else {
          // Otherwise directly call the mock API
          data = await mockApi.getCustomers();
        }
      }
      
      const endTime = performance.now();
      
      // For demo purposes, show in the demo cache
      if (cachingEnabled) {
        const cacheKey = `/${dataSource}`;
        demoCache.set(cacheKey, data);
        
        // Update displayed cache entries
        updateCacheDisplay();
      }
      
      setResult({
        data,
        time: Math.round(endTime - startTime),
        cached: cachingEnabled && apiCallCount > 1,
      });
    } catch (_err) {
      setError(`Error fetching data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear cache for demo
  const clearCache = () => {
    demoCache.clear();
    updateCacheDisplay();
  };
  
  // Update the cache entries display
  const updateCacheDisplay = () => {
    const entries: Array<{ key: string; expires: Date }> = [];
    demoCache.keys().forEach(key => {
      const item = demoCache.get(key);
      if (item) {
        entries.push({
          key,
          expires: new Date(Date.now() + 30000), // 30 seconds from now for demo
        });
      }
    });
    setCacheEntries(entries);
  };
  
  // Update cache display when component mounts
  useEffect(() => {
    updateCacheDisplay();
    
    // Set up a timer to refresh the cache display
    const interval = setInterval(() => {
      updateCacheDisplay();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Box>
      <PageHeader
        title="Caching Strategy Demo"
        subtitle="Demonstrate caching strategies for improved performance"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Demo', href: '/demo' },
          { label: 'Caching Strategy' },
        ]}
      />
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Caching Strategy Overview
        </Typography>
        <Typography variant="body2" paragraph>
          This demo showcases various caching strategies to improve application performance
          by reducing redundant API calls and storing frequently accessed data.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Alert severity="info" sx={{ height: '100%' }}>
              <Typography variant="subtitle2">Memory Cache</Typography>
              <Typography variant="body2">
                Stores data in memory for the current session. Fast access but cleared when the page refreshes.
              </Typography>
            </Alert>
          </Grid>
          <Grid item xs={12} md={4}>
            <Alert severity="info" sx={{ height: '100%' }}>
              <Typography variant="subtitle2">Local Storage Cache</Typography>
              <Typography variant="body2">
                Persists data between sessions. Limited to ~5MB but works in all browsers.
              </Typography>
            </Alert>
          </Grid>
          <Grid item xs={12} md={4}>
            <Alert severity="info" sx={{ height: '100%' }}>
              <Typography variant="subtitle2">IndexedDB Cache</Typography>
              <Typography variant="body2">
                Stores larger datasets persistently. Higher capacity but more complex API.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="caching demo tabs">
          <Tab label="API Caching Demo" />
          <Tab label="React Hook Caching" />
          <Tab label="Preference Caching" />
        </Tabs>
      </Box>
      
      {/* API Caching Demo */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuration
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="data-source-label">Data Source</InputLabel>
                  <Select
                    labelId="data-source-label"
                    value={dataSource}
                    label="Data Source"
                    onChange={handleDataSourceChange}
                  >
                    <MenuItem value="suppliers">Suppliers</MenuItem>
                    <MenuItem value="customers">Customers</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="ttl-select-label">Cache TTL</InputLabel>
                  <Select
                    labelId="ttl-select-label"
                    value={selectedTTL}
                    label="Cache TTL"
                    onChange={handleTTLChange}
                    disabled={!cachingEnabled}
                  >
                    <MenuItem value="SHORT">Short (5 minutes)</MenuItem>
                    <MenuItem value="MEDIUM">Medium (30 minutes)</MenuItem>
                    <MenuItem value="LONG">Long (2 hours)</MenuItem>
                    <MenuItem value="VERY_LONG">Very Long (24 hours)</MenuItem>
                  </Select>
                </FormControl>
                
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button
                    variant={cachingEnabled ? "contained" : "outlined"}
                    color={cachingEnabled ? "primary" : "error"}
                    onClick={handleToggleCaching}
                    sx={{ mr: 1 }}
                  >
                    Caching: {cachingEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={clearCache}
                    disabled={!cachingEnabled}
                  >
                    Clear Cache
                  </Button>
                </Box>
                
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={fetchData}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Fetch Data'}
                </Button>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Cache Entries
                </Typography>
                
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    maxHeight: 200,
                    overflow: 'auto'
                  }}
                >
                  {cacheEntries.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                      No cached data
                    </Typography>
                  ) : (
                    cacheEntries.map((entry, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1,
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <Typography variant="body2" component="div" noWrap>
                          <strong>Key:</strong> {entry.key}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Expires:</strong> {entry.expires.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {isLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                ) : result ? (
                  <>
                    <Box
                      sx={{
                        mb: 2,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: result.cached
                          ? alpha(theme.palette.success.main, 0.1)
                          : alpha(theme.palette.info.main, 0.1),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="subtitle2">
                        Response time: {result.time}ms
                      </Typography>
                      
                      {cachingEnabled && (
                        <Chip
                          label={result.cached ? 'From Cache' : 'From API'}
                          color={result.cached ? 'success' : 'primary'}
                          size="small"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      {dataSource === 'suppliers' ? 'Suppliers' : 'Customers'} Data:
                    </Typography>
                    
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        maxHeight: 400,
                        overflow: 'auto'
                      }}
                    >
                      {result.data.map((item: any) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 1,
                            mb: 1,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                          }}
                        >
                          <Typography variant="subtitle2">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.location}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </>
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height={200}
                    bgcolor={alpha(theme.palette.background.default, 0.5)}
                    borderRadius={1}
                  >
                    <Typography color="text.secondary">
                      Click "Fetch Data" to retrieve {dataSource === 'suppliers' ? 'suppliers' : 'customers'}
                    </Typography>
                  </Box>
                )}
                
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    How It Works
                  </Typography>
                  <Typography variant="body2" paragraph>
                    This demo uses a caching layer to store API responses in memory. When caching is enabled,
                    subsequent requests for the same data will be served from the cache instead of making
                    a new API call, resulting in faster response times.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Each cache entry has a Time-To-Live (TTL) value that determines how long it remains valid.
                    After the TTL expires, the next request will fetch fresh data from the API.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* React Hook Caching Demo */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  useCachedData Hook
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="hook-data-source-label">Data Source</InputLabel>
                  <Select
                    labelId="hook-data-source-label"
                    value={dataSource}
                    label="Data Source"
                    onChange={handleDataSourceChange}
                  >
                    <MenuItem value="suppliers">Suppliers</MenuItem>
                    <MenuItem value="customers">Customers</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="hook-ttl-select-label">Cache TTL</InputLabel>
                  <Select
                    labelId="hook-ttl-select-label"
                    value={selectedTTL}
                    label="Cache TTL"
                    onChange={handleTTLChange}
                  >
                    <MenuItem value="SHORT">Short (5 minutes)</MenuItem>
                    <MenuItem value="MEDIUM">Medium (30 minutes)</MenuItem>
                    <MenuItem value="LONG">Long (2 hours)</MenuItem>
                    <MenuItem value="VERY_LONG">Very Long (24 hours)</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => refetchHookData()}
                  disabled={hookLoading}
                >
                  {hookLoading ? <CircularProgress size={24} /> : 'Refetch Data'}
                </Button>
                
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    How the Hook Works
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    The <code>useCachedData</code> hook manages fetching, caching, and 
                    state (loading, error, data) automatically. When dependencies change, 
                    it checks the cache first before making a new API call.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hook Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {hookLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                    <CircularProgress />
                  </Box>
                ) : hookError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {hookError.message}
                  </Alert>
                ) : hookData ? (
                  <>
                    <Box
                      sx={{
                        mb: 2,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                      }}
                    >
                      <Typography variant="subtitle2">
                        Data loaded using the <code>useCachedData</code> hook
                      </Typography>
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      {dataSource === 'suppliers' ? 'Suppliers' : 'Customers'} Data:
                    </Typography>
                    
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        maxHeight: 400,
                        overflow: 'auto'
                      }}
                    >
                      {hookData.map((item: any) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 1,
                            mb: 1,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                          }}
                        >
                          <Typography variant="subtitle2">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.location}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </>
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height={200}
                    bgcolor={alpha(theme.palette.background.default, 0.5)}
                    borderRadius={1}
                  >
                    <Typography color="text.secondary">
                      No data available
                    </Typography>
                  </Box>
                )}
                
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Benefits of React Hooks for Caching
                  </Typography>
                  <ul>
                    <li>
                      <Typography variant="body2">
                        <strong>Automatic cache management:</strong> The hook handles caching logic internally
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>Reactive updates:</strong> Components re-render automatically when cached data changes
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>Consistent loading states:</strong> Loading and error states are managed by the hook
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>Dependency-based cache invalidation:</strong> Cache is refreshed when dependencies change
                      </Typography>
                    </li>
                  </ul>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Preference Caching Demo */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cached User Preferences
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    User preferences are stored in localStorage and persist between sessions.
                    Changes are automatically saved and will be available when you return.
                  </Typography>
                </Alert>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="theme-select-label">Theme Preference</InputLabel>
                  <Select
                    labelId="theme-select-label"
                    value={theme}
                    label="Theme Preference"
                    onChange={(e) => setThemePreference(e.target.value as 'light' | 'dark')}
                  >
                    <MenuItem value="light">Light Theme</MenuItem>
                    <MenuItem value="dark">Dark Theme</MenuItem>
                  </Select>
                </FormControl>
                
                <Box mt={3}>
                  <Typography id="font-size-slider" gutterBottom>
                    Font Size: {fontSize}px
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography>12px</Typography>
                    <input
                      type="range"
                      min={12}
                      max={24}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      style={{ flexGrow: 1 }}
                    />
                    <Typography>24px</Typography>
                  </Stack>
                </Box>
                
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: theme === 'dark' ? '#2d2d2d' : '#f5f5f5',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Preview
                  </Typography>
                  <Typography sx={{ fontSize: `${fontSize}px` }}>
                    This text reflects your current preferences.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  How Preference Caching Works
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body2" paragraph>
                  The <code>useCachedPreference</code> hook manages user preferences with automatic
                  persistence to localStorage. This ensures that user settings are maintained
                  between sessions without requiring a backend database.
                </Typography>
                
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    mb: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {`// Example usage of the useCachedPreference hook
const [theme, setTheme] = useCachedPreference('theme', 'light');
const [fontSize, setFontSize] = useCachedPreference('fontSize', 16);

// Later in your component
return (
  <div style={{ 
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    fontSize: \`\${fontSize}px\`
  }}>
    Content with user preferences applied
  </div>
);`}
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Benefits of Preference Caching
                </Typography>
                
                <ul>
                  <li>
                    <Typography variant="body2">
                      <strong>Persistence without backend:</strong> User preferences are stored locally
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Instant application:</strong> Changes apply immediately without API calls
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Offline support:</strong> Preferences work even without internet connection
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Performance boost:</strong> No need to fetch preferences on each page load
                    </Typography>
                  </li>
                </ul>
                
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> For authenticated users, important preferences should still
                    be synchronized with the backend to enable cross-device consistency.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default CachingStrategyDemo; 