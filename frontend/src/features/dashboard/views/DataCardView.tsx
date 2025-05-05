// frontend/src/features/dashboard/views/DataCardView.tsx
import React, { useState, useEffect } from 'react';
import { authService } from '../../../auth/services/authService';
import { AxiosError } from 'axios';

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

const DataCardView: React.FC = () => {
  // Estado para los datos y UI
  const [data, setData] = useState<DataCardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para filtros
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [week, setWeek] = useState<number>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / 
        (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  });
  const [warehouseId, setWarehouseId] = useState<string>('');

  // Lista de warehouses disponibles
  const warehouseOptions: WarehouseOption[] = [
    { id: 1, name: 'WH: 10 - Boca Raton (951) - FL' },
    { id: 12, name: 'WH: 15 - Sugar Land - TX' },
    { id: 20, name: 'WH: 18 - Pompano Beach (751) - FL' },
    { id: 23, name: 'WH: 20 - Lockbourne - OH' },
    { id: 27, name: 'WH: 23 - Dayton - NJ' },
  ];

  useEffect(() => {
    fetchDataCard();
  }, [year, week, warehouseId]); // Recargar cuando cambien los filtros

  const fetchDataCard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construir URL con parámetros de filtro
      let url = `/data/datacard-reports/?year=${year}&week=${week}`;
      if (warehouseId) {
        url += `&warehouse_id=${warehouseId}`;
      }
      
      const response = await authService.apiClient.get<DataCardItem[]>(url);
      setData(response.data);
      
    } catch (err) {
      let errorText = 'Ocurrió un error desconocido';
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

  // Renderización basada en el estado
  return (
    <div className="p-4">
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Año:</label>
          <select 
            className="border rounded px-2 py-1"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Semana:</label>
          <select 
            className="border rounded px-2 py-1"
            value={week}
            onChange={(e) => setWeek(parseInt(e.target.value))}
          >
            {weekOptions.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse:</label>
          <select
            className="border rounded px-2 py-1"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">All</option>
            {warehouseOptions.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button 
            className="bg-blue-600 text-white px-4 py-1 rounded"
            onClick={() => fetchDataCard()}
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Estados de carga y error */}
      {loading && (
        <div className="text-center py-4">
          <p>Cargando datos...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Tabla de datos */}
      {!loading && !error && (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lunes</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Martes</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Miércoles</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jueves</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Viernes</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sábado</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Domingo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{item.warehouse}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{item.description}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatValue(item.day1_value, item.is_percentage, item.is_integer)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatValue(item.day2_value, item.is_percentage, item.is_integer)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatValue(item.day3_value, item.is_percentage, item.is_integer)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatValue(item.day4_value, item.is_percentage, item.is_integer)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatValue(item.day5_value, item.is_percentage, item.is_integer)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatValue(item.day6_value, item.is_percentage, item.is_integer)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {formatValue(item.day7_value, item.is_percentage, item.is_integer)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-3 py-2 text-center text-sm text-gray-500">
                    No se encontraron datos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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