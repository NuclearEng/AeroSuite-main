/**
 * Format a date object to a standard string format
 * @param {Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
function dateFormat(date, options = {}) {
  if (!date) return '';
  
  // Convert string date to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Default options
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  };
  
  // Merge default options with provided options
  const formatOptions = { ...defaultOptions, ...options };
  
  // If showTime is false, remove time-related options
  if (options.showTime === false) {
    delete formatOptions.hour;
    delete formatOptions.minute;
  }
  
  try {
    return dateObj.toLocaleDateString('en-US', formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toString();
  }
}

module.exports = dateFormat; 