import React from 'react';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link, 
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onBack?: () => void;
  sx?: React.CSSProperties;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  onBack,
  sx
}) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        ...sx
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {onBack && (
            <Tooltip title="Back">
              <IconButton 
                onClick={onBack} 
                size="small" 
                sx={{ mr: 1, mt: -0.5 }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {breadcrumbs.length > 0 && (
            <Breadcrumbs 
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="breadcrumb"
            >
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return isLast || !crumb.href ? (
                  <Typography 
                    key={index} 
                    color="text.secondary"
                    variant="body2"
                  >
                    {crumb.label}
                  </Typography>
                ) : (
                  <Link 
                    key={index} 
                    component={RouterLink} 
                    to={crumb.href}
                    underline="hover"
                    color="inherit"
                    variant="body2"
                  >
                    {crumb.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}
        </Box>
        
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: subtitle ? 1 : 0
          }}
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      
      {actions && (
        <Box 
          sx={{ 
            mt: { xs: 2, sm: 0 },
            display: 'flex',
            gap: 1
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader; 