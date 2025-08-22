import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Typography,
  Link,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Container } from
'@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon } from
'@mui/icons-material';
import SupplierAnalyticsDashboard from './components/SupplierAnalyticsDashboard';
import supplierService from '../../services/supplier.service';
import ErrorHandler from '../../components/common/ErrorHandler';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}>

      {value === index &&
      <Box sx={{ p: 3 }}>
          {children}
        </Box>
      }
    </div>);

}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`
  };
}

const SupplierAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{id: string;}>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadSupplierData(id);
    }
  }, [id]);

  const loadSupplierData = async (supplierId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.getSupplier(supplierId);
      setSupplier(data);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate(id ? `/suppliers/${id}` : '/suppliers');
  };

  const RenderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>);

    }

    if (error) {
      return (
        <Alert severity="error">
          <AlertTitle>{t('common.error')}</AlertTitle>
          {error}
        </Alert>);

    }

    if (!supplier && id) {
      return (
        <Alert severity="warning">
          <AlertTitle>{t('common.warning')}</AlertTitle>
          {t('suppliers.notFound')}
        </Alert>);

    }

    return (
      <>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label={t('suppliers.analytics.tabs.label')}
              variant="scrollable"
              scrollButtons="auto">

              <Tab label={t('suppliers.analytics.tabs.performance')} {...a11yProps(0)} />
              <Tab label={t('suppliers.analytics.tabs.comparison')} {...a11yProps(1)} />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <SupplierAnalyticsDashboard supplierId={id || ''} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            
            <Typography variant="h6" gutterBottom>
              {t('suppliers.analytics.tabs.comparison')}
            </Typography>
          </TabPanel>
        </Paper>
      </>);

  };

  return (
    <Container maxWidth="xl">
      <ErrorHandler context={t('suppliers.analytics.page')}>
        <Box sx={{ mt: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ mr: 2 }}>

              {t('common.back')}
            </Button>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {id ?
                t('suppliers.analytics.supplierAnalytics', { name: supplier?.name || '' }) :
                t('suppliers.analytics.allSuppliersAnalytics')
                }
              </Typography>
              <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                <Link color="inherit" href="/" onClick={(e) => {e.preventDefault();navigate('/');}}>
                  {t('navigation.dashboard')}
                </Link>
                <Link color="inherit" href="/suppliers" onClick={(e) => {e.preventDefault();navigate('/suppliers');}}>
                  {t('navigation.suppliers')}
                </Link>
                {id &&
                <Link color="inherit" href={`/suppliers/${id}`} onClick={(e) => {e.preventDefault();navigate(`/suppliers/${id}`);}}>
                    {supplier?.name || id}
                  </Link>
                }
                <Typography color="text.primary">{t('suppliers.analytics.analytics')}</Typography>
              </Breadcrumbs>
            </Box>
          </Box>
          
          {RenderContent()}
        </Box>
      </ErrorHandler>
    </Container>);

};

export default SupplierAnalyticsPage;