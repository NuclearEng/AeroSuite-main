import React, { useState, useEffect } from 'react';
import { Box, Button, Divider, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import {
  Google as GoogleIcon,
  Microsoft as MicrosoftIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface SSOLoginButtonsProps {
  onError?: (error: string) => void;
  redirectUrl?: string;
}

/**
 * SSO Login Buttons Component
 * 
 * Renders login buttons for available SSO providers
 */
const SSOLoginButtons: React.FC<SSOLoginButtonsProps> = ({ onError, redirectUrl }) => {
  const [providers, setProviders] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const _navigate = useNavigate();

  // Custom provider icons
  const providerIcons: Record<string, React.ReactNode> = {
    google: <GoogleIcon />,
    microsoft: <MicrosoftIcon />,
    okta: null,
    auth0: null,
    saml: null
  };

  // Provider display names
  const providerNames: Record<string, string> = {
    google: 'Google',
    microsoft: 'Microsoft',
    okta: 'Okta',
    auth0: 'Auth0',
    saml: 'Enterprise SSO'
  };

  // Provider button colors
  const providerColors: Record<string, string> = {
    google: '#4285F4',
    microsoft: '#2F2F2F',
    okta: '#007DC1',
    auth0: '#EB5424',
    saml: '#6B7280'
  };

  // Load available SSO providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/auth/sso/providers');
        if (response.data.success && response.data.data.enabled) {
          setProviders(response.data.data.providers || []);
        } else {
          setProviders([]);
        }
      } catch (_error) {
        console.error("Error:", _error);
        setProviders([]);
        if (onError) {
          onError('Failed to load SSO providers');
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
    window.location.href = `/api/auth/sso/${provider}?redirect=${encodeURIComponent(redirect)}`;
  };

  // If no providers or still loading, don't render anything
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <Box width="100%" my={3}>
      <Divider>
        <Typography variant="body2" color="text.secondary">
          Or continue with
        </Typography>
      </Divider>
      
      <Box display="flex" flexDirection="column" gap={2} mt={3}>
        {providers.map((provider: any) => (
          <Button
            key={provider}
            variant="outlined"
            fullWidth
            startIcon={providerIcons[provider]}
            onClick={() => handleSSOLogin(provider)}
            sx={{
              borderColor: providerColors[provider],
              color: providerColors[provider],
              '&:hover': {
                borderColor: providerColors[provider],
                backgroundColor: `${providerColors[provider]}10`
              }
            }}
          >
            Continue with {providerNames[provider] || provider}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default SSOLoginButtons; 