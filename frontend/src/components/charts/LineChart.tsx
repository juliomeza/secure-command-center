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
  LineProps, // Import types for props if needed
  XAxisProps,
  YAxisProps,
  TooltipProps
} from 'recharts';

// Define props more explicitly if needed, or use Recharts types directly
interface CustomLineChartProps {
  data: any[]; // Be more specific with types if possible
  lines: LineProps[];
  xAxisProps?: XAxisProps;
  yAxisProps?: YAxisProps;
  tooltipProps?: TooltipProps<any, any>; // Adjust value/name types
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
        {lines.map((lineProps, index) => (
          <Line key={index} {...lineProps} />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;