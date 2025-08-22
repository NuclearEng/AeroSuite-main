import React from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import ComponentRelationshipGraph from '../../components/components/ComponentRelationshipGraph';

const ComponentRelationshipVisualization: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Component Relationship Visualization"
        subtitle="View and explore component dependencies and relationships"
        breadcrumbs={[
          { label: 'Components', href: '/components' },
          { label: id ? 'Component Details' : 'Relationship Visualization', href: id ? `/components/${id}` : '/components/relationships' },
          { label: 'Relationship Visualization' }
        ]}
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(id ? `/components/${id}` : '/components')}
          >
            Back
          </Button>
        }
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          This visualization shows the relationships between components in the system. Components are represented as nodes, and
          their relationships are shown as connecting lines. You can:
        </Typography>
        
        <Box component="ul" sx={{ pl: 4 }}>
          <Typography component="li" variant="body1">
            Filter by component type or relationship type
          </Typography>
          <Typography component="li" variant="body1">
            Drag nodes to reposition them
          </Typography>
          <Typography component="li" variant="body1">
            Hover over nodes to see detailed information
          </Typography>
          <Typography component="li" variant="body1">
            Toggle labels on/off
          </Typography>
          <Typography component="li" variant="body1">
            Zoom in/out with mouse wheel
          </Typography>
        </Box>
      </Paper>

      <ComponentRelationshipGraph 
        componentId={id} 
        showFilters={true}
        height={700}
      />
    </Container>
  );
};

export default ComponentRelationshipVisualization; 