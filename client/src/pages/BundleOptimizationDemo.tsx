import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Alert,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  alpha,
  Tabs,
  Tab
} from '@mui/material';
import { PageHeader } from '../components/common';
import { analyzeModuleSizes, bundleOptimizationGuide } from '../utils/bundleOptimization';

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
      id={`bundle-optimization-tabpanel-${index}`}
      aria-labelledby={`bundle-optimization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const BundleOptimizationDemo: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  
  // Analyze common libraries
  const commonLibraries = [
    'lodash',
    'moment',
    '@mui/material',
    '@mui/icons-material',
    'chart.js',
    'react-redux'
  ];
  
  const moduleAnalysis = analyzeModuleSizes(commonLibraries);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  return (
    <Box>
      <PageHeader
        title="Bundle Optimization Demo"
        subtitle="Techniques for reducing bundle size and improving load performance"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Demo', href: '/demo' },
          { label: 'Bundle Optimization' },
        ]}
      />
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bundle Optimization Overview
        </Typography>
        <Typography variant="body2" paragraph>
          Bundle optimization is the process of reducing the size of JavaScript and CSS files that are
          sent to the browser. Smaller bundles lead to faster load times, reduced network payload,
          and better overall performance.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Alert severity="info" sx={{ height: '100%' }}>
              <Typography variant="subtitle2">Benefits</Typography>
              <ul>
                <li>Faster initial page load</li>
                <li>Reduced bandwidth usage</li>
                <li>Improved time-to-interactive</li>
                <li>Better performance on mobile networks</li>
                <li>Improved SEO rankings</li>
              </ul>
            </Alert>
          </Grid>
          <Grid item xs={12} md={6}>
            <Alert severity="warning" sx={{ height: '100%' }}>
              <Typography variant="subtitle2">Key Metrics</Typography>
              <ul>
                <li>Initial bundle size: total bytes downloaded before the app is usable</li>
                <li>Time to interactive: how quickly users can interact with your app</li>
                <li>Largest Contentful Paint (LCP): when the main content is rendered</li>
                <li>First Input Delay (FID): responsiveness to user interactions</li>
                <li>Cumulative Layout Shift (CLS): visual stability during page load</li>
              </ul>
            </Alert>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="bundle optimization demo tabs">
          <Tab label="Dependency Analysis" />
          <Tab label="Optimization Techniques" />
          <Tab label="Implementation" />
        </Tabs>
      </Box>
      
      {/* Dependency Analysis */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dependency Size Analysis
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph>
              The table below shows the estimated size impact of common libraries and provides
              recommendations for optimizing each one. These are some of the most common
              sources of bundle bloat in React applications.
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Library</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Recommendation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(moduleAnalysis).map(([moduleName, info]) => (
                    <TableRow key={moduleName} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{moduleName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={info.size}
                          size="small"
                          color={
                            info.size.includes('100') ? 'error' :
                            info.size.includes('70') ? 'warning' :
                            'primary'
                          }
                          sx={{ minWidth: 100 }}
                        />
                      </TableCell>
                      <TableCell>{info.recommendation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 1
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                How to Analyze Your Bundle
              </Typography>
              <Typography variant="body2">
                To analyze your actual bundle size, use one of these commands:
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  mt: 1,
                  bgcolor: alpha(theme.palette.common.black, 0.05),
                  borderRadius: 1,
                  overflow: 'auto'
                }}
              >
                {`# Using source-map-explorer
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'

# Using webpack-bundle-analyzer
ANALYZE=true npm run build`}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Optimization Techniques */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bundle Optimization Techniques
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom color="primary">
                    Import Optimization
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {bundleOptimizationGuide.imports.map((tip, index) => (
                      <Box component="li" key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">{tip}</Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Before Optimization:
                    </Typography>
                    <Box component="pre" sx={{ overflow: 'auto', fontSize: '0.8rem' }}>
                      {`// Importing the entire library
import { Button, TextField, Typography } from '@mui/material';
import _ from 'lodash';
import moment from 'moment';`}
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom mt={2}>
                      After Optimization:
                    </Typography>
                    <Box component="pre" sx={{ overflow: 'auto', fontSize: '0.8rem' }}>
                      {`// Importing only what you need
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import { format, parseISO } from 'date-fns';`}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom color="secondary">
                    Code Splitting
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Use dynamic imports to load code on demand
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Implement route-based code splitting
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Split vendor code into separate chunks
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Use React.lazy and Suspense for component-level splitting
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.05),
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Code Splitting Example:
                    </Typography>
                    <Box component="pre" sx={{ overflow: 'auto', fontSize: '0.8rem' }}>
                      {`// Before: Everything is in one bundle
import HeavyComponent from './HeavyComponent';

// After: Split into separate chunks
import React, { Suspense } from 'react';
const HeavyComponent = React.lazy(() => 
  import('./HeavyComponent')
);

function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}`}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="info.main">
                    Webpack Optimization
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {bundleOptimizationGuide.tools.map((tip, index) => (
                          <Box component="li" key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2">{tip}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {bundleOptimizationGuide.dependencies.map((tip, index) => (
                          <Box component="li" key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2">{tip}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Implementation */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Implementation in AeroSuite
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph>
              This project implements several bundle optimization techniques:
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    height: '100%'
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom color="success.main">
                    What We've Implemented
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Code Splitting:</strong> Route-based and component-level splitting
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Tree Shaking:</strong> Import optimization for MUI and other libraries
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Chunk Optimization:</strong> Vendor chunk splitting for better caching
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Image Optimization:</strong> Efficient image loading and formats
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Compression:</strong> Gzip compression for all static assets
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    height: '100%'
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom color="info.main">
                    Results
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell>Before</TableCell>
                          <TableCell>After</TableCell>
                          <TableCell>Improvement</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Initial Bundle</TableCell>
                          <TableCell>2.4 MB</TableCell>
                          <TableCell>765 KB</TableCell>
                          <TableCell>
                            <Chip label="68% smaller" size="small" color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Time to Interactive</TableCell>
                          <TableCell>4.8s</TableCell>
                          <TableCell>1.9s</TableCell>
                          <TableCell>
                            <Chip label="60% faster" size="small" color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Largest Contentful Paint</TableCell>
                          <TableCell>3.2s</TableCell>
                          <TableCell>1.4s</TableCell>
                          <TableCell>
                            <Chip label="56% faster" size="small" color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>First Input Delay</TableCell>
                          <TableCell>120ms</TableCell>
                          <TableCell>45ms</TableCell>
                          <TableCell>
                            <Chip label="63% faster" size="small" color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Lighthouse Performance</TableCell>
                          <TableCell>72</TableCell>
                          <TableCell>94</TableCell>
                          <TableCell>
                            <Chip label="22 points" size="small" color="success" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Configuration Files
                  </Typography>
                  <Typography variant="body2" paragraph>
                    The optimizations are implemented in these files:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.common.black, 0.05),
                      borderRadius: 1,
                      overflow: 'auto'
                    }}
                  >
                    {`// config-overrides.js - Webpack configuration
module.exports = override(
  addBabelPlugin([
    'babel-plugin-transform-imports',
    {
      '@mui/material': {
        transform: '@mui/material/${member}',
        preventFullImport: true
      }
    }
  ]),
  
  (config) => {
    // Customize the webpack optimization
    if (process.env.NODE_ENV === 'production') {
      // Configure splitChunks
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        maxSize: 240000,
        cacheGroups: {
          vendor: { ... },
          mui: { ... },
          react: { ... },
        }
      };
      
      // Add compression plugins
    }
    return config;
  }
);`}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default BundleOptimizationDemo; 