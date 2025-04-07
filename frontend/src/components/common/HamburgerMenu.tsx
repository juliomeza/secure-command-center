// src/components/common/HamburgerMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Building } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
}

interface HamburgerMenuProps {
  menuItems: MenuItem[];
  position?: 'left' | 'right';
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ menuItems, position = 'right' }) => {
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

  return (
    <div 
      className="relative inline-block text-left" 
      ref={menuRef}
      style={{ zIndex: 100, paddingRight: '10px' }}  // Ensure it appears above other elements and add padding
    >
      {/* Hamburger Icon Button */}
      <button
        onClick={toggleMenu}
        className="focus:outline-none"
        aria-label="Menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
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
        <Menu 
          size={18} 
          strokeWidth={3} 
          className="opacity-80" 
        />
      </button>

      {/* Dropdown Menu - Using more explicit styling */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            left: position === 'left' ? 0 : 'auto',
            right: position === 'right' ? 0 : 'auto',
            marginTop: '0.5rem',
            width: '14rem',
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
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, color 0.2s',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.color = '#1e3a8a';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#4b5563';
                }}
                role="menuitem"
              >
                <span style={{ marginRight: '0.75rem', display: 'flex', alignItems: 'center' }}>
                  <Building size={18} strokeWidth={1.5} className="opacity-80" />
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;