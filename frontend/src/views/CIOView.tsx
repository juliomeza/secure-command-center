// src/views/CIOView.tsx
import React from 'react';
import KpiCard from '../components/common/KpiCard';
import Card from '../components/common/Card';
import BarChart from '../components/charts/BarChart';
import DashboardGrid from '../components/layout/DashboardGrid';
import ProjectTable from '../components/tables/ProjectTable';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { systemUptimeData, itProjectsData } from '../data/mockData';

// Tooltip Formatter
const percentTooltipFormatter = (value: number): string => `${value}%`;

const CIOView: React.FC = () => {
  const budgetUsedPercent = (950000 / 1200000) * 100;
  const budgetRemainingPercent = 100 - budgetUsedPercent;
  
  // Detectar el ancho de la ventana para aplicar estilos responsivos
  const [windowWidth, setWindowWidth] = React.useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Actualizar el ancho de la ventana cuando cambia
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Determinar la dirección del flex y el ancho de los items según el tamaño de pantalla
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
            title="System Availability"
            value="99.3%"
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                0.2%
              </span>
            }
          />
        </div>

        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
          <KpiCard
            title="Internet Downtime"
            value="43 min"
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                1.2%
              </span>
            }
          />
        </div>
        
        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
          <KpiCard
            title="Security Incidents"
            value="2"
            trend={
              <span className="text-red-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                5%
              </span>
            }
          />
        </div>
      </div>

      <DashboardGrid>
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
    </>
  );
};

export default CIOView;