// src/components/layout/DashboardLayout.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import HamburgerMenu from '../common/HamburgerMenu';
import AvatarMenu from '../common/AvatarMenu';
import PeriodMenu from '../common/PeriodMenu';
import { periods } from '../../data/mockData';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  
  // Get user initials from first and last name
  const getUserInitials = (): string => {
    if (!user) return '';
    
    const firstInitial = user.first_name ? user.first_name.charAt(0) : '';
    const lastInitial = user.last_name ? user.last_name.charAt(0) : '';
    
    return (firstInitial + lastInitial).toUpperCase();
  };
  
  // Get user full name
  const getFullName = (): string => {
    if (!user) return '';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  };
  
  // Get first name for welcome message
  const getFirstName = (): string => {
    if (!user) return '';
    return user.first_name || user.username;
  };
  
  // Set the company name based on user profile
  useEffect(() => {
    if (user?.profile?.company?.name) {
      setSelectedCompany(user.profile.company.name);
    }
  }, [user]);
  
  // User avatar menu options con iconos personalizados
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
        setShowWelcome(false);
        console.log('Empresa 1 seleccionada');
      }
    },
    {
      id: 'company2',
      label: 'Empresa 2',
      onClick: () => {
        setSelectedCompany('Empresa 2');
        setShowWelcome(false);
        console.log('Empresa 2 seleccionada');
      }
    },
    {
      id: 'company3',
      label: 'Empresa 3',
      onClick: () => {
        setSelectedCompany('Empresa 3');
        setShowWelcome(false);
        console.log('Empresa 3 seleccionada');
      }
    },
    {
      id: 'company4',
      label: 'Empresa 4',
      onClick: () => {
        setSelectedCompany('Empresa 4');
        setShowWelcome(false);
        console.log('Empresa 4 seleccionada');
      }
    },
    {
      id: 'company5',
      label: 'Empresa 5',
      onClick: () => {
        setSelectedCompany('Empresa 5');
        setShowWelcome(false);
        console.log('Empresa 5 seleccionada');
      }
    }
  ];

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 pt-2">
          <div className="flex items-center">
            <HamburgerMenu menuItems={companyMenuItems} position="left" />
            <h1 className="text-2xl font-semibold text-blue-900 pl-4">
              {showWelcome ? `Welcome back, ${getFirstName()}` : selectedCompany}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <PeriodMenu 
              periods={periods}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
            <AvatarMenu 
              initials={getUserInitials()} 
              fullName={getFullName()} 
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