// src/data/types.ts
export interface DataPoint {
    name: string;
    value: number;
    color?: string; // Para PieChart
  }
  
  export interface CashFlowPoint {
    name: string;
    inflow: number;
    outflow: number;
  }
  
  export interface Company {
    id: string;
    name: string;
  }
  
  export interface Period {
    id: string;
    name: string;
  }
  
  export interface Project {
      id: string;
      name: string;
      status: 'On track' | 'At risk' | 'Delayed'; // Ejemplo, puedes ajustar los estados
      progress: number; // Porcentaje 0-100
      endDate: string; // Formato 'MM/DD/YYYY' o similar
  }