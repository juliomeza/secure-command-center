// frontend/src/features/dashboard/views/DataCardView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { authService } from '../../../auth/services/authService';
import { AxiosError } from 'axios';
import CollapsibleSection from '../components/CollapsibleSection';
import CustomSelect from '../components/CustomSelect';
import SuperGroupHeader from '../components/SuperGroupHeader';
import { Calendar, CalendarDays, Building2 } from 'lucide-react';

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
  total: string;
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
  isDSCSA?: boolean;
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

  // Lista específica de items que deben estar en Open Order Summary
  const openOrderSummaryItems = [
    'OPEN ORDERS (CREATED)',
    'ORDERS CREATED(>24HRS)',
    'ORDERS CREATED(>48HRS)',
    'OPEN ORDERS (CREATED/APPROVAL REQUIRED)',
    'OPEN ORDERS (RELEASED/EXECUTING)',
    'NEW ORDERS (BEFORE 3PM)',
    'NEW ORDERS (AFTER 3PM)',
    'WAVED ORDERS',
    'SHIPPED ORDERS SAME DAY',
    'CARRYOVER ORDERS',
    'OPEN AGED ORDERS > 48 HRS (99.9 %)',
    'OPEN ORDERS > 7 DAYS',
    'OUT OF MKT (NEW)',
    'OUT OF MKT (WAVED/SHIPPED)',
    'OUT OF MKT (> 48 HRS)'
  ];

  // Lista específica de items que deben estar en Outbound Order Accuracy
  const outboundAccuracyItems = [
    'OUTBOUND ORDER ACCURACY ',  // Notese el espacio al final
    'ORDERS AUDITED (*)',
    'ERRORS (*)'
  ];

  // Lista específica de items que deben estar en Inbound Ops
  const inboundOpsItems = [
    'INBOUND OPS',
    'INBOUND LPs',  // Pendiente por corregir
    'INBOUND UNITS',
    'INBOUND CASES'
  ];

  // Lista específica de items que deben estar en Inbound
  const inboundItems = [
    'ASN NOT RECEIVED',
    'PALLETS IN RECEIVING AREA',
    'ACTUAL INBOUND CONTAINERS (*)',
    'ACTUAL LIVE LOAD TRLRS (*)'
  ];

  // Lista específica de items que deben estar en Over Short Damage
  const overShortDamageItems = [
    'TOTAL UNITS OVER',
    'TOTAL UNITS SHORT',
    'TOTAL UNITS DAMAGED'
  ];

  // Lista específica de items que deben estar en Inv Accuracy
  const invAccuracyItems = [
    'INV ACCURACY',
    'INVENTORY CYCLE COUNTS',
    'INVENTORY ADJUSTMENT '  // Nótese el espacio al final
  ];

  // Lista específica de items que deben estar en Reverse Logistics
  const reverseLogisticsItems = [
    'RETURN AUTHORIZATION CREATED',
    'RETURN UNITS RECEIVED',
    'COMPLETED RETURNS',
    'PENDING DESTRUCTION ORDERS'
  ];

  // Lista específica de items que deben estar en Outbound Serializado
  const outboundSerializedItems = [
    'OUTBOUND',
    'SERIALIZED OUTBOUND ORDERS RECEIVED',
    'SERIALIZED OUTBOUND ORDERS PROCESSED',
    'SERIALIZED OUTBOUND ORDERS CANCELLED',
    'SERIALIZED OUTBOUND ORDERS SCANNED',
    'SERIALIZED OUTBOUND ORDERS NOT SCANNED',
    '# SERIAL NUMBERS'
  ];

  // Lista específica de items que deben estar en Inbound Serializado
  const inboundSerializedItems = [
    'SERIALIZED INBOUND ORDERS RECEIVED',
    'SERIALIZED INBOUND ORDERS CANCELLED',
    'SERIALIZED INBOUND ORDERS SCANNED',
    '# SERIAL NUMBERS'
  ];

  useEffect(() => {
    fetchDataCard();
  }, [year, week, warehouseId]); // Recargar cuando cambien los filtros

  // Organizar los datos en grupos después de obtenerlos
  useEffect(() => {
    // Guardar los estados actuales de isOpen por nombre de grupo
    const currentOpenStates = dataGroups.reduce((acc, group) => {
      acc[group.name] = group.isOpen;
      return acc;
    }, {} as Record<string, boolean>);

    if (data.length > 0) {
      // Filtrado específico para Held Orders - solo incluir los 4 elementos especificados
      const heldOrdersItems = data.filter(item => 
        heldOrderItems.includes(item.description.toUpperCase())
      );

      // Filtrado específico para Outbound - solo incluir los elementos especificados
      const outboundOrdersItems = data.filter(item => 
        outboundItems.includes(item.description.toUpperCase())
      );

      // Items para Open Order Summary
      const openOrderItems = data.filter(item =>
        openOrderSummaryItems.includes(item.description.toUpperCase())
      );

      // Items para Outbound Order Accuracy
      const outboundAccuracyOrderItems = data.filter(item =>
        outboundAccuracyItems.includes(item.description.toUpperCase())
      );

      // Items para Inbound Ops
      const inboundOpsOrderItems = data.filter(item =>
        inboundOpsItems.includes(item.description.toUpperCase())
      );

      // Items para Inbound
      const inboundOrderItems = data.filter(item =>
        inboundItems.includes(item.description.toUpperCase())
      );

      // Items para Over Short Damage
      const overShortDamageOrderItems = data.filter(item =>
        overShortDamageItems.includes(item.description.toUpperCase())
      );

      // Items para Inv Accuracy
      const invAccuracyOrderItems = data.filter(item =>
        invAccuracyItems.includes(item.description.toUpperCase())
      );

      // Items para Reverse Logistics
      const reverseLogisticsOrderItems = data.filter(item =>
        reverseLogisticsItems.includes(item.description.toUpperCase())
      );

      // Items para Outbound Serializado
      const outboundSerializedOrderItems = data.filter(item =>
        outboundSerializedItems.includes(item.description.toUpperCase())
      );

      // Items para Inbound Serializado (corregido para que coincida con la definición de grupo)
      const inboundSerializedOrderItems = data.filter(item =>
        inboundSerializedItems.includes(item.description.toUpperCase())
      );

      // Definir la estructura de los grupos con sus items y propiedades isDSCSA
      const groupDefinitions: Omit<DataGroup, 'isOpen'>[] = [
        { name: 'Held Orders', items: heldOrdersItems, isDSCSA: false },
        { name: 'Outbound', items: outboundOrdersItems, isDSCSA: false },
        { name: 'Open Order Summary', items: openOrderItems, isDSCSA: false },
        { name: 'Outbound Order Accuracy', items: outboundAccuracyOrderItems, isDSCSA: false },
        { name: 'Inbound Ops', items: inboundOpsOrderItems, isDSCSA: false },
        { name: 'Inbound', items: inboundOrderItems, isDSCSA: false },
        { name: 'Over Short Damage', items: overShortDamageOrderItems, isDSCSA: false },
        { name: 'Inv Accuracy', items: invAccuracyOrderItems, isDSCSA: false },
        { name: 'Reverse Logistics', items: reverseLogisticsOrderItems, isDSCSA: false },
        { name: 'Serialized Outbound', items: outboundSerializedOrderItems, isDSCSA: true },
        { name: 'Serialized Inbound', items: inboundSerializedOrderItems, isDSCSA: true }
      ];

      // Mapear las definiciones a los grupos finales, preservando el estado isOpen
      const newProcessedGroups = groupDefinitions.map(groupDef => ({
        name: groupDef.name,
        // Usar el estado isOpen guardado, o false si es un grupo nuevo o no se encontró estado previo
        isOpen: currentOpenStates[groupDef.name] !== undefined ? currentOpenStates[groupDef.name] : false,
        items: groupDef.items,
        isDSCSA: groupDef.isDSCSA || false // Asegurar que isDSCSA tenga un valor booleano
      }));

      setDataGroups(newProcessedGroups);

    } else {
      // Si no hay datos (respuesta vacía de la API para los filtros seleccionados),
      // limpiar los grupos para mostrar el mensaje "No data found".
      setDataGroups([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Función para obtener el rango de fechas de una semana
  const getWeekDateRange = (yearParam: number, weekNumber: number): string => {
    // Crear una fecha para el 1 de enero del año especificado.
    const firstDayOfYear = new Date(yearParam, 0, 1);

    // Obtener el día de la semana del 1 de enero (0=Domingo, 1=Lunes, ..., 6=Sábado).
    const dayOfWeekJan1 = firstDayOfYear.getDay();

    // Calcular el desplazamiento para llegar al Lunes de la semana que contiene el 1 de Enero.
    // Si el 1 de Enero es Domingo (0), retrocedemos 6 días. Si es Lunes (1), 0 días. Si es Sábado (6), 5 días.
    // La fórmula es (dayOfWeekJan1 === 0 ? -6 : 1 - dayOfWeekJan1)
    const offsetToMonday = (dayOfWeekJan1 === 0) ? -6 : (1 - dayOfWeekJan1);
    const firstMondayOfCalendar = new Date(firstDayOfYear);
    firstMondayOfCalendar.setDate(firstDayOfYear.getDate() + offsetToMonday);

    // Calcular el Lunes de la semana 'weekNumber'
    const startDate = new Date(firstMondayOfCalendar);
    startDate.setDate(firstMondayOfCalendar.getDate() + (weekNumber - 1) * 7);

    // El Domingo de esa semana es 6 días después del Lunes.
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return ` (${formatDate(startDate)} - ${formatDate(endDate)})`;
  };
  
  // Generador de números de semana (1-53)
  const weekNumbers = useMemo(() => Array.from({ length: 53 }, (_, i) => i + 1), []);
  
  // Generador de opciones para años (actual -5 hasta actual +1), memoizado
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 7 }, 
    (_, i) => currentYear - 5 + i
  );

  // Generar opciones para el selector de semanas con rango de fechas
  const weekSelectOptions = useMemo(() => {
    return weekNumbers.map((w: number) => ({
      id: w,
      label: `Week ${w}${getWeekDateRange(year, w)}`
    }));
  }, [year, weekNumbers]); // Depende del año seleccionado y de la lista de números de semana

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
    <div className="p-2">
      {/* Filtros con CustomSelect */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 w-full max-w-3xl">
        <div className="w-full mb-2 sm:mb-0">
          <CustomSelect
            label="Year"
            value={year}
            onChange={(value) => setYear(Number(value))}
            options={yearOptions.map(y => ({ id: y, label: y.toString() }))}
            minWidth="140px"
            icon={<Calendar size={18} />}
          />
        </div>
        <div className="w-full mb-2 sm:mb-0">
          <CustomSelect
            label="Week"
            value={week}
            onChange={(value) => setWeek(Number(value))}
            options={weekSelectOptions}
            minWidth="285px"
            icon={<CalendarDays size={18} />}
          />
        </div>
        <div className="w-full">
          <CustomSelect
            label="Warehouse"
            value={Number(warehouseId)}
            onChange={(value) => setWarehouseId(value.toString())}
            options={warehouseOptions.map(wh => ({ id: wh.id, label: wh.name }))}
            minWidth="220px"
            icon={<Building2 size={18} />}
          />
        </div>
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
          {dataGroups.map((group, groupIndex) => {
            // Si es el primer grupo DSCSA, mostrar el encabezado
            const isFirstDSCSA = group.isDSCSA && !dataGroups[groupIndex - 1]?.isDSCSA;
            
            return (
              <React.Fragment key={`group-${groupIndex}`}>
                {isFirstDSCSA && (
                  <SuperGroupHeader title="DSCSA ORDERS SUMMARY" />
                )}
                <CollapsibleSection
                  isOpen={group.isOpen}
                  setIsOpen={() => toggleGroup(groupIndex)}
                  title={group.name}
                  itemCount={group.items.length}
                  status={
                    group.name === 'Held Orders' ? 'critical' :
                    group.name === 'Outbound' ? 'review' : 'normal'
                  }
                  isDSCSA={group.isDSCSA}
                >
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 text-left text-xs font-medium text-gray-500 uppercase" style={{
                              width: '250px',
                              minWidth: '250px',
                              backgroundColor: '#f9fafb',
                              padding: '0.5rem 0.75rem',
                              position: 'sticky',
                              left: 0,
                              zIndex: 20
                            }}></th>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Total'].map((day) => (
                              <th key={day} scope="col" className="px-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ 
                                width: 'calc((100% - 250px) / 8)',
                                minWidth: '45px',
                                backgroundColor: '#f9fafb',
                                padding: '0.5rem 0.75rem'
                              }}>{day}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.length > 0 ? (
                            group.items.map((item, index) => (
                              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-3 py-2 text-sm" style={{
                                  width: '250px',
                                  minWidth: '250px',
                                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                                  position: 'sticky',
                                  left: 0,
                                  zIndex: 10
                                }}>{item.description}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', textAlign: 'center', width: '100px' }}>{formatValue(item.day1_value, item.is_percentage, item.is_integer)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', textAlign: 'center', width: '100px' }}>{formatValue(item.day2_value, item.is_percentage, item.is_integer)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', textAlign: 'center', width: '100px' }}>{formatValue(item.day3_value, item.is_percentage, item.is_integer)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', textAlign: 'center', width: '100px' }}>{formatValue(item.day4_value, item.is_percentage, item.is_integer)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', textAlign: 'center', width: '100px' }}>{formatValue(item.day5_value, item.is_percentage, item.is_integer)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', textAlign: 'center', width: '100px' }}>{formatValue(item.day6_value, item.is_percentage, item.is_integer)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', textAlign: 'center', width: '100px' }}>{formatValue(item.day7_value, item.is_percentage, item.is_integer)}</td>
                                <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', textAlign: 'center', width: '100px' }}>{formatValue(item.total, item.is_percentage, item.is_integer)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={9} className="px-3 py-2 text-center text-sm text-gray-500">
                                No data found for this group.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CollapsibleSection>
              </React.Fragment>
            );
          })}

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
    try {
      const numValue = parseFloat(value);
      const sign = numValue < 0 ? '-' : '';
      const absValue = Math.abs(numValue * 100); // Multiplicar por 100 para convertir a porcentaje
      return `${sign}${absValue.toFixed(0)}%`; // Mostrar sin decimales
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