// src/views/COOView.tsx
import React from 'react';
import KpiCard from '../components/common/KpiCard';
import Card from '../components/common/Card';
import SubCard from '../components/common/SubCard';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import DashboardGrid from '../components/layout/DashboardGrid';
import { formatPercent } from '../utils/formatters';
import { projectStatusData, marketShareData, teamPerformanceData } from '../data/mockData';

// Tooltip Formatters
const percentTooltipFormatter = (value: number): string => `${value}%`;
const projectTooltipFormatter = (value: number): string => `${value} projects`;

const COOView: React.FC = () => {
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
            title="Warehouse Utilization"
            value="89.2%"
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                4.5%
              </span>
            }
          />
        </div>

        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
          <KpiCard
            title="Orders Processed"
            value="12,437"
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                6.8%
              </span>
            }
          />
        </div>
        
        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
          <KpiCard
            title="Total Billed Units"
            value="583,921"
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                5.2%
              </span>
            }
          />
        </div>
      </div>

      <DashboardGrid>
        <Card title="Project Status">
          <PieChart
            data={projectStatusData}
            tooltipProps={{ formatter: projectTooltipFormatter }}
            height={180}
            showLegend={false}
          />
        </Card>

        <Card title="Market Share">
          <LineChart
            data={marketShareData}
            lines={[{ type: 'monotone', dataKey: 'value', stroke: '#1e3a8a', strokeWidth: 2, dot: true }]}
            xAxisProps={{ dataKey: 'name', axisLine: true, tickLine: true }}
            yAxisProps={{ domain: [25, 40], tickFormatter: formatPercent, axisLine: true, tickLine: false, width: 40 }}
            tooltipProps={{ formatter: percentTooltipFormatter }}
            height={180}
          />
        </Card>        <Card title="Team Performance" className="md:col-span-2">
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
        </Card>        <Card title="Key Operational Metrics" className="md:col-span-2">
          <div style={{ 
            display: 'flex', 
            flexDirection: isSmallScreen ? 'column' : 'row',
            gap: '1rem', 
            width: '100%' 
          }}>

            <SubCard 
              title="Delivery Time" 
              value="2.3 days" 
              isSmallScreen={isSmallScreen}
              width="25%"
              trend={
                <span className="text-green-600 text-sm" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSmallScreen ? 'center' : 'flex-start'
                }}>
                  <span>0.2</span>
                  <svg style={{ width: '18px', height: '18px', marginLeft: '2px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              }
            />

            <SubCard 
              title="Defect Rate" 
              value="0.8%" 
              isSmallScreen={isSmallScreen}
              width="25%"
              trend={
                <span className="text-green-600 text-sm" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSmallScreen ? 'center' : 'flex-start'
                }}>
                  <span>0.3%</span>
                  <svg style={{ width: '18px', height: '18px', marginLeft: '2px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              }
            />

            <SubCard 
              title="Capacity Utilized" 
              value="92.5%" 
              isSmallScreen={isSmallScreen}
              width="25%"
              trend={
                <span className="text-green-600 text-sm" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSmallScreen ? 'center' : 'flex-start'
                }}>
                  <span>3.5%</span>
                  <svg style={{ width: '18px', height: '18px', marginLeft: '2px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              }
            />

            <SubCard 
              title="Satisfaction" 
              value="94.2%" 
              isSmallScreen={isSmallScreen}
              width="25%"
              trend={
                <span className="text-green-600 text-sm" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSmallScreen ? 'center' : 'flex-start'
                }}>
                  <span>1.8%</span>
                  <svg style={{ width: '18px', height: '18px', marginLeft: '2px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              }
            />
          </div>
        </Card>
      </DashboardGrid>
    </>
  );
};

export default COOView;