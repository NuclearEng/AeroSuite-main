import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Paper
} from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorAnalyticsDashboard from '../../components/admin/ErrorAnalyticsDashboard';

const ErrorAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('errorAnalytics.title')}
          </Typography>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            <Link component={RouterLink} color="inherit" to="/">
              {t('navigation.dashboard')}
            </Link>
            <Link component={RouterLink} color="inherit" to="/admin">
              {t('navigation.admin')}
            </Link>
            <Link component={RouterLink} color="inherit" to="/monitoring">
              {t('navigation.monitoring')}
            </Link>
            <Typography color="text.primary">{t('errorAnalytics.title')}</Typography>
          </Breadcrumbs>
        </Box>
        
        <Paper sx={{ p: 3 }}>
          <ErrorAnalyticsDashboard />
        </Paper>
      </Box>
    </Container>
  );
};

export default ErrorAnalyticsPage; 