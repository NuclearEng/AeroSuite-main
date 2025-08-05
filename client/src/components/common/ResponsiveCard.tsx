import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardActions, 
  CardMedia, 
  CardProps, 
  Box, 
  Typography, 
  styled 
} from '@mui/material';
import useResponsive from '../../hooks/useResponsive';

interface ResponsiveCardProps extends CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  media?: {
    component?: 'img' | 'video' | 'audio' | 'iframe';
    src: string;
    alt?: string;
    height?: number | string;
  };
  actions?: React.ReactNode;
  adaptiveHeight?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
  noContentPadding?: boolean;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

// Styled components
const StyledCard = styled(Card)<{ 
  fullWidth?: boolean; 
  adaptiveHeight?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
}>(({ theme, fullWidth, adaptiveHeight, minHeight, maxHeight }) => ({
  width: fullWidth ? '100%' : undefined,
  height: adaptiveHeight ? '100%' : undefined,
  minHeight: minHeight || undefined,
  maxHeight: maxHeight || undefined,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.standard,
  }),
  '&:hover': {
    boxShadow: theme.shadows[4],
  }
}));

const CardContentWrapper = styled(CardContent)<{ noContentPadding?: boolean }>(
  ({ theme, noContentPadding }) => ({
    flexGrow: 1,
    padding: noContentPadding ? 0 : undefined,
    '&:last-child': {
      paddingBottom: noContentPadding ? 0 : theme.spacing(2),
    },
  })
);

/**
 * A responsive card component that adapts to different screen sizes.
 * It provides a consistent card interface with responsive behavior.
 */
const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  subtitle,
  headerAction,
  media,
  actions,
  adaptiveHeight = false,
  minHeight,
  maxHeight,
  noContentPadding = false,
  children,
  fullWidth = false,
  ...cardProps
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  // Adjust padding based on screen size
  const getPadding = () => {
    if (isMobile) return 1;
    if (isTablet) return 1.5;
    return 2;
  };
  
  return (
    <StyledCard 
      fullWidth={fullWidth} 
      adaptiveHeight={adaptiveHeight}
      minHeight={minHeight}
      maxHeight={maxHeight}
      {...cardProps}
    >
      {/* Card Header */}
      {(title || subtitle) && (
        <CardHeader
          title={title && (
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="h2"
              noWrap={isMobile}
            >
              {title}
            </Typography>
          )}
          subheader={subtitle && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              noWrap={isMobile}
            >
              {subtitle}
            </Typography>
          )}
          action={headerAction}
          sx={{ 
            padding: getPadding(),
            '& .MuiCardHeader-action': {
              margin: 0,
              alignSelf: 'center',
            }
          }}
        />
      )}
      
      {/* Card Media */}
      {media && (
        <CardMedia
          component={media.component || 'img'}
          src={media.src}
          alt={media.alt || 'Card media'}
          height={isMobile ? (
            typeof media.height === 'number' ? Math.floor(media.height * 0.7) : '140'
          ) : media.height || '200'}
          sx={{ objectFit: 'cover' }}
        />
      )}
      
      {/* Card Content */}
      <CardContentWrapper noContentPadding={noContentPadding}>
        {children}
      </CardContentWrapper>
      
      {/* Card Actions */}
      {actions && (
        <CardActions sx={{ 
          padding: getPadding(),
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          '& > *': { margin: '4px !important' }
        }}>
          {actions}
        </CardActions>
      )}
    </StyledCard>
  );
};

export default ResponsiveCard; 