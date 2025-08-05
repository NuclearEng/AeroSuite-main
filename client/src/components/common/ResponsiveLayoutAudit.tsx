import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Chip, 
  Tooltip, 
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TabletIcon from '@mui/icons-material/Tablet';
import LaptopIcon from '@mui/icons-material/Laptop';
import TvIcon from '@mui/icons-material/Tv';
import useResponsive from '../../hooks/useResponsive';

interface ResponsiveLayoutAuditProps {
  /**
   * Whether the audit tool is initially visible
   * @default true
   */
  initiallyVisible?: boolean;
  
  /**
   * Position of the audit tool
   * @default 'bottom-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * Whether to show the grid overlay
   * @default false
   */
  showGridOverlay?: boolean;
  
  /**
   * Whether to highlight touch targets
   * @default false
   */
  highlightTouchTargets?: boolean;
}

/**
 * A component that helps audit responsive layouts by showing viewport size and breakpoints
 */
const ResponsiveLayoutAudit: React.FC<ResponsiveLayoutAuditProps> = ({
  initiallyVisible = true,
  position = 'bottom-right',
  showGridOverlay: initialShowGrid = false,
  highlightTouchTargets: initialHighlightTouchTargets = false
}) => {
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(initialShowGrid);
  const [highlightTouchTargets, setHighlightTouchTargets] = useState(initialHighlightTouchTargets);
  
  const { 
    width, 
    height, 
    isMobile, 
    isTablet, 
    isDesktop, 
    orientation, 
    getCurrentBreakpoint 
  } = useResponsive();
  
  const currentBreakpoint = getCurrentBreakpoint();
  
  // Position styles
  const positionStyles = {
    'top-left': { top: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 }
  };
  
  // Get device icon based on current breakpoint
  const getDeviceIcon = () => {
    switch (currentBreakpoint) {
      case 'xs':
        return <PhoneAndroidIcon />;
      case 'sm':
        return <TabletIcon sx={{ transform: 'rotate(90deg)' }} />;
      case 'md':
        return <TabletIcon />;
      case 'lg':
        return <LaptopIcon />;
      case 'xl':
        return <TvIcon />;
      default:
        return <LaptopIcon />;
    }
  };
  
  // Get color based on device type
  const getBreakpointColor = () => {
    if (isMobile) return 'error';
    if (isTablet) return 'warning';
    return 'success';
  };
  
  // Toggle visibility of the audit tool
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Create grid overlay
  useEffect(() => {
    const existingOverlay = document.getElementById('responsive-grid-overlay');
    
    if (showGridOverlay) {
      if (!existingOverlay) {
        const overlay = document.createElement('div');
        overlay.id = 'responsive-grid-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999';
        
        // Create grid columns
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.height = '100%';
        container.style.maxWidth = '1200px';
        container.style.margin = '0 auto';
        container.style.padding = '0 16px';
        
        // Create 12 columns
        for (let i = 0; i < 12; i++) {
          const column = document.createElement('div');
          column.style.flex = '1';
          column.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
          column.style.border = '1px solid rgba(76, 175, 80, 0.2)';
          container.appendChild(column);
        }
        
        overlay.appendChild(container);
        document.body.appendChild(overlay);
      }
    } else if (existingOverlay) {
      existingOverlay.remove();
    }
    
    return () => {
      const overlay = document.getElementById('responsive-grid-overlay');
      if (overlay) {
        overlay.remove();
      }
    };
  }, [showGridOverlay]);
  
  // Highlight touch targets
  useEffect(() => {
    const existingHighlights = document.querySelectorAll('.touch-target-highlight');
    
    if (highlightTouchTargets) {
      // Remove existing highlights
      existingHighlights.forEach(el => el.remove());
      
      // Find all interactive elements
      const interactiveElements = document.querySelectorAll('button, a, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      
      interactiveElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        
        // Create highlight element
        const highlight = document.createElement('div');
        highlight.className = 'touch-target-highlight';
        highlight.style.position = 'absolute';
        highlight.style.top = `${window.scrollY + rect.top}px`;
        highlight.style.left = `${window.scrollX + rect.left}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.border = '2px solid red';
        highlight.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        highlight.style.zIndex = '9998';
        highlight.style.pointerEvents = 'none';
        
        // Add minimum size indicator if smaller than recommended
        if (rect.width < 48 || rect.height < 48) {
          const indicator = document.createElement('div');
          indicator.style.position = 'absolute';
          indicator.style.top = '0';
          indicator.style.right = '0';
          indicator.style.backgroundColor = 'red';
          indicator.style.color = 'white';
          indicator.style.padding = '2px 4px';
          indicator.style.fontSize = '10px';
          indicator.textContent = 'Small';
          highlight.appendChild(indicator);
        }
        
        document.body.appendChild(highlight);
      });
    } else {
      // Remove highlights
      existingHighlights.forEach(el => el.remove());
    }
    
    return () => {
      const highlights = document.querySelectorAll('.touch-target-highlight');
      highlights.forEach(el => el.remove());
    };
  }, [highlightTouchTargets]);
  
  // Floating button when collapsed
  if (!isVisible) {
    return (
      <Tooltip title="Show Responsive Audit">
        <IconButton
          color="primary"
          onClick={toggleVisibility}
          sx={{
            position: 'fixed',
            ...positionStyles[position],
            zIndex: 9999,
            backgroundColor: 'background.paper',
            boxShadow: 2
          }}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    );
  }
  
  // Collapsed view
  if (!isExpanded) {
    return (
      <Box
        sx={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Chip
          icon={getDeviceIcon()}
          label={`${width}×${height}`}
          color={getBreakpointColor()}
          onClick={toggleExpanded}
        />
        <IconButton size="small" onClick={toggleVisibility}>
          <VisibilityOffIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }
  
  // Full view
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        p: 2,
        width: { xs: 'calc(100% - 32px)', sm: 'auto' },
        maxWidth: { xs: 'calc(100% - 32px)', sm: '360px' }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Responsive Layout Audit
        </Typography>
        <Box>
          <IconButton size="small" onClick={toggleExpanded} sx={{ mr: 1 }}>
            <PhoneAndroidIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={toggleVisibility}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Viewport:</strong> {width}×{height}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Breakpoint:</strong>{' '}
            <Chip
              label={currentBreakpoint.toUpperCase()}
              color={getBreakpointColor()}
              size="small"
            />
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Device:</strong>{' '}
            {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            <strong>Orientation:</strong> {orientation}
          </Typography>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={showGridOverlay}
              onChange={(e) => setShowGridOverlay(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">Show Grid Overlay</Typography>}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={highlightTouchTargets}
              onChange={(e) => setHighlightTouchTargets(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">Highlight Touch Targets</Typography>}
        />
      </Box>
    </Paper>
  );
};

export default ResponsiveLayoutAudit; 