// src/components/charts/BarChart.tsx
import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxisProps,
  YAxisProps,
  TooltipProps
} from 'recharts';

interface BarConfig {
  dataKey: string;
  fill?: string;
  radius?: number | [number, number, number, number];
  [key: string]: any;
}

interface CustomBarChartProps {
  data: Array<Record<string, any>>;
  bars: BarConfig[];
  layout?: 'horizontal' | 'vertical';
  xAxisProps?: XAxisProps;
  yAxisProps?: YAxisProps;
  tooltipProps?: Partial<TooltipProps<number, string>>;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

const BarChart: React.FC<CustomBarChartProps> = ({
  data,
  bars,
  layout = 'horizontal',
  xAxisProps,
  yAxisProps,
  tooltipProps,
  showGrid = true,
  showLegend = false,
  height = 200,
  margin
}) => {
  // Define márgenes predeterminados basados en la orientación del gráfico
  const defaultMargin = layout === 'vertical' 
    ? { top: 5, right: 30, bottom: 5, left: 10 } // Margen predeterminado para gráficos verticales
    : { top: 5, right: 20, bottom: 5, left: 10 }; // Margen predeterminado para gráficos horizontales

  // Combina los márgenes personalizados con los predeterminados
  const finalMargin = { ...defaultMargin, ...(margin || {}) };

  // Configuraciones predeterminadas para ejes basadas en la orientación
  const defaultXAxisProps: Partial<XAxisProps> = layout === 'vertical'
    ? { type: 'number', axisLine: false, tickLine: false }
    : { type: 'category', axisLine: false, tickLine: false };

  const defaultYAxisProps: Partial<YAxisProps> = layout === 'vertical'
    ? { type: 'category', width: 100, tick: { textAnchor: 'end' }, axisLine: false, tickLine: false }
    : { type: 'number', width: 40, axisLine: false, tickLine: false };

  // Combina configuraciones predeterminadas con las personalizadas
  const finalXAxisProps = { ...defaultXAxisProps, ...(xAxisProps || {}) };
  const finalYAxisProps = { ...defaultYAxisProps, ...(yAxisProps || {}) };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} layout={layout} margin={finalMargin}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" horizontal={layout === 'vertical'} vertical={layout === 'horizontal'} />}
        <XAxis {...finalXAxisProps} />
        <YAxis {...finalYAxisProps} />
        <Tooltip {...tooltipProps} />
        {showLegend && <Legend />}
        {bars.map((barProps, index) => {
          const { dataKey, ...otherProps } = barProps;
          return <Bar key={index} dataKey={dataKey} {...otherProps} />;
        })}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;