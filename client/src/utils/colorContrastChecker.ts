/**
 * Color Contrast Checker Utility
 * 
 * This utility provides functions to check color contrast according to WCAG guidelines.
 * It helps ensure that text is readable against its background for users with visual impairments.
 */

/**
 * Interface for RGB color
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Interface for color contrast result
 */
export interface ContrastResult {
  contrast: number;
  AA: {
    normal: boolean;
    large: boolean;
  };
  AAA: {
    normal: boolean;
    large: boolean;
  };
  passes: boolean;
}

/**
 * Converts a hexadecimal color string to an RGB color object
 * 
 * @param {string} hex - Hexadecimal color string (e.g., "#FFFFFF", "#FFF", "FFFFFF", or "FFF")
 * @returns {RGB} RGB color object with r, g, b components (0-255)
 * 
 * @description
 * Parses a hexadecimal color string and converts it to an RGB color object.
 * Supports both 3-character and 6-character hex formats, with or without the leading "#".
 * 
 * @example
 * // Convert white hex color to RGB
 * const white = hexToRgb("#FFFFFF");
 * // Result: { r: 255, g: 255, b: 255 }
 * 
 * @example
 * // Convert shorthand hex color to RGB
 * const red = hexToRgb("#F00");
 * // Result: { r: 255, g: 0, b: 0 }
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert 3-character hex to 6-character
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Converts an RGB color object to a hexadecimal color string
 * 
 * @param {RGB} rgb - RGB color object with r, g, b components (0-255)
 * @returns {string} Hexadecimal color string (format: "#RRGGBB")
 * 
 * @description
 * Converts an RGB color object to a 6-character hexadecimal color string with a leading "#".
 * The function ensures proper zero-padding for each color component.
 * 
 * @example
 * // Convert RGB black to hex
 * const black = rgbToHex({ r: 0, g: 0, b: 0 });
 * // Result: "#000000"
 * 
 * @example
 * // Convert RGB blue to hex
 * const blue = rgbToHex({ r: 0, g: 0, b: 255 });
 * // Result: "#0000FF"
 */
export function rgbToHex(rgb: RGB): string {
  return '#' + 
    ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b)
      .toString(16)
      .slice(1);
}

/**
 * Calculates the relative luminance of a color according to WCAG 2.0
 * 
 * @param {RGB} rgb - RGB color object with r, g, b components (0-255)
 * @returns {number} Relative luminance value (0-1)
 * 
 * @description
 * Calculates the relative luminance of a color as defined by WCAG 2.0.
 * This value represents the perceived brightness of a color and is used in contrast calculations.
 * The formula first converts RGB values to the sRGB colorspace, then applies a power function
 * to account for the non-linear perception of brightness by the human eye.
 * 
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Where R, G, B are transformed using the appropriate power function.
 * 
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * 
 * @example
 * // Get luminance of white
 * const whiteLuminance = getLuminance({ r: 255, g: 255, b: 255 });
 * // Result: 1
 * 
 * @example
 * // Get luminance of black
 * const blackLuminance = getLuminance({ r: 0, g: 0, b: 0 });
 * // Result: 0
 */
export function getLuminance(rgb: RGB): number {
  // Convert RGB to sRGB
  const sRGB = {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255
  };
  
  // Apply transformation
  const transformed = {
    r: sRGB.r <= 0.03928 ? sRGB.r / 12.92 : Math.pow((sRGB.r + 0.055) / 1.055, 2.4),
    g: sRGB.g <= 0.03928 ? sRGB.g / 12.92 : Math.pow((sRGB.g + 0.055) / 1.055, 2.4),
    b: sRGB.b <= 0.03928 ? sRGB.b / 12.92 : Math.pow((sRGB.b + 0.055) / 1.055, 2.4)
  };
  
  // Calculate luminance
  return 0.2126 * transformed.r + 0.7152 * transformed.g + 0.0722 * transformed.b;
}

/**
 * Calculates the contrast ratio between two colors according to WCAG 2.0
 * 
 * @param {string|RGB} color1 - First color (hex string or RGB object)
 * @param {string|RGB} color2 - Second color (hex string or RGB object)
 * @returns {number} Contrast ratio (1-21)
 * 
 * @description
 * Calculates the contrast ratio between two colors as defined by WCAG 2.0.
 * The ratio ranges from 1 (no contrast) to 21 (maximum contrast, black on white).
 * This function accepts both hex strings and RGB objects as input.
 * 
 * Formula: (L1 + 0.05) / (L2 + 0.05), where L1 is the lighter color's luminance
 * and L2 is the darker color's luminance.
 * 
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * 
 * @example
 * // Get contrast ratio between black and white
 * const ratio1 = getContrastRatio("#000000", "#FFFFFF");
 * // Result: 21
 * 
 * @example
 * // Get contrast ratio between blue and yellow using RGB
 * const ratio2 = getContrastRatio(
 *   { r: 0, g: 0, b: 255 },
 *   { r: 255, g: 255, b: 0 }
 * );
 */
export function getContrastRatio(
  color1: string | RGB,
  color2: string | RGB
): number {
  // Convert to RGB if hex
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;
  
  // Calculate luminance
  const luminance1 = getLuminance(rgb1);
  const luminance2 = getLuminance(rgb2);
  
  // Calculate contrast ratio
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if the contrast ratio between two colors meets WCAG accessibility requirements
 * 
 * @param {string|RGB} color1 - First color (hex string or RGB object)
 * @param {string|RGB} color2 - Second color (hex string or RGB object)
 * @returns {ContrastResult} Object containing contrast ratio and compliance information
 * 
 * @description
 * Evaluates whether the contrast between two colors meets WCAG 2.0 accessibility standards.
 * Returns an object with the contrast ratio and boolean flags indicating compliance with
 * different WCAG levels:
 * 
 * - AA normal text: requires a contrast ratio of at least 4.5:1
 * - AA large text: requires a contrast ratio of at least 3:1
 * - AAA normal text: requires a contrast ratio of at least 7:1
 * - AAA large text: requires a contrast ratio of at least 4.5:1
 * 
 * The 'passes' property indicates if the colors meet at least the AA standard for normal text.
 * 
 * @example
 * // Check contrast between dark gray text and white background
 * const result = checkContrast("#333333", "#FFFFFF");
 * // Result: {
 * //   contrast: 12.63,
 * //   AA: { normal: true, large: true },
 * //   AAA: { normal: true, large: true },
 * //   passes: true
 * // }
 * 
 * @example
 * // Check contrast between light gray text and white background
 * const result2 = checkContrast("#CCCCCC", "#FFFFFF");
 * // Result: {
 * //   contrast: 1.61,
 * //   AA: { normal: false, large: false },
 * //   AAA: { normal: false, large: false },
 * //   passes: false
 * // }
 */
export function checkContrast(
  color1: string | RGB,
  color2: string | RGB
): ContrastResult {
  const ratio = getContrastRatio(color1, color2);
  
  return {
    contrast: ratio,
    AA: {
      normal: ratio >= 4.5,
      large: ratio >= 3
    },
    AAA: {
      normal: ratio >= 7,
      large: ratio >= 4.5
    },
    passes: ratio >= 4.5 // Minimum AA standard for normal text
  };
}

/**
 * Get a suggested color with better contrast
 * 
 * @param foreground - Foreground color (hex or RGB)
 * @param background - Background color (hex or RGB)
 * @param targetRatio - Target contrast ratio (default: 4.5)
 * @returns Suggested foreground color with better contrast
 */
export function getSuggestedColor(
  foreground: string | RGB,
  background: string | RGB,
  targetRatio: number = 4.5
): string {
  // Convert to RGB if hex
  const fgRGB = typeof foreground === 'string' ? hexToRgb(foreground) : foreground;
  const bgRGB = typeof background === 'string' ? hexToRgb(background) : background;
  
  // Calculate current contrast
  const currentRatio = getContrastRatio(fgRGB, bgRGB);
  
  // If already meets target, return original
  if (currentRatio >= targetRatio) {
    return typeof foreground === 'string' ? foreground : rgbToHex(fgRGB);
  }
  
  // Get luminance values
  const bgLuminance = getLuminance(bgRGB);
  
  // Determine if we should go lighter or darker
  const shouldGoLighter = bgLuminance < 0.5;
  
  // Start with current color
  let adjustedColor = { ...fgRGB };
  let adjustedRatio = currentRatio;
  let iterations = 0;
  
  // Adjust color until we reach target ratio or max iterations
  while (adjustedRatio < targetRatio && iterations < 100) {
    if (shouldGoLighter) {
      // Make color lighter
      adjustedColor.r = Math.min(255, adjustedColor.r + 5);
      adjustedColor.g = Math.min(255, adjustedColor.g + 5);
      adjustedColor.b = Math.min(255, adjustedColor.b + 5);
    } else {
      // Make color darker
      adjustedColor.r = Math.max(0, adjustedColor.r - 5);
      adjustedColor.g = Math.max(0, adjustedColor.g - 5);
      adjustedColor.b = Math.max(0, adjustedColor.b - 5);
    }
    
    adjustedRatio = getContrastRatio(adjustedColor, bgRGB);
    iterations++;
  }
  
  return rgbToHex(adjustedColor);
}

/**
 * Check if a color is light or dark
 * 
 * @param color - Color to check (hex or RGB)
 * @returns True if color is light, false if dark
 */
export function isLightColor(color: string | RGB): boolean {
  const rgb = typeof color === 'string' ? hexToRgb(color) : color;
  const luminance = getLuminance(rgb);
  return luminance > 0.5;
}

/**
 * Get WCAG level description for a contrast ratio
 * 
 * @param ratio - Contrast ratio
 * @returns Description of WCAG level
 */
export function getWcagLevel(ratio: number): string {
  if (ratio >= 7) {
    return 'AAA (Enhanced)';
  } else if (ratio >= 4.5) {
    return 'AA (Good)';
  } else if (ratio >= 3) {
    return 'AA Large Text Only';
  } else {
    return 'Fails WCAG';
  }
}

/**
 * Get a color palette with accessible color combinations
 * 
 * @param baseColor - Base color to build palette around (hex)
 * @returns Object with accessible color combinations
 */
export function getAccessiblePalette(baseColor: string): {
  base: string;
  text: string;
  background: string;
  accent: string;
  border: string;
} {
  const baseRgb = hexToRgb(baseColor);
  const isLight = isLightColor(baseRgb);
  
  // Create text color with good contrast
  const textColor = isLight ? 
    '#000000' : 
    '#FFFFFF';
  
  // Create background color with good contrast
  const backgroundColor = isLight ? 
    '#FFFFFF' : 
    '#121212';
  
  // Create accent color (analogous color with good contrast)
  let accentRgb = { ...baseRgb };
  
  // Shift hue by adjusting RGB values
  if (baseRgb.r > baseRgb.g && baseRgb.r > baseRgb.b) {
    // Red dominant, shift toward yellow or purple
    accentRgb.g = Math.min(255, accentRgb.g + 50);
  } else if (baseRgb.g > baseRgb.r && baseRgb.g > baseRgb.b) {
    // Green dominant, shift toward cyan or yellow
    accentRgb.b = Math.min(255, accentRgb.b + 50);
  } else {
    // Blue dominant, shift toward cyan or purple
    accentRgb.r = Math.min(255, accentRgb.r + 50);
  }
  
  // Ensure accent has good contrast with background
  const accentColor = getSuggestedColor(accentRgb, backgroundColor, 3);
  
  // Create border color (slightly different from base)
  const borderRgb = { ...baseRgb };
  if (isLight) {
    borderRgb.r = Math.max(0, borderRgb.r - 40);
    borderRgb.g = Math.max(0, borderRgb.g - 40);
    borderRgb.b = Math.max(0, borderRgb.b - 40);
  } else {
    borderRgb.r = Math.min(255, borderRgb.r + 40);
    borderRgb.g = Math.min(255, borderRgb.g + 40);
    borderRgb.b = Math.min(255, borderRgb.b + 40);
  }
  
  return {
    base: baseColor,
    text: textColor,
    background: backgroundColor,
    accent: accentColor,
    border: rgbToHex(borderRgb)
  };
}

/**
 * Get contrast issues in a CSS stylesheet
 * 
 * @param css - CSS stylesheet content
 * @returns Array of contrast issues
 */
export function findContrastIssuesInCss(css: string): Array<{
  selector: string;
  color: string;
  backgroundColor: string;
  ratio: number;
  passes: boolean;
}> {
  const issues: Array<{
    selector: string;
    color: string;
    backgroundColor: string;
    ratio: number;
    passes: boolean;
  }> = [];
  
  // Regular expressions for finding color properties
  const colorRegex = /([.#][a-zA-Z0-9_-]+[^{]*)\{[^}]*(color:\s*#[0-9a-fA-F]{3,6})[^}]*\}/g;
  const bgColorRegex = /([.#][a-zA-Z0-9_-]+[^{]*)\{[^}]*(background(?:-color)?:\s*#[0-9a-fA-F]{3,6})[^}]*\}/g;
  
  // Extract colors and selectors
  const colors: Record<string, string> = {};
  const bgColors: Record<string, string> = {};
  
  let match;
  
  // Extract text colors
  while ((match = colorRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const colorProp = match[2].trim();
    const color = colorProp.split(':')[1].trim();
    colors[selector] = color;
  }
  
  // Extract background colors
  while ((match = bgColorRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const bgColorProp = match[2].trim();
    const bgColor = bgColorProp.split(':')[1].trim();
    bgColors[selector] = bgColor;
  }
  
  // Check contrast for elements with both color and background-color
  for (const selector in colors) {
    if (bgColors[selector]) {
      const color = colors[selector];
      const bgColor = bgColors[selector];
      
      const result = checkContrast(color, bgColor);
      
      if (!result.passes) {
        issues.push({
          selector,
          color,
          backgroundColor: bgColor,
          ratio: result.contrast,
          passes: false
        });
      }
    }
  }
  
  return issues;
}

export default {
  hexToRgb,
  rgbToHex,
  getLuminance,
  getContrastRatio,
  checkContrast,
  getSuggestedColor,
  isLightColor,
  getWcagLevel,
  getAccessiblePalette,
  findContrastIssuesInCss
}; 