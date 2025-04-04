// frontend/src/components/ExecutiveDashboard.tsx
import React, { useState } from 'react';
import DashboardLayout from './layout/DashboardLayout';
import TabsNavigation from './common/TabsNavigation';
import CEOView from '../views/CEOView';
import CFOView from '../views/CFOView';
import COOView from '../views/COOView';
import CIOView from '../views/CIOView';
// Importamos iconos de Lucide para cada rol ejecutivo
import { 
  BarChart2, // CEO - Indicadores generales
  DollarSign, // CFO - Finanzas
  Settings, // COO - Operaciones
  Monitor // CIO - Tecnología
} from 'lucide-react';

// Define Tab type
type TabId = 'CEO' | 'CFO' | 'COO' | 'CIO';

// Configuración de iconos
const iconProps = {
  size: 18,
  strokeWidth: 1.5
};

// Definición de tabs con iconos
const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'CEO', label: 'CEO', icon: <BarChart2 {...iconProps} /> },
  { id: 'CFO', label: 'CFO', icon: <DollarSign {...iconProps} /> },
  { id: 'COO', label: 'COO', icon: <Settings {...iconProps} /> },
  { id: 'CIO', label: 'CIO', icon: <Monitor {...iconProps} /> },
];

const ExecutiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('CEO');

  const renderContent = () => {
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
      {/* Navegación principal con tabs minimalistas e iconos */}
      <TabsNavigation<TabId> 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        showIcons={true}
      />

      {/* Main Dashboard Content Area */}
      {renderContent()}
    </DashboardLayout>
  );
};

export default ExecutiveDashboard;