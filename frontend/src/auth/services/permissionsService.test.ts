// filepath: c:\Users\jmeza.WOODFIELD\git\Projects\secure-command-center\frontend\src\auth\services\permissionsService.test.ts
import { fetchUserPermissions, UserPermissions } from './permissionsService';
import { authService } from './authService'; // Import the actual authService instance

describe('PermissionsService', () => {
  // Declare a variable to hold the spy
  let mockGetSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create the spy on the actual instance's method
    mockGetSpy = jest.spyOn(authService.apiClient, 'get');
  });

  afterEach(() => {
    // Restore the original implementation after each test
    mockGetSpy.mockRestore();
  });

  describe('fetchUserPermissions', () => {
    it('should return user permissions on successful API call', async () => {
      const mockPermissions: UserPermissions = {
        allowed_companies: [{ id: 1, name: 'Company A' }],
        allowed_warehouses: [{ id: 101, name: 'Warehouse X' }],
        allowed_tabs: [{ id: 1, id_name: 'ceo', display_name: 'CEO View' }],
      };

      // Use the spy to mock the resolved value
      mockGetSpy.mockResolvedValue({ data: mockPermissions });

      const permissions = await fetchUserPermissions();

      // Assertions using the spy
      expect(permissions).toEqual(mockPermissions);
      expect(mockGetSpy).toHaveBeenCalledTimes(1);
      expect(mockGetSpy).toHaveBeenCalledWith('/access/permissions/');
    });

    it('should throw an error if the API call fails', async () => {
      const mockError = new Error('Network Error');

      // Use the spy to mock the rejected value
      mockGetSpy.mockRejectedValue(mockError);

      // Assertions using the spy
      await expect(fetchUserPermissions()).rejects.toThrow('Network Error');
      expect(mockGetSpy).toHaveBeenCalledTimes(1);
      expect(mockGetSpy).toHaveBeenCalledWith('/access/permissions/');
    });

    it('should log error to console when API call fails', async () => {
        const mockError = new Error('API Failed');
        // Use the spy to mock the rejected value
        mockGetSpy.mockRejectedValue(mockError);
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console output during test

        try {
            await fetchUserPermissions();
        } catch (e) {
            // Expected error
        }

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching user permissions:", mockError);

        consoleErrorSpy.mockRestore(); // Clean up spy
    });
  });
});
