import React, { useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import {
  LayoutDashboard, Network, Radio, TrendingUp, Sliders,
  FileText, Activity, Maximize2, Minimize2, LogOut, FolderTree,
  UserCheck, Cpu, RefreshCw, MessageSquare, Shield, Layers
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { portalRole, setPortalRole, theme } = useWarehouseStore();
  const [collapsed, setCollapsed] = useState(false);
  const isLight = theme === 'light';

  const getCompanyMenu = () => [
    { id: 'dashboard',       name: 'Executive Dashboard',  icon: LayoutDashboard },
    { id: 'network',         name: 'Warehouse Network',    icon: Network },
    { id: 'command',         name: 'Command Center',       icon: Radio },
    { id: 'forecast_center', name: 'Forecast Center',      icon: TrendingUp },
    { id: 'recommendations', name: 'Recommendation Feed',  icon: FolderTree },
    { id: 'reports',         name: 'Network Reports',      icon: FileText },
    { id: 'integrations',   name: 'Integrations Panel',   icon: Cpu },
  ];

  const getWarehouseMenu = () => [
    { id: 'operations',  name: 'Operations Board',      icon: Activity },
    { id: 'bottlenecks', name: 'Bottleneck Center',     icon: Layers },
    { id: 'twin',        name: 'Digital Twin View',     icon: Maximize2 },
    { id: 'space',       name: 'Space Optimization',    icon: Sliders },
    { id: 'demand',      name: 'Demand Intelligence',   icon: TrendingUp },
    { id: 'workforce',   name: 'Workforce Hub',         icon: UserCheck },
    { id: 'simulation',  name: 'Simulation Lab',        icon: RefreshCw },
    { id: 'reports_wh',  name: 'Performance Reports',   icon: FileText },
    { id: 'copilot',     name: 'AI Assistant Copilot',  icon: MessageSquare },
  ];

  const menuItems = portalRole === 'company' ? getCompanyMenu() : getWarehouseMenu();

  const handleLogout = () => setPortalRole('none');

  const textMuted  = isLight ? '#94A3B8' : '#64748B';
  const textNormal = isLight ? '#374151' : '#94A3B8';
  const textBold   = isLight ? '#0F172A' : '#FFFFFF';
  const hoverBg    = isLight ? 'rgba(219,234,254,0.5)' : 'rgba(255,255,255,0.04)';
  const bannerBg   = isLight ? 'rgba(219,234,254,0.4)' : 'rgba(255,255,255,0.03)';
  const bannerBorder = isLight ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)';
  const bottomBorder = isLight ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)';

  return (
    <div
      className={`min-h-screen sidebar-themed flex flex-col justify-between transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Top: Logo */}
      <div>
        <div
          className="p-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${bottomBorder}` }}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary-accent flex items-center justify-center shrink-0 shadow-md shadow-primary-accent/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-md tracking-wider font-mono" style={{ color: textBold }}>
                WareMind<span className="text-primary-accent">AI</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded transition-all duration-150"
            style={{ color: textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = textNormal)}
            onMouseLeave={e => (e.currentTarget.style.color = textMuted)}
          >
            {collapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Identity Banner */}
        {!collapsed && (
          <div
            className="m-3 p-3 rounded-lg"
            style={{ background: bannerBg, border: `1px solid ${bannerBorder}` }}
          >
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: textMuted }}>
                {portalRole === 'company' ? 'Company HQ Portal' : 'Warehouse Ops'}
              </span>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="mt-2 px-2 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.name : undefined}
                className="w-full flex items-center space-x-3 p-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : textNormal,
                  boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.25)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Switch Portal & Logout */}
      <div className="p-3 space-y-1.5" style={{ borderTop: `1px solid ${bottomBorder}` }}>
        {!collapsed && (
          <button
            onClick={() => setPortalRole(portalRole === 'company' ? 'warehouse' : 'company')}
            className="w-full py-2 px-3 text-xs font-mono font-bold rounded-lg flex items-center justify-center space-x-2 transition-all duration-150"
            style={{
              background: bannerBg,
              border: `1px solid ${bannerBorder}`,
              color: isLight ? '#3B82F6' : '#94A3B8',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = isLight ? '#2563EB' : '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = isLight ? '#3B82F6' : '#94A3B8')}
          >
            <Shield className="h-3.5 w-3.5 text-primary-accent" />
            <span>Switch Portal Mode</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ color: '#EF4444' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut className="h-5 w-5 shrink-0 text-rose-500" />
          {!collapsed && <span>System Logout</span>}
        </button>
      </div>
    </div>
  );
}
