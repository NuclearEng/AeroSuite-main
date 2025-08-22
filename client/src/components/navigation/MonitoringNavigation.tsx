import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Typography,
  Box
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Storage as StorageIcon,
  BugReport as BugIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
  Dns as DnsIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const MonitoringNavigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Navigation items for monitoring section
  const navigationItems = [
    {
      name: t('monitoring.performance'),
      path: '/monitoring/performance',
      icon: <SpeedIcon />
    },
    {
      name: t('monitoring.errors'),
      path: '/monitoring/error-analytics',
      icon: <BugIcon />
    },
    {
      name: t('monitoring.userAnalytics'),
      path: '/monitoring/user-analytics',
      icon: <PeopleIcon />
    },
    {
      name: t('monitoring.backups'),
      path: '/monitoring/backups',
      icon: <StorageIcon />
    },
    {
      name: t('monitoring.metrics'),
      path: '/monitoring/metrics',
      icon: <TimelineIcon />
    },
    {
      name: t('monitoring.logs'),
      path: '/monitoring/logs',
      icon: <DnsIcon />
    },
    {
      name: t('monitoring.uptime'),
      path: '/monitoring/uptime',
      icon: <VisibilityIcon />
    }
  ];
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ px: 2, py: 1 }}>
        {t('navigation.monitoring')}
      </Typography>
      <Divider />
      <List>
        {navigationItems.map((item: any) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MonitoringNavigation; 