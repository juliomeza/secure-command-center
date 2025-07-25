// src/views/CEOView.tsx
import React from 'react';
import { useWindowResize } from '../hooks/useWindowResize';
import KpiCard from '../cards/KpiCard';
import Card from '../cards/Card';
import LineChart from '../charts/LineChart';
import PieChart from '../charts/PieChart';
import BarChart from '../charts/BarChart';
import DashboardGrid from '../layouts/DashboardGrid';
import { formatCurrency, formatK, formatM } from '../utils/formatters';
import { revenueGrowthData, revenueByRegionData, expenseData } from '../data/mockData';

// Define Tooltip formatters with explicit types
const currencyTooltipFormatter = (value: number): [string, string] => [formatCurrency(value), "Revenue"];
const expenseTooltipFormatter = (value: number): string => formatCurrency(value);
const salesTooltipFormatter = (value: number): string => formatCurrency(value);

const CEOView: React.FC = () => {
  // Detectar el ancho de la ventana para aplicar estilos responsivos
  const windowWidth = useWindowResize();
  
  // Determine flex direction and item width based on screen size
  const isSmallScreen = windowWidth < 900;
  
  return (
    <>
      {/* KPI Cards Row - 3 en una fila con responsividad */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: '1.5rem', 
        marginBottom: '1.5rem', 
        width: '100%' 
      }}>
        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
          <KpiCard
            title="Revenue"
            value={formatCurrency(3580000)}
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                7.2%
              </span>
            }
          />
        </div>

        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
          <KpiCard
            title="Profit"
            value={formatCurrency(1110000)}
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                11.5%
              </span>
            }
          />
        </div>
        
        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
          <KpiCard
            title="Customer Retention Rate"
            value="94%"
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                3.2%
              </span>
            }
          />
        </div>
      </div>
      
      {/* Charts y otros componentes */}
      <DashboardGrid>
        <Card title="Revenue Growth">
          <LineChart
            data={revenueGrowthData}
            lines={[{ type: 'monotone', dataKey: 'value', stroke: '#1e3a8a', strokeWidth: 2, dot: true }]}
            xAxisProps={{ dataKey: 'name', axisLine: true, tickLine: true }}
            yAxisProps={{ tickFormatter: formatK, axisLine: true, tickLine: false, width: 45 }}
            tooltipProps={{ formatter: currencyTooltipFormatter }}
            height={180}
          />
        </Card>

        <Card title="Expense Breakdown">
          <PieChart
            data={expenseData}
            tooltipProps={{ formatter: expenseTooltipFormatter }}
            height={180}
            centerLabel={formatCurrency(770000)}
            showLegend={false}
          />
        </Card>

        <Card title="Revenue by Region" className="md:col-span-2">
          <BarChart
            data={revenueByRegionData}
            bars={[{ dataKey: 'value', fill: '#3b82f6', radius: [4, 4, 0, 0] }]}
            xAxisProps={{ dataKey: 'name' }}
            yAxisProps={{ tickFormatter: formatM }}
            tooltipProps={{ formatter: salesTooltipFormatter }}
            height={300}
          />
        </Card>
      </DashboardGrid>
    </>
  );
};

export default CEOView;