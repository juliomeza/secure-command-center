import { apiClient } from '../core/apiClient';
import { DataPoint } from '../../data/types';
import { handleApiError } from '../../utils/errorHandling';

interface OperationsMetricsParams {
    companyId?: string | string[];
    periodId: string;
}

/**
 * Servicio para métricas operativas (COO y CEO)
 */
export const operationsService = {
    /**
     * Obtiene datos de rendimiento del equipo
     */
    getTeamPerformance: async (params: OperationsMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/metrics/team-performance/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene métricas de cuota de mercado
     */
    getMarketShare: async (params: OperationsMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/metrics/market-share/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene métricas operativas clave
     */
    getKeyOperationalMetrics: async (params: OperationsMetricsParams): Promise<{
        deliveryTime: number;
        capacityUtilized: number;
        defectRate: number;
        satisfaction: number;
    }> => {
        try {
            const response = await apiClient.get('/metrics/operational-kpis/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene estadísticas de unidades procesadas
     */
    getProcessedUnits: async (params: OperationsMetricsParams): Promise<{
        total: number;
        trend: number;
    }> => {
        try {
            const response = await apiClient.get('/metrics/processed-units/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};