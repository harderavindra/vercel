export const snakeToCapitalCase = (value) => {
   if (typeof value !== 'string') return '';
   return value
     .split('_')
     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
     .join(' ');
 };