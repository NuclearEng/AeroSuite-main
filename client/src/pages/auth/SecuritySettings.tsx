import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress } from
'@mui/material';
import {
  Security as SecurityIcon,
  Password as PasswordIcon,
  VpnKey as VpnKeyIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  PhoneAndroid as PhoneIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon } from
'@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';
import AuthService from '../../services/auth.service';

const SecuritySettings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Two-factor auth state
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Backup codes state
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [passwordForBackupCodes, setPasswordForBackupCodes] = useState('');
  const [backupCodesLoading, setBackupCodesLoading] = useState(false);
  const [backupCodesError, setBackupCodesError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
      } catch (err: any) {
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleTwoFactorSetupComplete = async () => {
    setShowTwoFactorSetup(false);
    // Refresh user data to update 2FA status
    try {
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
    } catch (_err) {
      console.error("Error:", _error);
    }
  };

  const handleDisableTwoFactor = async () => {
    setDisableLoading(true);
    setDisableError(null);

    try {
      await AuthService.disableTwoFactor(password);

      // Refresh user data
      const userData = await AuthService.getCurrentUser();
      setUser(userData);

      // Close dialog
      setShowDisableDialog(false);
      setPassword('');
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable two-factor authentication');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setBackupCodesLoading(true);
    setBackupCodesError(null);

    try {
      const response = await AuthService.generateBackupCodes(passwordForBackupCodes);
      setBackupCodes(response.backupCodes);

      // Clear password field
      setPasswordForBackupCodes('');
    } catch (err: any) {
      setBackupCodesError(err.message || 'Failed to generate backup codes');
    } finally {
      setBackupCodesLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>);

  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>);

  }

  const twoFactorEnabled = user?.twoFactorAuth?.enabled || false;
  const twoFactorMethod = user?.twoFactorAuth?.method || 'app';

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Security Settings
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Account Security</Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <List>
          
          <ListItem>
            <ListItemIcon>
              <PasswordIcon />
            </ListItemIcon>
            <ListItemText
              primary="Password"
              secondary="Change your account password" />

            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/change-password')}>

                Change
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
          
          
          <ListItem>
            <ListItemIcon>
              {twoFactorEnabled ? <LockIcon color="success" /> : <LockOpenIcon color="warning" />}
            </ListItemIcon>
            <ListItemText
              primary="Two-Factor Authentication"
              secondary={
              twoFactorEnabled ?
              `Enabled (${twoFactorMethod === 'app' ?
              'Authenticator App' :
              twoFactorMethod === 'email' ?
              'Email' :
              'SMS'})` :
              "Disabled - We recommend enabling this for added security"
              } />

            <ListItemSecondaryAction>
              {twoFactorEnabled ?
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setShowDisableDialog(true)}>

                  Disable
                </Button> :

              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => setShowTwoFactorSetup(true)}>

                  Enable
                </Button>
              }
            </ListItemSecondaryAction>
          </ListItem>
          
          
          {twoFactorEnabled &&
          <ListItem>
              <ListItemIcon>
                <VpnKeyIcon />
              </ListItemIcon>
              <ListItemText
              primary="Backup Codes"
              secondary="Generate new backup codes for account recovery" />

              <ListItemSecondaryAction>
                <Button
                variant="outlined"
                size="small"
                onClick={() => setShowBackupCodesDialog(true)}>

                  Generate
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          }
          
          
          <ListItem>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText
              primary="Login History"
              secondary="View your recent login activity" />

            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/login-history')}>

                View
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>
      
      
      {showTwoFactorSetup &&
      <TwoFactorSetup
        onComplete={handleTwoFactorSetupComplete}
        onCancel={() => setShowTwoFactorSetup(false)} />

      }
      
      
      <Dialog
        open={showDisableDialog}
        onClose={() => setShowDisableDialog(false)}
        maxWidth="xs"
        fullWidth>

        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          {disableError &&
          <Alert severity="error" sx={{ mb: 2 }}>
              {disableError}
            </Alert>
          }
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            Disabling two-factor authentication will reduce the security of your account.
          </Alert>
          
          <Typography variant="body2" gutterBottom>
            Please enter your password to confirm this action.
          </Typography>
          
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            disabled={disableLoading} />

        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowDisableDialog(false);
              setPassword('');
              setDisableError(null);
            }}
            disabled={disableLoading}>

            Cancel
          </Button>
          <Button
            onClick={handleDisableTwoFactor}
            color="error"
            variant="contained"
            disabled={disableLoading || !password}>

            {disableLoading ? <CircularProgress size={24} /> : 'Disable'}
          </Button>
        </DialogActions>
      </Dialog>
      
      
      <Dialog
        open={showBackupCodesDialog}
        onClose={() => {
          if (!backupCodesLoading) {
            setShowBackupCodesDialog(false);
            setPasswordForBackupCodes('');
            setBackupCodesError(null);
            setBackupCodes([]);
          }
        }}
        maxWidth="sm"
        fullWidth>

        <DialogTitle>Backup Codes</DialogTitle>
        <DialogContent>
          {backupCodesError &&
          <Alert severity="error" sx={{ mb: 2 }}>
              {backupCodesError}
            </Alert>
          }
          
          {backupCodes.length > 0 ?
          <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Store these backup codes in a safe place. They allow you to log in if you lose access to your authentication device.
                </Typography>
              </Alert>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Each code can only be used once. After using a backup code, it will become invalid.
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {backupCodes.map((code, index) =>
              <Paper
                key={index}
                variant="outlined"
                sx={{
                  p: 1,
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  flex: '1 0 45%',
                  textAlign: 'center'
                }}>

                    {code}
                  </Paper>
              )}
              </Box>
              
              <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join('\n'));
              }}
              sx={{ mb: 2 }}>

                Copy to Clipboard
              </Button>
            </> :

          <>
              <Typography variant="body2" paragraph>
                Generating new backup codes will invalidate all existing codes. Please enter your password to confirm this action.
              </Typography>
              
              <TextField
              label="Password"
              type="password"
              fullWidth
              value={passwordForBackupCodes}
              onChange={(e) => setPasswordForBackupCodes(e.target.value)}
              margin="normal"
              disabled={backupCodesLoading} />

            </>
          }
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowBackupCodesDialog(false);
              setPasswordForBackupCodes('');
              setBackupCodesError(null);
              setBackupCodes([]);
            }}
            disabled={backupCodesLoading}>

            {backupCodes.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          
          {backupCodes.length === 0 &&
          <Button
            onClick={handleGenerateBackupCodes}
            color="primary"
            variant="contained"
            disabled={backupCodesLoading || !passwordForBackupCodes}>

              {backupCodesLoading ? <CircularProgress size={24} /> : 'Generate Codes'}
            </Button>
          }
        </DialogActions>
      </Dialog>
    </Box>);

};

export default SecuritySettings;