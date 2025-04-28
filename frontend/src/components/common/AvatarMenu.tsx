// src/components/common/AvatarMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
// Import the specific icons we need from Lucide
import { User, Settings, LogOut } from 'lucide-react';

interface AvatarMenuProps {
  initials: string;
  fullName: string;
  companyName: string;
  menuOptions: { id: string; label: string; onClick: () => Promise<any> | void }[];
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

  // Function to get Lucide icons based on ID
  const getIcon = (id: string) => {
    const iconProps = { 
      size: 18, // Smaller size to better fit the menu
      strokeWidth: 1.5, // Line thickness, similar to reference icons
      className: "opacity-80" // Apply opacity so they are not too intense
    };
    
    switch (id) {
      case 'profile':
        return <User {...iconProps} />;
      case 'settings':
        return <Settings {...iconProps} />;
      case 'logout':
        return <LogOut {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
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
        {initials}
      </button>

      {/* Dropdown Menu - More compact with better design */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 24,
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
          {/* User Info Section */}
          <div
            style={{
              padding: '0.75rem 1rem',
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
                marginBottom: '0.125rem'
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

          {/* Menu Options - With icons and more compact */}
          <div 
            style={{
              padding: '0.25rem 0',
              display: 'flex',
              flexDirection: 'column'
            }}  
            role="menu" 
            aria-orientation="vertical"
          >
            {menuOptions.map((option) => (
              <button
                key={option.id}
                onClick={async () => {
                  if (option.id === 'logout') {
                    console.log("[AvatarMenu] Logout button clicked");
                    const success = await option.onClick();
                    if (success) {
                      console.log("[AvatarMenu] Logout successful, redirecting to login page");
                      // Explicitly redirect to login page after logout
                      window.location.href = '/login';
                    }
                  } else {
                    option.onClick();
                  }
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: option.id === 'logout' ? '#dc2626' : '#4b5563',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, color 0.2s',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.color = option.id === 'logout' ? '#b91c1c' : '#1e3a8a';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = option.id === 'logout' ? '#dc2626' : '#4b5563';
                }}
                role="menuitem"
              >
                {/* Icon for each option */}
                <span style={{ marginRight: '0.75rem', display: 'flex', alignItems: 'center' }}>
                  {getIcon(option.id)}
                </span>
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