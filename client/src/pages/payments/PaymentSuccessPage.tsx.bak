import React, { useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SEO from '../../utils/seo';

/**
 * Payment Success Page
 * 
 * Displayed after a successful payment
 * Task: TS367 - Payment gateway integration
 */
const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = React.useState(true);
  
  // Get session_id from URL if available
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate checking payment status
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Container maxWidth="sm">
      <SEO
        title="Payment Successful - AeroSuite"
        description="Your payment has been processed successfully"
      />
      
      <Box sx={{ my: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6">Confirming your payment...</Typography>
            </Box>
          ) : (
            <>
              <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Payment Successful
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Thank you! Your payment has been processed successfully.
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
                  onClick={() => navigate('/payments')}
                  fullWidth
                >
                  View Payment History
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/dashboard')}
                  fullWidth
                >
                  Return to Dashboard
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default PaymentSuccessPage; 