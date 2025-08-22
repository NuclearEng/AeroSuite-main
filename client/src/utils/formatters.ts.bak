import { format, parseISO } from 'date-fns';
import { enUS, es, fr, de, zhCN } from 'date-fns/locale';
import i18next from 'i18next';

// Map of language codes to date-fns locales
const localeMap: Record<string, Locale> = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  zh: zhCN
};

/**
 * Get the current locale based on the selected language
 * @returns date-fns locale object
 */
export const getCurrentLocale = (): Locale => {
  const language = i18next.language || 'en';
  // Get the base language code (e.g., 'en' from 'en-US')
  const baseLanguage = language.split('-')[0];
  return localeMap[baseLanguage] || enUS;
};

/**
 * Format a date string to a human readable format
 * @param dateString ISO date string
 * @param formatStr Optional format string (defaults to 'MMM d, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (dateString?: string, formatStr = 'MMM d, yyyy'): string => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, formatStr);
  } catch (_error) {
    console.error('Error formatting date:', _error);
    return 'Invalid date';
  }
};

/**
 * Format a date string using the current locale
 * @param dateString ISO date string
 * @param formatStr Optional format string (defaults to 'PP')
 * @returns Locale-specific formatted date string
 */
export const formatLocalizedDate = (dateString?: string, formatStr = 'PP'): string => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, formatStr, { locale: getCurrentLocale() });
  } catch (_error) {
    console.error('Error formatting localized date:', _error);
    return 'Invalid date';
  }
};

/**
 * Format a date string to include time using the current locale
 * @param dateString ISO date string
 * @param formatStr Optional format string (defaults to 'PPp')
 * @returns Locale-specific formatted date and time string
 */
export const formatLocalizedDateTime = (dateString?: string, formatStr = 'PPp'): string => {
  return formatLocalizedDate(dateString, formatStr);
};

/**
 * Format a date string to include time
 * @param dateString ISO date string
 * @param formatStr Optional format string (defaults to 'MMM d, yyyy h:mm a')
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString?: string, formatStr = 'MMM d, yyyy h:mm a'): string => {
  return formatDate(dateString, formatStr);
};

/**
 * Format a time string
 * @param timeString Time string (hh:mm)
 * @returns Formatted time string
 */
export const formatTime = (timeString?: string): string => {
  if (!timeString) return 'N/A';
  return timeString;
};

/**
 * Format a number as currency
 * @param value Number to format
 * @param currency Currency code (defaults to USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (value?: number, currency = 'USD'): string => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Format a number as currency using the current locale
 * @param value Number to format
 * @param currency Currency code (defaults to USD)
 * @returns Locale-specific formatted currency string
 */
export const formatLocalizedCurrency = (value?: number, currency = 'USD'): string => {
  if (value === undefined || value === null) return 'N/A';
  const language = i18next.language || 'en';
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Format a number using the current locale
 * @param value Number to format
 * @param options Intl.NumberFormat options
 * @returns Locale-specific formatted number
 */
export const formatLocalizedNumber = (
  value?: number,
  options: Intl.NumberFormatOptions = {}
): string => {
  if (value === undefined || value === null) return 'N/A';
  const language = i18next.language || 'en';
  return new Intl.NumberFormat(language, options).format(value);
};

/**
 * Format a number as percentage
 * @param value Number to format (0-100)
 * @param decimalPlaces Number of decimal places (defaults to 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value?: number, decimalPlaces = 1): string => {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(decimalPlaces)}%`;
};

/**
 * Format a number as percentage using the current locale
 * @param value Number to format (0-1 or 0-100)
 * @param isDecimal Whether the value is in decimal form (0-1) or percentage form (0-100)
 * @returns Locale-specific formatted percentage string
 */
export const formatLocalizedPercentage = (value?: number, isDecimal = false): string => {
  if (value === undefined || value === null) return 'N/A';
  const language = i18next.language || 'en';
  // If the value is in percentage form (0-100), convert it to decimal form (0-1)
  const decimalValue = isDecimal ? value : value / 100;
  return new Intl.NumberFormat(language, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(decimalValue);
};

/**
 * Format inspection status for display and color coding
 * @param status Inspection status
 * @returns Status configuration for UI display
 */
export const formatStatus = (status?: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  if (!status) return 'default';
  
  switch (status.toLowerCase()) {
    case 'completed':
    case 'active':
    case 'approved':
    case 'pass':
      return 'success';
      
    case 'in-progress':
    case 'in_progress':
    case 'pending':
    case 'waiting':
      return 'warning';
      
    case 'cancelled':
    case 'expired':
    case 'failed':
    case 'fail':
    case 'rejected':
      return 'error';
      
    case 'scheduled':
    case 'upcoming':
    case 'new':
      return 'info';
      
    default:
      return 'default';
  }
};

/**
 * Format inspection priority for display
 * @param priority Priority level
 * @returns Object with label and color information
 */
export const formatPriority = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return { label: 'High', color: 'error' };
    case 'medium':
      return { label: 'Medium', color: 'warning' };
    case 'low':
      return { label: 'Low', color: 'success' };
    default:
      return { label: 'Normal', color: 'default' };
  }
};

/**
 * Format inspection type to be more readable
 * @param type Inspection type
 * @returns Formatted inspection type string
 */
export const formatInspectionType = (type?: string): string => {
  if (!type) return 'Unknown';
  
  // Replace underscores with spaces and capitalize words
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}; 