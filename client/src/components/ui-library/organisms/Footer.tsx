import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        borderTop: 1,
        borderColor: 'divider',
        textAlign: 'center',
      }}
      aria-label="Footer"
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} AeroSuite. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer; 