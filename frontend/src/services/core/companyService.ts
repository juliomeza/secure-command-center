import { apiClient } from'./apiClient';
import { Company } from '../../data/types';
import { handleApiError } from '../../utils/errorHandling';

/**
 * Servicio para gestionar la selección y datos de empresas
 * @note Actualmente implementa funcionalidad básica. Se expandirá cuando el backend
 * soporte selección múltiple de empresas y permisos granulares
 */
export const companyService = {
    /**
     * Obtiene la lista de empresas disponibles para el usuario
     */
    getCompanies: async (): Promise<Company[]> => {
        try {
            const response = await apiClient.get<Company[]>('/companies/');
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    },

    /**
     * Obtiene los detalles de una empresa específica
     * @param companyId - ID de la empresa
     */
    getCompanyDetails: async (companyId: string): Promise<Company> => {
        try {
            const response = await apiClient.get<Company>(`/companies/${companyId}/`);
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};