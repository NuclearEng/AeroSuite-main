import React, { ChangeEvent, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Radio,
  RadioGroup,
  FormControl,
  styled,
  alpha,
  Paper } from
'@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  ColorLens as ThemeIcon,
  Palette as PaletteIcon,
  FormatSize as FontSizeIcon,
  Animation as AnimationIcon,
  Check as CheckIcon } from
'@mui/icons-material';
import { useThemeContext } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { setDarkMode, setThemeVariant } from '../../redux/slices/ui.slice';
import { ThemeVariant } from '../../theme/themeConfig';
import ColorLens from '@mui/icons-material/ColorLens';

// Styled color circle for theme selection
const ColorCircle = styled(Box)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: `0 0 0 1px ${alpha(theme.palette.divider, 0.5)}`,
  position: 'relative',
  '&:hover': {
    transform: 'scale(1.1)'
  }
}));

// Selected indicator
const SelectedIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: 46,
  height: 46,
  borderRadius: '50%',
  border: `2px solid ${theme.palette.primary.main}`,
  top: -7,
  left: -7,
  '&::after': {
    content: '""',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main
  }
}));

interface ThemeSettingsProps {
  compact?: boolean;
  showTitle?: boolean;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  compact = false,
  showTitle = true
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { mode, variant, toggleTheme, setMode, setVariant } = useThemeContext();

  // Get settings from Redux
  const uiSettings = useAppSelector((state) => state.ui);

  // Handle theme change
  const handleDarkModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isDarkMode = event.target.checked;
    dispatch(setDarkMode(isDarkMode));
    setMode(isDarkMode ? 'dark' : 'light');
  };

  // Handle theme variant change
  const handleVariantChange = (variant: ThemeVariant) => {
    dispatch(setThemeVariant(variant));
    setVariant(variant);
  };

  // Font size options
  const fontSizes = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' }];


  // Animation options
  const animationOptions = [
  { value: 'on', label: 'On' },
  { value: 'reduced', label: 'Reduced' },
  { value: 'off', label: 'Off' }];


  // Theme color options
  const themeColors = [
  { value: 'blue', color: '#2563EB', label: 'Blue (Default)' },
  { value: 'purple', color: '#8B5CF6', label: 'Purple' },
  { value: 'emerald', color: '#10B981', label: 'Emerald' },
  { value: 'amber', color: '#F59E0B', label: 'Amber' },
  { value: 'rose', color: '#F43F5E', label: 'Rose' },
  { value: 'gray', color: '#4B5563', label: 'Gray' }];


  // Render content based on compact mode
  const RenderContent = () => {
    return (
      <>
        
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            mb: 2,
            bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 2
          }}>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <PaletteIcon sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">Theme Mode</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose between light and dark mode
              </Typography>
            </Box>
          </Box>
          <FormControlLabel
            control={
            <Switch
              checked={mode === 'dark'}
              onChange={handleDarkModeToggle}
              color="primary" />

            }
            label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'} />

        </Box>
        
        
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            mb: 2,
            bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
            border: `1px solid ${theme.palette.divider}`
          }}>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ColorLens sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">Theme Colors</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose your preferred color scheme
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {themeColors.map((color: any) =>
            <Box key={color.value} sx={{ position: 'relative' }}>
                <Tooltip title={color.label} arrow>
                  <ColorCircle
                  sx={{ bgcolor: color.color }}
                  onClick={() => handleVariantChange(color.value as ThemeVariant)} />

                </Tooltip>
                {variant === color.value &&
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#fff',
                  zIndex: 1
                }}>

                    <CheckIcon fontSize="small" />
                  </Box>
              }
              </Box>
            )}
          </Box>
        </Box>
        
        
        {!compact &&
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            mb: 2,
            bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
            border: `1px solid ${theme.palette.divider}`
          }}>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FontSizeIcon sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">Font Size</Typography>
                <Typography variant="body2" color="text.secondary">
                  Adjust the application font size
                </Typography>
              </Box>
            </Box>
            
            <FormControl component="fieldset">
              <RadioGroup
              row
              aria-label="font-size"
              name="font-size-group"
              defaultValue="medium">

                {fontSizes.map((size: any) =>
              <FormControlLabel
                key={size.value}
                value={size.value}
                control={<Radio />}
                label={size.label} />

              )}
              </RadioGroup>
            </FormControl>
          </Box>
        }
        
        
        {!compact &&
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
            border: `1px solid ${theme.palette.divider}`
          }}>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AnimationIcon sx={{ color: theme.palette.primary.main, mr: 1.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">Animations</Typography>
                <Typography variant="body2" color="text.secondary">
                  Control UI animation effects
                </Typography>
              </Box>
            </Box>
            
            <FormControl component="fieldset">
              <RadioGroup
              row
              aria-label="animations"
              name="animations-group"
              defaultValue="on">

                {animationOptions.map((option: any) =>
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label} />

              )}
              </RadioGroup>
            </FormControl>
          </Box>
        }
      </>);

  };

  return (
    <>
      {showTitle &&
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <ThemeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5">Theme Settings</Typography>
        </Box>
      }
      {RenderContent()}
    </>);

};

export default ThemeSettings;