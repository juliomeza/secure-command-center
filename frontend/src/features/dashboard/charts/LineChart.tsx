// src/components/charts/LineChart.tsx
import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
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

// Define props more explicitly using generics
interface LineConfig {
  dataKey: string;
  type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
  stroke?: string;
  strokeWidth?: number;
  dot?: boolean | object;
  name?: string;
  [key: string]: any;
}

interface CustomLineChartProps {
  data: Array<Record<string, any>>;
  lines: LineConfig[];
  xAxisProps?: XAxisProps;
  yAxisProps?: YAxisProps;
  tooltipProps?: Partial<TooltipProps<number, string>>;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

const LineChart: React.FC<CustomLineChartProps> = ({
  data,
  lines,
  xAxisProps,
  yAxisProps,
  tooltipProps,
  showGrid = true,
  showLegend = false,
  height = 200,
  margin = { top: 5, right: 20, bottom: 5, left: 0 }
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={margin}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />}
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip {...tooltipProps} />
        {showLegend && <Legend />}
        {lines.map((lineProps, index) => {
          // Extraer la propiedad dataKey para evitar errores de tipado
          const { dataKey, ...otherProps } = lineProps;
          return <Line key={index} dataKey={dataKey} {...otherProps} />;
        })}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;