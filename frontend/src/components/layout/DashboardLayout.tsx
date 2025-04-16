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
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Update window width when it changes
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
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
  
  // Get time-based greeting based on current hour
  const getTimeBasedGreeting = (): string => {
    const currentHour = new Date().getHours();
    
    if (currentHour < 12) {
      return 'Good morning';
    } else if (currentHour < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
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
      label: 'Profile',
      onClick: () => console.log('Profile clicked')
    },
    {
      id: 'settings',
      label: 'Settings',
      onClick: () => console.log('Settings clicked')
    },
    {
      id: 'logout',
      label: 'Logout',
      onClick: logout
    }
  ];
  
  // Define the company menu items (left side)
  const companyMenuItems = [
    {
      id: 'company1',
      label: 'Company 1',
      onClick: () => {
        setSelectedCompany('Company 1');
        setShowWelcome(false);
        console.log('Company 1 seleccionada');
      }
    },
    {
      id: 'company2',
      label: 'Company 2',
      onClick: () => {
        setSelectedCompany('Company 2');
        setShowWelcome(false);
        console.log('Company 2 seleccionada');
      }
    },
    {
      id: 'company3',
      label: 'Company 3',
      onClick: () => {
        setSelectedCompany('Company 3');
        setShowWelcome(false);
        console.log('Company 3 seleccionada');
      }
    },
    {
      id: 'company4',
      label: 'Company 4',
      onClick: () => {
        setSelectedCompany('Company 4');
        setShowWelcome(false);
        console.log('Company 4 seleccionada');
      }
    },
    {
      id: 'company5',
      label: 'Company 5',
      onClick: () => {
        setSelectedCompany('Company 5');
        setShowWelcome(false);
        console.log('Company 5 seleccionada');
      }
    }
  ];

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 pt-2">
          <div className="flex items-center">
            <HamburgerMenu menuItems={companyMenuItems} position="left" />
            <h1 
              className="font-semibold text-blue-900 pl-4"
              style={{ 
                fontSize: windowWidth < 640 ? '1rem' : windowWidth < 768 ? '1.125rem' : '1.5rem',
                transition: 'font-size 0.2s ease-in-out'
              }}
            >
              {showWelcome ? `${getTimeBasedGreeting()}, ${getFirstName()}` : selectedCompany}
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