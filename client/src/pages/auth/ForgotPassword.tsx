import React, { useState } from 'react';
import { Box, Typography, Container, Paper, Button, TextField, Link, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          AeroSuite
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%', mt: 2 }}>
          {!submitted ? (
            <>
              <Typography component="h2" variant="h5" align="center" gutterBottom>
                Forgot Password
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" paragraph>
                Enter your email address and we'll send you a link to reset your password
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Send Reset Link
                </Button>
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link 
                    component={RouterLink} 
                    to="/login" 
                    variant="body2"
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Back to Login
                  </Link>
                </Box>
              </Box>
            </>
          ) : (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                Reset password link has been sent to your email address
              </Alert>
              <Typography variant="body1" paragraph>
                We've sent an email to <strong>{email}</strong> with instructions to reset your password.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                If you don't receive an email within a few minutes, please check your spam folder or try again.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
              >
                Return to Login
              </Button>
            </>
          )}
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          This is a demo application. No emails are actually sent.
        </Typography>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 