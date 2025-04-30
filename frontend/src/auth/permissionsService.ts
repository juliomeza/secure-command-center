// filepath: c:\Users\jmeza.WOODFIELD\git\Projects\secure-command-center\frontend\src\auth\permissionsService.ts
import { authService } from './services/authService'; // <<< Import the singleton instance

export interface Company {
  id: number;
  name: string;
}

export interface Warehouse {
  id: number;
  name: string;
}

export interface Tab {
  id: number;
  id_name: string; // Internal identifier (e.g., 'CEO', 'Leaders')
  display_name: string; // Name for UI (e.g., 'CEO View')
}

export interface UserPermissions {
  allowed_companies: Company[];
  allowed_warehouses: Warehouse[];
  allowed_tabs: Tab[];
}

/**
 * Fetches the user's permissions from the backend.
 * Assumes the user is already authenticated and the request includes necessary credentials (e.g., JWT token).
 */
export const fetchUserPermissions = async (): Promise<UserPermissions> => {
  try {
    // <<< Use the apiClient from the authService instance
    const response = await authService.apiClient.get<UserPermissions>('/access/permissions/');
    return response.data;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    // Rethrow or handle error appropriately for the UI
    throw error;
  }
};
