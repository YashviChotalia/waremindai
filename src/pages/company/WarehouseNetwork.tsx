import React, { useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { Search, SlidersHorizontal, ArrowRight, Eye, ShieldAlert, X, Heart, Settings } from 'lucide-react';
import { getHealthStatus } from '../../engine/healthScore';

export default function WarehouseNetwork() {
  const { warehouses, setSelectedWarehouse, setPortalRole } = useWarehouseStore();
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [healthFilter, setHealthFilter] = useState('All');
  const [selectedWhDetail, setSelectedWhDetail] = useState<string | null>(null);

  // Extract unique regions
  const regions = ['All', ...new Set(warehouses.map(w => w.region))];

  // Filtering logic
  const filteredWarehouses = warehouses.filter(wh => {
    const matchesSearch = 
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = regionFilter === 'All' || wh.region === regionFilter;
    
    const healthInfo = getHealthStatus(wh.health.overall);
    const matchesHealth = healthFilter === 'All' || healthInfo.label === healthFilter;

    return matchesSearch && matchesRegion && matchesHealth;
  });

  const activeWh = warehouses.find(w => w.id === selectedWhDetail);

  const handleLaunchWarehouse = (id: string) => {
    setSelectedWarehouse(id);
    setPortalRole('warehouse');
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-theme-primary font-mono uppercase font-sans">Warehouse Nodes Directory</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Search, monitor, and deep dive into individual physical network locations</p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-900 rounded-xl items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID or region..."
            className="w-full glass-input input-with-icon text-xs"
          />
          <Search className="h-4 w-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Region Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Region:</span>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-theme-primary font-mono text-xs p-2 rounded-lg outline-none cursor-pointer"
          >
            {regions.map(r => (
              <option key={r} value={r} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">{r}</option>
            ))}
          </select>
        </div>
 
        {/* Health Status Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Status:</span>
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-theme-primary font-mono text-xs p-2 rounded-lg outline-none cursor-pointer"
          >
            <option value="All" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">All Healths</option>
            <option value="Optimal" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">Optimal (90+)</option>
            <option value="Stable" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">Stable (75+)</option>
            <option value="Warning" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">Warning (60+)</option>
            <option value="Critical" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">Critical (&lt;60)</option>
          </select>
        </div>

        {/* Counter */}
        <div className="ml-auto text-xs font-mono text-slate-500 dark:text-slate-400">
          Nodes Found: <span className="text-theme-primary font-bold">{filteredWarehouses.length}</span> / {warehouses.length}
        </div>
      </div>

      {/* Grid Network View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarehouses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 text-sm font-mono border border-slate-900 rounded-xl bg-slate-900/10">
            No active nodes match the filter query criteria.
          </div>
        ) : (
          filteredWarehouses.map((wh) => {
            const healthStatus = getHealthStatus(wh.health.overall);
            const activeAlerts = wh.alerts.filter(a => !a.isDismissed);

            return (
              <Card
                key={wh.id}
                onClick={() => setSelectedWhDetail(wh.id)}
                className="hover:translate-y-[-2px] flex flex-col justify-between h-64 border-theme hover:border-primary-accent/30 cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider uppercase block">{wh.region} Node</span>
                      <h3 className="text-md font-bold text-theme-primary tracking-tight leading-snug mt-0.5">{wh.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{wh.id}</p>
                    </div>

                    <div className={`py-1 px-2.5 rounded-lg border font-mono text-right ${healthStatus.bgColor} ${healthStatus.borderColor}`}>
                      <span className={`text-md font-bold ${healthStatus.color}`}>{wh.health.overall}%</span>
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 block tracking-wider uppercase">{healthStatus.label}</span>
                    </div>
                  </div>

                  {/* Core Metrics gauges */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-5">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                        <span>EFFICIENCY</span>
                        <span className="text-theme-primary font-semibold">{wh.health.efficiency}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-950 h-1 rounded overflow-hidden">
                        <div className="bg-primary-accent h-full rounded" style={{ width: `${wh.health.efficiency}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                        <span>SPACE UTILIZATION</span>
                        <span className="text-theme-primary font-semibold">{wh.health.space}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-950 h-1 rounded overflow-hidden">
                        <div className="bg-secondary-accent h-full rounded" style={{ width: `${wh.health.space}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-900 pt-3 flex items-center justify-between mt-4">
                  <span className="text-[10px] font-mono font-semibold flex items-center space-x-1.5">
                    {activeAlerts.length > 0 ? (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
                        <span className="text-rose-600 dark:text-rose-400">{activeAlerts.length} SEVERE INCIDENTS</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                        <span className="text-emerald-600 dark:text-emerald-450">NO ANOMALIES</span>
                      </>
                    )}
                  </span>
                  
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-theme-primary flex items-center font-semibold font-mono space-x-1">
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Sliding Inspector Drawer Side Panel */}
      {selectedWhDetail && activeWh && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-205 dark:border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between animate-fade-in">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-850">
              <div>
                <h3 className="text-md font-bold text-theme-primary tracking-wide uppercase font-mono">NODE SPECTRAL READOUT</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{activeWh.id}</p>
              </div>
              <button
                onClick={() => setSelectedWhDetail(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block tracking-widest uppercase">Name</span>
                <span className="text-sm font-bold text-theme-primary">{activeWh.name}</span>
              </div>

              {/* Health block */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Heart className={`h-5 w-5 ${getHealthStatus(activeWh.health.overall).color}`} />
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Overall Health Rating</span>
                    <span className="text-md font-bold text-theme-primary font-mono">{activeWh.health.overall}/100</span>
                  </div>
                </div>
                <span className={`text-xs font-mono font-bold uppercase ${getHealthStatus(activeWh.health.overall).color}`}>
                  {getHealthStatus(activeWh.health.overall).label}
                </span>
              </div>

              {/* Detailed Metrics List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold font-mono text-theme-primary uppercase tracking-widest">Calculated Sub-Metrics</h4>
                
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Pick Efficiency:</span>
                    <span className="text-theme-primary font-semibold">{activeWh.health.efficiency}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Space Utilization:</span>
                    <span className="text-theme-primary font-semibold">{activeWh.health.space}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Delay Risk Factor:</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{activeWh.health.delayRisk}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Demand Volatility Index:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{activeWh.health.demandRisk}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Labor Performance Score:</span>
                    <span className="text-emerald-600 dark:text-emerald-450 font-semibold">{activeWh.health.laborScore}%</span>
                  </div>
                </div>
              </div>

              {/* Incidents History */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold font-mono text-theme-primary uppercase tracking-widest">Incident History Board</h4>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {[...activeWh.alerts].sort((a, b) => {
                    if (!a.isDismissed && b.isDismissed) return -1;
                    if (a.isDismissed && !b.isDismissed) return 1;
                    return 0;
                  }).map(alt => (
                    <div
                      key={alt.id}
                      className={`p-2 border text-[10px] font-mono rounded flex justify-between items-center ${
                        alt.isDismissed
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                          : alt.severity === 'high'
                          ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-450'
                      }`}
                    >
                      <span className={alt.isDismissed ? 'line-through opacity-75' : ''}>
                        [{alt.timestamp}] {alt.title}
                      </span>
                      <span className="text-[9px] font-bold uppercase shrink-0 ml-1">
                        {alt.isDismissed ? '✓ Solved' : alt.severity === 'high' ? 'Critical' : 'Warning'}
                      </span>
                    </div>
                  ))}
                  {activeWh.alerts.length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-mono">No incidents logged</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleLaunchWarehouse(activeWh.id)}
            className="w-full py-3 px-4 rounded-lg bg-primary-accent text-slate-950 font-bold text-xs uppercase font-mono tracking-wider hover:bg-blue-400 transition flex items-center justify-center space-x-2 mt-6"
          >
            <Settings className="h-4 w-4" />
            <span>Launch Warehouse Console</span>
          </button>
        </div>
      )}

      {selectedWhDetail && (
        <div 
          onClick={() => setSelectedWhDetail(null)} 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" 
        />
      )}
    </div>
  );
}
