import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Grid,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const Profile: React.FC = () => {
  // Mock user data
  const [userData, setUserData] = useState({
    firstName: 'Tanner',
    lastName: 'Coker',
    email: 'tanner@aerosuite.example.com',
    role: 'Administrator',
    phone: '+1 (555) 123-4567',
    company: 'AeroSuite Inc.',
    title: 'Senior Quality Engineer'
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    newInspections: true,
    inspectionUpdates: true,
    inspectionResults: true,
    systemUpdates: false
  });

  const [saved, setSaved] = useState(false);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic would go here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  // Handle notification preference changes
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(prev => ({
      ...prev,
      [e.target.name]: e.target.checked
    }));
  };

  return (
    <Box>
      {/* Page header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Manage your account information and settings
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
              >
                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {userData.firstName} {userData.lastName}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {userData.title} • {userData.role}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    variant="outlined"
                    type="email"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={userData.phone}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    name="company"
                    value={userData.company}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    name="title"
                    value={userData.title}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Notification Preferences */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Notification Preferences" />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailNotifications}
                    onChange={handleNotificationChange}
                    name="emailNotifications"
                    color="primary"
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="body2" color="textSecondary" sx={{ ml: 3, mb: 2 }}>
                Receive email notifications for important updates
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.newInspections}
                    onChange={handleNotificationChange}
                    name="newInspections"
                    color="primary"
                    disabled={!notifications.emailNotifications}
                  />
                }
                label="New Inspections"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.inspectionUpdates}
                    onChange={handleNotificationChange}
                    name="inspectionUpdates"
                    color="primary"
                    disabled={!notifications.emailNotifications}
                  />
                }
                label="Inspection Updates"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.inspectionResults}
                    onChange={handleNotificationChange}
                    name="inspectionResults"
                    color="primary"
                    disabled={!notifications.emailNotifications}
                  />
                }
                label="Inspection Results"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.systemUpdates}
                    onChange={handleNotificationChange}
                    name="systemUpdates"
                    color="primary"
                    disabled={!notifications.emailNotifications}
                  />
                }
                label="System Updates"
              />

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    // Save notification preferences
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                  }}
                >
                  Save Preferences
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 