// frontend/src/features/dashboard/views/DataCardView.tsx
import React, { useState, useEffect } from 'react';
import { authService } from '../../../auth/services/authService';
import { AxiosError } from 'axios';
import CollapsibleSection from '../components/CollapsibleSection';
import CustomSelect from '../components/CustomSelect';

// Definición de la estructura de datos para DataCard
interface DataCardItem {
  id: number;
  warehouse_id: number;
  warehouse: string;
  section: number;
  list_order: number;
  description: string;
  day1_value: string;
  day2_value: string;
  day3_value: string;
  day4_value: string;
  day5_value: string;
  day6_value: string;
  day7_value: string;
  is_integer: boolean;
  is_percentage: boolean;
  is_text: boolean;
  year: number;
  week: number;
  fetched_at: string;
}

// Estructura para opciones del dropdown de warehouses
interface WarehouseOption {
  id: number;
  name: string;
}

// Estructura para grupos de datos
interface DataGroup {
  name: string;
  isOpen: boolean;
  items: DataCardItem[];
}

const DataCardView: React.FC = () => {
  // Estado para los datos y UI
  const [data, setData] = useState<DataCardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataGroups, setDataGroups] = useState<DataGroup[]>([]);
  
  // Estado para filtros
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / 
        (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  });
  // Inicializar warehouseId con el primer elemento de la lista
  const [warehouseId, setWarehouseId] = useState<string>('1');

  // Lista de warehouses disponibles con nombres descriptivos
  const warehouseOptions: WarehouseOption[] = [
    { id: 1, name: 'WH: 10 - Boca Raton (951) - FL' },
    { id: 12, name: 'WH: 15 - Sugar Land - TX' },
    { id: 20, name: 'WH: 18 - Pompano Beach (751) - FL' },
    { id: 23, name: 'WH: 20 - Lockbourne - OH' },
    { id: 27, name: 'WH: 23 - Dayton - NJ' },
  ];

  // Lista específica de items que deben estar en Held Orders
  const heldOrderItems = [
    'TOTAL HELD ORDERS',
    'SHIPPED HELD ORDERS',
    'OPEN AGED HELD ORDERS > 48 HRS',
    'OPEN HELD ORDERS > 7 DAYS'
  ];

  // Lista específica de items que deben estar en Outbound
  const outboundItems = [
    'OUTBOUND FC',
    'ORDERS SHIPPED',
    'ORDERS SHIPPED', // Mantenemos duplicado como solicitado
    'SHIPPED WT ORDERS'
  ];

  useEffect(() => {
    fetchDataCard();
  }, [year, week, warehouseId]); // Recargar cuando cambien los filtros

  // Organizar los datos en grupos después de obtenerlos
  useEffect(() => {
    if (data.length > 0) {
      // Filtrado específico para Held Orders - solo incluir los 4 elementos especificados
      const heldOrdersItems = data.filter(item => 
        heldOrderItems.includes(item.description.toUpperCase())
      );

      // Filtrado específico para Outbound - solo incluir los elementos especificados
      const outboundOrdersItems = data.filter(item => 
        outboundItems.includes(item.description.toUpperCase())
      );

      // Otros items que no son parte de los grupos específicos
      const otherItems = data.filter(item => 
        !heldOrderItems.includes(item.description.toUpperCase()) &&
        !outboundItems.includes(item.description.toUpperCase())
      );

      // Configurar grupos iniciales
      setDataGroups([
        { name: 'Order Management', isOpen: false, items: heldOrdersItems },
        { name: 'Outbound Operations', isOpen: false, items: outboundOrdersItems },
        { name: 'Open Order Summary', isOpen: false, items: otherItems }
      ]);
    }
  }, [data]);

  const fetchDataCard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construir URL con parámetros de filtro
      // Siempre incluir warehouse_id ya que ya no hay opción "All"
      const url = `/data/datacard-reports/?year=${year}&week=${week}&warehouse_id=${warehouseId}`;
      
      const response = await authService.apiClient.get<DataCardItem[]>(url);
      setData(response.data);
      
    } catch (err) {
      let errorText = 'An unknown error occurred';
      if (err instanceof AxiosError) {
        if (err.response?.data?.detail) {
          errorText = err.response.data.detail;
        } else if (err.response?.statusText) {
          errorText = `Error ${err.response.status}: ${err.response.statusText}`;
        } else {
          errorText = err.message;
        }
      } else if (err instanceof Error) {
        errorText = err.message;
      }
      setError(errorText);
      console.error("Error fetching DataCard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generador de opciones para semanas (1-53)
  const weekOptions = Array.from({ length: 53 }, (_, i) => i + 1);
  
  // Generador de opciones para años (actual -5 hasta actual +1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 7 }, 
    (_, i) => currentYear - 5 + i
  );

  // Manejar la apertura/cierre de un grupo
  const toggleGroup = (index: number) => {
    setDataGroups(prevGroups => 
      prevGroups.map((group, i) => 
        i === index ? { ...group, isOpen: !group.isOpen } : group
      )
    );
  };

  // Renderización basada en el estado
  return (
    <div className="p-4">
      {/* Filtros con CustomSelect */}
      <div className="mb-6 flex flex-wrap gap-6">
        <CustomSelect
          label="Year"
          value={year}
          onChange={(value) => setYear(Number(value))}
          options={yearOptions.map(y => ({ id: y, label: y.toString() }))}
          minWidth="140px"
        />
        
        <CustomSelect
          label="Week"
          value={week}
          onChange={(value) => setWeek(Number(value))}
          options={weekOptions.map(w => ({ id: w, label: w.toString() }))}
          minWidth="140px"
        />
        
        <CustomSelect
          label="Warehouse"
          value={Number(warehouseId)}
          onChange={(value) => setWarehouseId(value.toString())}
          options={warehouseOptions.map(wh => ({ id: wh.id, label: wh.name }))}
          minWidth="240px"
        />
      </div>

      {/* Estados de carga y error */}
      {loading && (
        <div className="text-center py-4">
          <p>Loading data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Secciones de datos */}
      {!loading && !error && (
        <div className="space-y-6">
          {dataGroups.map((group, groupIndex) => (
            <CollapsibleSection
              key={`group-${groupIndex}`}
              isOpen={group.isOpen}
              setIsOpen={() => toggleGroup(groupIndex)}
              title={group.name}
              itemCount={group.items.length}
              status={
                group.name === 'Order Management' ? 'critical' :
                group.name === 'Outbound Operations' ? 'review' : 'normal'
              }
            >
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0" style={{
                        width: '250px',
                        minWidth: '250px',
                        backgroundColor: '#f9fafb'
                      }}>Description</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ 
                        minWidth: '100px',
                        backgroundColor: '#f9fafb'
                      }}>Monday</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ 
                        minWidth: '100px',
                        backgroundColor: '#f9fafb'
                      }}>Tuesday</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ 
                        minWidth: '100px',
                        backgroundColor: '#f9fafb'
                      }}>Wednesday</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ 
                        minWidth: '100px',
                        backgroundColor: '#f9fafb'
                      }}>Thursday</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ 
                        minWidth: '100px',
                        backgroundColor: '#f9fafb'
                      }}>Friday</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ 
                        minWidth: '100px',
                        backgroundColor: '#f9fafb'
                      }}>Saturday</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{ 
                        minWidth: '100px',
                        backgroundColor: '#f9fafb'
                      }}>Sunday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.length > 0 ? (
                      group.items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 text-sm sticky left-0" style={{
                            width: '250px',
                            minWidth: '250px',
                            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                          }}>{item.description}</td>
                          <td className="px-3 py-2 text-sm">{formatValue(item.day1_value, item.is_percentage, item.is_integer)}</td>
                          <td className="px-3 py-2 text-sm">{formatValue(item.day2_value, item.is_percentage, item.is_integer)}</td>
                          <td className="px-3 py-2 text-sm">{formatValue(item.day3_value, item.is_percentage, item.is_integer)}</td>
                          <td className="px-3 py-2 text-sm">{formatValue(item.day4_value, item.is_percentage, item.is_integer)}</td>
                          <td className="px-3 py-2 text-sm">{formatValue(item.day5_value, item.is_percentage, item.is_integer)}</td>
                          <td className="px-3 py-2 text-sm">{formatValue(item.day6_value, item.is_percentage, item.is_integer)}</td>
                          <td className="px-3 py-2 text-sm">{formatValue(item.day7_value, item.is_percentage, item.is_integer)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-3 py-2 text-center text-sm text-gray-500">
                          No data found for this group.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          ))}

          {dataGroups.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No data found for the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Función para formatear valores según su tipo
const formatValue = (value: string | null, isPercentage: boolean, isInteger: boolean) => {
  if (!value) return '-';
  
  if (isPercentage) {
    // Intentar formatear como porcentaje
    try {
      const numValue = parseFloat(value);
      return `${numValue.toFixed(2)}%`;
    } catch {
      return value;
    }
  } else if (isInteger) {
    // Intentar formatear como entero con separador de miles
    try {
      const numValue = parseInt(value);
      return numValue.toLocaleString();
    } catch {
      return value;
    }
  }
  
  return value;
};

export default DataCardView;