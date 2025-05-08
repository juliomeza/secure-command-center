// src/data/mockData.ts
import { Company, Period, DataPoint, CashFlowPoint, Project } from './types';

export const companies: Company[] = [
  { id: 'all', name: 'All Companies' },
  { id: 'company1', name: 'TechSolutions Inc.' },
  { id: 'company2', name: 'EcoGreen Ventures' },
  { id: 'company3', name: 'Global Logistics' },
  { id: 'company4', name: 'Healthcare Partners' },
  { id: 'company5', name: 'Financial Experts' }
];

export const periods: Period[] = [
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'quarterly', name: 'Quarterly' },
  { id: 'yearly', name: 'Yearly' }
];

export const revenueGrowthData: DataPoint[] = [
  { name: 'Jan', value: 60000 },
  { name: 'Feb', value: 110000 },
  { name: 'Mar', value: 180000 },
  { name: 'Apr', value: 240000 },
  { name: 'May', value: 320000 },
];

export const revenueByRegionData: DataPoint[] = [
  { name: 'Florida - Boca', value: 1200000 },
  { name: 'Florida - Pompano', value: 1500000 },
  { name: 'Texas', value: 980000 },
  { name: 'New Jersey', value: 1350000 },
  { name: 'Ohio', value: 800000 },
];

export const expenseData: DataPoint[] = [
  { name: 'Personnel', value: 450000, color: '#1e3a8a' },
  { name: 'Marketing', value: 200000, color: '#3b82f6' },
  { name: 'Operations', value: 120000, color: '#93c5fd' },
];

export const projectStatusData: DataPoint[] = [
  { name: 'Completed', value: 18, color: '#1e3a8a' },
  { name: 'In progress', value: 7, color: '#3b82f6' },
  { name: 'Delayed', value: 3, color: '#93c5fd' },
  { name: 'Not started', value: 5, color: '#bfdbfe' },
];

export const marketShareData: DataPoint[] = [
  { name: 'Jan', value: 28 },
  { name: 'Feb', value: 29 },
  { name: 'Mar', value: 32 },
  { name: 'Apr', value: 35 },
  { name: 'May', value: 38 },
];

export const cashFlowData: CashFlowPoint[] = [
  { name: 'Jan', inflow: 2800000, outflow: 2200000 },
  { name: 'Feb', inflow: 3200000, outflow: 2400000 },
  { name: 'Mar', inflow: 3700000, outflow: 2900000 },
  { name: 'Apr', inflow: 4100000, outflow: 3000000 },
  { name: 'May', inflow: 4800000, outflow: 3200000 },
];

export const teamPerformanceData: DataPoint[] = [
  { name: 'Sales', value: 92 },
  { name: 'Development', value: 88 },
  { name: 'Support', value: 95 },
  { name: 'Marketing', value: 85 },
  { name: 'Finance', value: 90 },
  { name: 'HR', value: 87 },
];

export const systemUptimeData: DataPoint[] = [
  { name: 'CRM', value: 99.98 },
  { name: 'ERP', value: 99.95 },
  { name: 'Web', value: 99.99 },
  { name: 'Intranet', value: 99.90 },
  { name: 'Cloud', value: 99.97 },
];

export const itProjectsData: Project[] = [
     { id: '1', name: 'Cloud Migration', status: 'On track', progress: 75, endDate: '06/15/2025' },
     { id: '2', name: 'ERP Update', status: 'At risk', progress: 45, endDate: '07/30/2025' },
     { id: '3', name: 'Security Audit', status: 'On track', progress: 90, endDate: '04/15/2025' },
];

// Warehouse Leaders Mock Data
export const warehouseInventoryData = [
  { name: 'Jan', turnover: 5.2, accuracy: 99.1 },
  { name: 'Feb', turnover: 5.1, accuracy: 99.2 },
  { name: 'Mar', turnover: 5.4, accuracy: 99.5 },
  { name: 'Apr', turnover: 5.6, accuracy: 99.7 },
  { name: 'May', turnover: 5.8, accuracy: 99.8 },
];

export const warehouseSpaceUtilizationData = [
  { name: 'Used', value: 82, color: '#1e3a8a' },
  { name: 'Reserved', value: 10, color: '#3b82f6' },
  { name: 'Available', value: 8, color: '#93c5fd' },
];

export const warehouseShipmentData = [
  { name: 'Mon', value: 580 },
  { name: 'Tue', value: 620 },
  { name: 'Wed', value: 590 },
  { name: 'Thu', value: 540 },
  { name: 'Fri', value: 530 },
];

export const warehouseCategoryData = [
  { name: 'Electronics', value: 420, color: '#1e3a8a' },
  { name: 'Apparel', value: 310, color: '#3b82f6' },
  { name: 'Home Goods', value: 280, color: '#93c5fd' },
  { name: 'Accessories', value: 190, color: '#bfdbfe' },
  { name: 'Other', value: 140, color: '#dbeafe' },
];

export const warehousePerformanceData = [
  { name: 'Receiving', value: 95.8 },
  { name: 'Put-away', value: 96.2 },
  { name: 'Picking', value: 97.5 },
  { name: 'Packing', value: 98.1 },
  { name: 'Shipping', value: 97.9 },
];

export const warehouseReturnRateData = [
  { name: 'Jan', value: 2.8 },
  { name: 'Feb', value: 2.5 },
  { name: 'Mar', value: 2.2 },
  { name: 'Apr', value: 1.9 },
  { name: 'May', value: 1.7 },
];

// Warehouse Issues Mock Data
export const warehouseIssuesData = [
  { 
    id: '1', 
    issue: 'Inventory Count Discrepancy - Zone B4', 
    priority: 'High' as const, 
    status: 'In Progress' as const, 
    assignedTo: 'Inventory Team', 
    dueDate: '04/10/2025'
  },
  { 
    id: '2', 
    issue: 'Conveyor System Maintenance', 
    priority: 'Medium' as const, 
    status: 'Scheduled' as const, 
    assignedTo: 'Maintenance Team', 
    dueDate: '04/15/2025'
  },
  { 
    id: '3', 
    issue: 'Staff Training - New Picking System', 
    priority: 'Medium' as const, 
    status: 'On Track' as const, 
    assignedTo: 'Operations Manager', 
    dueDate: '04/22/2025'
  },
  { 
    id: '4', 
    issue: 'Seasonal Inventory Planning', 
    priority: 'Low' as const, 
    status: 'Not Started' as const, 
    assignedTo: 'Planning Team', 
    dueDate: '05/05/2025'
  },
];