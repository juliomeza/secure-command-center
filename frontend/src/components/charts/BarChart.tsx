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
  BarProps, // Import types for props if needed
  XAxisProps,
  YAxisProps,
  TooltipProps
} from 'recharts';

interface CustomBarChartProps {
  data: any[];
  bars: BarProps[];
  layout?: 'horizontal' | 'vertical';
  xAxisProps?: XAxisProps;
  yAxisProps?: YAxisProps;
  tooltipProps?: TooltipProps<any, any>;
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
        {bars.map((barProps, index) => (
          <Bar key={index} {...barProps} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;