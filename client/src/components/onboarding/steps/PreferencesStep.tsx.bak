import React from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  FormControlLabel, 
  FormGroup, 
  Switch, 
  RadioGroup, 
  Radio, 
  FormLabel,
  Paper,
  useTheme
} from '@mui/material';
import { 
  DarkMode as DarkModeIcon, 
  LightMode as LightModeIcon,
  Dashboard as DashboardIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Email as EmailIcon
} from '@mui/icons-material';

interface Preferences {
  darkMode: boolean;
  emailNotifications: boolean;
  dashboardLayout: string;
  defaultView: string;
}

interface PreferencesStepProps {
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
}

/**
 * Preferences Step
 * 
 * The third step in the onboarding flow that allows users to 
 * set their system preferences.
 */
const PreferencesStep: React.FC<PreferencesStepProps> = ({ preferences, setPreferences }) => {
  const theme = useTheme();

  // Handle switch changes
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({
      ...preferences,
      [event.target.name]: event.target.checked
    });
  };

  // Handle radio button changes
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({
      ...preferences,
      [event.target.name]: event.target.value
    });
  };

  return (
    <Box>
      <Typography variant="h5" align="center" gutterBottom>
        Set Your Preferences
      </Typography>
      
      <Typography variant="body1" align="center" paragraph sx={{ mb: 4 }}>
        Customize your experience with AeroSuite by selecting your preferred settings.
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.darkMode}
                  onChange={handleSwitchChange}
                  name="darkMode"
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {preferences.darkMode ? (
                    <DarkModeIcon sx={{ mr: 1 }} />
                  ) : (
                    <LightModeIcon sx={{ mr: 1 }} />
                  )}
                  <Typography>
                    {preferences.darkMode ? 'Dark Mode' : 'Light Mode'}
                  </Typography>
                </Box>
              }
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
              {preferences.darkMode 
                ? 'Using dark color scheme to reduce eye strain.' 
                : 'Using light color scheme for better visibility in bright environments.'}
            </Typography>
          </FormGroup>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications}
                  onChange={handleSwitchChange}
                  name="emailNotifications"
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ mr: 1 }} />
                  <Typography>Email Notifications</Typography>
                </Box>
              }
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
              {preferences.emailNotifications 
                ? 'You will receive email notifications for important events.' 
                : 'You will not receive email notifications.'}
            </Typography>
          </FormGroup>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DashboardIcon sx={{ mr: 1 }} />
                <Typography fontWeight="medium">Dashboard Layout</Typography>
              </Box>
            </FormLabel>
            
            <RadioGroup
              name="dashboardLayout"
              value={preferences.dashboardLayout}
              onChange={handleRadioChange}
            >
              <FormControlLabel 
                value="standard" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography>Standard</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Default layout with fixed widgets
                    </Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="compact" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography>Compact</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Condensed layout for more information at a glance
                    </Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="custom" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography>Customizable</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drag and drop widgets to create your own layout
                    </Typography>
                  </Box>
                } 
              />
            </RadioGroup>
          </FormControl>
        </Paper>
        
        <Paper sx={{ p: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ViewListIcon sx={{ mr: 1 }} />
                <Typography fontWeight="medium">Default View</Typography>
              </Box>
            </FormLabel>
            
            <RadioGroup
              name="defaultView"
              value={preferences.defaultView}
              onChange={handleRadioChange}
            >
              <FormControlLabel 
                value="dashboard" 
                control={<Radio />} 
                label="Dashboard" 
              />
              <FormControlLabel 
                value="inspections" 
                control={<Radio />} 
                label="Inspections" 
              />
              <FormControlLabel 
                value="suppliers" 
                control={<Radio />} 
                label="Suppliers" 
              />
              <FormControlLabel 
                value="customers" 
                control={<Radio />} 
                label="Customers" 
              />
            </RadioGroup>
          </FormControl>
        </Paper>
      </Box>
      
      <Typography variant="body2" color="text.secondary" align="center">
        You can change these preferences later in your account settings.
      </Typography>
    </Box>
  );
};

export default PreferencesStep; 