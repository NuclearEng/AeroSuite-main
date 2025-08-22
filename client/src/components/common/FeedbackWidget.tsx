import React, { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  Fab,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Feedback as FeedbackIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FeedbackForm from './FeedbackForm';

interface FeedbackWidgetProps {
  position?: 'left' | 'right';
  customerId?: string;
}

/**
 * A floating feedback button that opens a feedback form drawer
 * Can be embedded in various parts of the application
 * 
 * @task TS379 - Customer feedback collection system
 */
const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  position = 'right',
  customerId
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState<any>(false);
  
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  
  // Get current page context for feedback
  const getPageContext = () => {
    const path = location.pathname;
    const pageName = path.split('/').filter(Boolean).join('/');
    
    return {
      page: pageName || 'home',
      feature: getCurrentFeature(path),
      metadata: {
        url: path,
        timestamp: new Date().toISOString()
      }
    };
  };
  
  // Determine current feature based on URL
  const getCurrentFeature = (path: string) => {
    const pathParts = path.split('/').filter(Boolean);
    
    if (pathParts.length === 0) return 'dashboard';
    
    const mainSection = pathParts[0];
    
    switch (mainSection) {
      case 'customers':
        return 'customer_management';
      case 'suppliers':
        return 'supplier_management';
      case 'inspections':
        return 'inspection_management';
      case 'reports':
        return 'reporting';
      case 'settings':
        return 'settings';
      default:
        return mainSection;
    }
  };
  
  return (
    <>
      <Tooltip title={t('feedback.title')} placement={position === 'right' ? 'left' : 'right'}>
        <Fab
          color="primary"
          size={isMobile ? 'small' : 'medium'}
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            [position]: { xs: 16, sm: 24 },
            zIndex: theme.zIndex.speedDial
          }}
        >
          <FeedbackIcon />
        </Fab>
      </Tooltip>
      
      <Drawer
        anchor={position}
        open={isOpen}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 450 },
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            startIcon={<CloseIcon />}
            onClick={handleClose}
          >
            {t('common.close')}
          </Button>
        </Box>
        
        <FeedbackForm
          source="app"
          context={getPageContext()}
          onSuccess={handleClose}
          customerId={customerId}
        />
      </Drawer>
    </>
  );
};

export default FeedbackWidget; 