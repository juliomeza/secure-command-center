// src/components/TestHamburgerPage.tsx
import React from 'react';
import HamburgerMenu from './common/HamburgerMenu';

const TestHamburgerPage: React.FC = () => {
  // Define menu items for testing
  const menuItems = [
    {
      id: 'option1',
      label: 'Opción 1',
      onClick: () => console.log('Opción 1 clicked')
    },
    {
      id: 'option2',
      label: 'Opción 2',
      onClick: () => console.log('Opción 2 clicked')
    },
    {
      id: 'option3',
      label: 'Opción 3',
      onClick: () => console.log('Opción 3 clicked')
    },
    {
      id: 'option4',
      label: 'Opción 4',
      onClick: () => console.log('Opción 4 clicked')
    },
    {
      id: 'option5',
      label: 'Opción 5',
      onClick: () => console.log('Opción 5 clicked')
    }
  ];

  return (
    <div className="p-10">
      <h1 className="text-2xl mb-6">Página de Prueba - Menú Hamburguesa</h1>
      
      <div className="flex gap-6 mb-10">
        <div className="border p-4 rounded-md">
          <h2 className="mb-4">Menú Hamburguesa (Izquierda)</h2>
          <HamburgerMenu menuItems={menuItems} position="left" />
        </div>
        
        <div className="border p-4 rounded-md">
          <h2 className="mb-4">Menú Hamburguesa (Derecha)</h2>
          <HamburgerMenu menuItems={menuItems} position="right" />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg mb-2">Instrucciones:</h2>
        <ul className="list-disc pl-5">
          <li>Click en el icono de hamburguesa para ver el menú desplegable</li>
          <li>Verifica que las opciones aparezcan verticalmente</li>
          <li>Click en una opción para ver el mensaje en la consola</li>
        </ul>
      </div>
    </div>
  );
};

export default TestHamburgerPage;