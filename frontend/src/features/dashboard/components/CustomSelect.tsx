import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: { id: string | number; label: string }[];
  label: string;
  minWidth?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  label,
  minWidth = '140px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.id === value);

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
    <div style={{ minWidth }} className="relative" ref={menuRef}>
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
          {label}
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 text-left focus:outline-none"
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            color: '#1e293b',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent'
          }}
        >
          <span>{selectedOption?.label}</span>
          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0" 
            style={{ zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          />

          <div
            style={{
              position: 'fixed',
              zIndex: 50,
              backgroundColor: 'white',
              borderRadius: '0.375rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: 'none',
              width: menuRef.current?.offsetWidth ?? 'auto',
              left: menuRef.current?.getBoundingClientRect()?.left ?? 0,
              top: (menuRef.current?.getBoundingClientRect()?.bottom ?? 0) - 5,
              marginTop: '0.25rem',
              outline: 'none'
            }}
          >
            <div 
              role="listbox" 
              className="py-1"
              style={{
                maxHeight: '15rem',
                overflowY: 'auto'
              }}
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left"
                  role="option"
                  aria-selected={option.id === value}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    color: option.id === value ? '#1e3a8a' : '#4b5563',
                    backgroundColor: option.id === value ? '#f0f7ff' : 'transparent',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.color = '#1e3a8a';
                  }}
                  onMouseOut={(e) => {
                    if (option.id === value) {
                      e.currentTarget.style.backgroundColor = '#f0f7ff';
                      e.currentTarget.style.color = '#1e3a8a';
                    } else {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#4b5563';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomSelect;