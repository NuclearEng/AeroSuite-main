import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Avatar, 
  Button, 
  Grid,
  useTheme
} from '@mui/material';
import { Person as PersonIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  jobTitle: string;
  department: string;
  profileImage: File | null;
}

interface ProfileSetupStepProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
}

/**
 * Profile Setup Step
 * 
 * The second step in the onboarding flow that allows users to 
 * complete their profile information.
 */
const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({ profileData, setProfileData }) => {
  const theme = useTheme();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle text field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileData(prev => ({
        ...prev,
        profileImage: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box>
      <Typography variant="h5" align="center" gutterBottom>
        Complete Your Profile
      </Typography>
      
      <Typography variant="body1" align="center" paragraph>
        Let's set up your profile information so your colleagues can identify you.
      </Typography>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 4 
        }}
      >
        <Avatar
          src={previewUrl || undefined}
          sx={{
            width: 100,
            height: 100,
            mb: 2,
            bgcolor: theme.palette.primary.main
          }}
        >
          {!previewUrl && <PersonIcon sx={{ fontSize: 60 }} />}
        </Avatar>
        
        <Button
          component="label"
          variant="outlined"
          startIcon={<PhotoCameraIcon />}
          size="small"
        >
          Upload Photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="firstName"
            label="First Name"
            value={profileData.firstName}
            onChange={handleChange}
            fullWidth
            required
            error={!profileData.firstName}
            helperText={!profileData.firstName ? 'First name is required' : ''}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="lastName"
            label="Last Name"
            value={profileData.lastName}
            onChange={handleChange}
            fullWidth
            required
            error={!profileData.lastName}
            helperText={!profileData.lastName ? 'Last name is required' : ''}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="phoneNumber"
            label="Phone Number"
            value={profileData.phoneNumber}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="jobTitle"
            label="Job Title"
            value={profileData.jobTitle}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="department"
            label="Department"
            value={profileData.department}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileSetupStep; 