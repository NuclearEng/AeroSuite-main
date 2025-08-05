import React from 'react';
import { Container, Typography, Button, Alert, Box } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { useNavigate } from 'react-router-dom';

const CreateComponent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <PageHeader
        title="Create Component"
        subtitle="Add a new component to the system"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Components', href: '/components' },
          { label: 'Create' }
        ]}
        onBack={() => navigate('/components')}
      />

      <Box mt={3}>
        <Alert severity="info">
          The Create Component form is being implemented and will be available soon.
        </Alert>
      </Box>
    </Container>
  );
};

export default CreateComponent; 