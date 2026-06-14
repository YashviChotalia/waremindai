import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Bell, Heart, Database, ChevronDown, Clock, Wifi, Settings2, Sun, Moon } from 'lucide-react';
import { getHealthStatus } from '../../engine/healthScore';

export default function Header() {
  const {
    portalRole,
    selectedWarehouseId,
    setSelectedWarehouse,
    warehouses,
    theme,
    toggleTheme,
  } = useWarehouseStore();

  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [telemetryRefreshedAt, setTelemetryRefreshedAt] = useState('Live');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeWarehouse = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];
  const activeAlerts = warehouses.flatMap(w => w.alerts.filter(a => !a.isDismissed));
  const warehouseHealthStatus = getHealthStatus(activeWarehouse.health.overall);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const isLight = theme === 'light';

  const dropdownBg = isLight ? '#FFFFFF' : '#0F172A';
  const dropdownBorder = isLight ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.07)';
  const dropdownText = isLight ? '#374151' : '#CBD5E1';
  const dropdownMuted = isLight ? '#94A3B8' : '#475569';
  const pillBg = isLight ? 'rgba(219,234,254,0.6)' : 'rgba(255,255,255,0.04)';
  const pillBorder = isLight ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)';

  return (
    <header
      className="h-14 header-themed px-5 flex items-center justify-between z-40 sticky top-0 shrink-0"
    >
      {/* Left: Node Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest" style={{ color: isLight ? '#94A3B8' : '#64748B' }}>
          <Database className="h-3.5 w-3.5 text-primary-accent" />
          <span className="uppercase">Network Node</span>
        </div>

        {portalRole === 'warehouse' ? (
          <div className="relative">
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="font-mono text-xs py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer transition-all appearance-none"
              style={{
                background: isLight ? 'rgba(219,234,254,0.6)' : '#1E293B',
                border: `1px solid ${pillBorder}`,
                color: isLight ? '#0F172A' : '#E2E8F0',
              }}
            >
              {warehouses.map((wh) => (
                <option
                  key={wh.id}
                  value={wh.id}
                  style={{
                    background: isLight ? '#FFFFFF' : '#1E293B',
                    color: isLight ? '#0F172A' : '#E2E8F0',
                  }}
                >
                  {wh.name} ({wh.id})
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isLight ? '#64748B' : '#94A3B8' }} />
          </div>
        ) : (
          <div className="text-xs font-semibold font-mono flex items-center space-x-2" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Corporate HQ — {warehouses.length} Nodes Online</span>
          </div>
        )}
      </div>

      {/* Center: Live System Clock */}
      <div className="hidden md:flex items-center space-x-3" style={{ color: isLight ? '#64748B' : '#94A3B8' }}>
        <div
          className="flex items-center justify-center h-7 w-7 rounded-lg"
          style={{
            background: isLight ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.08)',
            border: isLight ? '1px solid rgba(6,182,212,0.25)' : '1px solid rgba(6,182,212,0.12)',
          }}
        >
          <Clock
            className="h-3.5 w-3.5"
            style={{ color: isLight ? '#0E7490' : '#06B6D4' }}
          />
        </div>
        <div className="text-center">
          <div className="text-xs font-mono font-bold tracking-wider" style={{ color: isLight ? '#0F172A' : '#FFFFFF' }}>
            {formatTime(currentTime)}
          </div>
          <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: isLight ? '#94A3B8' : '#475569' }}>
            {formatDate(currentTime)}
          </div>
        </div>
        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-400 tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Right: Health, Theme Toggle & Alerts */}
      <div className="flex items-center space-x-2">
        {/* Network Health */}
        <div
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg"
          style={{ background: pillBg, border: `1px solid ${pillBorder}` }}
        >
          <Heart className={`h-3.5 w-3.5 ${warehouseHealthStatus.color}`} />
          <div className="text-right">
            <div className={`text-xs font-bold font-mono leading-none ${warehouseHealthStatus.color}`}>
              {activeWarehouse.health.overall}/100
            </div>
            <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: isLight ? '#94A3B8' : '#475569' }}>
              {warehouseHealthStatus.label}
            </div>
          </div>
        </div>

        {/* Latency */}
        <div
          className="hidden lg:flex items-center space-x-1.5 px-2 py-1.5 rounded-lg"
          style={{ background: pillBg, border: `1px solid ${pillBorder}` }}
        >
          <Wifi className="h-3.5 w-3.5 text-primary-accent" />
          <span className="text-[9px] font-mono" style={{ color: isLight ? '#64748B' : '#94A3B8' }}>18ms</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5"
          style={{
            background: pillBg,
            border: `1px solid ${pillBorder}`,
            color: isLight ? '#F59E0B' : '#60A5FA',
          }}
        >
          {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
            className="p-2 rounded-lg transition-all duration-200 relative"
            style={{
              background: pillBg,
              border: `1px solid ${pillBorder}`,
              color: isLight ? '#475569' : '#94A3B8',
            }}
          >
            <Bell className="h-4 w-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {alertsDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAlertsDropdownOpen(false)} />
              <div
                className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
                style={{ background: dropdownBg, border: `1px solid ${dropdownBorder}` }}
              >
                <div
                  className="p-3 flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${dropdownBorder}` }}
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: dropdownText }}>
                    Incident Dispatch Feed
                  </span>
                  <span className="text-[9px] badge-critical px-1.5 py-0.5 rounded font-mono">
                    {activeAlerts.length} Active
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {activeAlerts.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono" style={{ color: dropdownMuted }}>
                      No critical incidents logged.
                    </div>
                  ) : (
                    activeAlerts.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-3 transition hover:bg-blue-500/5"
                        style={{ borderBottom: `1px solid ${dropdownBorder}` }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[11px] font-semibold ${alt.severity === 'high' ? 'text-rose-400' : 'text-amber-400'}`}>
                            {alt.title}
                          </span>
                          <span className="text-[9px] font-mono" style={{ color: dropdownMuted }}>{alt.timestamp}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed" style={{ color: isLight ? '#64748B' : '#94A3B8' }}>{alt.description}</p>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setAlertsDropdownOpen(false)}
                  className="w-full py-2 text-center text-[10px] font-mono transition hover:bg-blue-500/5"
                  style={{ color: dropdownMuted }}
                >
                  Close Feed
                </button>
              </div>
            </>
          )}
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
            className="p-2 rounded-lg transition-all duration-200"
            title="Dashboard options"
            style={{
              background: 'transparent',
              border: `1px solid transparent`,
              color: isLight ? '#94A3B8' : '#64748B',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = pillBorder)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {settingsDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSettingsDropdownOpen(false)} />
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
                style={{ background: dropdownBg, border: `1px solid ${dropdownBorder}` }}
              >
                <div className="p-3" style={{ borderBottom: `1px solid ${dropdownBorder}` }}>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: dropdownText }}>
                    Dashboard Options
                  </span>
                  <p className="text-[10px] font-mono mt-1" style={{ color: dropdownMuted }}>
                    Telemetry: {telemetryRefreshedAt}
                  </p>
                </div>
                {[
                  {
                    label: 'Refresh telemetry snapshot',
                    action: () => {
                      setTelemetryRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                      setSettingsDropdownOpen(false);
                    }
                  },
                  {
                    label: 'Focus current node',
                    action: () => { setSelectedWarehouse(activeWarehouse.id); setSettingsDropdownOpen(false); }
                  },
                  {
                    label: 'Close options',
                    action: () => setSettingsDropdownOpen(false),
                    muted: true,
                  }
                ].map(({ label, action, muted }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full px-3 py-2 text-left text-xs font-mono transition hover:bg-blue-500/5"
                    style={{ color: muted ? dropdownMuted : dropdownText }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
