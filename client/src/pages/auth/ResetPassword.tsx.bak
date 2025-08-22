import React, { useState } from 'react';
import { Box, Typography, Container, Paper, Button, TextField, Link, Alert, IconButton, InputAdornment } from '@mui/material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import AuthService from '../../services/auth.service';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple validation
    if (!password || !confirmPassword) {
      setError('Please enter both password fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      setError('Invalid or expired reset token. Please request a new password reset link.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.resetPassword({ password, passwordConfirm: confirmPassword, token });
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Reset Password
          </Typography>
          
          {success ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              Password has been reset successfully! Redirecting to login...
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" align="center" paragraph>
                Enter your new password below
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {!token && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  Invalid or expired reset token. Please request a new password reset link.
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!token || success || loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!token || success || loading}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={!token || success || loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </Box>
            </>
          )}
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component={RouterLink} to="/auth/login" variant="body2">
              Back to Login
            </Link>
          </Box>
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          This is a demo application. Password reset is simulated.
        </Typography>
      </Box>
    </Container>
  );
};

export default ResetPassword; 