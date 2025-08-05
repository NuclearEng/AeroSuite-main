import {
  calculateLuminance,
  calculateContrastRatio,
  ContrastLevel,
  passesContrastCheck,
  getContrastCheckResult,
} from './colorContrastChecker';

describe('Color Contrast Checker', () => {
  describe('calculateLuminance', () => {
    it('should calculate luminance correctly for white', () => {
      expect(calculateLuminance('#FFFFFF')).toBeCloseTo(1);
    });

    it('should calculate luminance correctly for black', () => {
      expect(calculateLuminance('#000000')).toBeCloseTo(0);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate contrast ratio correctly for black and white', () => {
      expect(calculateContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
    });

    it('should calculate contrast ratio correctly for similar colors', () => {
      expect(calculateContrastRatio('#777777', '#888888')).toBeLessThan(3);
    });
  });

  describe('ContrastLevel', () => {
    it('should have correct values', () => {
      expect(ContrastLevel.AAA).toBe('AAA');
      expect(ContrastLevel.AA).toBe('AA');
      expect(ContrastLevel.FAIL).toBe('FAIL');
    });
  });

  describe('passesContrastCheck', () => {
    it('should pass AAA for high contrast', () => {
      expect(passesContrastCheck('#000000', '#FFFFFF', ContrastLevel.AAA)).toBe(true);
    });

    it('should fail for low contrast', () => {
      expect(passesContrastCheck('#777777', '#888888', ContrastLevel.AA)).toBe(false);
    });
  });

  describe('getContrastCheckResult', () => {
    it('should return AAA for high contrast', () => {
      expect(getContrastCheckResult('#000000', '#FFFFFF')).toBe(ContrastLevel.AAA);
    });

    it('should return FAIL for low contrast', () => {
      expect(getContrastCheckResult('#777777', '#888888')).toBe(ContrastLevel.FAIL);
    });
  });
});