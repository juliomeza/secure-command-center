import { apiClient } from '../core/apiClient';
import { handleApiError } from '../../utils/errorHandling';

interface Permission {
    role: string;
    companies: string[];
    warehouses?: string[];
}

/**
 * Servicio de control de acceso y permisos
 * @note Implementación inicial. Se expandirá cuando el backend
 * soporte el sistema completo de permisos.
 */
export const accessControl = {
    /**
     * Verifica si el usuario tiene acceso a un rol específico
     */
    canViewRole: async (role: string): Promise<boolean> => {
        try {
            const response = await apiClient.get(`/permissions/role/${role}/`);
            return response.data.hasAccess;
        } catch (error) {
            // Por ahora, permitimos acceso si hay error (hasta que el backend implemente)
            console.warn('Permission check failed, allowing access:', error);
            return true;
        }
    },

    /**
     * Verifica si el usuario tiene acceso a una empresa específica
     */
    canViewCompany: async (companyId: string): Promise<boolean> => {
        try {
            const response = await apiClient.get(`/permissions/company/${companyId}/`);
            return response.data.hasAccess;
        } catch (error) {
            console.warn('Company permission check failed, allowing access:', error);
            return true;
        }
    },

    /**
     * Verifica si el usuario tiene acceso a un almacén específico
     */
    canViewWarehouse: async (warehouseId: string): Promise<boolean> => {
        try {
            const response = await apiClient.get(`/permissions/warehouse/${warehouseId}/`);
            return response.data.hasAccess;
        } catch (error) {
            console.warn('Warehouse permission check failed, allowing access:', error);
            return true;
        }
    },

    /**
     * Obtiene todos los permisos del usuario actual
     */
    getUserPermissions: async (): Promise<Permission[]> => {
        try {
            const response = await apiClient.get('/permissions/user/');
            return response.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
};