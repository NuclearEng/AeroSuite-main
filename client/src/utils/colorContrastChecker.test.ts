import { hexToRgb, getLuminance, getContrastRatio, RGB } from './colorContrastChecker';

// Define ContrastLevel enum for testing
enum ContrastLevel {
  AA_NORMAL_TEXT = 'aa_normal_text',
  AA_LARGE_TEXT = 'aa_large_text',
  AAA_NORMAL_TEXT = 'aaa_normal_text',
  AAA_LARGE_TEXT = 'aaa_large_text'
}

// Define passesContrastCheck function for testing
function passesContrastCheck(color1: string, color2: string, level: ContrastLevel): boolean {
  const ratio = getContrastRatio(color1, color2);
  switch (level) {
    case ContrastLevel.AA_NORMAL_TEXT:
      return ratio >= 4.5;
    case ContrastLevel.AA_LARGE_TEXT:
      return ratio >= 3;
    case ContrastLevel.AAA_NORMAL_TEXT:
      return ratio >= 7;
    case ContrastLevel.AAA_LARGE_TEXT:
      return ratio >= 4.5;
    default:
      return false;
  }
}

// Define getContrastCheckResult function for testing
function getContrastCheckResult(color1: string, color2: string) {
  const ratio = getContrastRatio(color1, color2);
  return {
    ratio,
    passesAA_NormalText: ratio >= 4.5,
    passesAA_LargeText: ratio >= 3,
    passesAAA_NormalText: ratio >= 7,
    passesAAA_LargeText: ratio >= 4.5
  };
}

describe('Color Contrast Checker', () => {
  describe('hexToRgb', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#123456')).toEqual({ r: 18, g: 52, b: 86 });
    });

    it('converts 3-digit hex to RGB', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#123')).toEqual({ r: 17, g: 34, b: 51 });
    });

    it('handles hex without # prefix', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('000')).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('getLuminance', () => {
    it('calculates luminance correctly', () => {
      // White has luminance of 1
      expect(getLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
      
      // Black has luminance of 0
      expect(getLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
      
      // Red
      expect(getLuminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(0.2126, 4);
      
      // Green
      expect(getLuminance({ r: 0, g: 255, b: 0 })).toBeCloseTo(0.7152, 4);
      
      // Blue
      expect(getLuminance({ r: 0, g: 0, b: 255 })).toBeCloseTo(0.0722, 4);
      
      // Medium gray
      expect(getLuminance({ r: 128, g: 128, b: 128 })).toBeCloseTo(0.2158, 4);
    });
  });

  describe('getContrastRatio', () => {
    it('calculates contrast ratio correctly', () => {
      // Black and white have the highest contrast ratio: 21
      expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
      expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
      
      // Same colors have the lowest contrast ratio: 1
      expect(getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
      expect(getContrastRatio('#000000', '#000000')).toBeCloseTo(1, 1);
      expect(getContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 1);
      
      // Test with RGB objects
      const black: RGB = { r: 0, g: 0, b: 0 };
      const white: RGB = { r: 255, g: 255, b: 255 };
      expect(getContrastRatio(black, white)).toBeCloseTo(21, 1);
      
      // Common color combinations
      expect(getContrastRatio('#000000', '#ffff00')).toBeGreaterThanOrEqual(4.5); // Black on Yellow
      expect(getContrastRatio('#0000ff', '#ffffff')).toBeGreaterThanOrEqual(4.5); // Blue on White
    });
  });

  describe('passesContrastCheck', () => {
    it('correctly determines if colors pass WCAG contrast requirements', () => {
      // Black (#000000) on White (#FFFFFF) - should pass all levels
      expect(passesContrastCheck('#000000', '#ffffff', ContrastLevel.AA_NORMAL_TEXT)).toBe(true);
      expect(passesContrastCheck('#000000', '#ffffff', ContrastLevel.AA_LARGE_TEXT)).toBe(true);
      expect(passesContrastCheck('#000000', '#ffffff', ContrastLevel.AAA_NORMAL_TEXT)).toBe(true);
      expect(passesContrastCheck('#000000', '#ffffff', ContrastLevel.AAA_LARGE_TEXT)).toBe(true);
      
      // White (#FFFFFF) on Light Gray (#CCCCCC) - should fail AA normal text and AAA
      expect(passesContrastCheck('#ffffff', '#cccccc', ContrastLevel.AA_NORMAL_TEXT)).toBe(false);
      expect(passesContrastCheck('#ffffff', '#cccccc', ContrastLevel.AA_LARGE_TEXT)).toBe(true);
      expect(passesContrastCheck('#ffffff', '#cccccc', ContrastLevel.AAA_NORMAL_TEXT)).toBe(false);
      expect(passesContrastCheck('#ffffff', '#cccccc', ContrastLevel.AAA_LARGE_TEXT)).toBe(false);
      
      // Blue (#0000FF) on Black (#000000) - should fail all levels
      expect(passesContrastCheck('#0000ff', '#000000', ContrastLevel.AA_NORMAL_TEXT)).toBe(false);
      expect(passesContrastCheck('#0000ff', '#000000', ContrastLevel.AA_LARGE_TEXT)).toBe(false);
      expect(passesContrastCheck('#0000ff', '#000000', ContrastLevel.AAA_NORMAL_TEXT)).toBe(false);
      expect(passesContrastCheck('#0000ff', '#000000', ContrastLevel.AAA_LARGE_TEXT)).toBe(false);
    });
  });

  describe('getContrastCheckResult', () => {
    it('returns correct contrast check results', () => {
      // Black on White
      const blackOnWhite = getContrastCheckResult('#000000', '#ffffff');
      expect(blackOnWhite.ratio).toBeGreaterThanOrEqual(21);
      expect(blackOnWhite.passesAA_NormalText).toBe(true);
      expect(blackOnWhite.passesAA_LargeText).toBe(true);
      expect(blackOnWhite.passesAAA_NormalText).toBe(true);
      expect(blackOnWhite.passesAAA_LargeText).toBe(true);
      
      // Gray on White
      const grayOnWhite = getContrastCheckResult('#767676', '#ffffff');
      expect(grayOnWhite.ratio).toBeCloseTo(4.54, 1);
      expect(grayOnWhite.passesAA_NormalText).toBe(true);
      expect(grayOnWhite.passesAA_LargeText).toBe(true);
      expect(grayOnWhite.passesAAA_NormalText).toBe(false);
      expect(grayOnWhite.passesAAA_LargeText).toBe(true);
    });
  });
});