import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Radio,
  Divider,
  Paper,
  alpha
} from '@mui/material';
import { useTranslation } from '../../hooks/useTranslation';

// Language options with their flags and native names
const languages = [
  { code: 'en', flag: '🇺🇸', name: 'English', nativeName: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'French', nativeName: 'Français' },
  { code: 'de', flag: '🇩🇪', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese', nativeName: '中文' },
];

const LanguageSettings: React.FC = () => {
  const { t, i18n, changeLanguage } = useTranslation();
  const currentLanguage = i18n.language;
  
  // Handle language selection
  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.language')}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        {t('settings.selectLanguage')}
      </Typography>
      
      <Paper elevation={2} sx={{ mb: 4 }}>
        <List sx={{ width: '100%' }}>
          {languages.map((language, index) => (
            <React.Fragment key={language.code}>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleLanguageChange(language.code)}
                  selected={currentLanguage === language.code}
                  sx={{
                    py: 2,
                    '&.Mui-selected': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ fontSize: '1.5rem', minWidth: 40 }}>
                    {language.flag}
                  </ListItemIcon>
                  <ListItemText 
                    primary={t(`language.${language.code}`)} 
                    secondary={language.nativeName !== t(`language.${language.code}`) ? language.nativeName : undefined}
                  />
                  <Radio 
                    checked={currentLanguage === language.code} 
                    onChange={() => handleLanguageChange(language.code)}
                    name="language-radio-button"
                    inputProps={{ 'aria-label': language.name }}
                  />
                </ListItemButton>
              </ListItem>
              {index < languages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('settings.dateFormat')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common.example')}: {new Date().toLocaleDateString(currentLanguage)}
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('settings.timeFormat')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('common.example')}: {new Date().toLocaleTimeString(currentLanguage)}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('settings.numberFormat')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('common.example')}: {(1234567.89).toLocaleString(currentLanguage)}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('settings.currencyFormat')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('common.example')}: {(1234.56).toLocaleString(currentLanguage, { style: 'currency', currency: 'USD' })}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LanguageSettings; 