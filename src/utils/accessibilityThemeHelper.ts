import { Theme, PaletteOptions, PaletteColor, SimplePaletteColorOptions } from '@mui/material/styles';

interface ColorCheck {
  name: string;
  color: string;
}

interface AccessiblePaletteColor extends SimplePaletteColorOptions {
  main: string;
  light?: string;
  dark?: string;
  contrastText: string;
}

interface AccessiblePalette extends PaletteOptions {
  primary?: AccessiblePaletteColor;
  secondary?: AccessiblePaletteColor;
  error?: AccessiblePaletteColor;
  warning?: AccessiblePaletteColor;
  info?: AccessiblePaletteColor;
  success?: AccessiblePaletteColor;
}

export function getAccessiblePalette(theme: Theme): AccessiblePalette {
  const { palette } = theme;
  const accessiblePalette: AccessiblePalette = {};

  const colorChecks: ColorCheck[] = [
    { name: 'primary', color: palette.primary?.main || '#000000' },
    { name: 'secondary', color: palette.secondary?.main || '#000000' },
    { name: 'error', color: palette.error?.main || '#000000' },
    { name: 'warning', color: palette.warning?.main || '#000000' },
    { name: 'info', color: palette.info?.main || '#000000' },
    { name: 'success', color: palette.success?.main || '#000000' },
  ];

  colorChecks.forEach(check => {
    const color = check.color;
    const contrastText = getContrastText(color);

    switch (check.name) {
      case 'primary':
        accessiblePalette.primary = {
          main: color,
          contrastText,
        };
        break;
      case 'secondary':
        accessiblePalette.secondary = {
          main: color,
          contrastText,
        };
        break;
      case 'error':
        accessiblePalette.error = {
          main: color,
          contrastText,
        };
        break;
      case 'warning':
        accessiblePalette.warning = {
          main: color,
          contrastText,
        };
        break;
      case 'info':
        accessiblePalette.info = {
          main: color,
          contrastText,
        };
        break;
      case 'success':
        accessiblePalette.success = {
          main: color,
          contrastText,
        };
        break;
    }
  });

  return accessiblePalette;
}

function getContrastText(color: string): string {
  // Mock implementation
  return '#ffffff';
}