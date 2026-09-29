/**
 * Currency and digit grouping utilities standardized on Indian Rupee (INR - ₹).
 */

export function formatINR(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '₹0';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return '₹0';
  
  const rounded = Math.round(num);
  return '₹' + rounded.toLocaleString('en-IN');
}

export function formatINRText(text: string): string {
  if (!text) return '';
  // Replace $ or ??? followed by amount with INR format
  return text.replace(/(?:\$|\?{3})\s*([0-9,]+(?:\.[0-9]+)?)/g, (_, match) => {
    const cleanNum = parseFloat(match.replace(/,/g, ''));
    if (isNaN(cleanNum)) return `₹${match}`;
    return formatINR(cleanNum);
  });
}
