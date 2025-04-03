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

export const salesByRegionData: DataPoint[] = [
  { name: 'Europe', value: 1200000 },
  { name: 'Americas', value: 1500000 },
  { name: 'Asia', value: 980000 },
  { name: 'EMEA', value: 1350000 },
  { name: 'LATAM', value: 800000 },
  { name: 'Pacific', value: 650000 },
  { name: 'Africa', value: 700000 },
];

export const expenseData: DataPoint[] = [
  { name: 'Personnel', value: 450000, color: '#1e3a8a' },
  { name: 'Marketing', value: 200000, color: '#3b82f6' },
  { name: 'Operations', value: 120000, color: '#93c5fd' },
  { name: 'R&D', value: 100000, color: '#bfdbfe' },
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