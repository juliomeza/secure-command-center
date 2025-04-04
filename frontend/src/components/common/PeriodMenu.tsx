// src/components/common/PeriodMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Period } from '../../data/types';

interface PeriodMenuProps {
  periods: Period[];
  selectedPeriod: string;
  onPeriodChange: (periodId: string) => void;
}

const PeriodMenu: React.FC<PeriodMenuProps> = ({ 
  periods, 
  selectedPeriod, 
  onPeriodChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get the label of the currently selected period
  const getSelectedPeriodLabel = (): string => {
    const selectedPeriodObj = periods.find(period => period.id === selectedPeriod);
    return selectedPeriodObj?.name || 'Select Period';
  };
  
  // Get icon for period
  const getCalendarIcon = () => {
    return (
      <Calendar 
        size={18} 
        strokeWidth={1.5} 
        className="opacity-80" 
      />
    );
  };

  return (
    <div 
      className="relative inline-block text-left" 
      ref={menuRef}
      style={{ zIndex: 100 }}
    >
      {/* Period Button */}
      <button
        onClick={toggleMenu}
        className="focus:outline-none"
        aria-label="Period selector"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '130px',
          height: '40px',
          borderRadius: '20px',
          backgroundColor: 'var(--blue-dark, #1e3a8a)',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          border: 'none',
          transition: 'background-color 0.2s ease-in-out'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--blue-primary, #3b82f6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--blue-dark, #1e3a8a)';
        }}
      >
        <Calendar 
          size={18} 
          strokeWidth={1.5} 
          className="opacity-80 mr-2" 
        />
        {getSelectedPeriodLabel()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            right: 86,
            marginTop: '0.5rem',
            width: '12rem',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white',
            zIndex: 50,
            border: '1px solid rgba(229, 231, 235, 1)',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{
              padding: '0.25rem 0',
              display: 'flex',
              flexDirection: 'column'
            }}  
            role="menu" 
            aria-orientation="vertical"
          >
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => {
                  onPeriodChange(period.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: period.id === selectedPeriod ? '#1e3a8a' : '#4b5563',
                  backgroundColor: period.id === selectedPeriod ? '#f0f7ff' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: period.id === selectedPeriod ? 600 : 400
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.color = '#1e3a8a';
                }}
                onMouseOut={(e) => {
                  if (period.id === selectedPeriod) {
                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                    e.currentTarget.style.color = '#1e3a8a';
                  } else {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#4b5563';
                  }
                }}
                role="menuitem"
              >
                <span style={{ marginRight: '0.75rem', display: 'flex', alignItems: 'center' }}>
                  {getCalendarIcon()}
                </span>
                {period.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodMenu;