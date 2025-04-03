// src/components/common/KpiCard.tsx
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
    <Card className={className}>
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <div className="flex items-center">
        <p className="text-4xl font-bold text-gray-900">{value}</p>
        {trend && <span className="ml-2 flex items-center">{trend}</span>}
      </div>
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </Card>
  );
};

export default KpiCard;