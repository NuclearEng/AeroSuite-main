/**
 * Accessibility Theme Helper
 * 
 * Utilities to verify and improve theme color contrast for accessibility compliance.
 */

import { PaletteOptions, SimplePaletteColorOptions, TypeText, PaletteColor } from '@mui/material/styles/createPalette';
import { getContrastRatio, checkContrast, getSuggestedColor } from './colorContrastChecker';

/**
 * Interface for contrast check result
 */
export interface ContrastCheckResult {
  color: string;
  background: string;
  ratio: number;
  passes: {
    aa: boolean;
    aaLarge: boolean;
    aaa: boolean;
    aaaLarge: boolean;
  };
  suggestedColor?: string;
}

/**
 * Interface for theme contrast audit result
 */
export interface ThemeContrastAudit {
  passesAll: boolean;
  failureCount: number;
  checks: ContrastCheckResult[];
}

/**
 * Check if a palette has sufficient contrast for accessibility
 * 
 * @param palette - The palette to check
 * @returns Audit results
 */
export function auditPaletteContrast(palette: PaletteOptions): ThemeContrastAudit {
  const checks: ContrastCheckResult[] = [];
  
  // Background colors to check against
  const backgrounds = [
    { name: 'default', color: palette.background?.default || '#FFFFFF' },
    { name: 'paper', color: palette.background?.paper || '#FFFFFF' },
  ];
  
  // Text colors to check
  const textColors = [
    { name: 'primary', color: palette.text?.primary || '#000000' },
    { name: 'secondary', color: palette.text?.secondary || '#000000' },
  ];
  
  // Primary and secondary colors
  const themeColors = [
    { name: 'primary', color: (palette.primary as PaletteColor)?.main || '#000000' },
    { name: 'secondary', color: (palette.secondary as PaletteColor)?.main || '#000000' },
    { name: 'error', color: (palette.error as PaletteColor)?.main || '#000000' },
    { name: 'warning', color: (palette.warning as PaletteColor)?.main || '#000000' },
    { name: 'info', color: (palette.info as PaletteColor)?.main || '#000000' },
    { name: 'success', color: (palette.success as PaletteColor)?.main || '#000000' },
  ];
  
  // Check text colors against backgrounds
  for (const text of textColors) {
    for (const bg of backgrounds) {
      const contrast = checkContrast(text.color, bg.color);
      checks.push({
        color: text.color,
        background: bg.color,
        ratio: contrast.contrast,
        passes: {
          aa: contrast.AA.normal,
          aaLarge: contrast.AA.large,
          aaa: contrast.AAA.normal,
          aaaLarge: contrast.AAA.large,
        },
        suggestedColor: !contrast.AA.normal ? getSuggestedColor(text.color, bg.color) : undefined,
      });
    }
  }
  
  // Check theme colors against their contrast text colors
  for (const color of themeColors) {
    const contrastText = getContrastTextColor(palette, color.name);
    if (contrastText) {
      const contrast = checkContrast(contrastText, color.color);
      checks.push({
        color: contrastText,
        background: color.color,
        ratio: contrast.contrast,
        passes: {
          aa: contrast.AA.normal,
          aaLarge: contrast.AA.large,
          aaa: contrast.AAA.normal,
          aaaLarge: contrast.AAA.large,
        },
        suggestedColor: !contrast.AA.normal ? getSuggestedColor(contrastText, color.color) : undefined,
      });
    }
  }
  
  // Count failures
  const failureCount = checks.filter(check => !check.passes.aa).length;
  
  return {
    passesAll: failureCount === 0,
    failureCount,
    checks,
  };
}

/**
 * Get the contrast text color for a theme color
 * 
 * @param palette - The palette
 * @param colorName - The color name
 * @returns The contrast text color or undefined
 */
function getContrastTextColor(palette: PaletteOptions, colorName: string): string | undefined {
  switch (colorName) {
    case 'primary':
      return (palette.primary as PaletteColor)?.contrastText;
    case 'secondary':
      return (palette.secondary as PaletteColor)?.contrastText;
    case 'error':
      return (palette.error as PaletteColor)?.contrastText;
    case 'warning':
      return (palette.warning as PaletteColor)?.contrastText;
    case 'info':
      return (palette.info as PaletteColor)?.contrastText;
    case 'success':
      return (palette.success as PaletteColor)?.contrastText;
    default:
      return undefined;
  }
}

/**
 * Create an accessible version of a palette by fixing contrast issues
 * 
 * @param palette - The original palette
 * @returns An accessible version of the palette
 */
export function createAccessiblePalette(palette: PaletteOptions): PaletteOptions {
  const audit = auditPaletteContrast(palette);
  
  // If everything passes, return the original palette
  if (audit.passesAll) {
    return palette;
  }
  
  // Create a new palette with fixed colors
  const accessiblePalette: PaletteOptions = {
    ...palette,
    text: {
      ...palette.text,
    },
    primary: {
      ...palette.primary,
    },
    secondary: {
      ...palette.secondary,
    },
    error: {
      ...palette.error,
    },
    warning: {
      ...palette.warning,
    },
    info: {
      ...palette.info,
    },
    success: {
      ...palette.success,
    },
  };
  
  // Fix contrast issues
  for (const check of audit.checks) {
    if (!check.passes.aa && check.suggestedColor) {
      // Find which color needs to be updated
      if (check.color === palette.text?.primary) {
        accessiblePalette.text = {
          ...accessiblePalette.text,
          primary: check.suggestedColor,
        } as Partial<TypeText>;
      } else if (check.color === palette.text?.secondary) {
        accessiblePalette.text = {
          ...accessiblePalette.text,
          secondary: check.suggestedColor,
        } as Partial<TypeText>;
      } else if (check.color === (palette.primary as PaletteColor)?.contrastText) {
        accessiblePalette.primary = {
          ...accessiblePalette.primary,
          contrastText: check.suggestedColor,
          main: (palette.primary as PaletteColor)?.main || '#000000'
        } as SimplePaletteColorOptions;
      } else if (check.color === (palette.secondary as PaletteColor)?.contrastText) {
        accessiblePalette.secondary = {
          ...accessiblePalette.secondary,
          contrastText: check.suggestedColor,
          main: (palette.secondary as PaletteColor)?.main || '#000000'
        } as SimplePaletteColorOptions;
      } else if (check.color === (palette.error as PaletteColor)?.contrastText) {
        accessiblePalette.error = {
          ...accessiblePalette.error,
          contrastText: check.suggestedColor,
          main: (palette.error as PaletteColor)?.main || '#000000'
        } as SimplePaletteColorOptions;
      } else if (check.color === (palette.warning as PaletteColor)?.contrastText) {
        accessiblePalette.warning = {
          ...accessiblePalette.warning,
          contrastText: check.suggestedColor,
          main: (palette.warning as PaletteColor)?.main || '#000000'
        } as SimplePaletteColorOptions;
      } else if (check.color === (palette.info as PaletteColor)?.contrastText) {
        accessiblePalette.info = {
          ...accessiblePalette.info,
          contrastText: check.suggestedColor,
          main: (palette.info as PaletteColor)?.main || '#000000'
        } as SimplePaletteColorOptions;
      } else if (check.color === (palette.success as PaletteColor)?.contrastText) {
        accessiblePalette.success = {
          ...accessiblePalette.success,
          contrastText: check.suggestedColor,
          main: (palette.success as PaletteColor)?.main || '#000000'
        } as SimplePaletteColorOptions;
      }
    }
  }
  
  return accessiblePalette;
}

export default {
  auditPaletteContrast,
  createAccessiblePalette,
}; 