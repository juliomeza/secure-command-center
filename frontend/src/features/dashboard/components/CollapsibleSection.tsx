import React from 'react';
import { ChevronDown, TruckIcon, ClipboardList, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import Card from '../cards/Card';

interface CollapsibleSectionProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  subtitle?: string;
  itemCount?: number;
  status?: 'critical' | 'review' | 'normal';
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  isOpen,
  setIsOpen,
  title,
  subtitle,
  itemCount,
  status = 'normal',
  children
}) => {
  const getIcon = () => {
    switch (title.toLowerCase()) {
      case 'held orders':
        return <AlertCircle className="w-5 h-5 text-red-500" style={{ marginRight: '10px' }} />;
      case 'outbound':
        return <TruckIcon className="w-5 h-5 text-gray-600" style={{ marginRight: '10px', transform: 'scaleX(-1)' }} />;
      case 'open order summary':
        return <ClipboardList className="w-5 h-5 text-gray-600" style={{ marginRight: '10px' }} />;
      case 'outbound order accuracy':
        return <CheckCircle2 className="w-5 h-5 text-gray-600" style={{ marginRight: '10px' }} />;
      case 'inbound':
        return <TruckIcon className="w-5 h-5 text-gray-600" style={{ marginRight: '10px' }} />;
      case 'inbound ops':
        return <Package className="w-5 h-5 text-gray-600" style={{ marginRight: '10px' }} />;
      case 'over short damage':
        return <AlertCircle className="w-5 h-5 text-yellow-500" style={{ marginRight: '10px' }} />;
      default:
        return null;
    }
  };

  return (
    <Card 
      className="mb-4 overflow-hidden" 
      style={{
        borderLeft: `6px solid ${
          status === 'critical' ? '#ef4444' : 
          status === 'review' ? '#f59e0b' : 
          '#10b981'
        }`,
        borderRadius: '8px',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          margin: `${isOpen ? '-2.5rem' : '-1.5rem'} -1.5rem -1.5rem -1.5rem`,
          padding: `${isOpen ? '1.5rem' : '0.1rem'} 1.5rem`,
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        className="hover:bg-gray-50"
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              {getIcon()}
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </div>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>
          
          <div className="flex items-center">
            {!isOpen && itemCount && (
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

      {/* Content */}
      <div 
        className={`
          transition-all duration-200 ease-in-out overflow-hidden
          ${isOpen ? 'opacity-100' : 'opacity-0 max-h-0'}
        `}
      >
        {isOpen && children}
      </div>
    </Card>
  );
};

export default CollapsibleSection;