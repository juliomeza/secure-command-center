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
    <Card variant="kpi" className={className}>
      <h3 className="text-sm font-medium text-gray-600 mb-0">{title}</h3>
      <div className="flex items-center">
        <p className="text-4xl font-bold text-blue-900 mt-0 leading-tight">{value}</p>
        {trend && <span className="ml-2 flex items-center">{trend}</span>}
      </div>
      {description && <p className="text-sm text-gray-600 mt-0">{description}</p>}
    </Card>
  );
};

export default KpiCard;