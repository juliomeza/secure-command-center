// src/views/CIOView.tsx
import React from 'react';
import { TooltipProps } from 'recharts';
import KpiCard from '../components/common/KpiCard';
import Card from '../components/common/Card';
import BarChart from '../components/charts/BarChart';
import DashboardGrid from '../components/layout/DashboardGrid';
import ProjectTable from '../components/tables/ProjectTable';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { systemUptimeData, itProjectsData } from '../data/mockData';

// Tooltip Formatter
const percentTooltipFormatter: TooltipProps<number, string>['formatter'] = (value) => `${value}%`;

const CIOView: React.FC = () => {
  const budgetUsedPercent = (950000 / 1200000) * 100;
  const budgetRemainingPercent = 100 - budgetUsedPercent;

  return (
    <DashboardGrid>
      <KpiCard
        title="System Availability"
        value="99.96%"
        trend={
          <span className="text-green-600 flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            0.05%
          </span>
        }
      />

      <Card title="Security Incidents">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold text-gray-900">2</p>
            <p className="text-sm text-gray-600">last month</p>
          </div>
          <div className="ml-8 text-right">
            <p className="text-xl font-bold text-gray-600">12</p>
            <p className="text-sm text-gray-600">last 12 months</p>
          </div>
        </div>
      </Card>

      <Card title="Availability by System">
        <BarChart
          data={systemUptimeData}
          layout="vertical"
          bars={[{ dataKey: 'value', fill: '#3b82f6', radius: [0, 4, 4, 0] }]}
          xAxisProps={{ type: 'number', domain: [99.8, 100], tickFormatter: formatPercent, axisLine: false, tickLine: false }}
          yAxisProps={{ dataKey: 'name', type: 'category', width: 80, axisLine: false, tickLine: false }}
          tooltipProps={{ formatter: percentTooltipFormatter }}
          height={200}
          margin={{ top: 5, right: 30, bottom: 5, left: 80 }} // Keep original margin
        />
      </Card>

      <Card title="IT Budget Status">
        <div className="flex items-center justify-between mb-4">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(950000)}</p>
          <p className="text-lg font-medium text-gray-600">of {formatCurrency(1200000)}</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
          <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${budgetUsedPercent}%` }}></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Used: {budgetUsedPercent.toFixed(0)}%</span>
          <span>Remaining: {budgetRemainingPercent.toFixed(0)}%</span>
        </div>
      </Card>

      <Card title="Active IT Projects" className="md:col-span-2">
        <ProjectTable projects={itProjectsData} />
      </Card>
    </DashboardGrid>
  );
};

export default CIOView;