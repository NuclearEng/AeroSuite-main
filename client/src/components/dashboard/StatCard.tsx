import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  IconButton, 
  useTheme, 
  Tooltip, 
  Skeleton,
  Grow,
  styled,
  SvgIconProps
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { keyframes } from '@mui/system';

// Pulse animation for hover effect
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.1);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
  }
`;

// Styled Card with interactive animations
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(3),
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.05)' 
    : 'rgba(0, 0, 0, 0.05)'}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    animation: `${pulse} 1.5s infinite`,
    '& .MuiSvgIcon-root.highlight-icon': {
      transform: 'scale(1.1) rotate(5deg)',
    }
  },
  '&:active': {
    transform: 'translateY(0px)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${theme.palette.primary.light}10, transparent)`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  }
}));

// Highlight section at the top of the card
const HighlightBar = styled(Box)(({ theme }) => ({
  height: 6,
  width: '30%',
  position: 'absolute',
  top: 0,
  left: 0,
  backgroundColor: theme.palette.primary.main,
  transition: 'width 0.3s ease',
  borderTopLeftRadius: 16,
  '&:hover': {
    width: '100%',
  }
}));

// Icon container with animations
const IconContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(37, 99, 235, 0.1)',
  borderRadius: '50%',
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
}));

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<SvgIconProps>;
  change?: number;
  changePeriod?: string;
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  onClick?: () => void;
  tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  changePeriod = 'from last period',
  loading = false,
  color = 'primary',
  onClick,
  tooltip
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine change indicator and color
  const showChange = typeof change === 'number';
  const isPositiveChange = showChange && change > 0;
  const changeColor = isPositiveChange 
    ? theme.palette.success.main 
    : theme.palette.error.main;
  
  // Get color based on prop
  const cardColor = theme.palette[color].main;
  
  return (
    <Grow in={true} timeout={800}>
      <StyledCard 
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{ 
          cursor: onClick ? 'pointer' : 'default',
          borderTop: `1px solid ${cardColor}40`,
        }}
      >
        <HighlightBar sx={{ backgroundColor: cardColor }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            {loading ? (
              <Skeleton variant="text" width={120} height={24} />
            ) : (
              <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                {title}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconContainer sx={{ backgroundColor: `${cardColor}20` }}>
              {React.cloneElement(icon, { 
                className: 'highlight-icon',
                sx: { 
                  color: cardColor,
                  transition: 'transform 0.3s ease',
                  fontSize: 24 
                } 
              })}
            </IconContainer>
            {tooltip && (
              <Tooltip title={tooltip} arrow>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <MoreHorizIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {loading ? (
          <Skeleton variant="rectangular" width="60%" height={40} sx={{ mb: 1 }} />
        ) : (
          <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
            {value}
          </Typography>
        )}
        
        {showChange && !loading && (
          <Box display="flex" alignItems="center">
            {isPositiveChange ? (
              <TrendingUpIcon sx={{ color: changeColor, mr: 0.5, fontSize: 16 }} />
            ) : (
              <TrendingDownIcon sx={{ color: changeColor, mr: 0.5, fontSize: 16 }} />
            )}
            <Typography variant="caption" sx={{ color: changeColor, fontWeight: 'medium' }}>
              {isPositiveChange ? '+' : ''}{change}% {changePeriod}
            </Typography>
          </Box>
        )}
      </StyledCard>
    </Grow>
  );
};

export default StatCard; 