import { SelectChangeEvent } from '@mui/material/Select';
import { ReactNode } from 'react';
import { Theme, PaletteOptions, PaletteColor } from '@mui/material/styles';

export type MUISelectChangeHandler<T = string> = (event: SelectChangeEvent<T>, child: ReactNode) => void;

export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending';
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'contained';
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backButton?: ReactNode;
}

export interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

export interface PaletteColorWithContrastText extends PaletteColor {
  contrastText: string;
}

export interface AccessiblePaletteOptions extends PaletteOptions {
  primary?: PaletteColorWithContrastText;
  secondary?: PaletteColorWithContrastText;
  error?: PaletteColorWithContrastText;
  warning?: PaletteColorWithContrastText;
  info?: PaletteColorWithContrastText;
  success?: PaletteColorWithContrastText;
}

export interface AccessibleTheme extends Theme {
  palette: AccessiblePaletteOptions;
}