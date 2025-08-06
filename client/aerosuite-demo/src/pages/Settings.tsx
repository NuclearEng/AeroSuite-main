import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Divider,
  Button,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem } from
'@mui/material';
import {
  DarkMode as DarkModeIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon } from
'@mui/icons-material';

const Settings: React.FC = () => {
  // Settings state
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    language: 'en',
    autoSave: true,
    compactMode: false,
    showTips: true
  });

  const [saved, setSaved] = useState(false);

  // Handle settings change
  const handleToggle = (setting: string) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  // Handle language change
  const handleLanguageChange = (event: any) => {
    setSettings((prev) => ({
      ...prev,
      language: event.target.value
    }));
  };

  // Save settings
  const handleSave = () => {
    // Save logic would go here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Languages
  const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' }];


  return (
    <Box>
      
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Configure application settings and preferences
        </Typography>
      </Box>

      {saved &&
      <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      }

      <Grid container spacing={3}>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Paper sx={{ mb: 3 }}>
            <Box p={2}>
              <Typography variant="h6">Application Settings</Typography>
            </Box>
            <Divider />
            <List>
              <ListItem>
                <ListItemIcon>
                  <DarkModeIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Dark Mode"
                  secondary="Use dark theme throughout the application" />

                <Switch
                  edge="end"
                  checked={settings.darkMode}
                  onChange={() => handleToggle('darkMode')} />

              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Notifications"
                  secondary="Enable browser notifications" />

                <Switch
                  edge="end"
                  checked={settings.notifications}
                  onChange={() => handleToggle('notifications')} />

              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem>
                <ListItemIcon>
                  <LanguageIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Language"
                  secondary="Select your preferred language" />

                <FormControl sx={{ minWidth: 120 }} size="small">
                  <Select
                    value={settings.language}
                    onChange={handleLanguageChange}>

                    {languages.map((lang) =>
                    <MenuItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem>
                <ListItemIcon>
                  <SaveIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Auto Save"
                  secondary="Automatically save forms while editing" />

                <Switch
                  edge="end"
                  checked={settings.autoSave}
                  onChange={() => handleToggle('autoSave')} />

              </ListItem>
            </List>
            <Box p={2} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                startIcon={<SaveIcon />}>

                Save Settings
              </Button>
            </Box>
          </Paper>
        </Grid>

        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Data Management" />
            <CardContent>
              <Typography variant="body2" paragraph>
                Manage your application data and exports.
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  fullWidth>

                  Export All Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  fullWidth>

                  Export Inspection Reports
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  fullWidth>

                  Clear Cache
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  fullWidth>

                  Reset All Data
                </Button>
              </Box>
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader title="Security" />
            <CardContent>
              <Typography variant="body2" paragraph>
                Manage security settings for your account.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                fullWidth
                sx={{ mb: 1 }}>

                Change Password
              </Button>
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                fullWidth>

                Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>);

};

export default Settings;