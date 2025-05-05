import React from 'react';
import { ChevronDown } from 'lucide-react';
import Card from '../cards/Card';

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
    <Card className="mb-6">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer -mt-6 -mx-6 px-6 py-4 hover:bg-gray-50 transition-all"
      >
        <div className="flex justify-between items-center">
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
      </div>

      {/* Contenido */}
      <div 
        className={`
          transition-all duration-200 ease-in-out overflow-hidden
          ${isOpen ? 'opacity-100 mt-4' : 'opacity-0 max-h-0'}
        `}
      >
        {isOpen && children}
      </div>
    </Card>
  );
};

export default CollapsibleSection;