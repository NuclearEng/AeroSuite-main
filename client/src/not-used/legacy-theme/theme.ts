import { createTheme, responsiveFontSizes, alpha, PaletteOptions } from '@mui/material/styles';
import { ThemeOptions } from '@mui/material/styles/createTheme';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    accent: Palette['primary'];
    status: {
      success: string;
      warning: string;
      danger: string;
      info: string;
      pending: string;
      scheduled: string;
      inProgress: string;
      completed: string;
      cancelled: string;
      delayed: string;
      pass: string;
      fail: string;
      conditional: string;
    };
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
    accent?: PaletteOptions['primary'];
    status?: {
      success: string;
      warning: string;
      danger: string;
      info: string;
      pending: string;
      scheduled: string;
      inProgress: string;
      completed: string;
      cancelled: string;
      delayed: string;
      pass: string;
      fail: string;
      conditional: string;
    };
  }

  interface TypeBackground {
    card?: string;
    navigation?: string;
    surface?: string;
    appBar?: string;
    highlight?: string;
  }
  
  interface TypographyVariants {
    code: React.CSSProperties;
    pageTitle: React.CSSProperties;
    cardTitle: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    code?: React.CSSProperties;
    pageTitle?: React.CSSProperties;
    cardTitle?: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    code: true;
    pageTitle: true;
    cardTitle: true;
  }
}

// Add custom button variants
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    success: true;
    danger: true;
  }
}

// Animation presets for consistent microinteractions
const animations = {
  microInteraction: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  pageTransition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cardHover: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  buttonHover: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  fadeIn: 'opacity 0.3s ease-in-out',
  expand: 'all 0.25s ease-in-out',
};

// Spacing system for consistent layout
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64,
};

// Create our app color theme
const baseThemeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#0A2F5C',
      light: '#3456A0',
      dark: '#051E3E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#3D8A9F',
      light: '#6BBDD3',
      dark: '#285C6B',
      contrastText: '#FFFFFF',
    },
    tertiary: {
      main: '#BD4500',
      light: '#EB6F28',
      dark: '#922800',
      contrastText: '#FFFFFF',
    },
    accent: {
      main: '#FFB930',
      light: '#FFDB85',
      dark: '#CC9426',
      contrastText: '#000000',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#FFA000',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#1976D2',
      light: '#64B5F6',
      dark: '#0D47A1',
    },
    success: {
      main: '#388E3C',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    text: {
      primary: '#1A2027',
      secondary: '#707886',
      disabled: '#9DA3AE',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
      card: '#FFFFFF',
      navigation: '#0A2F5C',
      surface: '#F5F7FA',
      appBar: '#FFFFFF',
      highlight: '#F0F7FF',
    },
    status: {
      success: '#388E3C',
      warning: '#FFA000',
      danger: '#D32F2F',
      info: '#1976D2',
      pending: '#9DA3AE',
      scheduled: '#1976D2',
      inProgress: '#FFA000',
      completed: '#388E3C',
      cancelled: '#D32F2F',
      delayed: '#9C27B0',
      pass: '#388E3C',
      fail: '#D32F2F',
      conditional: '#FFA000',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.25,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.35,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.45,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.55,
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.55,
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem',
      textTransform: 'none',
      lineHeight: 1.6,
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.65,
    },
    overline: {
      fontWeight: 500,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      lineHeight: 1.65,
      letterSpacing: '0.125em',
    },
    code: {
      fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      backgroundColor: '#F5F7FA',
      padding: '0.25em 0.4em',
      borderRadius: 4,
    },
    pageTitle: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    cardTitle: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.45,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.05)',
    '0px 8px 16px rgba(0, 0, 0, 0.05)',
    '0px 12px 24px rgba(0, 0, 0, 0.05)',
    '0px 16px 32px rgba(0, 0, 0, 0.05)',
    '0px 20px 40px rgba(0, 0, 0, 0.05)',
    '0px 24px 48px rgba(0, 0, 0, 0.05)',
    '0px 28px 56px rgba(0, 0, 0, 0.05)',
    '0px 32px 64px rgba(0, 0, 0, 0.05)',
    '0px 36px 72px rgba(0, 0, 0, 0.05)',
    '0px 40px 80px rgba(0, 0, 0, 0.05)',
    '0px 44px 88px rgba(0, 0, 0, 0.05)',
    '0px 48px 96px rgba(0, 0, 0, 0.05)',
    '0px 52px 104px rgba(0, 0, 0, 0.05)',
    '0px 56px 112px rgba(0, 0, 0, 0.05)',
    '0px 60px 120px rgba(0, 0, 0, 0.05)',
    '0px 64px 128px rgba(0, 0, 0, 0.05)',
    '0px 68px 136px rgba(0, 0, 0, 0.05)',
    '0px 72px 144px rgba(0, 0, 0, 0.05)',
    '0px 76px 152px rgba(0, 0, 0, 0.05)',
    '0px 80px 160px rgba(0, 0, 0, 0.05)',
    '0px 84px 168px rgba(0, 0, 0, 0.05)',
    '0px 88px 176px rgba(0, 0, 0, 0.05)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: animations.buttonHover,
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#0A2F5C',
            opacity: 0.9,
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#3D8A9F',
            opacity: 0.9,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
      variants: [
        {
          props: { variant: 'success' },
          style: {
            backgroundColor: '#388E3C',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#2E7D32',
            },
          },
        },
        {
          props: { variant: 'danger' },
          style: {
            backgroundColor: '#D32F2F',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#C62828',
            },
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          transition: animations.cardHover,
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: spacing.md,
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: spacing.md,
          '&:last-child': {
            paddingBottom: spacing.md,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: animations.microInteraction,
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: animations.microInteraction,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: animations.microInteraction,
          '&:hover': {
            backgroundColor: alpha('#0A2F5C', 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#0A2F5C', 0.12),
            '&:hover': {
              backgroundColor: alpha('#0A2F5C', 0.16),
            },
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F5F7FA',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: animations.microInteraction,
          '&:hover': {
            backgroundColor: alpha('#0A2F5C', 0.04),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: animations.microInteraction,
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          transition: animations.fadeIn,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1A2027',
          borderRadius: 6,
          fontSize: '0.75rem',
          padding: '6px 12px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
        },
      },
    },
  },
};

// Create theme variants
const lightTheme = createTheme(baseThemeOptions);
const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    ...baseThemeOptions.palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1E1E1E',
      card: '#1E1E1E',
      navigation: '#0A2F5C',
      surface: '#121212',
      appBar: '#1E1E1E',
      highlight: '#0A2F5C20',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      disabled: '#6C6C6C',
    },
  },
});

// Export the theme and utilities
export { lightTheme, darkTheme, animations, spacing };
export default lightTheme; 