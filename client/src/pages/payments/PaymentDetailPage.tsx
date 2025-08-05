import React from 'react';
import { Container, Typography, Box, Button, Breadcrumbs } from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PaymentDetails from '../../components/payments/PaymentDetails';
import SEO from '../../utils/seo';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/**
 * Payment Detail Page
 * 
 * Page for viewing detailed information about a specific payment
 * Task: TS367 - Payment gateway integration
 */
const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h5" color="error">Payment ID is required</Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/payments')}
          sx={{ mt: 2 }}
        >
          Back to Payments
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <SEO
        title="Payment Details - AeroSuite"
        description="View details of your payment"
      />
      
      <Box sx={{ my: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            Dashboard
          </Link>
          <Link to="/payments" style={{ textDecoration: 'none', color: 'inherit' }}>
            Payments
          </Link>
          <Typography color="text.primary">Payment Details</Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Payment Details
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/payments')}
          >
            Back to Payments
          </Button>
        </Box>
        
        <PaymentDetails 
          paymentId={id} 
          onRefund={() => {
            // Optionally show a success message
          }}
        />
      </Box>
    </Container>
  );
};

export default PaymentDetailPage; 