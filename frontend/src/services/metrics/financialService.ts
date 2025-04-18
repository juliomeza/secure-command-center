import { apiClient } from '../core/apiClient';
import { DataPoint, CashFlowPoint } from '../../data/types';
import { handleApiError } from '../../utils/errorHandling';

interface FinancialMetricsParams {
    companyId?: string | string[];
    periodId: string;
}

/**
 * Servicio para métricas financieras (CFO y CEO)
 */
export const financialService = {
    /**
     * Obtiene datos de crecimiento de ingresos
     */
    getRevenueGrowth: async (params: FinancialMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/metrics/revenue-growth/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene datos de flujo de caja
     */
    getCashFlow: async (params: FinancialMetricsParams): Promise<CashFlowPoint[]> => {
        try {
            const response = await apiClient.get<CashFlowPoint[]>('/metrics/cash-flow/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene desglose de gastos
     */
    getExpenseBreakdown: async (params: FinancialMetricsParams): Promise<DataPoint[]> => {
        try {
            const response = await apiClient.get<DataPoint[]>('/metrics/expenses/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene métricas de inversión y retorno
     */
    getInvestmentMetrics: async (params: FinancialMetricsParams): Promise<{
        totalInvestment: number;
        annualROI: number;
        paybackPeriod: number;
    }> => {
        try {
            const response = await apiClient.get('/metrics/investments/', { params });
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};