import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Divider, 
  Typography, 
  CircularProgress, 
  Paper,
  useTheme,
  Fade,
  Tooltip
} from '@mui/material';
import axios from 'axios';
import {
  Google as GoogleIcon,
  Microsoft as MicrosoftIcon,
  Login as LoginIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../../config';

interface SSOLoginButtonsProps {
  onError?: (error: string) => void;
  redirectUrl?: string;
  variant?: 'standard' | 'compact';
  showDivider?: boolean;
}

interface ProviderConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  textColor: string;
}

/**
 * Enhanced SSO Login Buttons Component
 * 
 * Renders styled login buttons for available SSO providers with animations
 */
const EnhancedSSOLoginButtons: React.FC<SSOLoginButtonsProps> = ({ 
  onError, 
  redirectUrl,
  variant = 'standard',
  showDivider = true
}) => {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const theme = useTheme();
  
  // Delay showing the loading spinner to avoid flickering
  const [showSpinner, setShowSpinner] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setShowSpinner(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  // Custom provider configurations
  const providerConfigs: Record<string, ProviderConfig> = {
    google: {
      id: 'google',
      name: 'Google',
      icon: <GoogleIcon />,
      color: '#ffffff',
      hoverColor: '#f1f3f4',
      textColor: '#757575'
    },
    microsoft: {
      id: 'microsoft',
      name: 'Microsoft',
      icon: <MicrosoftIcon />,
      color: '#2F2F2F',
      hoverColor: '#1E1E1E',
      textColor: '#ffffff'
    }
  };

  // Load available SSO providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        
        const response = await axios.get(`${API_BASE_URL}/api/auth/sso/providers`);
        if (response.data.success && response.data.data.enabled) {
          setProviders(response.data.data.providers || []);
        } else {
          setProviders([]);
        }
      } catch (_error) {
        console.error('Failed to fetch SSO providers:', error);
        setProviders([]);
        setLoadError('Failed to load authentication providers');
        if (onError) {
          onError('Failed to load authentication providers');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [onError]);

  // Handle SSO login
  const handleSSOLogin = (provider: string) => {
    // Construct redirect URL with the current path for post-login redirect
    const redirect = redirectUrl || window.location.pathname;
    window.location.href = `${API_BASE_URL}/api/auth/sso/${provider}?redirect=${encodeURIComponent(redirect)}`;
  };

  // If loading, show loading indicator
  if (showSpinner) {
    return (
      <Box width="100%" my={3} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress size={24} color="primary" />
      </Box>
    );
  }

  // If error loading providers, show error message
  if (loadError) {
    return (
      <Box width="100%" my={3}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.contrastText,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ErrorIcon sx={{ mr: 1 }} />
          <Typography variant="body2">{loadError}</Typography>
        </Paper>
      </Box>
    );
  }

  // If no providers available, don't render anything
  if (providers.length === 0 && !loading) {
    return null;
  }

  return (
    <Box width="100%" my={variant === 'compact' ? 1 : 3}>
      {showDivider && (
        <Divider sx={{ mb: variant === 'compact' ? 2 : 3 }}>
          <Typography variant="body2" color="text.secondary">
            {variant === 'compact' ? 'OR' : 'Or continue with'}
          </Typography>
        </Divider>
      )}
      
      <Fade in={!loading} timeout={500}>
        <Box>
          {variant === 'compact' ? (
            // Compact view with icons only
            <Box display="flex" justifyContent="center" gap={2}>
              {providers.map((provider) => {
                const config = providerConfigs[provider];
                return (
                  <Tooltip key={provider} title={`Sign in with ${config.name}`}>
                    <Button
                      variant="outlined"
                      onClick={() => handleSSOLogin(provider)}
                      sx={{
                        minWidth: 'unset',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: config.color,
                        color: config.textColor,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          backgroundColor: config.hoverColor,
                          borderColor: theme.palette.divider
                        }
                      }}
                    >
                      {config.icon}
                    </Button>
                  </Tooltip>
                );
              })}
            </Box>
          ) : (
            // Standard view with buttons and text
            <Box display="flex" flexDirection="column" gap={2}>
              {providers.map((provider) => {
                const config = providerConfigs[provider];
                return (
                  <Button
                    key={provider}
                    variant="outlined"
                    fullWidth
                    startIcon={config.icon}
                    onClick={() => handleSSOLogin(provider)}
                    sx={{
                      py: 1.2,
                      backgroundColor: config.color,
                      color: config.textColor,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        backgroundColor: config.hoverColor,
                        borderColor: theme.palette.divider
                      }
                    }}
                  >
                    Continue with {config.name}
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

export default EnhancedSSOLoginButtons; 