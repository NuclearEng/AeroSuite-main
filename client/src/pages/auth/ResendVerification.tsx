import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Link
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import AuthService from '../../services/auth.service';

const ResendVerification: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // This function will need to be added to the auth service
      await AuthService.resendVerificationEmail({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          AeroSuite
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%', mt: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <EmailIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography component="h2" variant="h5" gutterBottom>
              Resend Verification Email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your email address below and we'll send you a new verification link.
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Verification email sent successfully! Please check your inbox.
              </Alert>
              <Typography variant="body2" paragraph>
                If you don't receive the email within a few minutes, please check your spam folder.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Return to Login
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !email}
              >
                {loading ? <CircularProgress size={24} /> : 'Resend Verification Email'}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Remember your password?{' '}
                  <Link component={RouterLink} to="/login" variant="body2">
                    Back to Login
                  </Link>
                </Typography>
              </Box>
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

export default ResendVerification; 