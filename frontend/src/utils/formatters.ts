// src/utils/formatters.ts
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  export const formatPercentage = (value: number, decimals: number = 1): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  };
  
  export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  export const formatK = (value: number): string => `${value / 1000}K`;
  export const formatM = (value: number): string => `${value / 1000000}M`;
  export const formatPercent = (value: number): string => `${value}%`;