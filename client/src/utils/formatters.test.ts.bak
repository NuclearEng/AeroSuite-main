import { 
  formatDate, 
  formatDateTime, 
  formatTime, 
  formatCurrency, 
  formatPercentage,
  formatStatus,
  formatPriority,
  formatInspectionType
} from './formatters';

describe('Formatters utility functions', () => {
  describe('formatDate', () => {
    it('should format a valid date string', () => {
      expect(formatDate('2023-05-15')).toBe('May 15, 2023');
    });

    it('should return N/A for undefined input', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('should handle custom format strings', () => {
      expect(formatDate('2023-05-15', 'yyyy/MM/dd')).toBe('2023/05/15');
    });

    it('should return "Invalid date" for invalid date strings', () => {
      expect(formatDate('not-a-date')).toBe('Invalid date');
    });
  });

  describe('formatDateTime', () => {
    it('should format a valid date string with time', () => {
      expect(formatDateTime('2023-05-15T14:30:00')).toBe('May 15, 2023 2:30 PM');
    });

    it('should return N/A for undefined input', () => {
      expect(formatDateTime(undefined)).toBe('N/A');
    });

    it('should handle custom format strings', () => {
      expect(formatDateTime('2023-05-15T14:30:00', 'yyyy-MM-dd HH:mm')).toBe('2023-05-15 14:30');
    });
  });

  describe('formatTime', () => {
    it('should return the time string as is', () => {
      expect(formatTime('14:30')).toBe('14:30');
    });

    it('should return N/A for undefined input', () => {
      expect(formatTime(undefined)).toBe('N/A');
    });
  });

  describe('formatCurrency', () => {
    it('should format a number as USD currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format a number with custom currency', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });

    it('should return N/A for undefined input', () => {
      expect(formatCurrency(undefined)).toBe('N/A');
    });
  });

  describe('formatPercentage', () => {
    it('should format a number as percentage with default decimal places', () => {
      expect(formatPercentage(75.5)).toBe('75.5%');
    });

    it('should format a number as percentage with custom decimal places', () => {
      expect(formatPercentage(75.5678, 2)).toBe('75.57%');
    });

    it('should return N/A for undefined input', () => {
      expect(formatPercentage(undefined)).toBe('N/A');
    });
  });

  describe('formatStatus', () => {
    it('should return success for completed status', () => {
      expect(formatStatus('completed')).toBe('success');
    });

    it('should return warning for in-progress status', () => {
      expect(formatStatus('in-progress')).toBe('warning');
    });

    it('should return error for failed status', () => {
      expect(formatStatus('failed')).toBe('error');
    });

    it('should return info for scheduled status', () => {
      expect(formatStatus('scheduled')).toBe('info');
    });

    it('should return default for unknown status', () => {
      expect(formatStatus('unknown')).toBe('default');
    });

    it('should return default for undefined status', () => {
      expect(formatStatus(undefined)).toBe('default');
    });

    it('should be case-insensitive', () => {
      expect(formatStatus('COMPLETED')).toBe('success');
    });
  });

  describe('formatPriority', () => {
    it('should format high priority correctly', () => {
      expect(formatPriority('high')).toEqual({ label: 'High', color: 'error' });
    });

    it('should format medium priority correctly', () => {
      expect(formatPriority('medium')).toEqual({ label: 'Medium', color: 'warning' });
    });

    it('should format low priority correctly', () => {
      expect(formatPriority('low')).toEqual({ label: 'Low', color: 'success' });
    });

    it('should format unknown priority as normal', () => {
      expect(formatPriority('unknown')).toEqual({ label: 'Normal', color: 'default' });
    });

    it('should be case-insensitive', () => {
      expect(formatPriority('HIGH')).toEqual({ label: 'High', color: 'error' });
    });
  });

  describe('formatInspectionType', () => {
    it('should format inspection type by replacing underscores with spaces', () => {
      expect(formatInspectionType('quality_check')).toBe('Quality Check');
    });

    it('should capitalize each word', () => {
      expect(formatInspectionType('safety_compliance_review')).toBe('Safety Compliance Review');
    });

    it('should return Unknown for undefined input', () => {
      expect(formatInspectionType(undefined)).toBe('Unknown');
    });
  });
}); 