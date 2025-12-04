/**
 * Format number in Nepali style (Indian numbering system)
 * Example: 1234567.89 -> 12,34,567.89
 */
export const formatNepaliCurrency = (amount: number): string => {
  const parts = amount.toFixed(2).split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format the integer part with Nepali/Indian style commas
  let formattedInteger = "";
  let count = 0;
  
  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      formattedInteger = "," + formattedInteger;
    }
    formattedInteger = integerPart[i] + formattedInteger;
    count++;
  }
  
  return `NRS ${formattedInteger}.${decimalPart}`;
};

/**
 * Format number in Nepali style without currency
 */
export const formatNepaliNumber = (value: number): string => {
  const parts = value.toFixed(2).split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  let formattedInteger = "";
  let count = 0;
  
  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      formattedInteger = "," + formattedInteger;
    }
    formattedInteger = integerPart[i] + formattedInteger;
    count++;
  }
  
  return `${formattedInteger}.${decimalPart}`;
};
