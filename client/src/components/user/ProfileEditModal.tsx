import React, { ChangeEvent, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  Alert } from
'@mui/material';
import { Save as SaveIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import userService, { User, UpdateUserData } from '../../services/user.service';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  [key: string]: string | undefined;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  avatar?: File | null;
  avatarUrl?: string;
}

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  initialData?: Partial<ProfileFormData>;
  userId?: string;
}

const initialFormValues: ProfileFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  avatar: null,
  avatarUrl: ''
};

// Department options
const departmentOptions = [
{ value: 'engineering', label: 'Engineering' },
{ value: 'quality', label: 'Quality Assurance' },
{ value: 'operations', label: 'Operations' },
{ value: 'management', label: 'Management' },
{ value: 'sales', label: 'Sales' },
{ value: 'support', label: 'Support' },
{ value: 'other', label: 'Other' }];


const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  userId
}) => {
  const [formValues, setFormValues] = useState<any>({
    ...initialFormValues,
    ...initialData
  });
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<any>(initialData?.avatarUrl);

  // Load user data if needed
  useEffect(() => {
    if (userId && open && !initialData) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          setApiError(null);
          const userData = await userService.getUserProfile(userId);
          setFormValues({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            position: userData.position || '',
            department: userData.department || '',
            avatarUrl: userData.avatarUrl || ''
          });
          setAvatarPreview(userData.avatarUrl);
        } catch (error: any) {
          console.error("Error:", error);
          setApiError(error.message || 'Failed to load user profile data');
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    } else if (initialData) {
      setAvatarPreview(initialData.avatarUrl);
    }
  }, [userId, open, initialData]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | {name?: string;value: any;}>) => {
    const { name, value } = e.target;

    if (!name) return;

    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Clear API error when any field changes
    if (apiError) {
      setApiError(null);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setApiError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setApiError('File is too large. Maximum size is 5MB.');
      return;
    }

    // Create preview URL
    const fileUrl = URL.createObjectURL(file);
    setAvatarPreview(fileUrl);

    setFormValues((prev) => ({
      ...prev,
      avatar: file
    }));

    // Clear API error
    if (apiError) {
      setApiError(null);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formValues.firstName) newErrors.firstName = 'First name is required';
    if (!formValues.lastName) newErrors.lastName = 'Last name is required';
    if (!formValues.email) newErrors.email = 'Email is required';

    // Email validation
    if (formValues.email && !/\S+@\S+\.\S+/.test(formValues.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Phone validation (optional field)
    if (formValues.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(formValues.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Map form values to user data structure
      const userData: UpdateUserData = {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        phone: formValues.phone,
        position: formValues.position,
        department: formValues.department
      };

      let savedUser: User;

      if (userId) {
        // Update user profile
        savedUser = await userService.updateUserProfile(userId, userData);

        // Upload avatar if changed
        if (formValues.avatar) {
          try {
            const formData = new FormData();
            formData.append('avatar', formValues.avatar);
            await userService.uploadAvatar(userId, formData);

            // Refresh user data to get updated avatar URL
            savedUser = await userService.getUserProfile(userId);
          } catch (avatarError: any) {
            // Continue with the save but notify about avatar upload failure
            console.error('Error uploading avatar:', avatarError);
            setApiError(`Profile updated but avatar upload failed: ${avatarError.message || 'Unknown error'}`);
            onSave(savedUser);
            return;
          }
        }

        onSave(savedUser);
        onClose();
      } else {
        // This should not happen as we're editing an existing profile
        throw new Error('User ID is required for profile update');
      }
    } catch (error: any) {
      console.error("Error:", error);
      setApiError(error.message || 'Failed to save profile changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md">

      <DialogTitle>
        Edit Profile
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ?
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box> :

        <form id="profile-form" onSubmit={handleSubmit}>
            {apiError &&
          <Alert severity="error" sx={{ mb: 3 }}>
                {apiError}
              </Alert>
          }
            
            <Grid container spacing={3}>
              
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                  src={avatarPreview}
                  sx={{ width: 120, height: 120, mb: 1 }}
                  alt={`${formValues.firstName} ${formValues.lastName}`}>

                    {formValues.firstName && formValues.lastName ?
                  `${formValues.firstName[0]}${formValues.lastName[0]}` :
                  ''}
                  </Avatar>
                  <Button
                  component="label"
                  variant="contained"
                  startIcon={<PhotoCameraIcon />}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: -20,
                    borderRadius: '50%',
                    minWidth: 'auto',
                    width: 40,
                    height: 40,
                    p: 0
                  }}>

                    <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange} />

                    <PhotoCameraIcon fontSize="small" />
                  </Button>
                </Box>
              </Grid>
              
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                fullWidth
                required
                label="First Name"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName} />

              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                fullWidth
                required
                label="Last Name"
                name="lastName"
                value={formValues.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName} />

              </Grid>
              
              <Grid item xs={12}>
                <TextField
                fullWidth
                required
                label="Email Address"
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email} />

              </Grid>
              
              <Grid item xs={12}>
                <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formValues.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone || 'Format: +1 (555) 123-4567'} />

              </Grid>
              
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Professional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                fullWidth
                label="Position"
                name="position"
                value={formValues.position}
                onChange={handleChange}
                placeholder="Your job title" />

              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                  name="department"
                  value={formValues.department}
                  label="Department"
                  onChange={handleChange as any}>

                    {departmentOptions.map((option: any) =>
                  <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                  )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </form>
        }
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          form="profile-form"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={isSubmitting || loading}>

          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>);

};

export default ProfileEditModal;