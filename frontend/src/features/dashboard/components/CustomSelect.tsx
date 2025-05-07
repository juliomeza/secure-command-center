import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: { id: string | number; label: string }[];
  label: string;
  minWidth?: string;
  icon?: ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  label,
  minWidth = '140px',
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable options container
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

  // Scroll to selected option when dropdown opens
  useEffect(() => {
    if (isOpen && selectedOption && optionsContainerRef.current) {
      // Query for the button element using the data-option-id attribute
      const selectedOptionElement = optionsContainerRef.current.querySelector(
        `button[data-option-id="${selectedOption.id}"]`
      );

      if (selectedOptionElement) {
        // Scroll the element into view
        selectedOptionElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [isOpen, selectedOption, options]); // options is included in case they change

  return (
    <div
      className="relative sm:flex-1"
      style={{ minWidth, maxWidth: '320px' }}
      ref={menuRef}
    >
      <div className="w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full px-3 py-2 rounded-lg bg-white focus:outline-none gap-2"
          type="button"
          style={{
            border: '1px solid #1e40af',
            fontSize: '0.95rem',
            color: '#1e293b',
            cursor: 'pointer',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: 500,
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem'
          }}
        >
          {icon && <span className="flex-shrink-0 text-blue-600">{icon}</span>}
          <span style={{ width: '12px', display: 'inline-block' }} />
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap flex-shrink-0">{label}</span>
          <span style={{ width: '12px', display: 'inline-block' }} />
          <span className="text-left" style={{ minWidth: 0 }}>{selectedOption?.label}</span>
          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`}
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
              borderRadius: '0.5rem',
              border: '1.5px solid #60a5fa', // azul-400
              width: menuRef.current?.offsetWidth ?? 'auto',
              top: menuRef.current ? menuRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: menuRef.current ? menuRef.current.getBoundingClientRect().left : 0,
              outline: 'none',
              boxShadow: 'none'
            }}
          // No ref here, ref is on the inner scrollable div
          >
            <div
              role="listbox"
              className="py-1"
              style={{
                maxHeight: '15rem',
                overflowY: 'auto'
              }}
              ref={optionsContainerRef} // Assign ref to the scrollable container
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left hover:bg-blue-50"
                  data-option-id={option.id} // Add data attribute for easy selection
                  style={{
                    color: option.id === value ? '#1e3a8a' : '#4b5563',
                    backgroundColor: option.id === value ? '#e0f2fe' : 'transparent',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    paddingLeft: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
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