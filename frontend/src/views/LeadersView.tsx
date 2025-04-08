// src/views/LeadersView.tsx
import React from 'react';
import Card from '../components/common/Card';
import KpiCard from '../components/common/KpiCard';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import DashboardGrid from '../components/layout/DashboardGrid';
import { 
  warehouseInventoryData, 
  warehouseSpaceUtilizationData, 
  warehouseShipmentData,
  warehouseCategoryData,
  warehousePerformanceData,
  warehouseReturnRateData
} from '../data/mockData';

const LeadersView: React.FC = () => {
  // Responsive layout handling
  const [windowWidth, setWindowWidth] = React.useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const isSmallScreen = windowWidth < 900;

  return (
    <>
      {/* KPI Cards Row - Responsive layout */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: '1.5rem', 
        marginBottom: '1.5rem', 
        width: '100%' 
      }}>
        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '50%' }}>
          <KpiCard
            title="Warehouse Efficiency"
            value="93.2%"
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                2.7%
              </span>
            }
          />
        </div>

        <div style={{ flex: isSmallScreen ? 'none' : '1', width: isSmallScreen ? '100%' : '50%' }}>
          <KpiCard
            title="Order Fulfillment"
            value="98.5%"
            trend={
              <span className="text-green-600 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                0.8%
              </span>
            }
          />
        </div>
      </div>

      {/* Main Dashboard Content using DashboardGrid */}
      <DashboardGrid>
        {/* Inventory Metrics Card */}        <Card title="Inventory Metrics">
          <div className="relative">
            <LineChart 
              data={warehouseInventoryData} 
              lines={[
                { 
                  dataKey: "turnover", 
                  type: "monotone", 
                  name: "Inventory Turnover", 
                  stroke: "#1e3a8a", 
                  strokeWidth: 2
                }
              ]}
              xAxisProps={{ 
                dataKey: "name" 
              }}
              yAxisProps={{ 
                domain: [4, 6],
                orientation: "left"
              }}
              tooltipProps={{
                formatter: (value) => [`${value}`, "Inventory Turnover"]
              }}
              showGrid={true}
              showLegend={false}
              height={200}
              margin={{ top: 5, right: 50, bottom: 5, left: 0 }}
            />
            {/* Agregar una leyenda manual en vez de usar dos ejes Y */}
            <div className="flex justify-center mt-2">
              <div className="flex items-center mx-3">
                <div style={{ backgroundColor: "#1e3a8a" }} className="w-4 h-4 mr-2 rounded-sm"></div>
                <span className="text-sm">Inventory Turnover: 5.8</span>
              </div>
              <div className="flex items-center mx-3">
                <div style={{ backgroundColor: "#3b82f6" }} className="w-4 h-4 mr-2 rounded-sm"></div>
                <span className="text-sm">Inventory Accuracy: 99.8%</span>
              </div>
            </div>
          </div>
        </Card>{/* Space Utilization Card */}
        <Card title="Space Utilization">
          <PieChart
            data={warehouseSpaceUtilizationData}
            pieProps={{
              startAngle: 90,
              endAngle: -270
            }}
            tooltipProps={{
              formatter: (value) => [`${value}%`, ""]
            }}
            showLegend={true}
            height={200}
          />
          <div className="mt-2 text-sm text-gray-500 text-center">
            <p>Total capacity: 125,000 sq. ft.</p>
          </div>
        </Card>

        {/* Weekly Shipments Card */}
        <Card title="Weekly Shipments">          <BarChart 
            data={warehouseShipmentData} 
            bars={[
              { dataKey: "value", fill: "#3b82f6", radius: [4, 4, 0, 0] }
            ]}
            xAxisProps={{ dataKey: "name" }}
            tooltipProps={{ formatter: (value) => [`${value} orders`, ""] }}
            height={200}
          />
          <div className="mt-4 text-center">
            <div className="bg-blue-50 rounded-md p-2">
              <p className="text-sm font-medium text-gray-800">Total Weekly Shipments: 2,860</p>
              <p className="text-sm text-gray-600">Average Daily: 409</p>
            </div>
          </div>
        </Card>        {/* Inventory by Category Card */}
        <Card title="Inventory by Category">
          <PieChart
            data={warehouseCategoryData}
            pieProps={{
              paddingAngle: 2,
              innerRadius: 60,
              outerRadius: 90
            }}
            tooltipProps={{
              formatter: (value) => [`${value} SKUs`, ""]
            }}
            showLegend={true}
            height={200}
          />
        </Card>        <Card title="Performance by Operation" className="md:col-span-2">
          <BarChart 
            data={warehousePerformanceData}
            bars={[{ dataKey: "value", fill: "#3b82f6", radius: [0, 4, 4, 0] }]}
            layout="vertical"
            xAxisProps={{
              type: "number",
              domain: [90, 100],
              tickFormatter: (value) => `${value}%`,
              tickCount: 5
            }}
            yAxisProps={{
              dataKey: "name",
              type: "category",
              width: 100
            }}
            tooltipProps={{ formatter: (value) => [`${value}%`, ""] }}
            height={250}
            margin={{ top: 5, right: 30, bottom: 5, left: 100 }}
          />
        </Card><Card title="Return Rate Trend">
          <LineChart 
            data={warehouseReturnRateData}
            lines={[
              { 
                dataKey: "value", 
                type: "monotone",
                stroke: "#1e3a8a", 
                strokeWidth: 2 
              }
            ]}
            xAxisProps={{ dataKey: "name" }}
            yAxisProps={{ 
              domain: [1, 3],
              tickFormatter: (value) => `${value}%`
            }}
            tooltipProps={{ formatter: (value) => [`${value}%`, ""] }}
            height={200}
          />
          <div className="flex justify-between mt-2 text-sm">
            <div className="bg-green-50 text-green-700 px-2 py-1 rounded">
              <span>↓ 0.9% from last period</span>
            </div>
            <div className="text-gray-500">
              <span>Target: &lt; 2.0%</span>
            </div>
          </div>
        </Card>

        {/* Key Metrics Card */}
        <Card title="Key Warehouse Metrics" className="md:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">Order Cycle Time</h4>
              <p className="text-xl font-bold text-gray-900">1.7 days</p>
              <span className="text-green-600 text-sm">↓ 0.3</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">Pick Rate</h4>
              <p className="text-xl font-bold text-gray-900">148/hr</p>
              <span className="text-green-600 text-sm">↑ 12</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">Cost per Order</h4>
              <p className="text-xl font-bold text-gray-900">$3.82</p>
              <span className="text-green-600 text-sm">↓ $0.28</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">Dock to Stock</h4>
              <p className="text-xl font-bold text-gray-900">4.2 hrs</p>
              <span className="text-green-600 text-sm">↓ 0.5</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600">Perfect Orders</h4>
              <p className="text-xl font-bold text-gray-900">96.8%</p>
              <span className="text-green-600 text-sm">↑ 1.2%</span>
            </div>
          </div>
        </Card>

        {/* Active Warehouse Issues Table */}
        <Card title="Active Warehouse Issues" className="md:col-span-2">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Inventory Count Discrepancy - Zone B4</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">High</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">In Progress</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Inventory Team</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">04/10/2025</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Conveyor System Maintenance</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Medium</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Scheduled</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Maintenance Team</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">04/15/2025</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Staff Training - New Picking System</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Medium</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">On Track</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Operations Manager</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">04/22/2025</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Seasonal Inventory Planning</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Low</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Not Started</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Planning Team</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">05/05/2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </DashboardGrid>
    </>
  );
};

export default LeadersView;
