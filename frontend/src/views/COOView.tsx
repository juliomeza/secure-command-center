// src/views/COOView.tsx
import React from 'react';
import { TooltipProps } from 'recharts';
import KpiCard from '../components/common/KpiCard';
import Card from '../components/common/Card';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import DashboardGrid from '../components/layout/DashboardGrid';
import { formatPercent } from '../utils/formatters';
import { projectStatusData, marketShareData, teamPerformanceData } from '../data/mockData';

// Tooltip Formatters
const percentTooltipFormatter: TooltipProps<number, string>['formatter'] = (value) => `${value}%`;
const projectTooltipFormatter: TooltipProps<number, string>['formatter'] = (value) => `${value} projects`;

const COOView: React.FC = () => {
  return (
    <DashboardGrid>
      <KpiCard
        title="Operational Efficiency"
        value="87.5%"
        trend={
          <span className="text-green-600 flex items-center text-sm">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
             </svg>
            3.2%
          </span>
        }
      />

      <Card title="Project Status">
        <PieChart
          data={projectStatusData}
          tooltipProps={{ formatter: projectTooltipFormatter }}
          height={180}
        />
      </Card>

      <Card title="Market Share">
        <LineChart
          data={marketShareData}
          lines={[{ type: 'monotone', dataKey: 'value', stroke: '#1e3a8a', strokeWidth: 2, dot: false }]}
          xAxisProps={{ dataKey: 'name', axisLine: false, tickLine: false }}
          yAxisProps={{ domain: [25, 40], tickFormatter: formatPercent, axisLine: false, tickLine: false, width: 40 }}
          tooltipProps={{ formatter: percentTooltipFormatter }}
          height={180}
        />
      </Card>

      <Card title="Team Performance">
        <BarChart
          data={teamPerformanceData}
          layout="vertical"
          bars={[{ dataKey: 'value', fill: '#3b82f6', radius: [0, 4, 4, 0] }]}
          xAxisProps={{ type: 'number', domain: [0, 100], tickFormatter: formatPercent, tickCount: 5, axisLine: false, tickLine: false }}
          yAxisProps={{ dataKey: 'name', type: 'category', width: 100, tick: { textAnchor: 'end' }, axisLine: false, tickLine: false }}
          tooltipProps={{ formatter: percentTooltipFormatter }}
          height={250} // Keep original height
          margin={{ top: 5, right: 30, bottom: 5, left: 100 }} // Keep original margin
        />
      </Card>

      <Card title="Key Operational Metrics" className="md:col-span-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Delivery Time</h4>
            <p className="text-xl font-bold text-gray-900 mt-1">2.3 days</p>
            <span className="text-green-600 text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" /> {/* Down Arrow */}
                </svg>
                 0.2
            </span>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Defect Rate</h4>
            <p className="text-xl font-bold text-gray-900 mt-1">0.8%</p>
             <span className="text-green-600 text-sm flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                 </svg>
                 0.3%
             </span>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Capacity Utilized</h4>
            <p className="text-xl font-bold text-gray-900 mt-1">92.5%</p>
            <span className="text-green-600 text-sm flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" /> {/* Up arrow */}
               </svg>
                3.5%
            </span>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Satisfaction</h4>
            <p className="text-xl font-bold text-gray-900 mt-1">94.2%</p>
            <span className="text-green-600 text-sm flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                 1.8%
             </span>
          </div>
        </div>
      </Card>
    </DashboardGrid>
  );
};

export default COOView;