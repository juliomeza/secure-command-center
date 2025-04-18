import { apiClient } from '../core/apiClient';
import { DataPoint, Project } from '../../data/types';
import { handleApiError } from '../../utils/errorHandling';

interface TechnologyMetricsParams {
    companyId?: string | string[];
    periodId?: string;
}

/**
 * Servicio para métricas de tecnología (CIO)
 */
export const technologyService = {
    /**
     * Obtiene datos de disponibilidad de sistemas
     */
    getSystemAvailability: async (params: TechnologyMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/metrics/system-availability/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene métricas de tiempo de inactividad
     */
    getDowntimeMetrics: async (params: TechnologyMetricsParams): Promise<{
        total: number;
        trend: number;
        incidents: number;
    }> => {
        try {
            const response = await apiClient.get('/metrics/downtime/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene estado del presupuesto de IT
     */
    getBudgetStatus: async (params: TechnologyMetricsParams): Promise<{
        total: number;
        used: number;
        remaining: number;
    }> => {
        try {
            const response = await apiClient.get('/metrics/it-budget/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene lista de proyectos IT activos
     */
    getItProjects: async (params: TechnologyMetricsParams): Promise<Project[]> => {
        try {
            const response = await apiClient.get<Project[]>('/metrics/it-projects/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene métricas de incidentes de seguridad
     */
    getSecurityIncidents: async (params: TechnologyMetricsParams): Promise<{
        count: number;
        severity: { high: number; medium: number; low: number; };
        trend: number;
    }> => {
        try {
            const response = await apiClient.get('/metrics/security-incidents/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};