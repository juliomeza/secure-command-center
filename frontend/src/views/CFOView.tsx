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
            title="Total Revenue"
            value={formatCurrency(3580000)}
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                5.5%
              </span>
            }
          />
        </div>

        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
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
        </div>
        
        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '33.33%' }}>
          <KpiCard
            title="Operating Expenses (%)"
            value="24.3%"
            trend={
              <span className="text-red-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                1.8%
              </span>
            }
          />
        </div>
      </div>
      
      {/* Charts y otros componentes */}
      <DashboardGrid>
        <Card title="Cash Flow">
          <LineChart
            data={cashFlowData}
            lines={[
              { type: 'monotone', dataKey: 'inflow', name: 'Inflow', stroke: '#1e3a8a', strokeWidth: 2, dot: true },
              { type: 'monotone', dataKey: 'outflow', name: 'Outflow', stroke: '#ef4444', strokeWidth: 2, dot: true }
            ]}
            xAxisProps={{ dataKey: 'name', axisLine: true, tickLine: true }}
            yAxisProps={{ tickFormatter: formatM, axisLine: true, tickLine: false, width: 40 }}
            tooltipProps={{ formatter: currencyTooltipFormatter }}
            showLegend={true}
            height={180}
          />
        </Card>

        <Card title="Expense Breakdown">
          <PieChart
            data={expenseData}
            tooltipProps={{ formatter: currencyTooltipFormatter }}
            height={180} // Adjust height slightly
            centerLabel={formatCurrency(870000)}
            showLegend={false}
          />
        </Card>        
        
        <Card title="Investments and Returns" className="md:col-span-2">
          <div style={{ 
            display: 'flex', 
            flexDirection: isSmallScreen ? 'column' : 'row',
            gap: '0.75rem', 
            width: '100%',
            padding: '0.25rem'
          }}>
            <div style={{ 
              flex: isSmallScreen ? 'none' : '1', 
              width: isSmallScreen ? '100%' : '33.33%',
              padding: '0.0rem 1rem',
              backgroundColor: '#eff6ff',
              borderRadius: '0.5rem',
              textAlign: isSmallScreen ? 'center' : 'left'
            }}>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#4b5563',
                marginBottom: '0.0rem'
              }}>
                Total Investment
              </h4>
              <p style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#111827', 
                marginTop: '0',
                marginBottom: '0.95rem'
              }}>
                {formatCurrency(1250000)}
              </p>
            </div>
            <div style={{ 
              flex: isSmallScreen ? 'none' : '1', 
              width: isSmallScreen ? '100%' : '33.33%',
              padding: '0.0rem 1rem',
              backgroundColor: '#eff6ff',
              borderRadius: '0.5rem',
              textAlign: isSmallScreen ? 'center' : 'left'
            }}>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#4b5563',
                marginBottom: '0.0rem'
              }}>
                Annual ROI
              </h4>
              <p style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#111827', 
                marginTop: '0',
                marginBottom: '0.95'
              }}>
                18.5%
              </p>
            </div>
            <div style={{ 
              flex: isSmallScreen ? 'none' : '1', 
              width: isSmallScreen ? '100%' : '33.33%',
              padding: '0.0rem 1rem',
              backgroundColor: '#eff6ff',
              borderRadius: '0.5rem',
              textAlign: isSmallScreen ? 'center' : 'left'
            }}>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#4b5563',
                marginBottom: '0.0rem'
              }}>
                Payback Period
              </h4>
              <p style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#111827', 
                marginTop: '0',
                marginBottom: '0.95'
              }}>
                2.4 years
              </p>
            </div>
          </div>
        </Card>
      </DashboardGrid>
    </>
  );
};

export default CFOView;