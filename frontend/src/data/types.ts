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

export interface WarehouseIssue {
    id: string;
    issue: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'In Progress' | 'Scheduled' | 'On Track' | 'Not Started';
    assignedTo: string;
    dueDate: string;
}

export interface WarehouseInventoryData {
    name: string;
    turnover: number;
    accuracy: number;
}

export interface UserProfile {
    company?: {
        name: string;
    };
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile?: UserProfile;
}