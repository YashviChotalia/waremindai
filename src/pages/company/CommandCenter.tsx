import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import {
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Network,
  ArrowRight,
  Users,
  Activity,
  Check,
  X,
  Database
} from 'lucide-react';
import { getHealthStatus } from '../../engine/healthScore';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info';
}

export default function CommandCenter() {
  const { warehouses, dismissAlert, reallocateWorkers, executeSlotMove, setSelectedWarehouse, setPortalRole } = useWarehouseStore();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('WH-01');
  const [executedRecIds, setExecutedRecIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [alertTab, setAlertTab] = useState<'active' | 'resolved'>('active');

  const addToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auto-remove toasts after 4 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        removeToast(toasts[0].id);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // Aggregate active alerts from all warehouses
  const activeAlerts = warehouses.flatMap(wh =>
    wh.alerts
      .filter(a => !a.isDismissed)
      .map(alert => ({
        ...alert,
        warehouseName: wh.name,
        warehouseId: wh.id
      }))
  );

  const resolvedAlerts = warehouses.flatMap(wh =>
    wh.alerts
      .filter(a => a.isDismissed)
      .map(alert => ({
        ...alert,
        warehouseName: wh.name,
        warehouseId: wh.id
      }))
  );

  // Core Recommendations Generator based on engine outputs
  const generatedRecommendations = warehouses.flatMap(wh => {
    const outputs = useWarehouseStore.getState().getEngineOutputs(wh.id);

    // 1. Slot recommendations
    const slotRecs = outputs.slotting.recommendations.map(r => ({
      id: `slot-rec-${wh.id}-${r.sku}`,
      warehouseId: wh.id,
      warehouseName: wh.name,
      impact: `+${r.expectedGain}% Velocity`,
      savings: r.laborSavings,
      action: `Relocate SKU ${r.sku} (${r.name}) to Zone A`,
      type: 'Space Slotting',
      sku: r.sku,
      targetZone: 'Zone A' as const
    }));

    // 2. Bottleneck recommendations
    const bottleneckRecs = outputs.bottlenecks
      .filter(b => b.status !== 'Optimal')
      .map(b => ({
        id: `btn-rec-${wh.id}-${b.stageId}`,
        warehouseId: wh.id,
        warehouseName: wh.name,
        impact: b.recommendation.impact,
        savings: b.status === 'Critical' ? 850 : 350,
        action: b.recommendation.action,
        type: 'Workforce Allocation',
        stageId: b.stageId,
        workerAdjustment: 2
      }));

    return [...slotRecs, ...bottleneckRecs];
  }).sort((a, b) => b.savings - a.savings); // Sort by highest financial ROI first

  const handleAcknowledgeAlert = (warehouseId: string, alertId: string, title: string) => {
    dismissAlert(warehouseId, alertId);
    addToast(`Acknowledged incident log: "${title}"`, 'info');
  };

  const handleExecuteRecommendation = (rec: any) => {
    if (rec.type === 'Space Slotting') {
      executeSlotMove(rec.warehouseId, rec.sku, rec.targetZone);
      addToast(`Executed Slot Move: SKU ${rec.sku} relocated to ${rec.targetZone}. Base efficiency boosted!`);
    } else if (rec.type === 'Workforce Allocation') {
      const wh = warehouses.find(w => w.id === rec.warehouseId);
      const stage = wh?.stages.find(s => s.id === rec.stageId);
      if (wh && stage) {
        const currentWorkers = stage.workers;
        const newCount = currentWorkers + rec.workerAdjustment;
        reallocateWorkers(wh.id, rec.stageId, newCount);
        addToast(`Executed Workforce Allocation: Added 2 workers to ${stage.name}. Bottleneck relieved!`);
      }
    }
    setExecutedRecIds(prev => [...prev, rec.id]);
  };

  const selectedWh = warehouses.find(w => w.id === selectedNodeId);
  const selectedWhHealth = selectedWh ? getHealthStatus(selectedWh.health.overall) : null;
  const selectedWhAlerts = selectedWh ? selectedWh.alerts.filter(a => !a.isDismissed) : [];

  const handleInspectWarehouse = (whId: string) => {
    setSelectedWarehouse(whId);
    setPortalRole('warehouse');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        @keyframes telemetry-dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .telemetry-link-active {
          stroke-dasharray: 6, 4;
          animation: telemetry-dash 1s linear infinite;
        }
        .telemetry-link-warning {
          stroke-dasharray: 4, 3;
          animation: telemetry-dash 0.6s linear infinite;
        }
        circle {
          transform-origin: center;
          transform-box: fill-box;
        }
      `}</style>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex justify-between items-start space-x-3 pointer-events-auto animate-slide-in ${toast.type === 'info'
                ? 'bg-slate-900/95 border-sky-500/20 text-slate-200'
                : 'bg-slate-900/95 border-emerald-500/20 text-slate-200'
              }`}
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'info' ? (
                <Activity className="h-5 w-5 text-sky-400 shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              )}
              <p className="text-xs font-medium font-mono leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-slate-300 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-theme-primary font-mono uppercase">Operational Command Center</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Real-time incident response management and telemetry overlays</p>
      </div>

      {/* Grid Layout: Left (Incidents), Center (Visualization), Right (AI Recs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Alerts Feed (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">Incident Dispatch Board</h4>
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${
                activeAlerts.length > 0
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
              }`}>
                {activeAlerts.length} Active
              </span>
            </div>
            
            {/* Tab Buttons */}
            <div className="flex space-x-1 p-0.5 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-lg text-[10px] font-mono">
              <button
                onClick={() => setAlertTab('active')}
                className={`flex-1 py-1 px-2 rounded transition font-bold uppercase cursor-pointer ${
                  alertTab === 'active'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-300'
                }`}
              >
                Active ({activeAlerts.length})
              </button>
              <button
                onClick={() => setAlertTab('resolved')}
                className={`flex-1 py-1 px-2 rounded transition font-bold uppercase cursor-pointer ${
                  alertTab === 'resolved'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-300'
                }`}
              >
                Resolved ({resolvedAlerts.length})
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {alertTab === 'active' ? (
              activeAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs border border-slate-200 dark:border-slate-900 rounded-xl bg-slate-900/10">
                  All systems operating within nominal limits.
                </div>
              ) : (
                activeAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 bg-slate-50 dark:bg-slate-950/60 transition ${alert.severity === 'high' ? 'border-rose-500/20 hover:border-rose-500/30' : 'border-amber-500/20 hover:border-amber-500/30'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase">{alert.warehouseName}</span>
                        <h5 className={`text-xs font-bold ${alert.severity === 'high' ? 'text-rose-600 dark:text-rose-450' : 'text-amber-600 dark:text-amber-450'}`}>
                          {alert.title}
                        </h5>
                      </div>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{alert.timestamp}</span>
                    </div>

                    <p className="text-xs text-theme-secondary leading-relaxed font-sans">{alert.description}</p>

                    <button
                      onClick={() => handleAcknowledgeAlert(alert.warehouseId, alert.id, alert.title)}
                      className="self-end text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center space-x-1 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/20 px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/40 transition cursor-pointer"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Acknowledge Log</span>
                    </button>
                  </div>
                ))
              )
            ) : (
              resolvedAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs border border-slate-200 dark:border-slate-900 rounded-xl bg-slate-900/10">
                  No resolved incidents in this session.
                </div>
              ) : (
                resolvedAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase">{alert.warehouseName}</span>
                        <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-450 line-through opacity-75">
                          {alert.title}
                        </h5>
                      </div>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{alert.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{alert.description}</p>
                    
                    <div className="flex justify-between items-center text-[9px] font-mono text-emerald-600 dark:text-emerald-450 font-bold border-t border-emerald-500/10 pt-2">
                      <span>✓ SOLVED {alert.resolvedBy === 'warehouse' ? 'BY WH CONSOLE' : 'BY HQ'}</span>
                      {alert.resolvedAt && <span>at {alert.resolvedAt}</span>}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Center: Operational Visualization (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <Card className="flex-1 flex flex-col justify-between min-h-[400px] relative">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold font-mono text-theme-secondary uppercase tracking-wider">Network Interconnect Map</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Click a node to inspect system telemetry</p>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>LINK_ACTIVE</span>
              </div>
            </div>

            {/* Futuristic SVG Map connecting nodes */}
            <div className="flex-1 border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 rounded-xl relative overflow-hidden flex items-center justify-center p-6 min-h-[300px]">
              <div className="absolute inset-0 timeline-grid opacity-30 pointer-events-none" />

              <svg width="100%" height="100%" viewBox="0 0 400 300" className="z-10 overflow-visible">
                {/* SVG link lines */}
                {/* Line Seattle (80, 80) to Austin (200, 220) */}
                <line x1="80" y1="80" x2="200" y2="220" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="2" className="telemetry-link-active" />
                {/* Line Chicago (300, 100) to Seattle (80, 80) */}
                <line x1="80" y1="80" x2="300" y2="100" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="2" className="telemetry-link-warning" />
                {/* Line Chicago (300, 100) to Austin (200, 220) */}
                <line x1="300" y1="100" x2="200" y2="220" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" className="telemetry-link-active" />

                {/* Seattle Node (WH-01) */}
                <g className="cursor-pointer group" onClick={() => setSelectedNodeId('WH-01')}>
                  <circle cx="80" cy="80" r="14" className="node-halo-circle fill-sky-500/10 stroke-sky-500/20" strokeWidth="1" />
                  <circle cx="80" cy="80" r="8" className={`transition-all duration-300 ${selectedNodeId === 'WH-01' ? 'fill-sky-400 stroke-white scale-110' : 'fill-white dark:fill-slate-950 stroke-sky-500'} group-hover:stroke-sky-400`} strokeWidth="3" />
                  <text x="80" y="52" className="fill-slate-900 dark:fill-slate-100" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">WH-01</text>
                  <text x="80" y="62" className="fill-slate-600 dark:fill-slate-400" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">Seattle (90%)</text>
                </g>

                {/* Chicago Node (WH-03 - Crit alert) */}
                <g className="cursor-pointer group" onClick={() => setSelectedNodeId('WH-03')}>
                  <circle cx="300" cy="100" r="14" className="node-halo-circle fill-rose-500/10 stroke-rose-500/20" strokeWidth="1" />
                  <circle cx="300" cy="100" r="8" className={`transition-all duration-300 ${selectedNodeId === 'WH-03' ? 'fill-rose-500 stroke-white scale-110' : 'fill-white dark:fill-slate-950 stroke-rose-500'} group-hover:stroke-rose-400`} strokeWidth="3" />
                  <text x="300" y="72" className="fill-slate-900 dark:fill-slate-100" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">WH-03</text>
                  <text x="300" y="82" className="fill-rose-600 dark:fill-rose-400 font-bold" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">Chicago (58%)</text>
                </g>

                {/* Austin Node (WH-02) */}
                <g className="cursor-pointer group" onClick={() => setSelectedNodeId('WH-02')}>
                  <circle cx="200" cy="220" r="14" className="node-halo-circle fill-emerald-500/10 stroke-emerald-500/20" strokeWidth="1" />
                  <circle cx="200" cy="220" r="8" className={`transition-all duration-300 ${selectedNodeId === 'WH-02' ? 'fill-emerald-400 stroke-white scale-110' : 'fill-white dark:fill-slate-950 stroke-emerald-500'} group-hover:stroke-emerald-400`} strokeWidth="3" />
                  <text x="200" y="245" className="fill-slate-900 dark:fill-slate-100" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">WH-02</text>
                  <text x="200" y="255" className="fill-slate-600 dark:fill-slate-400" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">Austin (94%)</text>
                </g>
              </svg>

              {/* Status overlay bar */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg flex justify-between text-[10px] font-mono z-20">
                <div className="flex space-x-3">
                  <span className="text-slate-500 dark:text-slate-400">PACKETS: <span className="text-emerald-600 dark:text-emerald-400 font-bold">99.9%</span></span>
                  <span className="text-slate-500 dark:text-slate-400">PING: <span className="text-slate-800 dark:text-white font-bold">18ms</span></span>
                </div>
                <span className={`${activeAlerts.length > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'} uppercase`}>
                  {activeAlerts.length} Active Incidents
                </span>
              </div>
            </div>
          </Card>

          {/* Node Inspector details board */}
          {selectedWh && selectedWhHealth && (
            <Card className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xl animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800/60 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-mono text-primary-accent block font-bold tracking-wider">{selectedWh.region.toUpperCase()} REGION</span>
                  <h4 className="text-sm font-bold text-theme-primary leading-tight">{selectedWh.name} ({selectedWh.id})</h4>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedWhHealth.color} bg-slate-100 dark:bg-slate-950/40 border border-current/20`}>
                    HEALTH: {selectedWh.health.overall}/100
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block uppercase font-mono mt-1">{selectedWhHealth.label}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 p-2 rounded-lg">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Efficiency</span>
                  <span className="text-xs font-mono font-bold text-theme-primary">{selectedWh.health.efficiency}/100</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 p-2 rounded-lg">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Dead Space</span>
                  <span className="text-xs font-mono font-bold text-theme-primary">
                    {Math.round(100 - selectedWh.health.space)}%
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 p-2 rounded-lg">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Delay Risk</span>
                  <span className={`text-xs font-mono font-bold ${selectedWh.health.delayRisk > 30 ? 'text-rose-600 dark:text-rose-400' : 'text-theme-primary'}`}>
                    {selectedWh.health.delayRisk}%
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 p-2 rounded-lg">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Workforce count</span>
                  <span className="text-xs font-mono font-bold text-theme-primary flex items-center space-x-1">
                    <Users className="h-3 w-3 text-slate-450 dark:text-slate-400" />
                    <span>{selectedWh.workers.length} assignees</span>
                  </span>
                </div>
              </div>

              {/* Alerts summary inside inspect board */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {selectedWhAlerts.length === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Zero anomalies reported at this station</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      ⚠️ {selectedWhAlerts.length} unresolved incidents require intervention
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleInspectWarehouse(selectedWh.id)}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-accent hover:bg-blue-400 text-slate-950 font-bold text-xs font-mono tracking-wider rounded-lg transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Access Node Command Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* Right: AI Recommendations (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">Optimizations Feed</h4>
            <span className="text-[10px] font-mono text-primary-accent flex items-center space-x-1 bg-primary-accent/10 border border-primary-accent/20 px-1.5 py-0.5 rounded">
              <Sparkles className="h-3 w-3" />
              <span>Engine Driven</span>
            </span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {generatedRecommendations.map((rec) => {
              const isApplied = executedRecIds.includes(rec.id);
              return (
                <div
                  key={rec.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition ${isApplied
                      ? 'border-emerald-500/20 bg-emerald-950/5'
                      : 'border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/30 hover:border-primary-accent/10'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono px-1.5 py-0.5 rounded block w-fit mb-1 font-bold">
                        {rec.type}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block uppercase leading-none">{rec.warehouseName}</span>
                      <h5 className="text-xs font-bold text-theme-primary mt-1 leading-snug">{rec.action}</h5>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-900/60 pt-2 text-[10px] font-mono">
                    <span className="text-slate-500 dark:text-slate-400">IMPACT: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rec.impact}</span></span>
                    <span className="text-slate-500 dark:text-slate-400">ROI: <span className="text-theme-primary font-bold">${rec.savings}/mo</span></span>
                  </div>

                  <button
                    disabled={isApplied}
                    onClick={() => handleExecuteRecommendation(rec)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-mono tracking-wider transition-all duration-250 flex items-center justify-center space-x-1.5 ${isApplied
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                        : 'bg-primary-accent hover:bg-blue-400 text-slate-950 hover:shadow-lg hover:shadow-primary-accent/10'
                      }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Optimization Applied</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span>Apply Optimization</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
