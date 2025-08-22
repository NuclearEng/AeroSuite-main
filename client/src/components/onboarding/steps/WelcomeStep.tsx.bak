import React from 'react';
import { Box, Typography, Avatar, useTheme } from '@mui/material';
import { EmojiPeople as EmojiPeopleIcon } from '@mui/icons-material';

interface WelcomeStepProps {
  user: any;
}

/**
 * Welcome Step
 * 
 * The first step in the onboarding flow that welcomes the user
 * and explains the onboarding process.
 */
const WelcomeStep: React.FC<WelcomeStepProps> = ({ user }) => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center' 
      }}
    >
      <Avatar 
        sx={{ 
          width: 80, 
          height: 80, 
          bgcolor: theme.palette.primary.main,
          mb: 2
        }}
      >
        <EmojiPeopleIcon sx={{ fontSize: 40 }} />
      </Avatar>
      
      <Typography variant="h5" gutterBottom>
        Welcome, {user?.firstName || 'New User'}!
      </Typography>
      
      <Typography variant="body1" paragraph>
        We're excited to have you on board. Let's take a few minutes to set up your profile
        and preferences so you can get the most out of AeroSuite.
      </Typography>
      
      <Box 
        sx={{ 
          mt: 3, 
          p: 3, 
          bgcolor: theme.palette.background.default,
          borderRadius: 2,
          width: '100%',
          maxWidth: '600px'
        }}
      >
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          In this quick setup, you'll:
        </Typography>
        
        <Box component="ul" sx={{ textAlign: 'left' }}>
          <Typography component="li" variant="body1" paragraph>
            Complete your profile information
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Set your preferences for notifications and display
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Learn about key features of the system
          </Typography>
          <Typography component="li" variant="body1">
            Be ready to start using AeroSuite effectively
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body2" sx={{ mt: 4, fontStyle: 'italic' }}>
        This will only take about 2 minutes to complete.
      </Typography>
    </Box>
  );
};

export default WelcomeStep; 