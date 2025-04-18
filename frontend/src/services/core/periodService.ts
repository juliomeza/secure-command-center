import { apiClient } from './apiClient';
import { Period } from '../../data/types';
import { handleApiError } from '../../utils/errorHandling';

/**
 * Servicio para gestión de períodos de tiempo
 */
export const periodService = {
    /**
     * Obtiene los períodos disponibles (semanal, mensual, trimestral, anual)
     */
    getPeriods: async (): Promise<Period[]> => {
        try {
            const response = await apiClient.get<Period[]>('/periods/');
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene métricas para un período específico
     * @param periodId - ID del período (weekly, monthly, quarterly, yearly)
     */
    getPeriodMetrics: async (periodId: string): Promise<any> => {
        try {
            const response = await apiClient.get(`/metrics/period/${periodId}/`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};