import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export interface CustomerCardProps {
  name: string;
  email: string;
  avatarUrl?: string;
  company?: string;
  details?: React.ReactNode;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ name, email, avatarUrl, company, details }) => {
  return (
    <Card sx={{ maxWidth: 345, m: 1 }} aria-label={`Customer card for ${name}`}>
      <CardHeader
        avatar={<Avatar alt={name} src={avatarUrl} />}
        title={name}
        subheader={company}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {email}
        </Typography>
        {details && <Box mt={2}>{details}</Box>}
      </CardContent>
    </Card>
  );
};

export default CustomerCard; 