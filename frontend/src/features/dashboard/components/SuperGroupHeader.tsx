import React from 'react';
import { Barcode } from 'lucide-react';

interface SuperGroupHeaderProps {
  title: string;
}

const SuperGroupHeader: React.FC<SuperGroupHeaderProps> = ({ title }) => {
  return (
    <div className="mb-6 mt-8">
      <div 
        className="flex items-center"
        style={{
          position: 'relative',
          paddingLeft: '1rem',
          borderLeft: '4px solid var(--blue-dark, #1e3a8a)'
        }}
      >
        <Barcode className="w-5 h-5 text-gray-600" style={{ marginRight: '10px' }} />
        <h2 className="text-lg font-semibold text-blue-900">
          {title}
        </h2>
      </div>
    </div>
  );
};

export default SuperGroupHeader;