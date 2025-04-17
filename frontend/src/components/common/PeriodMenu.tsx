// src/components/common/PeriodMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, CalendarDays  } from 'lucide-react';
import { Period } from '../../data/types';

interface PeriodMenuProps {
  periods: Period[];
  selectedPeriod: string;
  onPeriodChange: (periodId: string) => void;
  position?: 'left' | 'right';
}

const PeriodMenu: React.FC<PeriodMenuProps> = ({ 
  periods, 
  selectedPeriod, 
  onPeriodChange,
  position = 'right'
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
          flexDirection: 'column',
          width: '40px',
          height: '50px',
          cursor: 'pointer',
          border: 'none',
          backgroundColor: 'transparent',
          position: 'relative',
          padding: 0
        }}
      >
        <div style={{ position: 'relative' }}>
          <CalendarDays 
            size={32} 
            strokeWidth={1.5}
            color={selectedPeriod === 'yearly' ? '#880e4f' :
                  selectedPeriod === 'quarterly' ? '#00796b' :
                  selectedPeriod === 'monthly' ? 'var(--blue-dark, #1e3a8a)' :
                  '#0288d1'}
            style={{
              transition: 'color 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              // Maintain the current period color but in a slightly lighter shade
              const hoverColor = selectedPeriod === 'yearly' ? '#ad1457' :
                                selectedPeriod === 'quarterly' ? '#00897b' :
                                selectedPeriod === 'monthly' ? 'var(--blue-primary, #3b82f6)' :
                                '#039be5';
              e.currentTarget.style.color = hoverColor;
            }}
            onMouseOut={(e) => {
              // Return to the original color
              const originalColor = selectedPeriod === 'yearly' ? '#880e4f' :
                                  selectedPeriod === 'quarterly' ? '#00796b' :
                                  selectedPeriod === 'monthly' ? 'var(--blue-dark, #1e3a8a)' :
                                  '#0288d1';
              e.currentTarget.style.color = originalColor;
            }}
          />
        </div>
        <span style={{
          fontSize: '7px',
          fontWeight: '500',
          marginTop: '2px',
          color: selectedPeriod === 'yearly' ? '#880e4f' :
                selectedPeriod === 'quarterly' ? '#00796b' :
                selectedPeriod === 'monthly' ? 'var(--blue-dark, #1e3a8a)' :
                '#0288d1',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {selectedPeriod === 'monthly' ? 'Monthly' : 
          selectedPeriod === 'quarterly' ? 'Quarterly' : 
          selectedPeriod === 'weekly' ? 'Weekly' : 'Yearly'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            left: position === 'left' ? 0 : 'auto',
            right: position === 'right' ? 84 : 'auto',
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