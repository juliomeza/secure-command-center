// src/components/common/AvatarMenu.tsx
import React, { useState, useRef, useEffect } from 'react';

interface AvatarMenuOption {
  id: string;
  label: string;
  onClick: () => void;
}

interface AvatarMenuProps {
  initials: string;
  fullName: string;
  companyName: string;
  menuOptions: AvatarMenuOption[];
}

const AvatarMenu: React.FC<AvatarMenuProps> = ({ 
  initials, 
  fullName, 
  companyName, 
  menuOptions 
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

  return (
    <div 
      className="relative inline-block text-left" 
      ref={menuRef}
      style={{ zIndex: 100 }}
    >
      {/* Avatar Circle Button */}
      <button
        onClick={toggleMenu}
        className="focus:outline-none"
        aria-label="User menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'var(--blue-primary, #3b82f6)',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          border: 'none',
          transition: 'background-color 0.2s ease-in-out'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--blue-dark, #1e3a8a)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--blue-primary, #3b82f6)';
        }}
      >
        {initials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            right: 0, // Alineamos con el borde derecho del avatar
            marginTop: '0.5rem',
            width: '16rem',
            // Eliminamos la transformación que causa el desplazamiento
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'white',
            zIndex: 50,
            border: '1px solid rgba(229, 231, 235, 1)',
            overflow: 'hidden'
          }}
        >
          {/* User Info Section */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(229, 231, 235, 1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: '#1e293b',
                marginBottom: '0.25rem'
              }}
            >
              {fullName}
            </span>
            <span
              style={{
                fontSize: '0.8125rem',
                color: '#64748b'
              }}
            >
              {companyName}
            </span>
          </div>

          {/* Menu Options */}
          <div 
            style={{
              padding: '0.5rem 0',
              display: 'flex',
              flexDirection: 'column'
            }}  
            role="menu" 
            aria-orientation="vertical"
          >
            {menuOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  option.onClick();
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
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarMenu;