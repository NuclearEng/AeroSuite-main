import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Link
} from '@mui/material';
import { MarkEmailRead as MarkEmailReadIcon, Error as ErrorIcon } from '@mui/icons-material';
import AuthService from '../../services/auth.service';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setError('Verification token is missing');
          setLoading(false);
          return;
        }

        const response = await AuthService.verifyEmail(token);
        setSuccess(true);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to verify email address');
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          AeroSuite
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%', mt: 2, textAlign: 'center' }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6">Verifying your email address...</Typography>
            </Box>
          ) : success ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <MarkEmailReadIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>Email Verified Successfully!</Typography>
              <Typography variant="body1" paragraph color="text.secondary">
                Your email address has been successfully verified. You can now log in to your account.
              </Typography>
                              <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/auth/login')}
                  sx={{ mt: 2 }}
                >
                  Log In
                </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>Verification Failed</Typography>
              <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
                {error}
              </Alert>
              <Typography variant="body1" paragraph>
                The verification link may have expired or is invalid.
              </Typography>
                              <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/auth/resend-verification"
                  sx={{ mt: 2 }}
                >
                  Resend Verification Email
                </Button>
            </Box>
          )}
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Need help? <Link component={RouterLink} to="/contact">Contact Support</Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default VerifyEmail; 