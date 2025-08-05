import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as InspectionIcon,
  Business as CustomerIcon,
  Factory as SupplierIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  EventNote as ScheduleIcon,
  Map as MapIcon,
  Assessment as AnalyticsIcon,
  Security as RiskIcon
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  drawerWidth: number;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, drawerWidth }) => {
  const location = useLocation();
  const [inspectionsOpen, setInspectionsOpen] = useState(true);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);

  const toggleInspections = () => {
    setInspectionsOpen(!inspectionsOpen);
  };

  const toggleCustomers = () => {
    setCustomersOpen(!customersOpen);
  };

  const toggleSuppliers = () => {
    setSuppliersOpen(!suppliersOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          AeroSuite
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Inspection Management
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/"
            selected={isActive('/')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Inspections Section */}
        <ListItem disablePadding>
          <ListItemButton onClick={toggleInspections}>
            <ListItemIcon>
              <InspectionIcon />
            </ListItemIcon>
            <ListItemText primary="Inspections" />
            {inspectionsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={inspectionsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/inspections"
              selected={isActive('/inspections')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <InspectionIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Inspections" />
            </ListItemButton>
            <ListItemButton
              component={RouterLink}
              to="/inspections/schedule"
              selected={isActive('/inspections/schedule')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <ScheduleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Schedule Inspection" />
            </ListItemButton>
            <ListItemButton
              component={RouterLink}
              to="/inspections/dashboard"
              selected={isActive('/inspections/dashboard')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <DashboardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Inspection Dashboard" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Customers Section */}
        <ListItem disablePadding>
          <ListItemButton onClick={toggleCustomers}>
            <ListItemIcon>
              <CustomerIcon />
            </ListItemIcon>
            <ListItemText primary="Customers" />
            {customersOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={customersOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/customers"
              selected={isActive('/customers')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <CustomerIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Customers" />
            </ListItemButton>
            <ListItemButton
              component={RouterLink}
              to="/customers/add"
              selected={isActive('/customers/add')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Customer" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Suppliers Section */}
        <ListItem disablePadding>
          <ListItemButton onClick={toggleSuppliers}>
            <ListItemIcon>
              <SupplierIcon />
            </ListItemIcon>
            <ListItemText primary="Suppliers" />
            {suppliersOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={suppliersOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={RouterLink}
              to="/suppliers"
              selected={isActive('/suppliers')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <SupplierIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Suppliers" />
            </ListItemButton>
            <ListItemButton
              component={RouterLink}
              to="/suppliers/add"
              selected={isActive('/suppliers/add')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Supplier" />
            </ListItemButton>
            <ListItemButton
              component={RouterLink}
              to="/suppliers/network"
              selected={isActive('/suppliers/network')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <MapIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Supplier Network" />
            </ListItemButton>
            <ListItemButton
              component={RouterLink}
              to="/suppliers/analytics"
              selected={isActive('/suppliers/analytics')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <AnalyticsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Supplier Analytics" />
            </ListItemButton>
            <ListItemButton
              component={RouterLink}
              to="/suppliers/risk-assessment"
              selected={isActive('/suppliers/risk-assessment')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <RiskIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Risk Assessment" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar; 