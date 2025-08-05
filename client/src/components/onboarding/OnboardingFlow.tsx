import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography, 
  Paper,
  Container,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon, Check as CheckIcon } from '@mui/icons-material';
import { z } from 'zod';

// Import onboarding steps
import WelcomeStep from './steps/WelcomeStep';
import ProfileSetupStep from './steps/ProfileSetupStep';
import PreferencesStep from './steps/PreferencesStep';
import FeaturesOverviewStep from './steps/FeaturesOverviewStep';
import CompletionStep from './steps/CompletionStep';

// Import Redux actions
import { updateProfile, completeOnboarding } from '../../redux/slices/auth.slice';
import { RootState } from '../../redux/store';

// Define preferences interface
interface UserPreferences {
  theme?: string;
  notifications?: boolean;
  dashboardLayout?: string;
  defaultView?: string;
  language?: string;
}

// Define step labels
const steps = [
  'Welcome',
  'Profile Setup',
  'Preferences',
  'Features Overview',
  'Completion'
];

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  profileImage: z.any().optional()
});

const preferencesSchema = z.object({
  theme: z.string().optional(),
  notifications: z.boolean().optional(),
  dashboardLayout: z.string().optional(),
  defaultView: z.string().optional(),
  language: z.string().optional()
});

/**
 * OnboardingFlow Component
 * 
 * A multi-step onboarding workflow for new users to get familiar with the system
 * and set up their initial preferences.
 * Part of TS375: User onboarding workflow
 */
const OnboardingFlow: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get user and loading state from redux store
  const { user, loading } = useSelector((state: RootState) => state.auth);
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    profileImage: user?.profileImage || null
  });
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: user?.preferences?.theme || 'light',
    notifications: user?.preferences?.notifications !== false,
    dashboardLayout: user?.preferences?.dashboardLayout || 'standard',
    defaultView: user?.preferences?.defaultView || 'dashboard',
    language: user?.preferences?.language || 'en'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user has already completed onboarding
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Handle next step
  const handleNext = async () => {
    if (activeStep === 1) {
      // Validate profile data
      const result = profileSchema.safeParse(profileData);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach(e => {
          if (e.path[0]) errors[e.path[0] as string] = e.message;
        });
        setFormErrors(errors);
        setErrorMessage('Please fix the errors in your profile.');
        return;
      }
      setFormErrors({});
      setErrorMessage(null);
      try {
        await dispatch(updateProfile(profileData) as any);
      } catch (_error) {
        setErrorMessage('Error saving profile data.');
        return;
      }
    } else if (activeStep === 2) {
      // Validate preferences
      const result = preferencesSchema.safeParse(preferences);
      if (!result.success) {
        setErrorMessage('Invalid preferences.');
        return;
      }
      setErrorMessage(null);
      try {
        await dispatch(updateProfile({ preferences }) as any);
      } catch (_error) {
        setErrorMessage('Error saving preferences.');
        return;
      }
    } else if (activeStep === steps.length - 1) {
      try {
        await dispatch(completeOnboarding() as any);
        navigate('/dashboard');
        return;
      } catch (_error) {
        setErrorMessage('Error completing onboarding.');
        return;
      }
    }
    
    // Move to next step
    setActiveStep(prevStep => prevStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  // Handle skip (only available on non-required steps)
  const handleSkip = () => {
    if (activeStep === 2) { // Preferences step is skippable
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <WelcomeStep user={user} />;
      case 1:
        return (
          <ProfileSetupStep 
            profileData={profileData} 
            setProfileData={setProfileData} 
          />
        );
      case 2:
        return (
          <PreferencesStep 
            preferences={preferences as any} 
            setPreferences={setPreferences as any} 
          />
        );
      case 3:
        return <FeaturesOverviewStep />;
      case 4:
        return <CompletionStep profileData={profileData} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  // Determine if current step is skippable
  const isStepSkippable = (step: number) => {
    return step === 2; // Only preferences step is skippable
  };

  // Determine if the next button should be disabled
  const isNextDisabled = () => {
    if (activeStep === 1) {
      // Validate profile data
      return !profileData.firstName || !profileData.lastName;
    }
    return false;
  };

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4, 
          mb: 4, 
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Welcome to AeroSuite
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 2, mb: 4, minHeight: '300px' }}>
          {renderStepContent()}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          
          <Box>
            {isStepSkippable(activeStep) && (
              <Button 
                color="inherit" 
                onClick={handleSkip} 
                sx={{ mr: 1 }}
              >
                Skip
              </Button>
            )}
            
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            
            <Button
              variant="contained"
              color="primary"
              endIcon={activeStep === steps.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />}
              onClick={handleNext}
              disabled={isNextDisabled() || loading}
              sx={{ minWidth: 120 }}
            >
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default OnboardingFlow; 