import React from 'react';
import Card from './Card';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: React.ReactNode;
  description?: string;
  className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, trend, description, className }) => {
  return (
    <Card noPadding className={className}>
      <div className="px-4 py-2 flex flex-col">
        <h3 className="text-lg font-medium text-blue-900 mb-[-1.2rem]">{title}</h3>
        
        <div className="flex items-center">
          <p className="text-4xl font-bold text-blue-900" style={{ lineHeight: '1', marginTop: '-4px', marginBottom: '24px' }}>{value}</p>
          {trend && <span className="ml-2 flex items-center" style={{ marginBottom: '24px' }}>{trend}</span>}
        </div>
        
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
    </Card>
  );
};

export default KpiCard;