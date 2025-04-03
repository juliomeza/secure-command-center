// src/views/CEOView.tsx
import React from 'react';
import { TooltipProps } from 'recharts'; // Import TooltipProps for type safety
import KpiCard from '../components/common/KpiCard';
import Card from '../components/common/Card';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import DashboardGrid from '../components/layout/DashboardGrid';
import { formatCurrency, formatK, formatM } from '../utils/formatters';
import { revenueGrowthData, salesByRegionData, expenseData } from '../data/mockData';
import { DataPoint } from '../data/types';

// Define Tooltip formatters with explicit types
const currencyTooltipFormatter: TooltipProps<number, string>['formatter'] = (value) => [formatCurrency(value as number), "Revenue"];
const expenseTooltipFormatter: TooltipProps<number, string>['formatter'] = (value) => formatCurrency(value as number);
const salesTooltipFormatter: TooltipProps<number, string>['formatter'] = (value) => formatCurrency(value as number);

const CEOView: React.FC = () => {
  return (
    <DashboardGrid>
      <KpiCard
        title="Revenue"
        value={formatCurrency(3580000)}
      />

      <KpiCard
        title="Profit"
        value={formatCurrency(1110000)}
        trend={
          <span className="text-green-600 flex items-center text-sm"> {/* Adjusted size */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"> {/* Adjusted size */}
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" /> {/* Up arrow */}
            </svg>
            11.5%
          </span>
        }
      />

      <Card title="Revenue Growth">
        <LineChart
          data={revenueGrowthData}
          lines={[{ type: 'monotone', dataKey: 'value', stroke: '#1e3a8a', strokeWidth: 2, dot: false }]}
          xAxisProps={{ dataKey: 'name', axisLine: false, tickLine: false }}
          yAxisProps={{ tickFormatter: formatK, axisLine: false, tickLine: false, width: 40 }}
          tooltipProps={{ formatter: currencyTooltipFormatter }}
          height={180} // Adjust height slightly
        />
      </Card>

      <Card title="Expense Breakdown">
         <div className="flex items-center justify-between mb-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(870000)}</p>
          </div>
        <PieChart
          data={expenseData}
          tooltipProps={{ formatter: expenseTooltipFormatter }}
          height={180} // Adjust height slightly
        />
      </Card>

      <Card title="Sales by Region" className="md:col-span-2">
        <BarChart
          data={salesByRegionData}
          bars={[{ dataKey: 'value', fill: '#3b82f6', radius: [4, 4, 0, 0] }]}
          xAxisProps={{ dataKey: 'name', axisLine: false, tickLine: false }}
          yAxisProps={{ tickFormatter: formatM, axisLine: false, tickLine: false, width: 40 }}
          tooltipProps={{ formatter: salesTooltipFormatter }}
          height={200}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }} // Adjusted margin
        />
      </Card>
    </DashboardGrid>
  );
};

export default CEOView;