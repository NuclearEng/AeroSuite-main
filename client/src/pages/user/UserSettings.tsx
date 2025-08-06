import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress } from
'@mui/material';
import {
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  ColorLens as ColorLensIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon } from
'@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { updateUserPreferences } from '../../services/userService';
import { useThemeContext } from '../../theme/ThemeProvider';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  emailNotifications: {
    newInspections: boolean;
    inspectionUpdates: boolean;
    newFindings: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    shareUsageData: boolean;
    allowCookies: boolean;
  };
  display: {
    compactView: boolean;
    showAnimations: boolean;
    highContrastMode: boolean;
    dashboardLayout: string;
  };
}

const UserSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode, setMode } = useThemeContext();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    theme: mode,
    language: 'en',
    notifications: {
      email: true,
      browser: false,
      mobile: false
    },
    emailNotifications: {
      newInspections: true,
      inspectionUpdates: true,
      newFindings: true,
      weeklyDigest: true
    },
    privacy: {
      shareUsageData: true,
      allowCookies: true
    },
    display: {
      compactView: false,
      showAnimations: true,
      highContrastMode: false,
      dashboardLayout: 'default'
    }
  });

  // Load user preferences when component mounts
  useEffect(() => {
    if (user?.preferences) {
      const userPrefs = user.preferences;
      setSettings((prevSettings) => ({
        ...prevSettings,
        theme: userPrefs.theme as 'light' | 'dark' | 'system' || prevSettings.theme,
        language: userPrefs.language || prevSettings.language,
        notifications: {
          ...prevSettings.notifications,
          email: userPrefs.notifications ?? prevSettings.notifications.email
        },
        display: {
          ...prevSettings.display,
          dashboardLayout: userPrefs.dashboardLayout || prevSettings.display.dashboardLayout
        }
      }));
    }
  }, [user]);

  // Handle theme change
  const handleThemeChange = (event: SelectChangeEvent) => {
    const newTheme = event.target.value as 'light' | 'dark' | 'system';
    setSettings({
      ...settings,
      theme: newTheme
    });

    // Update theme in the app
    if (newTheme === 'light' || newTheme === 'dark') {
      setMode(newTheme as 'light' | 'dark');
    }
  };

  // Handle language change
  const handleLanguageChange = (event: SelectChangeEvent) => {
    setSettings({
      ...settings,
      language: event.target.value
    });
  };

  // Handle switch changes
  const handleSwitchChange = (section: keyof UserSettings, setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => {
      const sectionData = prev[section] as Record<string, unknown>;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [setting]: event.target.checked
        }
      };
    });
  };

  // Handle dashboard layout change
  const handleDashboardLayoutChange = (event: SelectChangeEvent) => {
    setSettings({
      ...settings,
      display: {
        ...settings.display,
        dashboardLayout: event.target.value
      }
    });
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Map settings to user preferences format
      const preferences = {
        theme: settings.theme,
        language: settings.language,
        notifications: settings.notifications.email,
        dashboardLayout: settings.display.dashboardLayout,
        defaultView: 'dashboard'
      };

      // Call API to update preferences
      await updateUserPreferences(preferences);

      setSuccess('Settings saved successfully');
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSuccess(null);
    setError(null);
  };

  // Export user data
  const handleExportData = () => {
    // In a real app, this would call an API endpoint to generate and download user data
    setSuccess('Your data export has been initiated. You will receive an email when it is ready for download.');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Account Settings
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveSettings}
          disabled={loading}>

          {loading ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>
      
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <ColorLensIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Appearance</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="theme-select-label">Theme</InputLabel>
                <Select
                  labelId="theme-select-label"
                  id="theme-select"
                  value={settings.theme}
                  label="Theme"
                  onChange={handleThemeChange}>

                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                <Switch
                  checked={settings.display.showAnimations}
                  onChange={handleSwitchChange('display', 'showAnimations')} />

                }
                label="Show Animations" />

            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                <Switch
                  checked={settings.display.compactView}
                  onChange={handleSwitchChange('display', 'compactView')} />

                }
                label="Compact View" />

            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                <Switch
                  checked={settings.display.highContrastMode}
                  onChange={handleSwitchChange('display', 'highContrastMode')} />

                }
                label="High Contrast Mode" />

            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="dashboard-layout-label">Dashboard Layout</InputLabel>
                <Select
                  labelId="dashboard-layout-label"
                  id="dashboard-layout"
                  value={settings.display.dashboardLayout}
                  label="Dashboard Layout"
                  onChange={handleDashboardLayoutChange}>

                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="compact">Compact</MenuItem>
                  <MenuItem value="detailed">Detailed</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <LanguageIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Language</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={settings.language}
              label="Language"
              onChange={handleLanguageChange}>

              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
              <MenuItem value="ja">日本語</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>
      
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <NotificationsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Notifications</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Notification Channels
          </Typography>
          
          <Box mb={3}>
            <FormControlLabel
              control={
              <Switch
                checked={settings.notifications.email}
                onChange={handleSwitchChange('notifications', 'email')} />

              }
              label="Email Notifications" />

            
            <FormControlLabel
              control={
              <Switch
                checked={settings.notifications.browser}
                onChange={handleSwitchChange('notifications', 'browser')} />

              }
              label="Browser Notifications" />

            
            <FormControlLabel
              control={
              <Switch
                checked={settings.notifications.mobile}
                onChange={handleSwitchChange('notifications', 'mobile')} />

              }
              label="Mobile Notifications" />

          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Email Notification Preferences
          </Typography>
          
          <Box>
            <FormControlLabel
              control={
              <Switch
                checked={settings.emailNotifications.newInspections}
                onChange={handleSwitchChange('emailNotifications', 'newInspections')}
                disabled={!settings.notifications.email} />

              }
              label="New Inspections" />

            
            <FormControlLabel
              control={
              <Switch
                checked={settings.emailNotifications.inspectionUpdates}
                onChange={handleSwitchChange('emailNotifications', 'inspectionUpdates')}
                disabled={!settings.notifications.email} />

              }
              label="Inspection Updates" />

            
            <FormControlLabel
              control={
              <Switch
                checked={settings.emailNotifications.newFindings}
                onChange={handleSwitchChange('emailNotifications', 'newFindings')}
                disabled={!settings.notifications.email} />

              }
              label="New Findings" />

            
            <FormControlLabel
              control={
              <Switch
                checked={settings.emailNotifications.weeklyDigest}
                onChange={handleSwitchChange('emailNotifications', 'weeklyDigest')}
                disabled={!settings.notifications.email} />

              }
              label="Weekly Summary" />

          </Box>
        </CardContent>
      </Card>
      
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <VisibilityIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Privacy</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <FormControlLabel
            control={
            <Switch
              checked={settings.privacy.shareUsageData}
              onChange={handleSwitchChange('privacy', 'shareUsageData')} />

            }
            label={
            <Box display="flex" alignItems="center">
                Share Usage Data
                <Tooltip title="Helps us improve the application by collecting anonymous usage statistics">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            } />

          
          <FormControlLabel
            control={
            <Switch
              checked={settings.privacy.allowCookies}
              onChange={handleSwitchChange('privacy', 'allowCookies')} />

            }
            label="Allow Cookies" />

        </CardContent>
      </Card>
      
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SecurityIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Data Management</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DownloadIcon />}
                fullWidth
                onClick={handleExportData}>

                Export My Data
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                fullWidth
                onClick={() => setDeleteAccountDialogOpen(true)}>

                Delete Account
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      
      <Snackbar
        open={!!success || !!error}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>

        <Alert
          onClose={handleSnackbarClose}
          severity={success ? 'success' : 'error'}
          sx={{ width: '100%' }}>

          {success || error}
        </Alert>
      </Snackbar>
    </Box>);

};

export default UserSettings;