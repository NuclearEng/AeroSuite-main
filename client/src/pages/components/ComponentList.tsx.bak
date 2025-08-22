import React from 'react';
import { Container, Typography, Button, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { useNavigate } from 'react-router-dom';

const ComponentList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <PageHeader
        title="Components"
        subtitle="Manage engineering components and track revisions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Components' }
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/components/create')}
          >
            Add Component
          </Button>
        }
      />

      <Alert severity="info">
        Component management features are being implemented. 
        The Component List view will be available soon.
      </Alert>
    </Container>
  );
};

export default ComponentList; 