import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import OnboardingFlow from '../../components/onboarding/OnboardingFlow';
import { RootState } from '../../redux/store';

/**
 * OnboardingPage Component
 * 
 * This page handles the user onboarding workflow.
 * Part of TS375: User onboarding workflow
 */
const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  // Redirect to dashboard if user has already completed onboarding
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [loading, user, navigate]);

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render onboarding flow if authenticated and not completed
  return <OnboardingFlow />;
};

export default OnboardingPage; 