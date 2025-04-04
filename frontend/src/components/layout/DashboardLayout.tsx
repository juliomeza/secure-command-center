// src/components/layout/DashboardLayout.tsx
import React, { useState } from 'react';
import { useAuth } from '../AuthProvider';
import HamburgerMenu from '../common/HamburgerMenu';
import AvatarMenu from '../common/AvatarMenu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState('Empresa 1');
  
  // User avatar menu options
  const avatarMenuOptions = [
    {
      id: 'profile',
      label: 'Mi Perfil',
      onClick: () => console.log('Perfil clicked')
    },
    {
      id: 'settings',
      label: 'Configuración',
      onClick: () => console.log('Configuración clicked')
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      onClick: logout
    }
  ];
  
  // Define the company menu items (left side)
  const companyMenuItems = [
    {
      id: 'company1',
      label: 'Empresa 1',
      onClick: () => {
        setSelectedCompany('Empresa 1');
        console.log('Empresa 1 seleccionada');
      }
    },
    {
      id: 'company2',
      label: 'Empresa 2',
      onClick: () => {
        setSelectedCompany('Empresa 2');
        console.log('Empresa 2 seleccionada');
      }
    },
    {
      id: 'company3',
      label: 'Empresa 3',
      onClick: () => {
        setSelectedCompany('Empresa 3');
        console.log('Empresa 3 seleccionada');
      }
    },
    {
      id: 'company4',
      label: 'Empresa 4',
      onClick: () => {
        setSelectedCompany('Empresa 4');
        console.log('Empresa 4 seleccionada');
      }
    },
    {
      id: 'company5',
      label: 'Empresa 5',
      onClick: () => {
        setSelectedCompany('Empresa 5');
        console.log('Empresa 5 seleccionada');
      }
    }
  ];

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 pt-2">
          <div className="flex items-center gap-3">
            <HamburgerMenu menuItems={companyMenuItems} position="left" />
            <h1 className="text-2xl font-semibold text-blue-900">
              {selectedCompany}
            </h1>
          </div>
          
          <div className="flex items-center">
            <AvatarMenu 
              initials="JM" 
              fullName="Juan Martínez" 
              companyName={selectedCompany} 
              menuOptions={avatarMenuOptions} 
            />
          </div>
        </div>
        
        {children}
        
      </div>
    </div>
  );
};

export default DashboardLayout;