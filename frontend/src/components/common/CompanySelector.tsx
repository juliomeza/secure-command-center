// src/components/common/CompanySelector.tsx
import React from 'react';
import { Company } from '../../data/types';

interface CompanySelectorProps {
  companies: Company[];
  selectedValue: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ companies, selectedValue, onChange }) => {
  return (
    <div className="bg-blue-50 py-2 px-4 rounded-md flex items-center">
      <svg className="w-4 h-4 text-blue-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
      </svg>
      <select
        value={selectedValue}
        onChange={onChange}
        className="bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-0 text-blue-700 pr-8 appearance-none"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>{company.name}</option>
        ))}
      </select>
      {/* Simple arrow indicator */}
      <svg className="w-4 h-4 text-blue-700 ml-[-20px] pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

export default CompanySelector;