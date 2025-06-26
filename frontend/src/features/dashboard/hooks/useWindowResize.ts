import { useState, useEffect } from 'react';

export interface UseWindowResizeOptions {
  initialValue?: number;
  debounceMs?: number;
}

/**
 * Hook para manejar cambios de tamaño de ventana
 * @param options Configuración opcional
 * @returns El ancho actual de la ventana
 */
export const useWindowResize = (options: UseWindowResizeOptions = {}): number => {
  const { initialValue = typeof window !== 'undefined' ? window.innerWidth : 1200, debounceMs = 0 } = options;
  
  const [windowWidth, setWindowWidth] = useState<number>(initialValue);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Llamar inmediatamente para obtener el valor actual
    handleResize();

    if (debounceMs > 0) {
      let timeoutId: number;
      const debouncedHandleResize = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleResize, debounceMs);
      };
      
      window.addEventListener('resize', debouncedHandleResize);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', debouncedHandleResize);
      };
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [debounceMs]);

  return windowWidth;
};

/**
 * Hook para detectar si está en modo mobile
 * @param breakpoint Punto de quiebre en px (default: 600)
 * @returns true si está en modo mobile
 */
export const useIsMobile = (breakpoint: number = 600): boolean => {
  const windowWidth = useWindowResize();
  return windowWidth <= breakpoint;
};