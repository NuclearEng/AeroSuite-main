import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Divider,
  Paper,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon } from
'@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Security as SecurityIcon } from
'@mui/icons-material';
import { ProfileEditModal } from '../../components/user';
import userService, { User } from '../../services/user.service';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userData = await userService.getCurrentUser();
        setUser(userData);
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Handle edit profile
  const handleEditProfile = () => {
    setEditModalOpen(true);
  };

  // Handle profile update
  const handleProfileUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    setSnackbar({
      open: true,
      message: 'Profile updated successfully',
      severity: 'success'
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Format department name
  const formatDepartment = (department?: string) => {
    if (!department) return 'Not specified';

    return department.
    split('_').
    map((word) => word.charAt(0).toUpperCase() + word.slice(1)).
    join(' ');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading profile...</Typography>
      </Box>);

  }

  if (error || !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Unable to load profile information'}
        </Alert>
      </Box>);

  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Profile
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
          onClick={handleEditProfile}>

          Edit Profile
        </Button>
      </Box>

      <Grid container spacing={3}>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <Avatar
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}>

                {user.firstName && user.lastName ?
                `${user.firstName[0]}${user.lastName[0]}` :
                ''}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user.position || 'No position specified'}
              </Typography>
              <Chip
                label={formatDepartment(user.department)}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ mt: 1 }} />

              <Chip
                label={user.role}
                color="secondary"
                variant="outlined"
                size="small"
                sx={{ mt: 1, ml: 1 }} />

            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={user.email} />

                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone"
                    secondary={user.phone || 'Not provided'} />

                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WorkIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Position"
                    secondary={user.position || 'Not specified'} />

                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Department"
                    secondary={formatDepartment(user.department)} />

                </ListItem>
              </List>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Role"
                      secondary={user.role} />

                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Password"
                      secondary="********" />

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        // Handle password change
                        setSnackbar({
                          open: true,
                          message: 'Password change functionality will be implemented separately',
                          severity: 'info'
                        });
                      }}>

                      Change
                    </Button>
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      
      {user &&
      <ProfileEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleProfileUpdated}
        userId={user._id}
        initialData={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          position: user.position || '',
          department: user.department || '',
          avatarUrl: user.avatarUrl
        }} />

      }

      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>

        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>);

};

export default Profile;