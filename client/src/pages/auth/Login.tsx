import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Alert } from
'@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  MarkEmailRead as MarkEmailReadIcon } from
'@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import TwoFactorVerification from '../../components/auth/TwoFactorVerification';
import EnhancedSSOLoginButtons from '../../components/auth/EnhancedSSOLoginButtons';
import AuthService from '../../services/auth.service';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Two-factor authentication state
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'app' | 'email' | 'sms'>('app');
  const [tempToken, setTempToken] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Email verification state
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailVerificationRequired(false);

    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const response = await AuthService.login({ email, password });

      // Check if 2FA is required
      if ('tempToken' in response) {
        // Store the temp token and show 2FA dialog
        setTempToken(response.tempToken);
        setTwoFactorMethod(response.twoFactorMethod);
        setShowTwoFactorDialog(true);
      } else {
        // Regular login success - redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.emailVerificationRequired) {
        setEmailVerificationRequired(true);
        setUnverifiedEmail(email);
      } else {
        setError(err.message || 'Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerify = async (code: string, useBackupCode: boolean) => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);

    try {
      await AuthService.verifyTwoFactorLogin({
        token: code,
        tempToken
      });

      // Login successful, close dialog and redirect
      setShowTwoFactorDialog(false);
      navigate('/dashboard');
    } catch (err: any) {
      setTwoFactorError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleResendVerification = () => {
    navigate('/resend-verification');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4
        }}>

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 700, mb: 3 }}>

          AeroSuite
        </Typography>

        {emailVerificationRequired ?
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            textAlign: 'center'
          }}>

            <MarkEmailReadIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Email Verification Required
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Your email address needs to be verified before you can log in.
            </Alert>
            <Typography variant="body1" paragraph>
              We've sent a verification link to <strong>{unverifiedEmail}</strong>.
              Please check your inbox and click the verification link.
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
              If you didn't receive the email, check your spam folder or request a new verification link.
            </Typography>
            <Button
            variant="contained"
            onClick={handleResendVerification}
            sx={{ mt: 2 }}>

              Resend Verification Email
            </Button>
            <Box sx={{ mt: 3 }}>
              <Link
              component={RouterLink}
              to="/login"
              variant="body2"
              onClick={() => setEmailVerificationRequired(false)}>

                Try another account
              </Link>
            </Box>
          </Paper> :

        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}>

            <Typography variant="h5" component="h2" gutterBottom align="center">
              Sign In
            </Typography>
            <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}>

              Enter your credentials to access your account
            </Typography>

            {error &&
          <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
          }

            <form onSubmit={handleSubmit}>
              <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              margin="normal"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading} />


              <TextField
              label="Password"
              variant="outlined"
              fullWidth
              margin="normal"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              InputProps={{
                endAdornment:
                <InputAdornment position="end">
                      <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading}>

                        {showPassword ?
                    <VisibilityOffIcon /> :

                    <VisibilityIcon />
                    }
                      </IconButton>
                    </InputAdornment>

              }} />


              <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                mt: 1
              }}>

                <FormControlLabel
                control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                  disabled={loading} />

                }
                label="Remember me" />

                <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                underline="hover">

                  Forgot password?
                </Link>
              </Box>

              <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 2, py: 1.2 }}
              disabled={loading}>

                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <EnhancedSSOLoginButtons
            onError={(errorMessage) => setError(errorMessage)}
            redirectUrl="/dashboard"
            showDivider={false} />


            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                underline="hover">

                  Sign up
                </Link>
              </Typography>
            </Box>
          </Paper>
        }

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 4, textAlign: 'center' }}>

          For demo, use: demo@example.com / password
        </Typography>
      </Box>
      
      
      <TwoFactorVerification
        open={showTwoFactorDialog}
        onClose={() => setShowTwoFactorDialog(false)}
        onVerify={handleTwoFactorVerify}
        method={twoFactorMethod}
        loading={twoFactorLoading}
        error={twoFactorError} />

    </Container>);

};

export default Login;