import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from './store/useWarehouseStore';
import Login from './pages/Login';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Company Portal Pages
import ExecutiveDashboard from './pages/company/ExecutiveDashboard';
import WarehouseNetwork from './pages/company/WarehouseNetwork';
import CommandCenter from './pages/company/CommandCenter';
import ForecastCenter from './pages/company/ForecastCenter';
import RecommendationFeed from './pages/company/RecommendationFeed';
import Reports from './pages/company/Reports';
import Integrations from './pages/company/Integrations';

// Warehouse Portal Pages
import Operations from './pages/manager/Operations';
import BottleneckIntelligence from './pages/manager/BottleneckIntelligence';
import DigitalTwin from './pages/manager/DigitalTwin';
import SpaceOptimization from './pages/manager/SpaceOptimization';
import DemandIntelligence from './pages/manager/DemandIntelligence';
import Workforce from './pages/manager/Workforce';
import SimulationLab from './pages/manager/SimulationLab';
import AICopilot from './pages/manager/AICopilot';

export default function App() {
  const { portalRole, theme } = useWarehouseStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sync html class whenever theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Reset tab to default when changing portal role
  useEffect(() => {
    if (portalRole === 'company') {
      setActiveTab('dashboard');
    } else if (portalRole === 'warehouse') {
      setActiveTab('operations');
    }
  }, [portalRole]);

  // Session guard
  if (portalRole === 'none') {
    return <Login />;
  }

  const renderCompanyPage = () => {
    switch (activeTab) {
      case 'dashboard':      return <ExecutiveDashboard />;
      case 'network':        return <WarehouseNetwork />;
      case 'command':        return <CommandCenter />;
      case 'forecast_center':return <ForecastCenter />;
      case 'recommendations':return <RecommendationFeed />;
      case 'reports':        return <Reports mode="company" />;
      case 'integrations':   return <Integrations />;
      default:               return <ExecutiveDashboard />;
    }
  };

  const renderWarehousePage = () => {
    switch (activeTab) {
      case 'operations':  return <Operations />;
      case 'bottlenecks': return <BottleneckIntelligence />;
      case 'twin':        return <DigitalTwin />;
      case 'space':       return <SpaceOptimization />;
      case 'demand':      return <DemandIntelligence />;
      case 'workforce':   return <Workforce />;
      case 'simulation':  return <SimulationLab />;
      case 'reports_wh':  return <Reports mode="warehouse" />;
      case 'copilot':     return <AICopilot />;
      default:            return <Operations />;
    }
  };

  return (
    <div
      className="flex min-h-screen overflow-hidden font-sans"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />

        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {portalRole === 'company' ? renderCompanyPage() : renderWarehousePage()}
          </div>
        </main>
      </div>
    </div>
  );
}
