import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook that wraps the i18next useTranslation hook
 * and provides additional functionality.
 * 
 * @returns The i18next translation utilities plus additional helpers
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  /**
   * Changes the application language
   * @param language The language code to change to
   */
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    // Store the language preference in localStorage
    localStorage.setItem('i18nextLng', language);
  };
  
  /**
   * Gets the current language code
   * @returns The current language code
   */
  const getCurrentLanguage = () => {
    return i18n.language;
  };
  
  /**
   * Checks if the current language is RTL (Right-to-Left)
   * @returns Boolean indicating if the current language is RTL
   */
  const isRTL = () => {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(getCurrentLanguage());
  };
  
  /**
   * Formats a date according to the current locale
   * @param date The date to format
   * @param options The Intl.DateTimeFormat options
   * @returns The formatted date string
   */
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    const locale = i18n.language;
    return new Intl.DateTimeFormat(locale, options).format(date);
  };
  
  /**
   * Formats a number according to the current locale
   * @param number The number to format
   * @param options The Intl.NumberFormat options
   * @returns The formatted number string
   */
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    const locale = i18n.language;
    return new Intl.NumberFormat(locale, options).format(number);
  };
  
  /**
   * Formats currency according to the current locale
   * @param amount The amount to format
   * @param currencyCode The ISO 4217 currency code (e.g., 'USD', 'EUR')
   * @returns The formatted currency string
   */
  const formatCurrency = (amount: number, currencyCode: string) => {
    return formatNumber(amount, {
      style: 'currency',
      currency: currencyCode,
    });
  };
  
  return {
    t,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    isRTL,
    formatDate,
    formatNumber,
    formatCurrency,
  };
};

export default useTranslation; 