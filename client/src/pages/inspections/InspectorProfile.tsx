import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';

const InspectorProfile = () => {
  // Mock data
  const profile = { name: 'John Doe', role: 'Senior Inspector', experience: '10 years' };

  return (
    <Box>
      <Typography variant="h4">Inspector Profile</Typography>
      <Card>
        <CardContent>
          <Typography>Name: {profile.name}</Typography>
          <Typography>Role: {profile.role}</Typography>
          <Typography>Experience: {profile.experience}</Typography>
          <Button>Edit Profile</Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InspectorProfile;
