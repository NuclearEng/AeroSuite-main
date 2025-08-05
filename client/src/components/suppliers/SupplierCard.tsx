import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import SupplierRiskIndicator, { SupplierRiskLevel } from './SupplierRiskIndicator';

export interface SupplierCardProps {
  name: string;
  supplierId: string;
  avatarUrl?: string;
  risk: SupplierRiskLevel;
  status?: 'Active' | 'Inactive' | 'Pending';
  location?: string;
  details?: React.ReactNode;
}

const statusColor = {
  Active: 'success',
  Inactive: 'default',
  Pending: 'warning',
} as const;

const SupplierCard: React.FC<SupplierCardProps> = ({ name, supplierId, avatarUrl, risk, status = 'Active', location, details }) => {
  return (
    <Card sx={{ maxWidth: 345, m: 1 }} aria-label={`Supplier card for ${name}`}>
      <CardHeader
        avatar={<Avatar alt={name} src={avatarUrl} />}
        title={name}
        subheader={supplierId}
        action={<Chip label={status} color={statusColor[status]} size="small" />}
      />
      <CardContent>
        <Box sx={{ mb: 1 }}>
          <SupplierRiskIndicator risk={risk} />
        </Box>
        {location && (
          <Typography variant="body2" color="text.secondary">Location: {location}</Typography>
        )}
        {details && <Box mt={2}>{details}</Box>}
      </CardContent>
    </Card>
  );
};

export default SupplierCard; 