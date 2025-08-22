import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Tabs,
  Tab,
  Paper,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Translate as TranslateIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSettings from './LanguageSettings';
import PageHeader from '../../components/common/PageHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && children}
    </div>
  );
};

// Helper function for a11y props
const a11yProps = (index: number) => {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
};

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleLanguageError = (err: any) => {
    setErrorMessage(err.message || 'Failed to change language');
  };

  const tabs = [
    { label: t('settings.general'), icon: <SettingsIcon />, content: <Box p={2}><Typography>{t('settings.generalSettings')}</Typography></Box> },
    { label: t('settings.language'), icon: <TranslateIcon />, content: <LanguageSettings /> },
    { label: t('settings.appearance'), icon: <PaletteIcon />, content: <Box p={2}><Typography>{t('settings.appearanceSettings')}</Typography></Box> },
    { label: t('settings.security'), icon: <SecurityIcon />, content: <Box p={2}><Typography>{t('settings.securitySettings')}</Typography></Box> },
    { label: t('settings.notifications'), icon: <NotificationsIcon />, content: <Box p={2}><Typography>{t('settings.notificationSettings')}</Typography></Box> },
    { label: t('settings.account'), icon: <AccountCircleIcon />, content: <Box p={2}><Typography>{t('settings.accountSettings')}</Typography></Box> },
  ];

  return (
    <Container maxWidth="xl">
      <PageHeader title={t('settings.title')} />
      
      <Paper sx={{ mt: 2 }}>
        <Grid container>
          <Grid item xs={12} md={3} lg={2}>
            <Tabs
              orientation={isMobile ? 'horizontal' : 'vertical'}
              variant={isMobile ? 'scrollable' : 'standard'}
              value={activeTab}
              onChange={handleTabChange}
              aria-label={t('settings.settingsTabs')}
              sx={{
                borderRight: isMobile ? 0 : `1px solid ${theme.palette.divider}`,
                borderBottom: isMobile ? `1px solid ${theme.palette.divider}` : 0,
                minHeight: isMobile ? 'auto' : '70vh',
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  px: 3,
                  py: 2,
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  {...a11yProps(index)}
                  sx={{ minHeight: 48 }}
                />
              ))}
            </Tabs>
          </Grid>
          <Grid item xs={12} md={9} lg={10}>
            <Box p={3}>
              {tabs.map((tab, index) => (
                <TabPanel key={index} value={activeTab} index={index}>
                  {tab.content}
                </TabPanel>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      {errorMessage && (
        <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={() => setErrorMessage(null)}>
          <Alert onClose={() => setErrorMessage(null)} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default SettingsPage; 