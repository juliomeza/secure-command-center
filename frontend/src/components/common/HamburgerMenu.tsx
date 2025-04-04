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
    <div className="relative" ref={menuRef}>
      {/* Hamburger Icon */}
      <button
        onClick={toggleMenu}
        className="p-2 rounded-md hover:bg-gray-100 focus:outline-none transition-colors"
        aria-label="Menu"
      >
        <svg 
          className="w-6 h-6 text-blue-900" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-900 transition-colors"
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