import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';

interface TopBarProps {
  onMenuClick?: () => void;
  userName?: string;
  userAvatarUrl?: string;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, userName = 'User', userAvatarUrl }) => {
  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          AeroSuite
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={userName}>
            <IconButton sx={{ p: 0 }}>
              <Avatar alt={userName} src={userAvatarUrl} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar; 