import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  InputAdornment,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions } from
'@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EditIcon from '@mui/icons-material/Edit';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import axios from 'axios';

/**
 * Component for verifying a user's phone number via SMS
 */
const SMSVerification = ({
  user,
  onVerificationComplete,
  onPreferencesChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEditing, setIsEditing] = useState(!user?.phoneNumber);
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  // SMS notification preferences (initialize from user)
  const [preferences, setPreferences] = useState({
    enabled: user?.notificationPreferences?.smsNotifications?.enabled || false,
    inspectionReminders: user?.notificationPreferences?.smsNotifications?.inspectionReminders || true,
    inspectionAssignments: user?.notificationPreferences?.smsNotifications?.inspectionAssignments || true,
    supplierAlerts: user?.notificationPreferences?.smsNotifications?.supplierAlerts || false,
    systemAlerts: user?.notificationPreferences?.smsNotifications?.systemAlerts || false,
    dailyDigest: user?.notificationPreferences?.smsNotifications?.dailyDigest || false
  });

  /**
   * Start the phone verification process
   */
  const handleStartVerification = async () => {
    // Basic client-side validation for E.164 format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number in international format (e.g., +1234567890)');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/notifications/verify/phone', {
        phoneNumber
      });

      if (response.data.success) {
        setVerificationSent(true);
        setSuccess('Verification code sent! Please check your phone.');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (_err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify the phone number with the provided code
   */
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/notifications/verify/phone/check', {
        phoneNumber,
        code: verificationCode
      });

      if (response.data.success && response.data.data.valid) {
        setSuccess('Phone number verified successfully!');

        // Update user in parent component
        if (onVerificationComplete) {
          onVerificationComplete({
            phoneNumber,
            isPhoneVerified: true
          });
        }

        setIsEditing(false);
        setVerificationSent(false);
        setVerificationCode('');

        // If not already enabled, show dialog to enable SMS notifications
        if (!preferences.enabled) {
          setShowDialog(true);
        }
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (_err) {
      setError(err.response?.data?.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle preference changes and save to server
   */
  const handlePreferenceChange = async (event) => {
    const { name, checked } = event.target;

    const updatedPreferences = {
      ...preferences,
      [name]: checked
    };

    setPreferences(updatedPreferences);

    // Save preferences to server
    try {
      await axios.post('/api/notifications/preferences', {
        smsNotifications: updatedPreferences
      });

      // Notify parent component
      if (onPreferencesChange) {
        onPreferencesChange({
          notificationPreferences: {
            smsNotifications: updatedPreferences
          }
        });
      }

      setSuccess('Preferences updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (_err) {
      setError('Failed to update preferences');
      setTimeout(() => setError(''), 3000);
    }
  };

  /**
   * Enable SMS notifications from the dialog
   */
  const handleEnableSMS = async () => {
    const updatedPreferences = {
      ...preferences,
      enabled: true
    };

    setPreferences(updatedPreferences);

    try {
      await axios.post('/api/notifications/preferences', {
        smsNotifications: updatedPreferences
      });

      // Notify parent component
      if (onPreferencesChange) {
        onPreferencesChange({
          notificationPreferences: {
            smsNotifications: updatedPreferences
          }
        });
      }

      setSuccess('SMS notifications enabled');
      setTimeout(() => setSuccess(''), 3000);
    } catch (_err) {
      setError('Failed to update preferences');
      setTimeout(() => setError(''), 3000);
    } finally {
      setShowDialog(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center">
        <PhoneIcon sx={{ mr: 1 }} />
        SMS Notifications
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {(error || success) &&
      <Box mb={2}>
          {error &&
        <Alert severity="error" onClose={() => setError('')}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
        }
          
          {success &&
        <Alert severity="success" onClose={() => setSuccess('')}>
              <AlertTitle>Success</AlertTitle>
              {success}
            </Alert>
        }
        </Box>
      }
      
      <Box mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Phone Verification
        </Typography>
        
        {user?.isPhoneVerified && !isEditing ?
        <Box display="flex" alignItems="center" mb={2}>
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography>
              <strong>Verified:</strong> {user.phoneNumber}
            </Typography>
            <Button
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
            size="small"
            sx={{ ml: 2 }}>

              Change
            </Button>
          </Box> :

        <Box>
            <TextField
            fullWidth
            label="Phone Number"
            variant="outlined"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            disabled={loading || verificationSent && !isEditing}
            margin="normal"
            InputProps={{
              startAdornment:
              <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>

            }}
            helperText="Enter your phone number in international format (E.164)" />

            
            {verificationSent &&
          <TextField
            fullWidth
            label="Verification Code"
            variant="outlined"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            margin="normal"
            disabled={loading}
            placeholder="Enter code sent to your phone"
            InputProps={{
              startAdornment:
              <InputAdornment position="start">
                      <VerifiedUserIcon />
                    </InputAdornment>

            }} />

          }
            
            <Box mt={2} display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={2}>
              {!verificationSent ?
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartVerification}
              disabled={loading || !phoneNumber}
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              fullWidth={isMobile}>

                  Send Verification Code
                </Button> :

            <>
                  <Button
                variant="contained"
                color="success"
                onClick={handleVerifyCode}
                disabled={loading || !verificationCode}
                startIcon={loading ? <CircularProgress size={20} /> : <VerifiedUserIcon />}
                fullWidth={isMobile}>

                    Verify Code
                  </Button>
                  
                  <Button
                variant="outlined"
                onClick={() => {
                  setVerificationSent(false);
                  setVerificationCode('');
                }}
                disabled={loading}
                fullWidth={isMobile}>

                    Cancel
                  </Button>
                </>
            }
            </Box>
          </Box>
        }
      </Box>
      
      {user?.isPhoneVerified &&
      <Box>
          <Typography variant="subtitle1" gutterBottom>
            SMS Notification Preferences
          </Typography>
          
          <FormControlLabel
          control={
          <Checkbox
            checked={preferences.enabled}
            onChange={handlePreferenceChange}
            name="enabled"
            color="primary" />

          }
          label="Enable SMS notifications" />

          
          {preferences.enabled &&
        <Box pl={4} mt={1}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Select which notifications you want to receive via SMS:
              </Typography>
              
              <FormControlLabel
            control={
            <Checkbox
              checked={preferences.inspectionReminders}
              onChange={handlePreferenceChange}
              name="inspectionReminders"
              color="primary"
              disabled={!preferences.enabled} />

            }
            label="Inspection reminders" />

              
              <FormControlLabel
            control={
            <Checkbox
              checked={preferences.inspectionAssignments}
              onChange={handlePreferenceChange}
              name="inspectionAssignments"
              color="primary"
              disabled={!preferences.enabled} />

            }
            label="New inspection assignments" />

              
              <FormControlLabel
            control={
            <Checkbox
              checked={preferences.supplierAlerts}
              onChange={handlePreferenceChange}
              name="supplierAlerts"
              color="primary"
              disabled={!preferences.enabled} />

            }
            label="Supplier alerts" />

              
              <FormControlLabel
            control={
            <Checkbox
              checked={preferences.systemAlerts}
              onChange={handlePreferenceChange}
              name="systemAlerts"
              color="primary"
              disabled={!preferences.enabled} />

            }
            label="System alerts" />

              
              <FormControlLabel
            control={
            <Checkbox
              checked={preferences.dailyDigest}
              onChange={handlePreferenceChange}
              name="dailyDigest"
              color="primary"
              disabled={!preferences.enabled} />

            }
            label="Daily digest" />

              
              <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                Standard message and data rates may apply. Message frequency varies.
              </Typography>
            </Box>
        }
        </Box>
      }
      
      
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}>

        <DialogTitle>Enable SMS Notifications?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your phone number has been verified successfully. Would you like to enable SMS notifications?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Not Now</Button>
          <Button onClick={handleEnableSMS} color="primary" variant="contained">
            Enable SMS
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>);

};

export default SMSVerification;