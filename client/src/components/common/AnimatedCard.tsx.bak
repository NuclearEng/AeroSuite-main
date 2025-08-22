import React, { ReactNode } from 'react';
import { 
  Card, 
  CardProps, 
  CardContent, 
  CardHeader, 
  CardActions,
  Typography,
  Box,
} from '@mui/material';
import { useTheme, SxProps, Theme } from '@mui/material/styles';

interface AnimatedCardProps extends CardProps {
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  hoverEffect?: 'lift' | 'glow' | 'border' | 'none';
  clickable?: boolean;
  animationDelay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  hoverEffect = 'lift',
  clickable = false,
  animationDelay = 0,
  onClick,
  sx,
  ...props
}) => {
  const theme = useTheme();
  
  // Define hover effects
  const hoverStyles: Record<string, SxProps<Theme>> = {
    lift: {
      transition: theme.transitions.create(['transform', 'box-shadow'], {
        duration: theme.transitions.duration.short,
        easing: theme.transitions.easing.easeInOut,
      }),
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: theme.shadows[4],
      },
    },
    glow: {
      transition: theme.transitions.create('box-shadow', {
        duration: theme.transitions.duration.short,
        easing: theme.transitions.easing.easeInOut,
      }),
      '&:hover': {
        boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
      },
    },
    border: {
      transition: theme.transitions.create('border-color', {
        duration: theme.transitions.duration.short,
        easing: theme.transitions.easing.easeInOut,
      }),
      '&:hover': {
        borderColor: theme.palette.primary.main,
      },
    },
    none: {},
  };
  
  // Define entrance animation
  const entranceAnimation: SxProps<Theme> = {
    animation: `fadeIn 0.5s ${theme.transitions.easing.easeOut} ${animationDelay}s both`,
    '@keyframes fadeIn': {
      '0%': { opacity: 0, transform: 'translateY(20px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
  };
  
  // Combine all styles
  const cardStyles: SxProps<Theme> = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    cursor: clickable || onClick ? 'pointer' : 'default',
    borderWidth: hoverEffect === 'border' ? 1 : 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    ...(hoverStyles[hoverEffect] as any),
    ...entranceAnimation,
    ...(sx as any),
  };

  return (
    <Card 
      sx={cardStyles} 
      onClick={onClick}
      {...props}
    >
      {title && (
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
          }
          subheader={subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          action={headerAction}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        {children}
      </CardContent>
      
      {footer && (
        <CardActions>
          {footer}
        </CardActions>
      )}
    </Card>
  );
};

export default AnimatedCard; 