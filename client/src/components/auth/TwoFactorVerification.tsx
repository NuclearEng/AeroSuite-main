import React, { ChangeEvent, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Link,
  Alert
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface TwoFactorVerificationProps {
  open: boolean;
  onClose: () => void;
  onVerify: (code: string, useBackupCode: boolean) => Promise<void>;
  method: 'app' | 'email' | 'sms';
  loading: boolean;
  error: string | null;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  open,
  onClose,
  onVerify,
  method,
  loading,
  error
}) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (useBackupCode) {
        await onVerify(backupCode, true);
      } else {
        await onVerify(code, false);
      }
    } catch (_err) {
      // Error handling is done via the error prop
    }
  };

  const handleToggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode('');
    setBackupCode('');
  };

  const formatBackupCode = (input: string) => {
    // Remove non-alphanumeric characters
    const cleanedInput = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Format with dashes every 4 characters
    const formattedCode = cleanedInput.replace(/(.{4})/g, '$1-').slice(0, 19);
    
    return formattedCode;
  };

  const handleBackupCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBackupCode(e.target.value);
    setBackupCode(formatted);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <LockIcon sx={{ mr: 1, color: 'primary.main' }} />
        Two-Factor Authentication
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {!useBackupCode ? (
            <>
              <Typography variant="body1" gutterBottom>
                {method === 'app' 
                  ? 'Enter the 6-digit code from your authenticator app.'
                  : method === 'email'
                    ? 'Enter the verification code sent to your email.'
                    : 'Enter the verification code sent to your phone.'}
              </Typography>
              
              <TextField
                label="Verification Code"
                variant="outlined"
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                sx={{ mt: 2 }}
                autoFocus
                inputProps={{ 
                  maxLength: 6,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
                placeholder="123456"
                disabled={loading}
              />
            </>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                Enter a backup code from the list provided when you set up two-factor authentication.
              </Typography>
              
              <TextField
                label="Backup Code"
                variant="outlined"
                fullWidth
                value={backupCode}
                onChange={handleBackupCodeChange}
                sx={{ mt: 2 }}
                autoFocus
                placeholder="XXXX-XXXX-XXXX-XXXX"
                disabled={loading}
              />
            </>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={handleToggleBackupCode}
              sx={{ textDecoration: 'none' }}
              disabled={loading}
            >
              {useBackupCode 
                ? 'Use verification code instead' 
                : 'Use a backup code instead'}
            </Link>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || (useBackupCode ? backupCode.length < 10 : code.length !== 6)}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TwoFactorVerification; 