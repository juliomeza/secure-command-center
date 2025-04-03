// src/components/common/PeriodSelector.tsx
import React from 'react';
import { Period } from '../../data/types';

interface PeriodSelectorProps {
  periods: Period[];
  selectedValue: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ periods, selectedValue, onChange }) => {
  return (
    <div className="bg-white border border-gray-100 shadow-sm py-2 px-4 rounded-lg flex items-center">
      <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
      <select
        value={selectedValue}
        onChange={onChange}
        className="bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-0 text-blue-600 pr-8 appearance-none"
      >
        {periods.map((period) => (
          <option key={period.id} value={period.id}>{period.name}</option>
        ))}
      </select>
       {/* Simple arrow indicator */}
      <svg className="w-4 h-4 text-blue-600 ml-[-20px] pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

export default PeriodSelector;