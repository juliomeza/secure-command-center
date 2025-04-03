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
  margin = { top: 5, right: 30, bottom: 20, left: 20 }
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} layout={layout} margin={margin}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" horizontal={layout === 'vertical'} vertical={layout === 'horizontal'} />}
        <XAxis {...xAxisProps} type={layout === 'vertical' ? 'number' : 'category'} />
        <YAxis {...yAxisProps} type={layout === 'vertical' ? 'category' : 'number'} />
        <Tooltip {...tooltipProps} />
        {showLegend && <Legend />}
        {bars.map((barProps, index) => {
          // Extraer la propiedad dataKey para evitar errores de tipado
          const { dataKey, ...otherProps } = barProps;
          return <Bar key={index} dataKey={dataKey} {...otherProps} />;
        })}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;