/**
 * Formats a date string or timestamp into a readable format like 'DD MMM YYYY'
 * @param {string|number|Date} dateSource - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateSource) => {
  if (!dateSource) return 'N/A';
  
  try {
    const date = new Date(dateSource);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
};

/**
 * Formats a date into a readable time format like 'HH:MM AM/PM'
 * @param {string|number|Date} dateSource - The date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (dateSource) => {
  if (!dateSource) return '';
  
  try {
    const date = new Date(dateSource);
    if (isNaN(date.getTime())) return '';
    
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (error) {
    return '';
  }
};
