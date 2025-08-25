// Assume similar to MonitoringNavigation
import React from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';

const InspectionNavigation = () => {
  const location = useLocation();
  const navItems = [
    { name: 'Inspections', path: '/inspections', icon: <AssignmentIcon /> },
    { name: 'Kanban', path: '/inspections/kanban', icon: <ViewKanbanIcon /> },
    { name: 'Inspector Profile', path: '/inspections/inspector-profile', icon: <PersonIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ px: 2, py: 1 }}>Inspections</Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton component={Link} to={item.path} selected={location.pathname === item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default InspectionNavigation;
