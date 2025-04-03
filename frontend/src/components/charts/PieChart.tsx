// src/components/charts/PieChart.tsx
import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { DataPoint } from '../../data/types'; // Assuming DataPoint has 'name', 'value', 'color'

interface PieConfig {
  dataKey?: string;
  cx?: string | number;
  cy?: string | number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  paddingAngle?: number;
  nameKey?: string;
  [key: string]: any;
}

interface CustomPieChartProps {
  data: DataPoint[]; // Use specific type
  pieProps?: PieConfig; // Use custom config type
  tooltipProps?: Partial<TooltipProps<number, string>>;
  showLegend?: boolean;
  height?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  legendItems?: Array<{ name: string, color: string }>; // Optional separate legend items
}

const PieChart: React.FC<CustomPieChartProps> = ({
  data,
  pieProps,
  tooltipProps,
  showLegend = true, // Default to true based on usage
  height = 200,
  innerRadius = 60,
  outerRadius = 90,
  legendItems // Allow passing legend items explicitly if needed
}) => {

  const defaultPieProps: PieConfig = {
    dataKey: "value",
    cx: "50%",
    cy: "50%",
    innerRadius: innerRadius,
    outerRadius: outerRadius,
    paddingAngle: 2,
  };

  const finalPieProps = { ...defaultPieProps, ...pieProps }; // Merge default and passed props
  const itemsForLegend = legendItems || data; // Use passed items or derive from data

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie 
            dataKey={finalPieProps.dataKey || "value"}
            cx={finalPieProps.cx}
            cy={finalPieProps.cy}
            innerRadius={finalPieProps.innerRadius}
            outerRadius={finalPieProps.outerRadius}
            paddingAngle={finalPieProps.paddingAngle}
            data={data}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} /> // Provide default color
            ))}
          </Pie>
          <Tooltip {...tooltipProps} />
          {/* Note: Recharts Legend doesn't automatically work well with custom Cell colors easily. */}
          {/* A custom legend component might be better if needed consistently */}
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Custom Legend (as in original code) */}
      {showLegend && itemsForLegend.length > 0 && (
         <div className="flex justify-center mt-4 flex-wrap">
           {itemsForLegend.map((entry, index) => (
             <div key={`legend-${index}`} className="flex items-center mx-3 mb-1">
               <div style={{ backgroundColor: entry.color }} className="w-4 h-4 mr-2"></div>
               <span className="text-sm text-gray-700">{entry.name}</span>
             </div>
           ))}
         </div>
       )}
    </div>
  );
};

export default PieChart;