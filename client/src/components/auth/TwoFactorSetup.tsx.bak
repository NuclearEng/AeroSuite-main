import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider } from
'@mui/material';
import {
  PhoneAndroid as PhoneIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon,
  Lock as LockIcon,
  Security as SecurityIcon } from
'@mui/icons-material';

// API services
import AuthService from '../../services/auth.service';

const steps = ['Select Method', 'Setup', 'Verify', 'Backup Codes'];

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [method, setMethod] = useState<'app' | 'email' | 'sms'>('app');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup data
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(event.target.value as 'app' | 'email' | 'sms');
  };

  const handleSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.setupTwoFactor(method);

      if (method === 'app') {
        setQrCode(response.qrCode || null);
        setSecret(response.secret || null);
      }

      handleNext();
    } catch (err: any) {
      setError(err.message || 'Failed to setup two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.verifyTwoFactor(verificationCode);
      setBackupCodes(response.backupCodes);
      handleNext();
    } catch (err: any) {
      setError(err.message || 'Failed to verify two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const RenderMethodSelection = () =>
  <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Choose Authentication Method
      </Typography>
      
      <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
        <RadioGroup value={method} onChange={handleMethodChange}>
          <Paper variant="outlined" sx={{ mb: 2, p: 2, border: method === 'app' ? '2px solid' : '1px solid', borderColor: method === 'app' ? 'primary.main' : 'divider' }}>
            <FormControlLabel
            value="app"
            control={<Radio />}
            label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <QrCodeIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle1">Authenticator App</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use an app like Google Authenticator, Authy, or Microsoft Authenticator
                    </Typography>
                  </Box>
                  <Chip
                label="Recommended"
                color="primary"
                size="small"
                sx={{ ml: 2, display: { xs: 'none', sm: 'flex' } }} />

                </Box>
            } />

          </Paper>
          
          <Paper variant="outlined" sx={{ mb: 2, p: 2, border: method === 'email' ? '2px solid' : '1px solid', borderColor: method === 'email' ? 'primary.main' : 'divider' }}>
            <FormControlLabel
            value="email"
            control={<Radio />}
            label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle1">Email</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive verification codes via email
                    </Typography>
                  </Box>
                </Box>
            } />

          </Paper>
          
          <Paper variant="outlined" sx={{ p: 2, border: method === 'sms' ? '2px solid' : '1px solid', borderColor: method === 'sms' ? 'primary.main' : 'divider' }}>
            <FormControlLabel
            value="sms"
            control={<Radio />}
            label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle1">SMS</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive verification codes via text message
                    </Typography>
                  </Box>
                </Box>
            } />

          </Paper>
        </RadioGroup>
      </FormControl>
    </Box>;


  const RenderSetup = () => {
    if (method === 'app') {
      return (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Set Up Authenticator App
          </Typography>
          
          <Typography variant="body1" paragraph>
            1. Install an authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator)
          </Typography>
          
          <Typography variant="body1" paragraph>
            2. Scan this QR code with your authenticator app
          </Typography>
          
          {qrCode &&
          <Box sx={{ mt: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
              <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
            </Box>
          }
          
          <Typography variant="body1" paragraph>
            3. If you can't scan the code, enter this setup key manually:
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                display: 'inline-block',
                p: 2,
                letterSpacing: 1,
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>

              {secret}
            </Paper>
          </Box>
        </Box>);

    } else if (method === 'email') {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Email Authentication
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            A verification code has been sent to your email address. You'll need to enter this code in the next step.
          </Alert>
          
          <Typography variant="body1">
            With email authentication, you'll receive a unique code via email each time you log in.
          </Typography>
        </Box>);

    } else {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            SMS Authentication
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            A verification code has been sent to your phone. You'll need to enter this code in the next step.
          </Alert>
          
          <Typography variant="body1">
            With SMS authentication, you'll receive a unique code via text message each time you log in.
          </Typography>
        </Box>);

    }
  };

  const RenderVerification = () =>
  <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Verify {method === 'app' ? 'Authenticator App' : method === 'email' ? 'Email' : 'SMS'}
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        {method === 'app' ?
      'Enter the 6-digit code from your authenticator app to verify setup.' :
      method === 'email' ?
      'Enter the verification code sent to your email.' :
      'Enter the verification code sent to your phone.'}
      </Typography>
      
      <TextField
      label="Verification Code"
      variant="outlined"
      fullWidth
      value={verificationCode}
      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
      placeholder="123456"
      inputProps={{
        maxLength: 6,
        inputMode: 'numeric',
        pattern: '[0-9]*'
      }}
      autoFocus />

    </Box>;


  const RenderBackupCodes = () =>
  <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
        Backup Codes
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Important:</strong> Store these backup codes in a safe place. They allow you to log in if you lose access to your authentication device.
        </Typography>
      </Alert>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Each code can only be used once. After using a backup code, it will become invalid.
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {backupCodes.map((code, index) =>
      <Grid item xs={6} sm={4} key={index}>
            <Card variant="outlined">
              <CardContent sx={{ py: 1, px: 2, textAlign: 'center', fontFamily: 'monospace' }}>
                {code}
              </CardContent>
            </Card>
          </Grid>
      )}
      </Grid>
      
      <Typography variant="body2" color="text.secondary">
        Two-factor authentication is now enabled for your account.
      </Typography>
    </Box>;


  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return RenderMethodSelection();
      case 1:
        return RenderSetup();
      case 2:
        return RenderVerification();
      case 3:
        return RenderBackupCodes();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">Two-Factor Authentication Setup</Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) =>
        <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        )}
      </Stepper>
      
      {error &&
      <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      }
      
      {getStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={activeStep === 0 ? onCancel : handleBack}
          disabled={loading}>

          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button
          variant="contained"
          onClick={
          activeStep === 0 ? handleSetup :
          activeStep === 1 ? handleNext :
          activeStep === 2 ? handleVerify :
          handleComplete
          }
          disabled={loading || activeStep === 2 && verificationCode.length !== 6}
          startIcon={loading ? <CircularProgress size={20} /> : null}>

          {loading ? 'Processing...' :
          activeStep === steps.length - 1 ? 'Finish' :
          activeStep === 0 ? 'Continue' :
          activeStep === 1 ? 'Next' :
          'Verify'}
        </Button>
      </Box>
    </Paper>);

};

export default TwoFactorSetup;