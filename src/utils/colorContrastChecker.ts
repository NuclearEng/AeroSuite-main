export enum ContrastLevel {
  AAA = 'AAA',
  AA = 'AA',
  FAIL = 'FAIL',
}

export function calculateLuminance(color: string): number {
  // Remove the hash if present
  const hex = color.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Convert RGB to relative luminance
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = calculateLuminance(color1);
  const l2 = calculateLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function passesContrastCheck(
  color1: string,
  color2: string,
  level: ContrastLevel
): boolean {
  const ratio = calculateContrastRatio(color1, color2);

  switch (level) {
    case ContrastLevel.AAA:
      return ratio >= 7;
    case ContrastLevel.AA:
      return ratio >= 4.5;
    default:
      return false;
  }
}

export function getContrastCheckResult(color1: string, color2: string): ContrastLevel {
  const ratio = calculateContrastRatio(color1, color2);

  if (ratio >= 7) {
    return ContrastLevel.AAA;
  } else if (ratio >= 4.5) {
    return ContrastLevel.AA;
  } else {
    return ContrastLevel.FAIL;
  }
}