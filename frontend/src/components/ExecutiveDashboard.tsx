// frontend/src/components/ExecutiveDashboard.tsx
import React, { useState, ChangeEvent } from 'react';
import DashboardLayout from './layout/DashboardLayout';
import CompanySelector from './common/CompanySelector';
import PeriodSelector from './common/PeriodSelector';
import CEOView from '../views/CEOView';
import CFOView from '../views/CFOView';
import COOView from '../views/COOView';
import CIOView from '../views/CIOView';
import { companies, periods } from '../data/mockData'; // Import data for selectors
import { useAuth } from './AuthProvider';

// Define Tab type
type TabId = 'CEO' | 'CFO' | 'COO' | 'CIO';

const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'CEO', label: 'CEO' },
    { id: 'CFO', label: 'CFO' },
    { id: 'COO', label: 'COO' },
    { id: 'CIO', label: 'CIO' },
];

const ExecutiveDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('CEO');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  
  const handleCompanyChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedCompany(e.target.value);
  };
  
  const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedPeriod(e.target.value);
  };

  const renderContent = () => {
    // NOTE: Currently, selectedCompany and selectedPeriod are not used
    // to filter data, as the views use static mockData directly.
    // In a real app, you would pass these down or use them in data fetching.
    switch (activeTab) {
      case 'CEO':
        return <CEOView />;
      case 'CFO':
        return <CFOView />;
      case 'COO':
        return <COOView />;
      case 'CIO':
        return <CIOView />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <DashboardLayout>
      {/* Modern tabs design with logout button */}
      <div className="mb-6">
        <div className="flex justify-between items-center px-2 py-4">
          {/* Tabs */}
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ease-in-out
                  ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 border border-gray-100'
                  }`
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Logout button */}
          <div>
            <button 
              onClick={logout} 
              className="px-5 py-3 text-gray-600 hover:text-blue-600 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 border border-gray-100 transition-all duration-200 ease-in-out flex items-center"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Selectors in a clean, modern card */}
        <div className="mt-4 bg-white rounded-lg shadow-sm p-4 mb-2 flex flex-col sm:flex-row justify-between items-center gap-4">
          <CompanySelector
            companies={companies}
            selectedValue={selectedCompany}
            onChange={handleCompanyChange}
          />
          <PeriodSelector
            periods={periods}
            selectedValue={selectedPeriod}
            onChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Main Dashboard Content Area */}
      {renderContent()}

    </DashboardLayout>
  );
};

export default ExecutiveDashboard;