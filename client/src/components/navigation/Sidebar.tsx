import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  IconButton,
  Typography,
  alpha,
  useTheme,
  styled,
  Tooltip } from
'@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { useThemeContext } from '../../theme/ThemeProvider';
import { useAppSelector, RootState } from '../../redux/store';
import { Speed as SpeedIcon, Science as ScienceIcon } from '@mui/icons-material';

// Drawer width
const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 72;

// Animated ListItemButton with hover effects
const AnimatedListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 12,
  margin: '4px 12px',
  padding: '10px 12px',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease'
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    '&::before': {
      transform: 'translateX(100%)'
    }
  },
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: '70%',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '0 4px 4px 0'
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.16)
    }
  }
}));

// Logo component with animation
const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  '& svg': {
    transition: 'transform 0.3s ease'
  },
  '&:hover svg': {
    transform: 'rotate(5deg) scale(1.1)'
  }
}));

// Logo icon that pulses on hover
const LogoIcon = styled('div')(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  marginRight: 12,
  fontWeight: 'bold',
  fontSize: 18,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

// Menu section header
const MenuSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  marginLeft: theme.spacing(2),
  letterSpacing: '0.08em'
}));

// Menu item type definition
interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  badge?: number;
  roles?: string[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  onToggle,
  variant = 'permanent'
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useThemeContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState('');

  // User data (assuming we have a user in redux)
  const user = useAppSelector((state: RootState) => state.auth.user);

  // Define menu items
  const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: <HomeIcon />
  },
  {
    id: 'customers',
    title: 'Customers',
    path: '/customers',
    icon: <PeopleIcon />,
    children: [
    {
      id: 'customer-list',
      title: 'Customer List',
      path: '/customers',
      icon: <PeopleIcon />
    },
    {
      id: 'customer-create',
      title: 'Add Customer',
      path: '/customers/create',
      icon: <PeopleIcon />
    }]

  },
  {
    id: 'suppliers',
    title: 'Suppliers',
    path: '/suppliers',
    icon: <BusinessIcon />,
    children: [
    {
      id: 'supplier-list',
      title: 'Supplier List',
      path: '/suppliers',
      icon: <BusinessIcon />
    },
    {
      id: 'supplier-create',
      title: 'Add Supplier',
      path: '/suppliers/create',
      icon: <BusinessIcon />
    },
    {
      id: 'supplier-enhanced-form',
      title: 'Enhanced Form',
      path: '/suppliers/enhanced-form',
      icon: <BusinessIcon />
    },
    {
      id: 'supplier-enhanced-table',
      title: 'Enhanced Table',
      path: '/suppliers/enhanced-table',
      icon: <BusinessIcon />
    }]

  },
  {
    id: 'inspections',
    title: 'Inspections',
    path: '/inspections',
    icon: <AssignmentIcon />,
    badge: 5,
    children: [
    {
      id: 'inspection-list',
      title: 'All Inspections',
      path: '/inspections',
      icon: <AssignmentIcon />
    },
    {
      id: 'inspection-schedule',
      title: 'Schedule Inspection',
      path: '/inspections/schedule',
      icon: <AssignmentIcon />
    }]

  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    icon: <BarChartIcon />,
    children: [
    {
      id: 'report-builder',
      title: 'Report Builder',
      path: '/reports/builder',
      icon: <BarChartIcon />
    },
    {
      id: 'data-visualization',
      title: 'Data Visualization',
      path: '/reports/visualization',
      icon: <BarChartIcon />
    },
    {
      id: 'application-metrics',
      title: 'Application Metrics',
      path: '/metrics',
      icon: <BarChartIcon />
    }]

  },
  {
    id: 'ai-analysis',
    title: 'AI Analysis',
    path: '/ai-analysis',
    icon: <ScienceIcon />
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />
  },
  {
    id: 'performance-metrics',
    title: 'Performance Metrics',
    path: '/monitoring/performance',
    icon: <SpeedIcon />,
    roles: ['admin', 'developer']
  }];


  // Set active item based on current location
  useEffect(() => {
    const currentPath = location.pathname;

    // Find the menu item that matches the current path
    const findActiveItem = (items: MenuItem[]): string => {
      for (const item of items) {
        if (item.path === currentPath) {
          return item.id;
        }
        if (item.children) {
          const childActiveItem = findActiveItem(item.children);
          if (childActiveItem) {
            // Expand the parent if a child is active
            if (!expandedItems.includes(item.id)) {
              setExpandedItems((prev) => [...prev, item.id]);
            }
            return childActiveItem;
          }
        }
      }
      return '';
    };

    const activeItemId = findActiveItem(menuItems);
    setActiveItem(activeItemId);
  }, [location.pathname, expandedItems]);

  // Toggle menu item expansion
  const handleExpandClick = (itemId: string) => {
    setExpandedItems((prev) =>
    prev.includes(itemId) ?
    prev.filter((id) => id !== itemId) :
    [...prev, itemId]
    );
  };

  // Handle menu item click
  const handleMenuItemClick = (item: MenuItem) => {
    if (item.children) {
      handleExpandClick(item.id);
    } else {
      navigate(item.path);
      if (variant === 'temporary') {
        onClose();
      }
    }
  };

  // Render menu items recursively
  const RenderMenuItems = (items: MenuItem[], level = 0) =>
  <>
      {items.map((item) => {
      const isSelected = activeItem === item.id;
      const isExpanded = expandedItems.includes(item.id);

      return (
        <React.Fragment key={item.id}>
            <AnimatedListItemButton
            selected={isSelected}
            onClick={() => handleMenuItemClick(item)}
            sx={{
              pl: level * 2 + 2,
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center'
            }}>

              <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
                color: isSelected ? theme.palette.primary.main : 'inherit'
              }}>

                {item.icon}
              </ListItemIcon>
              
              {open &&
            <>
                  <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontWeight: isSelected ? 600 : 400,
                  variant: 'body2',
                  noWrap: true
                }}
                sx={{ opacity: open ? 1 : 0 }} />

                  
                  {item.badge &&
              <Box
                sx={{
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  minWidth: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  ml: 1
                }}>

                      {item.badge}
                    </Box>
              }
                  
                  {item.children &&
              <ExpandMoreIcon
                sx={{
                  transition: 'transform 0.3s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />

              }
                </>
            }
            </AnimatedListItemButton>
            
            {item.children &&
          <Collapse in={open && isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {RenderMenuItems(item.children, level + 1)}
                </List>
              </Collapse>
          }
          </React.Fragment>);

    })}
    </>;


  // Drawer content
  const drawerContent =
  <>
      <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        p: theme.spacing(2),
        pb: theme.spacing(1)
      }}>

        {open ?
      <Logo>
            <LogoIcon>A</LogoIcon>
            <Typography variant="h6" fontWeight="bold" noWrap>
              AeroSuite
            </Typography>
          </Logo> :

      <Tooltip title="AeroSuite" arrow placement="right">
            <LogoIcon>A</LogoIcon>
          </Tooltip>
      }
        
        <IconButton onClick={onToggle} sx={{ mx: 0.5 }}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <List sx={{ pt: 0 }}>
        <MenuSectionTitle sx={{ opacity: open ? 1 : 0, height: open ? 'auto' : 0 }}>
          Main Menu
        </MenuSectionTitle>
        {RenderMenuItems(menuItems)}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      <Box
      sx={{
        p: theme.spacing(2),
        display: 'flex',
        flexDirection: 'column',
        alignItems: open ? 'flex-start' : 'center'
      }}>

        {open && user &&
      <Box sx={{ mb: 2, width: '100%' }}>
            <Typography variant="subtitle2" fontWeight="medium" noWrap>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.role}
            </Typography>
          </Box>
      }
        
        {!open && user &&
      <Tooltip title={`${user.firstName} ${user.lastName}`} arrow placement="right">
            <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            mb: 2
          }}>

              {user.firstName?.[0]}{user.lastName?.[0]}
            </Box>
          </Tooltip>
      }
      </Box>
    </>;


  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: theme.shadows[3],
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          }),
          overflowX: 'hidden',
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(to bottom, ${alpha(theme.palette.primary.main, 0.03)}, transparent)`
        }
      }}>

      {drawerContent}
    </Drawer>);

};

export default Sidebar;