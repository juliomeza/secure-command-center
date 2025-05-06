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
    <div className="relative sm:flex-1" style={{ minWidth }} ref={menuRef}>
      <div className="flex items-center gap-2 w-full">
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
            background: 'transparent',
            minWidth: 0
          }}
        >
          <span className="truncate">{selectedOption?.label}</span>
          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${
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
              position: 'absolute',
              zIndex: 50,
              backgroundColor: 'white',
              borderRadius: '0.375rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: 'none',
              width: menuRef.current?.offsetWidth ?? 'auto',
              left: 0,
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
                  className="w-full text-left hover:bg-gray-50"
                  style={{
                    color: option.id === value ? '#1e3a8a' : '#4b5563',
                    backgroundColor: option.id === value ? '#f0f7ff' : 'transparent',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    paddingLeft: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem'
                  }}
                  role="option"
                  aria-selected={option.id === value}
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