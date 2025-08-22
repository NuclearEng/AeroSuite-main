import React from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CancelIcon from '@mui/icons-material/Cancel';
import SEO from '../../utils/seo';

/**
 * Payment Cancel Page
 * 
 * Displayed when a payment is cancelled
 * Task: TS367 - Payment gateway integration
 */
const PaymentCancelPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get session_id from URL if available
  const sessionId = searchParams.get('session_id');

  return (
    <Container maxWidth="sm">
      <SEO
        title="Payment Cancelled - AeroSuite"
        description="Your payment has been cancelled"
      />
      
      <Box sx={{ my: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <CancelIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Payment Cancelled
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your payment process was cancelled. No charges were made.
          </Typography>
          {sessionId && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Session ID: {sessionId}
            </Typography>
          )}
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => window.history.back()}
              fullWidth
            >
              Try Again
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/dashboard')}
              fullWidth
            >
              Return to Dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default PaymentCancelPage; 