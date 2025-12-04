// Utility function to convert numbers to words (Indian numbering system)
export function numberToWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      return tens[ten] + (unit > 0 ? " " + units[unit] : "");
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return units[hundred] + " Hundred" + (remainder > 0 ? " " + convertLessThanThousand(remainder) : "");
  }

  function convertToWords(num: number): string {
    if (num === 0) return "";

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = "";

    if (crore > 0) {
      result += convertLessThanThousand(crore) + " Crore ";
    }
    if (lakh > 0) {
      result += convertLessThanThousand(lakh) + " Lakh ";
    }
    if (thousand > 0) {
      result += convertLessThanThousand(thousand) + " Thousand ";
    }
    if (remainder > 0) {
      result += convertLessThanThousand(remainder);
    }

    return result.trim();
  }

  const rupees = Math.floor(amount);
  const paisa = Math.round((amount - rupees) * 100);

  let words = convertToWords(rupees) + " Rupees";
  
  if (paisa > 0) {
    words += " and " + convertToWords(paisa) + " Paisa";
  }
  
  return words + " Only";
}
