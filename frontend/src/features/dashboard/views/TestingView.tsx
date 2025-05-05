// frontend/src/features/dashboard/views/TestingView.tsx
import React, { useState, useEffect } from 'react';
import { authService } from '../../../auth/services/authService'; // <<< Importar authService
import { AxiosError } from 'axios'; // <<< Importar AxiosError para mejor manejo

// Define la estructura de los datos que esperamos de la API
interface TestDataItem {
  order_id: number;
  order_class_id: number;
  order_status_id: number;
  lookup_code: string;
  fetched_at: string; // La API devuelve la fecha como string ISO
}

const TestingView: React.FC = () => {
  const [data, setData] = useState<TestDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usar la instancia apiClient de authService en lugar de fetch
        // Asume que apiClient ya está configurado para enviar credenciales (cookies HttpOnly)
        // y tiene el baseURL configurado (probablemente /api)
        const response = await authService.apiClient.get<TestDataItem[]>('/data/test-data/');

        // Con Axios, los datos están directamente en response.data
        setData(response.data);

      } catch (err) {
        let errorText = 'An unknown error occurred';
        if (err instanceof AxiosError) {
          // Intentar obtener el mensaje de error de la respuesta de Axios
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
        console.error("Error fetching test data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Testing View - Live Data</h2>

      {loading && (
        <div className="text-center py-4">
          <p>Loading data...</p>
          {/* Podrías añadir un spinner aquí */}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lookup Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fetched At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.order_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.order_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lookup_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.order_class_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.order_status_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.fetched_at).toLocaleString()} {/* Formatea la fecha */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TestingView;
