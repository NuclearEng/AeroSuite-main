import {
  hexToRgb,
  calculateLuminance,
  calculateContrastRatio,
  ContrastLevel,
  passesContrastCheck,
  getContrastCheckResult
} from './colorContrastChecker';

describe('Color Contrast Checker', () => {
  describe('hexToRgb', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
      expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
      expect(hexToRgb('#123456')).toEqual([18, 52, 86]);
    });

    it('converts 3-digit hex to RGB', () => {
      expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
      expect(hexToRgb('#0f0')).toEqual([0, 255, 0]);
      expect(hexToRgb('#00f')).toEqual([0, 0, 255]);
      expect(hexToRgb('#123')).toEqual([17, 34, 51]);
    });

    it('handles hex without # prefix', () => {
      expect(hexToRgb('ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('000')).toEqual([0, 0, 0]);
    });
  });

  describe('calculateLuminance', () => {
    it('calculates luminance correctly', () => {
      // White has luminance of 1
      expect(calculateLuminance([255, 255, 255])).toBeCloseTo(1, 5);
      
      // Black has luminance of 0
      expect(calculateLuminance([0, 0, 0])).toBeCloseTo(0, 5);
      
      // Red
      expect(calculateLuminance([255, 0, 0])).toBeCloseTo(0.2126, 4);
      
      // Green
      expect(calculateLuminance([0, 255, 0])).toBeCloseTo(0.7152, 4);
      
      // Blue
      expect(calculateLuminance([0, 0, 255])).toBeCloseTo(0.0722, 4);
      
      // Medium gray
      expect(calculateLuminance([128, 128, 128])).toBeCloseTo(0.2158, 4);
    });
  });

  describe('calculateContrastRatio', () => {
    it('calculates contrast ratio correctly', () => {
      // Black and white have the highest contrast ratio: 21
      expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
      expect(calculateContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
      
      // Same colors have the lowest contrast ratio: 1
      expect(calculateContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
      expect(calculateContrastRatio('#000000', '#000000')).toBeCloseTo(1, 1);
      expect(calculateContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 1);
      
      // Some common combinations
      expect(calculateContrastRatio('#0000ff', '#ffffff')).toBeGreaterThan(8); // Blue on white
      expect(calculateContrastRatio('#ff0000', '#ffffff')).toBeGreaterThan(4); // Red on white
      expect(calculateContrastRatio('#ffff00', '#000000')).toBeGreaterThan(15); // Yellow on black
    });
  });

  describe('passesContrastCheck', () => {
    it('correctly determines if contrast passes AA normal text', () => {
      // Black on white passes AA for normal text (ratio > 4.5)
      expect(passesContrastCheck('#000000', '#ffffff', ContrastLevel.AA_NORMAL_TEXT)).toBe(true);
      
      // White on light gray may not pass
      expect(passesContrastCheck('#ffffff', '#cccccc', ContrastLevel.AA_NORMAL_TEXT)).toBe(false);
      
      // Dark blue on white passes
      expect(passesContrastCheck('#0000ff', '#ffffff', ContrastLevel.AA_NORMAL_TEXT)).toBe(true);
    });

    it('correctly determines if contrast passes AA large text', () => {
      // Even lower contrast can pass for large text (ratio > 3)
      expect(passesContrastCheck('#ffffff', '#767676', ContrastLevel.AA_LARGE_TEXT)).toBe(true);
    });

    it('correctly determines if contrast passes AAA normal text', () => {
      // Black on white passes AAA for normal text (ratio > 7)
      expect(passesContrastCheck('#000000', '#ffffff', ContrastLevel.AAA_NORMAL_TEXT)).toBe(true);
      
      // Dark gray on white might pass AA but not AAA
      const darkGray = '#666666';
      expect(passesContrastCheck(darkGray, '#ffffff', ContrastLevel.AA_NORMAL_TEXT)).toBe(true);
      expect(passesContrastCheck(darkGray, '#ffffff', ContrastLevel.AAA_NORMAL_TEXT)).toBe(false);
    });
  });

  describe('getContrastCheckResult', () => {
    it('returns correct results for high contrast', () => {
      const result = getContrastCheckResult('#000000', '#ffffff');
      expect(result.ratio).toBeCloseTo(21, 1);
      expect(result.passesAA_NormalText).toBe(true);
      expect(result.passesAA_LargeText).toBe(true);
      expect(result.passesAAA_NormalText).toBe(true);
      expect(result.passesAAA_LargeText).toBe(true);
    });

    it('returns correct results for medium contrast', () => {
      // Medium gray on white
      const result = getContrastCheckResult('#767676', '#ffffff');
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
      expect(result.ratio).toBeLessThan(7);
      expect(result.passesAA_NormalText).toBe(true);
      expect(result.passesAA_LargeText).toBe(true);
      expect(result.passesAAA_NormalText).toBe(false);
      expect(result.passesAAA_LargeText).toBe(true);
    });

    it('returns correct results for low contrast', () => {
      // Light gray on white
      const result = getContrastCheckResult('#cccccc', '#ffffff');
      expect(result.ratio).toBeLessThan(3);
      expect(result.passesAA_NormalText).toBe(false);
      expect(result.passesAA_LargeText).toBe(false);
      expect(result.passesAAA_NormalText).toBe(false);
      expect(result.passesAAA_LargeText).toBe(false);
    });
  });
}); 