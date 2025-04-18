import { apiClient } from '../core/apiClient';
import { DataPoint, WarehouseInventoryData, WarehouseIssue } from '../../data/types';
import { handleApiError } from '../../utils/errorHandling';

interface WarehouseMetricsParams {
    companyId?: string | string[];
    warehouseId?: string | string[];
    periodId: string;
}

/**
 * Servicio para métricas de almacenes
 */
export const warehouseService = {
    /**
     * Obtiene datos de inventario del almacén
     */
    getInventoryData: async (params: WarehouseMetricsParams): Promise<WarehouseInventoryData[]> => {
        try {
            const response = await apiClient.get<WarehouseInventoryData[]>('/warehouses/inventory/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene métricas de utilización de espacio
     */
    getSpaceUtilization: async (params: WarehouseMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/warehouses/space-utilization/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene datos de envíos
     */
    getShipmentData: async (params: WarehouseMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/warehouses/shipments/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene datos por categoría
     */
    getCategoryData: async (params: WarehouseMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/warehouses/categories/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene datos de rendimiento
     */
    getPerformanceData: async (params: WarehouseMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/warehouses/performance/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene datos de tasa de devolución
     */
    getReturnRateData: async (params: WarehouseMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/warehouses/returns/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene incidencias del almacén
     */
    getWarehouseIssues: async (params: WarehouseMetricsParams): Promise<WarehouseIssue[]> => {
        try {
            const response = await apiClient.get<WarehouseIssue[]>('/warehouses/issues/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene métricas clave del almacén
     */
    getKeyMetrics: async (params: WarehouseMetricsParams): Promise<{
        orderCycleTime: number;
        pickRate: number;
        costPerOrder: number;
        dockToStock: number;
    }> => {
        try {
            const response = await apiClient.get('/warehouses/key-metrics/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};