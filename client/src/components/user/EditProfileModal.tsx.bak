import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
  Divider,
  InputAdornment,
  useTheme,
  Alert,
  Snackbar } from
'@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  BusinessCenter as BusinessCenterIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Loop as SyncIcon } from
'@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// User profile type definition
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  position: string;
  department?: string;
  company?: string;
  location?: string;
  bio?: string;
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void>;
  disableEmail?: boolean;
}

// Validation schema using Yup
const validationSchema = Yup.object({
  firstName: Yup.string().
  required('First name is required').
  min(2, 'First name must be at least 2 characters').
  max(50, 'First name must be less than 50 characters'),
  lastName: Yup.string().
  required('Last name is required').
  min(2, 'Last name must be at least 2 characters').
  max(50, 'Last name must be less than 50 characters'),
  email: Yup.string().
  email('Invalid email address').
  required('Email is required'),
  phoneNumber: Yup.string().
  matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number format').
  required('Phone number is required'),
  position: Yup.string().
  required('Job position is required'),
  department: Yup.string(),
  company: Yup.string(),
  location: Yup.string(),
  bio: Yup.string().
  max(500, 'Bio must be less than 500 characters')
});

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  profile,
  onSave,
  disableEmail = false
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile.avatar);

  // Initialize form with Formik
  const formik = useFormik({
    initialValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      position: profile.position || '',
      department: profile.department || '',
      company: profile.company || '',
      location: profile.location || '',
      bio: profile.bio || ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError(null);

      try {
        const updatedProfile: UserProfile = {
          ...profile,
          ...values,
          avatar: avatarPreview || profile.avatar
        };

        // Upload avatar if changed (in a real app would do this before updating profile)
        // For now, we'll just assume the avatar is uploaded and set in the profile

        // Save profile
        await onSave(updatedProfile);
        setSuccess(true);

        // Close modal after short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (err: any) {
        setError(err.message || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    }
  });

  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Avatar image must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }

      setAvatarFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle close with confirmation if form is dirty
  const handleClose = () => {
    // If form has unsaved changes and is not in loading state
    if (formik.dirty && !loading && !success) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  // Reset form and state
  const resetForm = () => {
    formik.resetForm();
    setAvatarFile(null);
    setAvatarPreview(profile.avatar);
    setError(null);
    setSuccess(false);
  };

  // Handle Snackbar close
  const handleSnackbarClose = () => {
    setSuccess(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2 }
        }}>

        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Edit Profile</Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
              disabled={loading}>

              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error &&
          <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          }

          <form id="edit-profile-form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              
              <Grid item xs={12} display="flex" justifyContent="center">
                <Box
                  sx={{
                    position: 'relative',
                    mb: 2
                  }}>

                  <Avatar
                    src={avatarPreview}
                    alt={`${formik.values.firstName} ${formik.values.lastName}`}
                    sx={{
                      width: 100,
                      height: 100,
                      border: `4px solid ${theme.palette.primary.main}`
                    }} />

                  <label htmlFor="avatar-upload">
                    <input
                      accept="image/*"
                      id="avatar-upload"
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleAvatarChange}
                      disabled={loading} />

                    <IconButton
                      aria-label="change profile picture"
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: theme.shadows[2],
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        }
                      }}
                      disabled={loading}>

                      <PhotoCameraIcon />
                    </IconButton>
                  </label>
                </Box>
              </Grid>

              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>

                  }}
                  disabled={loading} />

              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>

                  }}
                  disabled={loading} />

              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={
                  formik.touched.email && formik.errors.email || (
                  disableEmail ? "Email cannot be changed directly" : "")
                  }
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>

                  }}
                  disabled={loading || disableEmail} />

              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Phone Number"
                  value={formik.values.phoneNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                  helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>

                  }}
                  disabled={loading} />

              </Grid>

              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Work Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="position"
                  name="position"
                  label="Job Position"
                  value={formik.values.position}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.position && Boolean(formik.errors.position)}
                  helperText={formik.touched.position && formik.errors.position}
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <WorkIcon />
                      </InputAdornment>

                  }}
                  disabled={loading} />

              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="department"
                  name="department"
                  label="Department"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.department && Boolean(formik.errors.department)}
                  helperText={formik.touched.department && formik.errors.department}
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <BusinessCenterIcon />
                      </InputAdornment>

                  }}
                  disabled={loading} />

              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="company"
                  name="company"
                  label="Company"
                  value={formik.values.company}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company && Boolean(formik.errors.company)}
                  helperText={formik.touched.company && formik.errors.company}
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <BusinessCenterIcon />
                      </InputAdornment>

                  }}
                  disabled={loading} />

              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="location"
                  name="location"
                  label="Location"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.location && Boolean(formik.errors.location)}
                  helperText={formik.touched.location && formik.errors.location}
                  InputProps={{
                    startAdornment:
                    <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>

                  }}
                  disabled={loading} />

              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="bio"
                  name="bio"
                  label="Bio"
                  multiline
                  rows={4}
                  value={formik.values.bio}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.bio && Boolean(formik.errors.bio)}
                  helperText={
                  formik.touched.bio && formik.errors.bio ||
                  `${formik.values.bio.length}/500 characters`
                  }
                  disabled={loading} />

              </Grid>
            </Grid>
          </form>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading}>

            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-profile-form"
            variant="contained"
            color="primary"
            disabled={!formik.dirty || !formik.isValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}>

            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>

        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled">

          Profile updated successfully!
        </Alert>
      </Snackbar>
    </>);

};

export default EditProfileModal;