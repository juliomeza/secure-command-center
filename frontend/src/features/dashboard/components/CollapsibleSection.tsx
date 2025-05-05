import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  subtitle?: string;
  itemCount?: number;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  isOpen,
  setIsOpen,
  title,
  subtitle,
  itemCount,
  children
}) => {
  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-4 cursor-pointer transition-all hover:bg-gray-50 
          flex justify-between items-center
          ${isOpen ? 'border-b border-gray-200' : ''}
          rounded-t-lg
        `}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {!isOpen && itemCount && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {itemCount} items
              </span>
            )}
          </div>
          {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
        </div>
        
        <div className="flex items-center">
          {isOpen && itemCount && (
            <span className="text-sm text-gray-500 mr-2">
              {itemCount} items
            </span>
          )}
          <ChevronDown 
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Contenedor del contenido con animación */}
      <div 
        className={`
          transition-all duration-200 ease-in-out overflow-hidden
          ${isOpen ? 'opacity-100' : 'opacity-0 max-h-0'}
        `}
      >
        {isOpen && (
          <div className="p-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollapsibleSection;