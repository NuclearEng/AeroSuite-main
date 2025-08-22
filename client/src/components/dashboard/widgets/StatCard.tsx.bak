import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | null;
  trendValue?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend = null, trendValue, color }) => {
  return (
    <Card sx={{ minWidth: 200, m: 1 }} aria-label={`Stat card for ${label}`}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon && <Avatar sx={{ bgcolor: color || 'primary.main', mr: 2 }}>{icon}</Avatar>}
          <Typography variant="h5" component="div">{value}</Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              {trend === 'up' ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
              {trendValue && <Typography variant="body2" color={trend === 'up' ? 'success.main' : 'error.main'} sx={{ ml: 0.5 }}>{trendValue}</Typography>}
            </Box>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard; 