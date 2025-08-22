/**
 * Progressive Loading Demo Page
 * 
 * This page demonstrates the various progressive loading strategies
 * implemented in RF036.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Divider,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress } from
'@mui/material';
import {
  ProgressiveImage,
  useProgressiveDataLoading,
  ProgressiveRender,
  useCriticalPathRendering } from
'../utils/progressiveLoading';
import { LoadPriority } from '../utils/codeSplittingConfig';
import ProgressiveTable from '../components/ui-library/molecules/ProgressiveTable';
import ProgressiveForm from '../components/ui-library/molecules/ProgressiveForm';

// Demo data types
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  thumbnail: string;
  rating: number;
  stock: number;
}

// Mock data fetching function with artificial delay
const fetchProducts = (): Promise<Product[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
      {
        id: 1,
        name: 'Aerospace Component A',
        description: 'High-quality aerospace component for commercial aircraft',
        price: 1299.99,
        category: 'Components',
        image: 'https://via.placeholder.com/600/92c952',
        thumbnail: 'https://via.placeholder.com/150/92c952',
        rating: 4.5,
        stock: 10
      },
      {
        id: 2,
        name: 'Inspection Tool B',
        description: 'Precision inspection tool for aircraft maintenance',
        price: 799.99,
        category: 'Tools',
        image: 'https://via.placeholder.com/600/771796',
        thumbnail: 'https://via.placeholder.com/150/771796',
        rating: 4.2,
        stock: 15
      },
      {
        id: 3,
        name: 'Maintenance Kit C',
        description: 'Complete maintenance kit for routine aircraft servicing',
        price: 2499.99,
        category: 'Maintenance',
        image: 'https://via.placeholder.com/600/24f355',
        thumbnail: 'https://via.placeholder.com/150/24f355',
        rating: 4.8,
        stock: 5
      },
      {
        id: 4,
        name: 'Safety Equipment D',
        description: 'Essential safety equipment for aerospace professionals',
        price: 349.99,
        category: 'Safety',
        image: 'https://via.placeholder.com/600/d32776',
        thumbnail: 'https://via.placeholder.com/150/d32776',
        rating: 4.0,
        stock: 20
      },
      {
        id: 5,
        name: 'Diagnostic System E',
        description: 'Advanced diagnostic system for aircraft troubleshooting',
        price: 4999.99,
        category: 'Diagnostics',
        image: 'https://via.placeholder.com/600/f66b97',
        thumbnail: 'https://via.placeholder.com/150/f66b97',
        rating: 4.9,
        stock: 3
      }]
      );
    }, 1500);
  });
};

// Skeleton component for product cards
const ProductCardSkeleton: React.FC = () =>
<Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ height: 140, bgcolor: 'grey.300' }} />
    <CardContent>
      <Box sx={{ height: 20, width: '80%', bgcolor: 'grey.300', mb: 1 }} />
      <Box sx={{ height: 40, bgcolor: 'grey.300', mb: 1 }} />
      <Box sx={{ height: 20, width: '40%', bgcolor: 'grey.300' }} />
    </CardContent>
  </Card>;


// Low-fidelity component for product cards
const ProductCardLowFidelity: React.FC<{product: Product;}> = ({ product }) =>
<Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardMedia
    sx={{ height: 140 }}
    image={product.thumbnail}
    title={product.name} />

    <CardContent>
      <Typography gutterBottom variant="h6" component="div">
        {product.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {product.category}
      </Typography>
      <Typography variant="h6" color="primary">
        ${product.price.toFixed(2)}
      </Typography>
    </CardContent>
  </Card>;


// Full-fidelity component for product cards
const ProductCardFullFidelity: React.FC<{product: Product;}> = ({ product }) =>
<Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardMedia
    sx={{ height: 140 }}
    image={product.image}
    title={product.name} />

    <CardContent>
      <Typography gutterBottom variant="h6" component="div">
        {product.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {product.description}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="primary">
          ${product.price.toFixed(2)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rating: {product.rating}/5 • Stock: {product.stock}
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" size="small" fullWidth>
          Add to Cart
        </Button>
      </Box>
    </CardContent>
  </Card>;


// Demo tabs
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
      id={`progressive-loading-tabpanel-${index}`}
      aria-labelledby={`progressive-loading-tab-${index}`}
      {...other}>

      {value === index &&
      <Box sx={{ p: 3 }}>
          {children}
        </Box>
      }
    </div>);

}

function a11yProps(index: number) {
  return {
    id: `progressive-loading-tab-${index}`,
    'aria-controls': `progressive-loading-tabpanel-${index}`
  };
}

/**
 * Progressive Loading Demo Page
 */
export default function ProgressiveLoadingDemo() {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  // Critical path rendering demo
  const criticalPathLoaded = useCriticalPathRendering([
  {
    importFn: () => import('../components/ui-library/molecules/ProgressiveTable'),
    key: 'ProgressiveTable',
    priority: LoadPriority.CRITICAL
  },
  {
    importFn: () => import('../components/ui-library/molecules/ProgressiveForm'),
    key: 'ProgressiveForm',
    priority: LoadPriority.HIGH
  }]
  );

  // Progressive data loading demo
  const {
    data: products,
    loading: productsLoading,
    progress: productsLoadingProgress
  } = useProgressiveDataLoading<Product[]>(
    fetchProducts,
    {
      initialData: [],
      streamingFn: (_, fullData) => {
        // Create intermediate steps with partial data
        return [
        fullData.slice(0, 1),
        fullData.slice(0, 3),
        fullData.slice(0, 4)];

      },
      streamInterval: 500
    }
  );

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Reset demo
  const handleReset = () => {
    setIsLoading(true);
    setResetKey((prev) => prev + 1);
    setTimeout(() => setIsLoading(false), 2000);
  };

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [resetKey]);

  // Table demo columns
  const tableColumns = [
  {
    id: 'id',
    label: 'ID',
    render: (product: Product) => product.id,
    priority: 'high' as const,
    width: '5%',
    align: 'left' as const
  },
  {
    id: 'name',
    label: 'Product Name',
    render: (product: Product) => product.name,
    priority: 'high' as const,
    width: '20%'
  },
  {
    id: 'category',
    label: 'Category',
    render: (product: Product) => product.category,
    priority: 'high' as const,
    width: '15%'
  },
  {
    id: 'price',
    label: 'Price',
    render: (product: Product) => `$${product.price.toFixed(2)}`,
    priority: 'medium' as const,
    width: '10%',
    align: 'right' as const
  },
  {
    id: 'description',
    label: 'Description',
    render: (product: Product) => product.description,
    priority: 'low' as const,
    width: '30%'
  },
  {
    id: 'stock',
    label: 'Stock',
    render: (product: Product) => product.stock,
    priority: 'medium' as const,
    width: '10%',
    align: 'right' as const
  },
  {
    id: 'rating',
    label: 'Rating',
    render: (product: Product) => `${product.rating}/5`,
    priority: 'low' as const,
    width: '10%',
    align: 'right' as const
  }];


  // Form demo fields
  const formFields = [
  {
    id: 'name',
    label: 'Product Name',
    component: TextField,
    priority: LoadPriority.CRITICAL,
    required: true,
    section: 'basic',
    validate: (value: string) => !value ? 'Name is required' : null
  },
  {
    id: 'category',
    label: 'Category',
    component: TextField,
    priority: LoadPriority.CRITICAL,
    required: true,
    section: 'basic',
    validate: (value: string) => !value ? 'Category is required' : null
  },
  {
    id: 'price',
    label: 'Price',
    component: TextField,
    props: { type: 'number', InputProps: { startAdornment: '$' } },
    priority: LoadPriority.HIGH,
    required: true,
    section: 'basic',
    validate: (value: string) => !value ? 'Price is required' : null
  },
  {
    id: 'description',
    label: 'Description',
    component: TextField,
    props: { multiline: true, rows: 4 },
    priority: LoadPriority.MEDIUM,
    section: 'details'
  },
  {
    id: 'stock',
    label: 'Stock',
    component: TextField,
    props: { type: 'number' },
    priority: LoadPriority.MEDIUM,
    section: 'details'
  },
  {
    id: 'rating',
    label: 'Rating',
    component: TextField,
    props: { type: 'number', inputProps: { min: 0, max: 5, step: 0.1 } },
    priority: LoadPriority.LOW,
    section: 'details'
  },
  {
    id: 'image',
    label: 'Image URL',
    component: TextField,
    priority: LoadPriority.LOW,
    section: 'media'
  },
  {
    id: 'thumbnail',
    label: 'Thumbnail URL',
    component: TextField,
    priority: LoadPriority.LOW,
    section: 'media'
  }];


  // Form sections
  const formSections = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Enter the basic product information',
    priority: LoadPriority.CRITICAL
  },
  {
    id: 'details',
    title: 'Product Details',
    description: 'Enter additional product details',
    priority: LoadPriority.MEDIUM
  },
  {
    id: 'media',
    title: 'Media',
    description: 'Enter product media URLs',
    priority: LoadPriority.LOW
  }];


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Progressive Loading Strategies Demo
        </Typography>
        <Typography variant="body1" paragraph>
          This page demonstrates the various progressive loading strategies implemented in RF036.
          Each tab showcases a different technique for improving perceived performance and user experience.
        </Typography>
        <Button variant="contained" onClick={handleReset}>
          Reset Demo
        </Button>
      </Paper>
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="progressive loading demos">
            <Tab label="Progressive Images" {...a11yProps(0)} />
            <Tab label="Progressive Tables" {...a11yProps(1)} />
            <Tab label="Progressive Forms" {...a11yProps(2)} />
            <Tab label="Progressive Components" {...a11yProps(3)} />
            <Tab label="Data Streaming" {...a11yProps(4)} />
          </Tabs>
        </Box>
        
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" gutterBottom>
            Progressive Image Loading
          </Typography>
          <Typography variant="body1" paragraph>
            This demo shows how images can be loaded progressively, starting with a placeholder,
            then a low-resolution version, and finally the full-resolution image.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Standard Loading</Typography>
                <Box sx={{ height: 300, bgcolor: 'background.paper' }}>
                  <img
                    src="https://via.placeholder.com/800x600/92c952"
                    alt="Standard loading"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Progressive Loading</Typography>
                <Box sx={{ height: 300, bgcolor: 'background.paper' }}>
                  <ProgressiveImage
                    src="https://via.placeholder.com/800x600/92c952"
                    lowResSrc="https://via.placeholder.com/80x60/92c952"
                    alt="Progressive loading"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Simulated Slow Network</Typography>
                <Box sx={{ height: 300, bgcolor: 'background.paper' }}>
                  <ProgressiveImage
                    key={resetKey}
                    src="https://via.placeholder.com/800x600/771796"
                    lowResSrc="https://via.placeholder.com/80x60/771796"
                    alt="Slow network simulation"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Progressive Table Loading
          </Typography>
          <Typography variant="body1" paragraph>
            This demo shows how tables can be loaded progressively, starting with a skeleton,
            then showing high-priority columns, and finally the complete table.
          </Typography>
          
          <ProgressiveTable
            key={resetKey}
            data={products.filter(Boolean)}
            columns={tableColumns}
            isLoading={isLoading || productsLoading}
            keyExtractor={(item) => item.id}
            rowsPerPage={5}
            initialLoadDelay={100}
            lowFidelityDuration={800}
            fullFidelityDelay={500} />

        </TabPanel>
        
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" gutterBottom>
            Progressive Form Loading
          </Typography>
          <Typography variant="body1" paragraph>
            This demo shows how forms can be loaded progressively, with fields appearing
            in order of priority and visibility.
          </Typography>
          
          <ProgressiveForm
            key={resetKey}
            fields={formFields}
            sections={formSections}
            isLoading={isLoading}
            title="Add New Product"
            description="Enter the product details below"
            onSubmit={(values) => console.log('Form submitted:', values)}
            initialValues={{
              name: '',
              category: '',
              price: '',
              description: '',
              stock: '',
              rating: '',
              image: '',
              thumbnail: ''
            }} />

        </TabPanel>
        
        
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" gutterBottom>
            Progressive Component Rendering
          </Typography>
          <Typography variant="body1" paragraph>
            This demo shows how components can be rendered progressively, starting with a skeleton,
            then a low-fidelity version, and finally the full component.
          </Typography>
          
          <Grid container spacing={3}>
            {products.filter(Boolean).map((product: any) =>
            <Grid item key={product.id} xs={12} sm={6} md={4}>
                <ProgressiveRender
                skeletonComponent={ProductCardSkeleton}
                lowFidelityComponent={ProductCardLowFidelity}
                fullComponent={ProductCardFullFidelity}
                componentProps={{ product }}
                config={{
                  initialDelay: 100,
                  minStageDuration: {
                    skeleton: 800,
                    'low-fidelity': 1000
                  },
                  stageDelays: {
                    'low-fidelity': 200,
                    full: 500
                  }
                }} />

              </Grid>
            )}
            
            {products.length === 0 && isLoading &&
            <>
                {[1, 2, 3].map((index: any) =>
              <Grid item key={index} xs={12} sm={6} md={4}>
                    <ProductCardSkeleton />
                  </Grid>
              )}
              </>
            }
          </Grid>
        </TabPanel>
        
        
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h5" gutterBottom>
            Progressive Data Streaming
          </Typography>
          <Typography variant="body1" paragraph>
            This demo shows how data can be streamed progressively, with partial data
            becoming available before the full dataset is loaded.
          </Typography>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                <CircularProgress variant="determinate" value={productsLoadingProgress} />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>

                  <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(productsLoadingProgress)}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1">
                {productsLoading ? 'Loading products...' : 'Products loaded'}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Products loaded: {products.length} / 5
            </Typography>
          </Paper>
          
          <Grid container spacing={3}>
            {products.filter(Boolean).map((product: any) =>
            <Grid item key={product.id} xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <ProgressiveImage
                      src={product.image}
                      lowResSrc={product.thumbnail}
                      alt={product.name}
                      style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />

                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <Typography variant="h6" gutterBottom>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {product.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" color="primary">
                          ${product.price.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Category: {product.category}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
            
            {productsLoading && products.length === 0 &&
            <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ width: '100%', aspectRatio: '1/1', bgcolor: 'grey.300' }} />
                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <Box sx={{ height: 28, width: '60%', bgcolor: 'grey.300', mb: 1 }} />
                      <Box sx={{ height: 60, bgcolor: 'grey.300', mb: 1 }} />
                      <Box sx={{ height: 28, width: '30%', bgcolor: 'grey.300' }} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            }
          </Grid>
        </TabPanel>
      </Box>
    </Container>);

}