import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Tab,
  Tabs,
  Divider,
  Chip,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Visibility as ViewIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
  Layers as LayersIcon
} from '@mui/icons-material';
import NetworkIcon from '@mui/icons-material/AccountTree';
import { PageHeader } from '../../components/common';
import useComponentRevisions from '../../hooks/useComponentRevisions';
import RevisionHistory from './RevisionHistory';
import DocumentationManager from './DocumentationManager';

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
      id={`component-tabpanel-${index}`}
      aria-labelledby={`component-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ComponentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tabValue, setTabValue] = React.useState(0);
  const { component, loading, error } = useComponentRevisions(id);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading && !component) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!component) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          Component not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title={component.name}
        subtitle={`Part Number: ${component.partNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Components', href: '/components' },
          { label: component.name }
        ]}
        onBack={() => navigate('/components')}
        actions={
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            href={`/components/${id}/edit`}
          >
            Edit Component
          </Button>
        }
      />

      <Box mb={3}>
        <Chip 
          label={component.status} 
          color={
            component.status === 'active' 
              ? 'success' 
              : component.status === 'in-development' 
                ? 'info' 
                : 'default'
          }
          variant="outlined"
        />
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="component details tabs"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          label="Overview" 
          icon={<DescriptionIcon />} 
          iconPosition="start" 
          id="component-tab-0" 
        />
        <Tab 
          label="Revisions" 
          icon={<HistoryIcon />} 
          iconPosition="start" 
          id="component-tab-1" 
        />
        <Tab 
          label="Documentation" 
          icon={<LayersIcon />} 
          iconPosition="start" 
          id="component-tab-2" 
        />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography paragraph>
                {component.description || 'No description provided.'}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Part Number
                  </Typography>
                  <Typography variant="body1">
                    {component.partNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {component.category}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Version
                  </Typography>
                  <Typography variant="body1">
                    {component.currentVersion}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    {component.status}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(component.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {new Date(component.updatedAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => setTabValue(1)}
                >
                  View Revision History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LayersIcon />}
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => setTabValue(2)}
                >
                  View Documentation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<NetworkIcon />}
                  fullWidth
                  onClick={() => navigate(`/components/relationships/${id}`)}
                >
                  View Relationships
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  fullWidth
                >
                  View Related Components
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          {id && <RevisionHistory componentId={id} />}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          {id && <DocumentationManager componentId={id} />}
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default ComponentDetail; 