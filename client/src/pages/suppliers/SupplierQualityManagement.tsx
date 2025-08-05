import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import QualityManagement from './components/QualityManagement';

/**
 * Page component that displays the Quality Management System for a supplier
 */
const SupplierQualityManagement: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/suppliers/${supplierId}`);
  };

  return (
    <Box>
      <PageHeader
        title="Supplier Quality Management System"
        subtitle="View and manage quality metrics, certifications, non-conformances and documentation"
        onBack={handleBack}
      />
      
      <QualityManagement />
    </Box>
  );
};

export default SupplierQualityManagement; 