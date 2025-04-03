// src/views/CFOView.tsx
import React from 'react';
import KpiCard from '../components/common/KpiCard';
import Card from '../components/common/Card';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import DashboardGrid from '../components/layout/DashboardGrid';
import { formatCurrency, formatM } from '../utils/formatters';
import { cashFlowData, expenseData } from '../data/mockData';

// Tooltip Formatters
const currencyTooltipFormatter = (value: number): string => formatCurrency(value);

const CFOView: React.FC = () => {
  return (
    <DashboardGrid>
      <KpiCard
        title="Total Revenue"
        value={formatCurrency(3580000)}
      />

      <KpiCard
        title="Profit Margin"
        value="31.0%"
        trend={
          <span className="text-green-600 flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            2.5%
          </span>
        }
      />

      <Card title="Cash Flow">
        <LineChart
          data={cashFlowData}
          lines={[
            { type: 'monotone', dataKey: 'inflow', name: 'Inflow', stroke: '#1e3a8a', strokeWidth: 2, dot: false },
            { type: 'monotone', dataKey: 'outflow', name: 'Outflow', stroke: '#ef4444', strokeWidth: 2, dot: false }
          ]}
          xAxisProps={{ dataKey: 'name', axisLine: false, tickLine: false }}
          yAxisProps={{ tickFormatter: formatM, axisLine: false, tickLine: false, width: 40 }}
          tooltipProps={{ formatter: currencyTooltipFormatter }}
          showLegend={true}
          height={180}
        />
      </Card>

       <Card title="Expense Breakdown">
         <div className="flex items-center justify-between mb-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(870000)}</p>
          </div>
        <PieChart
          data={expenseData}
          tooltipProps={{ formatter: currencyTooltipFormatter }}
          height={180} // Adjust height slightly
        />
      </Card>

      <Card title="Investments and Returns" className="md:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center sm:text-left">
            <h4 className="text-sm font-medium text-gray-600">Total Investment</h4>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(1250000)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center sm:text-left">
            <h4 className="text-sm font-medium text-gray-600">Annual ROI</h4>
            <p className="text-xl font-bold text-gray-900 mt-1">18.5%</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center sm:text-left">
            <h4 className="text-sm font-medium text-gray-600">Payback Period</h4>
            <p className="text-xl font-bold text-gray-900 mt-1">2.4 years</p>
          </div>
        </div>
      </Card>
    </DashboardGrid>
  );
};

export default CFOView;