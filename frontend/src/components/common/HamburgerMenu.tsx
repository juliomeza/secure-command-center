// src/components/common/HamburgerMenu.tsx
import React, { useState, useRef, useEffect } from 'react';

interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
}

interface HamburgerMenuProps {
  menuItems: MenuItem[];
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ menuItems }) => {
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
      style={{ zIndex: 100 }}  // Ensure it appears above other elements
    >
      {/* Hamburger Icon Button */}
      <button
        onClick={toggleMenu}
        className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
        aria-label="Menu"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {/* Using inline SVG for hamburger icon to avoid style conflicts */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: 'var(--blue-dark, #1e3a8a)' }}
        >
          <path 
            d="M4 6H20M4 12H20M4 18H20" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown Menu - Using more explicit styling */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            width: '14rem',
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.color = '#1e3a8a';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#4b5563';
                }}
                role="menuitem"
              >
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