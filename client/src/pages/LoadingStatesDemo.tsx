import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import SkeletonScreen, { SkeletonScreenVariant } from '../components/ui-library/molecules/SkeletonScreen';
import { useLoadingState } from '../hooks/useLoadingState';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`loading-states-tabpanel-${index}`}
      aria-labelledby={`loading-states-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `loading-states-tab-${index}`,
    'aria-controls': `loading-states-tabpanel-${index}`,
  };
}

/**
 * Demo page for loading states and skeleton screens
 */
const LoadingStatesDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>('card');
  const [count, setCount] = useState<any>(5);
  const [animation, setAnimation] = useState<any>('pulse');
  const [withHeader, setWithHeader] = useState<any>(true);
  const [withActions, setWithActions] = useState<any>(true);
  const [withImage, setWithImage] = useState<any>(true);
  const [withFooter, setWithFooter] = useState<any>(true);
  const [columns, setColumns] = useState<any>(3);
  
  // Loading state for demo buttons
  const loadingState1 = useLoadingState({ minLoadingTime: 1000 });
  const loadingState2 = useLoadingState({ minLoadingTime: 2000, autoReset: true });
  const loadingState3 = useLoadingState();
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Simulate loading for demo
  const simulateLoading = (loadingState: ReturnType<typeof useLoadingState>, delay: number = 2000, shouldSucceed: boolean = true) => {
    loadingState.setLoading();
    
    setTimeout(() => {
      if (shouldSucceed) {
        loadingState.setSuccess();
      } else {
        loadingState.setError(new Error('Simulated error'));
      }
    }, delay);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Loading States Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This page demonstrates the various loading state components and patterns available in AeroSuite.
        These components help improve perceived performance and user experience during loading operations.
      </Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="loading states tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Skeleton Screens" {...a11yProps(0)} />
          <Tab label="Loading States" {...a11yProps(1)} />
          <Tab label="Progressive Loading" {...a11yProps(2)} />
          <Tab label="Best Practices" {...a11yProps(3)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Skeleton Screen Components
            </Typography>
            <Typography variant="body2" paragraph>
              Skeleton screens provide a preview of the content layout before the actual content loads.
              They help reduce perceived loading time and improve user experience.
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="variant-select-label">Variant</InputLabel>
                    <Select
                      labelId="variant-select-label"
                      id="variant-select"
                      value={selectedVariant}
                      label="Variant"
                      onChange={(e) => setSelectedVariant(e.target.value as SkeletonScreenVariant)}
                    >
                      <MenuItem value="table">Table</MenuItem>
                      <MenuItem value="card">Card</MenuItem>
                      <MenuItem value="list">List</MenuItem>
                      <MenuItem value="grid">Grid</MenuItem>
                      <MenuItem value="detail">Detail View</MenuItem>
                      <MenuItem value="form">Form</MenuItem>
                      <MenuItem value="chart">Chart</MenuItem>
                      <MenuItem value="dashboard">Dashboard</MenuItem>
                      <MenuItem value="profile">Profile</MenuItem>
                      <MenuItem value="feed">Feed</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Count"
                    type="number"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    fullWidth
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1, max: 10 }}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="animation-select-label">Animation</InputLabel>
                    <Select
                      labelId="animation-select-label"
                      id="animation-select"
                      value={animation}
                      label="Animation"
                      onChange={(e) => setAnimation(e.target.value as 'pulse' | 'wave')}
                    >
                      <MenuItem value="pulse">Pulse</MenuItem>
                      <MenuItem value="wave">Wave</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Columns"
                    type="number"
                    value={columns}
                    onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                    fullWidth
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1, max: 6 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={withHeader} onChange={(e) => setWithHeader(e.target.checked)} />}
                      label="With Header"
                    />
                    <FormControlLabel
                      control={<Switch checked={withActions} onChange={(e) => setWithActions(e.target.checked)} />}
                      label="With Actions"
                    />
                    <FormControlLabel
                      control={<Switch checked={withImage} onChange={(e) => setWithImage(e.target.checked)} />}
                      label="With Image"
                    />
                    <FormControlLabel
                      control={<Switch checked={withFooter} onChange={(e) => setWithFooter(e.target.checked)} />}
                      label="With Footer"
                    />
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    onClick={() => setSelectedVariant(selectedVariant)}
                    sx={{ mb: 2 }}
                  >
                    Refresh Skeleton
                  </Button>
                </Grid>
              </Grid>
            </Paper>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} Skeleton Preview
              </Typography>
              
              <SkeletonScreen
                variant={selectedVariant}
                count={count}
                animation={animation}
                config={{
                  columns,
                  withHeader,
                  withActions,
                  withImage,
                  withFooter
                }}
              />
            </Box>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Common Skeleton Patterns
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Table Skeleton
                </Typography>
                <SkeletonScreen variant="table" count={3} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  List Skeleton
                </Typography>
                <SkeletonScreen variant="list" count={4} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Card Grid Skeleton
                </Typography>
                <SkeletonScreen variant="grid" count={6} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Form Skeleton
                </Typography>
                <SkeletonScreen variant="form" />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Loading State Management
            </Typography>
            <Typography variant="body2" paragraph>
              The useLoadingState hook provides a simple way to manage loading states in components.
              It supports different loading states, minimum loading times, and auto-reset functionality.
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Basic Loading" />
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      Basic loading state with minimum loading time of 1 second.
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        Current state: <strong>{loadingState1.state}</strong>
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="contained"
                      onClick={() => simulateLoading(loadingState1)}
                      disabled={loadingState1.isLoading}
                      fullWidth
                    >
                      {loadingState1.isLoading ? 'Loading...' : 'Start Loading'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Auto-Reset Loading" />
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      Loading state with auto-reset after 2 seconds.
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        Current state: <strong>{loadingState2.state}</strong>
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="contained"
                      onClick={() => simulateLoading(loadingState2)}
                      disabled={loadingState2.isLoading}
                      fullWidth
                    >
                      {loadingState2.isLoading ? 'Loading...' : 'Start Loading'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Error State" />
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      Loading state with error handling.
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        Current state: <strong>{loadingState3.state}</strong>
                      </Typography>
                      {loadingState3.error && (
                        <Typography variant="body2" color="error">
                          Error: {loadingState3.error.message}
                        </Typography>
                      )}
                    </Box>
                    
                    <Button
                      variant="contained"
                      onClick={() => simulateLoading(loadingState3, 1500, false)}
                      disabled={loadingState3.isLoading}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      {loadingState3.isLoading ? 'Loading...' : 'Trigger Error'}
                    </Button>
                    
                    {loadingState3.isError && (
                      <Button
                        variant="outlined"
                        onClick={loadingState3.reset}
                        fullWidth
                      >
                        Reset
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Using the useLoadingState Hook
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`// Import the hook
import { useLoadingState } from '../hooks/useLoadingState';

// Initialize with options
const { 
  state,
  isLoading,
  isSuccess,
  isError,
  error,
  setLoading,
  setSuccess,
  setError,
  reset,
  wrapAsync
} = useLoadingState({
  minLoadingTime: 1000,
  autoReset: true,
  resetDelay: 3000
});

// Use with async functions
const fetchData = async () => {
  try {
    setLoading();
    const data = await api.getData();
    setSuccess();
    return data;
  } catch (_err) {
    setError(err);
  }
};

// Or use the wrapAsync utility
const loadData = () => {
  wrapAsync(async () => {
    const data = await api.getData();
    return data;
  });
};`}
              </Typography>
            </Paper>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Progressive Loading
            </Typography>
            <Typography variant="body2" paragraph>
              Progressive loading improves perceived performance by showing content in stages,
              from low-fidelity placeholders to full content.
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Progressive Loading Stages" />
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        1. Initial (Optional)
                      </Typography>
                      <Typography variant="body2">
                        Minimal UI with just layout structure.
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        2. Skeleton
                      </Typography>
                      <Typography variant="body2">
                        Placeholder UI that resembles the final content.
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        3. Low-Fidelity (Optional)
                      </Typography>
                      <Typography variant="body2">
                        Partial content with minimal styling.
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        4. Full Content
                      </Typography>
                      <Typography variant="body2">
                        Complete content with full styling and interactivity.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Benefits" />
                  <CardContent>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Reduces perceived loading time
                        </Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Provides immediate feedback to users
                        </Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Prevents layout shifts during loading
                        </Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Improves user experience on slow connections
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography variant="body2">
                          Allows for prioritization of critical content
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Using the Progressive Loading Hook
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`// Import the hook
import { useProgressiveLoading } from '../utils/progressiveLoading';

// Define renderers for each stage
const renderers = {
  initial: (props) => <InitialLayout {...props} />,
  skeleton: (props) => <SkeletonScreen variant="card" {...props} />,
  'low-fidelity': (props) => <LowFidelityContent {...props} />,
  full: (props) => <FullContent {...props} />
};

// Use the hook with configuration
const [stage, renderContent, loadingState] = useProgressiveLoading(renderers, {
  initialDelay: 0,
  stageDelays: {
    skeleton: 100,
    'low-fidelity': 300,
    full: 200
  },
  minStageDuration: {
    skeleton: 500,
    'low-fidelity': 300
  }
});

// Render the content based on current stage
return renderContent(componentProps);`}
              </Typography>
            </Paper>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Loading State Best Practices
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Do's
                </Typography>
                
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Use skeleton screens</strong> that match the layout of the actual content
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Provide immediate feedback</strong> when a user action triggers loading
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Maintain layout stability</strong> by using placeholders with the same dimensions as the final content
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Use progressive loading</strong> for large content sections
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Prioritize above-the-fold content</strong> to load first
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      <strong>Provide clear error states</strong> with recovery options
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Don'ts
                </Typography>
                
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Avoid generic spinners</strong> that don't indicate progress or content structure
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Don't block the entire UI</strong> during loading operations
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Avoid layout shifts</strong> when content loads
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Don't use loading indicators</strong> for operations under 300ms
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Avoid multiple loading indicators</strong> in the same view
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      <strong>Don't leave users stranded</strong> in error states without recovery options
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>
              Performance Considerations
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Perceived Performance" />
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      Perceived performance is how fast a user thinks your application is, regardless of actual loading times.
                      Well-designed loading states can significantly improve perceived performance.
                    </Typography>
                    
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Show immediate feedback for user actions
                        </Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Use animation sparingly to indicate progress
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography variant="body2">
                          Progressively reveal content as it becomes available
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Optimistic UI Updates" />
                  <CardContent>
                    <Typography variant="body2" paragraph>
                      Optimistic UI updates assume that operations will succeed and update the UI immediately,
                      then reconcile if the operation fails. This creates a more responsive feel.
                    </Typography>
                    
                    <Box component="ul" sx={{ pl: 2 }}>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Update UI immediately on user action
                        </Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          Queue operations to be performed in the background
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography variant="body2">
                          Provide graceful recovery for failed operations
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default LoadingStatesDemo; 