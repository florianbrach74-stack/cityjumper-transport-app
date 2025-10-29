/**
 * Format price with VAT notice
 * @param {number} price - Price in EUR
 * @param {boolean} showVAT - Whether to show VAT notice (default: true)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, showVAT = true) => {
  if (!price && price !== 0) return '-';
  
  const formatted = typeof price === 'number' ? price.toFixed(2) : parseFloat(price).toFixed(2);
  
  return showVAT ? `€${formatted} (zzgl. 19% MwSt.)` : `€${formatted}`;
};

/**
 * Format price inline (shorter version)
 * @param {number} price - Price in EUR
 * @returns {string} Formatted price string
 */
export const formatPriceInline = (price) => {
  if (!price && price !== 0) return '-';
  
  const formatted = typeof price === 'number' ? price.toFixed(2) : parseFloat(price).toFixed(2);
  
  return `€${formatted}*`;
};

/**
 * Calculate price with VAT
 * @param {number} netPrice - Net price in EUR
 * @param {number} vatRate - VAT rate (default: 0.19 for 19%)
 * @returns {number} Gross price
 */
export const calculateGrossPrice = (netPrice, vatRate = 0.19) => {
  return netPrice * (1 + vatRate);
};
