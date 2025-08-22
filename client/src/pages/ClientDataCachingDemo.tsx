import React, { ChangeEvent, useState, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  SelectChangeEvent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  RestartAlt as RefreshIcon,
  Storage as StorageIcon,
  DeleteForever as ClearIcon,
  CloudDownload as DownloadIcon,
  NetworkCheck as NetworkIcon,
  NetworkWifi as OfflineIcon,
  Done as SuccessIcon,
} from '@mui/icons-material';
import { PageHeader } from '../components/common';
import useClientCache, { useClientPreference, useSimpleCache } from '../hooks/useClientCache';
import clientDataCache, { 
  CacheStrategy, 
  DEFAULT_TTL
} from '../utils/clientDataCache';

// Mock data for simulation
const mockAPI = {
  getData: async (entityType: string, delay = 1500) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (entityType === 'users') {
      return [
        { id: 1, name: 'John Smith', role: 'Admin', department: 'Engineering' },
        { id: 2, name: 'Sarah Johnson', role: 'Manager', department: 'Sales' },
        { id: 3, name: 'Michael Brown', role: 'Developer', department: 'Engineering' },
        { id: 4, name: 'Emily Davis', role: 'Designer', department: 'Product' },
        { id: 5, name: 'David Wilson', role: 'Analyst', department: 'Finance' }
      ];
    } else if (entityType === 'products') {
      return [
        { id: 101, name: 'Airplane Wing Component A', sku: 'AWC-001', price: 12500 },
        { id: 102, name: 'Fuselage Section B', sku: 'FSB-002', price: 45000 },
        { id: 103, name: 'Landing Gear Assembly', sku: 'LGA-003', price: 28750 },
        { id: 104, name: 'Cockpit Control System', sku: 'CCS-004', price: 36200 },
        { id: 105, name: 'Engine Mount Bracket', sku: 'EMB-005', price: 8900 }
      ];
    } else {
      return [
        { id: 201, name: 'Inspection Report #45', date: '2023-01-15', status: 'Completed' },
        { id: 202, name: 'Maintenance Record #78', date: '2023-02-22', status: 'In Progress' },
        { id: 203, name: 'Quality Assessment #12', date: '2023-03-05', status: 'Pending Review' },
        { id: 204, name: 'Safety Compliance #34', date: '2023-03-18', status: 'Approved' },
        { id: 205, name: 'Certification Document #56', date: '2023-04-02', status: 'Submitted' }
      ];
    }
  },
  
  getWithPagination: async (page: number, pageSize: number, delay = 1000) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Create page of mock data
    const startIndex = (page - 1) * pageSize;
    const items = [];
    
    for (let i = 0; i < pageSize; i++) {
      const id = startIndex + i + 1;
      // Only return data up to item 25 (to simulate end of data)
      if (id <= 25) {
        items.push({
          id,
          name: `Item ${id}`,
          description: `Description for item ${id}`,
          category: id % 3 === 0 ? 'Category A' : id % 3 === 1 ? 'Category B' : 'Category C'
        });
      }
    }
    
    return {
      items,
      page,
      pageSize,
      totalItems: 25,
      totalPages: Math.ceil(25 / pageSize)
    };
  }
};

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
      id={`cache-demo-tabpanel-${index}`}
      aria-labelledby={`cache-demo-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const ClientDataCachingDemo: React.FC = () => {
  const muiTheme = useTheme();
  
  // Demo state
  const [tabValue, setTabValue] = useState(0);
  const [entityType, setEntityType] = useState('users');
  const [cacheStrategy, setCacheStrategy] = useState<any>(CacheStrategy.STALE_WHILE_REVALIDATE);
  const [ttlOption, setTTLOption] = useState('MEDIUM');
  const [isOffline, setIsOffline] = useState(false);
  const [customCacheKey, setCustomCacheKey] = useState('demo-custom-data');
  const [customCacheValue, setCustomCacheValue] = useState('');
  const [manualCacheResult, setManualCacheResult] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // User preferences (persisted)
  const [themePreference, setThemePreference] = useClientPreference<'light' | 'dark'>('ui-theme', 'light');
  const [fontSize, setFontSize] = useClientPreference<number>('ui-font-size', 16);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle entity type change
  const handleEntityTypeChange = (event: SelectChangeEvent) => {
    setEntityType(event.target.value);
  };
  
  // Handle cache strategy change
  const handleStrategyChange = (event: SelectChangeEvent) => {
    setCacheStrategy(event.target.value as CacheStrategy);
  };
  
  // Handle TTL option change
  const handleTTLChange = (event: SelectChangeEvent) => {
    setTTLOption(event.target.value);
  };
  
  // Toggle offline mode
  const toggleOfflineMode = () => {
    setIsOffline(!isOffline);
  };
  
  // Function to create fetch function based on offline mode
  const createFetchFn = useCallback(
    (type: string) => {
      return async () => {
        if (isOffline) {
          // Simulate network error in offline mode
          throw new Error('Network error: Device is offline');
        }
        return mockAPI.getData(type);
      };
    },
    [isOffline]
  );
  
  // Basic strategy demo
  const { 
    data: strategyData, 
    loading: strategyLoading, 
    error: strategyError,
    refresh: refreshStrategy,
    isFromCache: isFromStrategyCache,
    lastUpdated: strategyLastUpdated
  } = useClientCache(
    `demo-${entityType}`,
    createFetchFn(entityType),
    {
      strategy: cacheStrategy,
      ttl: DEFAULT_TTL[ttlOption as keyof typeof DEFAULT_TTL],
      fetchOnMount: true
    }
  );
  
  // Simple cache demo
  const { 
    data: simpleData, 
    loading: simpleLoading, 
    refresh: refreshSimple 
  } = useSimpleCache(
    'demo-simple-data',
    async () => {
      if (isOffline) {
        throw new Error('Network error: Device is offline');
      }
      await new Promise(resolve => setTimeout(resolve, 800));
      return { message: 'Simple cached data', timestamp: new Date().toISOString() };
    },
    DEFAULT_TTL.SHORT
  );
  
  // Pagination demo
  const {
    data: paginatedData,
    loading: paginationLoading,
    error: paginationError,
    fetchMore: fetchMoreItems,
    hasMore: hasMoreItems,
    refresh: refreshPagination
  } = useClientCache(
    'demo-paginated-data',
    async () => {
      if (isOffline) {
        throw new Error('Network error: Device is offline');
      }
      return mockAPI.getWithPagination(currentPage, 5);
    },
    {
      pagination: {
        currentPage,
        pageSize: 5,
        appendResults: true
      },
      deps: [currentPage],
      fetchOnMount: true
    }
  );
  
  // Manual cache operations
  const handleSetCache = async () => {
    if (!customCacheKey || !customCacheValue) return;
    
    try {
      await clientDataCache.set(customCacheKey, customCacheValue, {
        strategy: CacheStrategy.LOCAL_STORAGE,
        ttl: DEFAULT_TTL.LONG
      });
      
      setManualCacheResult({
        success: true,
        message: `Value stored in cache with key: ${customCacheKey}`
      });
    } catch (_error) {
      setManualCacheResult({
        success: false,
        message: `Error storing value: ${_error instanceof Error ? _error.message : String(_error)}`
      });
    }
  };
  
  const handleGetCache = async () => {
    if (!customCacheKey) return;
    
    try {
      const value = await clientDataCache.get(customCacheKey, {
        strategy: CacheStrategy.LOCAL_STORAGE
      });
      
      setManualCacheResult({
        success: true,
        message: value !== undefined 
          ? `Retrieved value: ${JSON.stringify(value)}`
          : `No value found for key: ${customCacheKey}`
      });
    } catch (_error) {
      setManualCacheResult({
        success: false,
        message: `Error retrieving value: ${_error instanceof Error ? _error.message : String(_error)}`
      });
    }
  };
  
  const handleClearCache = async () => {
    if (!customCacheKey) return;
    
    try {
      await clientDataCache.invalidate(customCacheKey);
      
      setManualCacheResult({
        success: true,
        message: `Cleared cache for key: ${customCacheKey}`
      });
    } catch (_error) {
      setManualCacheResult({
        success: false,
        message: `Error clearing cache: ${_error instanceof Error ? _error.message : String(_error)}`
      });
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Client Data Caching Demo"
        subtitle="Demonstration of client-side data caching strategies and features"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Demo', href: '/demo' },
          { label: 'Client Data Caching' }
        ]}
      />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Client-Side Data Caching Overview
        </Typography>
        <Typography paragraph>
          Client-side data caching improves application performance by storing API responses locally
          and reducing network requests. This demo showcases different caching strategies and features.
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Stale-While-Revalidate" 
                subheader="Fastest user experience"
                avatar={<StorageIcon color="primary" />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Returns cached data immediately while fetching fresh data in the background.
                  Provides the best balance between performance and freshness.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Cache First" 
                subheader="Optimal for stable data"
                avatar={<StorageIcon color="primary" />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Always tries to serve from cache first, falling back to network only when
                  the cache is empty or expired. Ideal for static or rarely changing data.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Network First" 
                subheader="Ensures freshness with fallback"
                avatar={<NetworkIcon color="primary" />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Always tries to fetch fresh data first, falling back to cache when offline
                  or when the network fails. Provides optimal data freshness with reliability.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={isOffline} 
                onChange={toggleOfflineMode} 
                color="warning"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isOffline ? <OfflineIcon color="warning" sx={{ mr: 1 }} /> : <NetworkIcon color="success" sx={{ mr: 1 }} />}
                <Typography>{isOffline ? "Offline Mode (Simulates network failure)" : "Online Mode"}</Typography>
              </Box>
            }
          />
        </Box>
      </Paper>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        aria-label="client data caching demo tabs"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Caching Strategies" />
        <Tab label="Pagination with Cache" />
        <Tab label="User Preferences" />
        <Tab label="Manual Cache Control" />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="entity-type-label">Data Type</InputLabel>
                <Select
                  labelId="entity-type-label"
                  value={entityType}
                  label="Data Type"
                  onChange={handleEntityTypeChange}
                >
                  <MenuItem value="users">Users</MenuItem>
                  <MenuItem value="products">Products</MenuItem>
                  <MenuItem value="reports">Reports</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="cache-strategy-label">Cache Strategy</InputLabel>
                <Select
                  labelId="cache-strategy-label"
                  value={cacheStrategy}
                  label="Cache Strategy"
                  onChange={handleStrategyChange}
                >
                  <MenuItem value={CacheStrategy.STALE_WHILE_REVALIDATE}>Stale While Revalidate</MenuItem>
                  <MenuItem value={CacheStrategy.CACHE_FIRST}>Cache First</MenuItem>
                  <MenuItem value={CacheStrategy.NETWORK_FIRST}>Network First</MenuItem>
                  <MenuItem value={CacheStrategy.CACHE_ONLY}>Cache Only (Offline)</MenuItem>
                  <MenuItem value={CacheStrategy.NETWORK_ONLY}>Network Only (No Cache)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="ttl-label">Cache TTL</InputLabel>
                <Select
                  labelId="ttl-label"
                  value={ttlOption}
                  label="Cache TTL"
                  onChange={handleTTLChange}
                >
                  <MenuItem value="SHORT">Short (1 minute)</MenuItem>
                  <MenuItem value="MEDIUM">Medium (5 minutes)</MenuItem>
                  <MenuItem value="LONG">Long (30 minutes)</MenuItem>
                  <MenuItem value="VERY_LONG">Very Long (1 day)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Data
            </Typography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              {isFromStrategyCache && (
                <Chip 
                  label="From Cache" 
                  color="primary" 
                  size="small" 
                  icon={<StorageIcon />} 
                />
              )}
              
              <Typography variant="body2" color="text.secondary">
                Last updated: {formatTimestamp(strategyLastUpdated)}
              </Typography>
              
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={refreshStrategy} 
                disabled={strategyLoading}
              >
                Refresh
              </Button>
            </Stack>
          </Box>
          
          {strategyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : strategyError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {strategyError.message}
            </Alert>
          ) : (
            <Box sx={{ mt: 2 }}>
              <List sx={{ bgcolor: 'background.paper' }}>
                {Array.isArray(strategyData) && strategyData.map((item: any) => (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={item.name}
                      secondary={
                        entityType === 'users'
                          ? `${item.role} - ${item.department}`
                          : entityType === 'products'
                          ? `SKU: ${item.sku} - $${item.price}`
                          : `${item.date} - ${item.status}`
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Simple Cache Demo
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2">
              Using the simplified hook with short TTL (1 minute)
            </Typography>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={refreshSimple}
              disabled={simpleLoading}
            >
              Refresh
            </Button>
          </Box>
          
          {simpleLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Box sx={{ p: 2, bgcolor: alpha(muiTheme.palette.primary.main, 0.1), borderRadius: 1 }}>
              <Typography>
                {simpleData ? simpleData.message : 'No data'}
              </Typography>
              {simpleData && (
                <Typography variant="body2" color="text.secondary">
                  Timestamp: {simpleData.timestamp}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Paginated Data with Caching
          </Typography>
          
          <Typography paragraph>
            This demo shows how to efficiently cache paginated data and implement infinite scrolling
            with cached results. Each page is cached separately and combined client-side.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshPagination}
              disabled={paginationLoading}
            >
              Reset & Refresh
            </Button>
          </Box>
          
          {paginationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paginationError.message}
            </Alert>
          )}
          
          <List sx={{ bgcolor: 'background.paper' }}>
            {paginatedData?.items?.map((item: any) => (
              <ListItem key={item.id} divider>
                <ListItemText
                  primary={item.name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Chip 
                        label={item.category} 
                        size="small" 
                        sx={{ ml: 1 }}
                        color={
                          item.category === 'Category A' ? 'primary' :
                          item.category === 'Category B' ? 'secondary' : 'default'
                        }
                      />
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            {paginationLoading ? (
              <CircularProgress size={24} />
            ) : hasMoreItems ? (
              <Button
                variant="contained"
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Load More
              </Button>
            ) : (
              <Typography color="text.secondary">
                All items loaded
              </Typography>
            )}
          </Box>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Persistent User Preferences
          </Typography>
          
          <Typography paragraph>
            User preferences are stored in localStorage with permanent TTL. They persist
            across page refreshes and browser sessions.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="theme-label">Theme Preference</InputLabel>
                <Select
                  labelId="theme-label"
                  value={themePreference}
                  label="Theme Preference"
                  onChange={(e) => setThemePreference(e.target.value as 'light' | 'dark')}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography gutterBottom>Font Size: {fontSize}px</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">12px</Typography>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{ flex: 1, margin: '0 10px' }}
                  />
                  <Typography variant="body2">24px</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, p: 3, bgcolor: themePreference === 'dark' ? '#333' : '#f5f5f5', borderRadius: 1 }}>
            <Typography
              variant="h6"
              sx={{ 
                color: themePreference === 'dark' ? '#fff' : '#000',
                fontSize: `${fontSize}px`
              }}
            >
              Preview of your preferences
            </Typography>
            <Typography
              sx={{ 
                color: themePreference === 'dark' ? '#ccc' : '#333',
                fontSize: `${fontSize - 2}px`,
                mt: 1
              }}
            >
              This text shows how your preferences would look in the application.
              Changes are automatically saved and will persist even after you close the browser.
            </Typography>
          </Box>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Manual Cache Control
          </Typography>
          
          <Typography paragraph>
            This demo shows how to manually interact with the cache for advanced use cases.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cache Key"
                value={customCacheKey}
                onChange={(e) => setCustomCacheKey(e.target.value)}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Value to Cache"
                value={customCacheValue}
                onChange={(e) => setCustomCacheValue(e.target.value)}
                margin="normal"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<StorageIcon />}
              onClick={handleSetCache}
              disabled={!customCacheKey || !customCacheValue}
            >
              Store in Cache
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleGetCache}
              disabled={!customCacheKey}
            >
              Retrieve from Cache
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={handleClearCache}
              disabled={!customCacheKey}
            >
              Clear from Cache
            </Button>
          </Box>
          
          {manualCacheResult && (
            <Alert 
              severity={manualCacheResult.success ? "success" : "error"} 
              sx={{ mt: 3 }}
              icon={manualCacheResult.success ? <SuccessIcon /> : undefined}
            >
              {manualCacheResult.message}
            </Alert>
          )}
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default ClientDataCachingDemo; 