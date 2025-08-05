import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Code as CodeIcon,
  Speed as SpeedIcon,
  Image as ImageIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { PageHeader } from '../components/common';
import resourcePrioritization, {
  ResourceType,
  ResourcePriority,
  ResourceStrategy,
  ResourcePriorityQueue,
  preconnectToDomains
} from '../utils/resourcePrioritization';

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
      id={`resource-optimization-tabpanel-${index}`}
      aria-labelledby={`resource-optimization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Demo images with different sizes
const demoImages = [
  {
    url: 'https://via.placeholder.com/800x400',
    title: 'Critical Hero Image',
    priority: ResourcePriority.CRITICAL,
    size: '45KB'
  },
  {
    url: 'https://via.placeholder.com/400x300',
    title: 'High Priority Image',
    priority: ResourcePriority.HIGH,
    size: '22KB'
  },
  {
    url: 'https://via.placeholder.com/300x200',
    title: 'Medium Priority Image',
    priority: ResourcePriority.MEDIUM,
    size: '14KB'
  },
  {
    url: 'https://via.placeholder.com/200x200',
    title: 'Low Priority Image',
    priority: ResourcePriority.LOW,
    size: '8KB'
  },
  {
    url: 'https://via.placeholder.com/100x100',
    title: 'Low Priority Image',
    priority: ResourcePriority.LOW,
    size: '3KB'
  }
];

// Demo scripts to prioritize
const demoScripts = [
  {
    url: '/main.js',
    title: 'Main Application Bundle',
    priority: ResourcePriority.CRITICAL
  },
  {
    url: '/vendor.js',
    title: 'Vendor Bundle',
    priority: ResourcePriority.HIGH
  },
  {
    url: '/charts.js',
    title: 'Chart Library',
    priority: ResourcePriority.MEDIUM
  },
  {
    url: '/analytics.js',
    title: 'Analytics Script',
    priority: ResourcePriority.LOW
  }
];

const ResourcePrioritizationDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [domainUrl, setDomainUrl] = useState('https://example.com');
  const [preconnectStatus, setPreconnectStatus] = useState<string | null>(null);
  const [isImagePrioritized, setIsImagePrioritized] = useState<Record<string, boolean>>({});
  const [priorityQueue] = useState(() => new ResourcePriorityQueue());

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePreconnect = () => {
    const elements = preconnectToDomains([domainUrl]);
    setPreconnectStatus(elements.length > 0 
      ? `Successfully added preconnect hints for ${domainUrl}` 
      : 'Failed to add preconnect hints');
    setTimeout(() => setPreconnectStatus(null), 3000);
  };

  const prioritizeImage = (imageUrl: string, priority: ResourcePriority) => {
    // Find the image element by URL
    const imgElement = document.querySelector(`img[src="${imageUrl}"]`) as HTMLImageElement;
    if (imgElement) {
      resourcePrioritization.prioritizeImage(imgElement, priority);
      setIsImagePrioritized(prev => ({ ...prev, [imageUrl]: true }));
    }
  };

  const addToQueue = (url: string, type: ResourceType, priority: ResourcePriority) => {
    priorityQueue.add({
      url,
      type,
      strategy: ResourceStrategy.PRELOAD
    }, priority);
  };

  const processQueue = () => {
    priorityQueue.process();
  };

  // Auto-prioritize above-the-fold images on mount
  useEffect(() => {
    setTimeout(() => {
      resourcePrioritization.autoPrioritizeImages('.demo-images');
    }, 1000);
  }, []);

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Resource Prioritization Demo"
        subtitle="Demonstrate techniques for prioritizing critical resources"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Demo', href: '/demo' },
          { label: 'Resource Prioritization' }
        ]}
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Resource Prioritization Overview
        </Typography>
        <Typography paragraph>
          Resource prioritization is the practice of telling the browser which resources 
          are most important to load first. This improves perceived performance by ensuring 
          critical resources are loaded before less important ones.
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Preload" 
                subheader="Load critical resources early"
                avatar={<SpeedIcon color="primary" />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Preload tells the browser to start loading a resource as soon as possible,
                  regardless of when it's discovered in the HTML.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Prefetch" 
                subheader="Load resources for future navigation"
                avatar={<CodeIcon color="primary" />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Prefetch hints the browser to load resources that will be needed for the next
                  navigation, but at a lower priority than the current page.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Fetch Priority" 
                subheader="Explicitly set resource importance"
                avatar={<BarChartIcon color="primary" />}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  FetchPriority gives developers explicit control over resource loading
                  priority, allowing fine-grained control over the loading sequence.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        aria-label="resource prioritization demo tabs"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Image Prioritization" icon={<ImageIcon />} iconPosition="start" />
        <Tab label="Preconnect" icon={<SpeedIcon />} iconPosition="start" />
        <Tab label="Priority Queue" icon={<BarChartIcon />} iconPosition="start" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Image Prioritization
        </Typography>
        <Typography paragraph>
          Different images have different priorities. Above-the-fold images should load first,
          while images far down the page can load later.
        </Typography>

        <Grid container spacing={3} className="demo-images">
          {demoImages.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                  <img 
                    src={image.url} 
                    alt={image.title}
                    width="100%"
                    style={{ display: 'block' }}
                  />
                  {isImagePrioritized[image.url] && (
                    <Chip 
                      label={`Priority: ${image.priority}`}
                      color="primary"
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        bottom: 8, 
                        right: 8,
                        bgcolor: 'rgba(25, 118, 210, 0.8)'
                      }}
                    />
                  )}
                </Box>
                <CardContent>
                  <Typography variant="h6">{image.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Size: {image.size}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => prioritizeImage(image.url, image.priority)}
                    disabled={isImagePrioritized[image.url]}
                  >
                    Prioritize ({image.priority})
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Preconnect to External Domains
        </Typography>
        <Typography paragraph>
          Preconnect establishes early connections to important third-party domains,
          eliminating connection latency when resources are needed.
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                label="Domain URL"
                value={domainUrl}
                onChange={(e) => setDomainUrl(e.target.value)}
                fullWidth
                helperText="Enter a domain to preconnect to (e.g., https://fonts.googleapis.com)"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained" 
                onClick={handlePreconnect}
                fullWidth
              >
                Add Preconnect Hint
              </Button>
            </Grid>
          </Grid>

          {preconnectStatus && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {preconnectStatus}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom>
            Example Preconnect Tags Generated:
          </Typography>
          <Box component="pre" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, overflow: 'auto' }}>
            {`<link rel="preconnect" href="${domainUrl}" crossorigin="anonymous" />
<link rel="dns-prefetch" href="${domainUrl}" />`}
          </Box>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Priority Queue
        </Typography>
        <Typography paragraph>
          The priority queue ensures resources are loaded in the optimal order based on their importance.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Script Resources
              </Typography>
              <List>
                {demoScripts.map((script, index) => (
                  <ListItem key={index} divider={index < demoScripts.length - 1}>
                    <ListItemText
                      primary={script.title}
                      secondary={script.url}
                    />
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => addToQueue(script.url, ResourceType.SCRIPT, script.priority)}
                    >
                      Add to Queue
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" gutterBottom>
                Queue Processing
              </Typography>
              <Typography paragraph>
                Adding resources to the queue will organize them by priority.
                When processed:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Critical/High priority: Loaded immediately" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Medium priority: Loaded after a short delay" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Low priority: Loaded during browser idle time" />
                </ListItem>
              </List>
              <Button 
                variant="contained" 
                color="primary"
                sx={{ mt: 'auto' }}
                onClick={processQueue}
              >
                Process Queue
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default ResourcePrioritizationDemo; 