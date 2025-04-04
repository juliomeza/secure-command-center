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
      <div className="px-4 py-2 space-y-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        
        <div className="flex items-center">
          <p className="text-4xl font-bold text-blue-900 leading-tight">{value}</p>
          {trend && <span className="ml-2 flex items-center">{trend}</span>}
        </div>
        
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
    </Card>
  );
};

export default KpiCard;