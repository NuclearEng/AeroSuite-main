import React from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  EmojiEvents as EmojiEventsIcon,
  Explore as ExploreIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

interface CompletionStepProps {
  profileData: {
    firstName: string;
    lastName: string;
    [key: string]: any;
  };
}

/**
 * Completion Step
 * 
 * The final step in the onboarding flow that confirms the setup is complete
 * and provides next steps for the user.
 */
const CompletionStep: React.FC<CompletionStepProps> = ({ profileData }) => {
  const theme = useTheme();

  // Next steps for the user
  const nextSteps = [
    {
      text: 'Explore the dashboard to get familiar with the system',
      icon: <ExploreIcon color="primary" />
    },
    {
      text: 'Complete your first inspection to get started',
      icon: <CheckCircleIcon color="primary" />
    },
    {
      text: 'Invite team members to collaborate',
      icon: <ChatIcon color="primary" />
    },
    {
      text: 'Check out the help center for detailed guides',
      icon: <HelpIcon color="primary" />
    }
  ];

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
          bgcolor: theme.palette.success.main,
          mb: 2
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: 40 }} />
      </Avatar>

      <Typography variant="h5" gutterBottom>
        Congratulations, {profileData.firstName}!
      </Typography>

      <Typography variant="body1" paragraph>
        You've successfully completed the AeroSuite onboarding process.
        Your profile has been set up, and your preferences have been saved.
      </Typography>

      <Box
        sx={{
          mt: 3,
          p: 3,
          bgcolor: theme.palette.background.default,
          borderRadius: 2,
          width: '100%',
          maxWidth: '600px',
          mb: 4
        }}
      >
        <Typography variant="subtitle1" gutterBottom fontWeight="bold" align="left">
          Next Steps:
        </Typography>

        <List>
          {nextSteps.map((step, index: any) => (
            <ListItem key={index}>
              <ListItemIcon>
                {step.icon}
              </ListItemIcon>
              <ListItemText primary={step.text} />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
          gap: 2
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          startIcon={<HelpIcon />}
          onClick={() => window.open('/help', '_blank')}
        >
          Help Center
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SettingsIcon />}
          onClick={() => window.open('/settings', '_blank')}
        >
          Account Settings
        </Button>
      </Box>
    </Box>
  );
};

export default CompletionStep; 