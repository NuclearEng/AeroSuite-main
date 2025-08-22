import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

// Flag icons for languages
const languageFlags: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  zh: '🇨🇳',
};

// Available languages
const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
];

interface LanguageSelectorProps {
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'button',
  size = 'medium' 
}) => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Get current language
  const currentLanguage = i18n.language;
  
  // Handle menu open
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Handle language change
  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    handleClose();
    
    // Store the selected language in localStorage
    localStorage.setItem('i18nextLng', languageCode);
  };
  
  // Find current language details
  const currentLangDetails = languages.find(lang => lang.code === currentLanguage) || languages[0];
  
  return (
    <>
      {variant === 'button' ? (
        <Button
          onClick={handleClick}
          startIcon={<LanguageIcon />}
          size={size}
          color="inherit"
          aria-label={t('language.selectLanguage')}
        >
          {languageFlags[currentLangDetails.code]} {t(`language.${currentLangDetails.code}`)}
        </Button>
      ) : (
        <Tooltip title={t('language.selectLanguage')}>
          <IconButton
            onClick={handleClick}
            size={size}
            color="inherit"
            aria-label={t('language.selectLanguage')}
          >
            <LanguageIcon />
          </IconButton>
        </Tooltip>
      )}
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: { maxHeight: 300 }
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={currentLanguage === language.code}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {languageFlags[language.code]}
            </ListItemIcon>
            <ListItemText>
              {t(`language.${language.code}`)}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector; 