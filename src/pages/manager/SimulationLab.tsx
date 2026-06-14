import React from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { Sliders, RefreshCw, Sparkles, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SimulationLab() {
  const {
    selectedWarehouseId,
    warehouses,
    simulationInput,
    simulationResult,
    isSimulating,
    triggerSimulation,
    resetSimulation
  } = useWarehouseStore();

  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];
  const currentThroughput = activeWh.stages.reduce((sum, s) => sum + s.throughput, 0);

  // Preset Handlers
  const handlePreset = (preset: 'flash_sale' | 'worker_shortage' | 'layout_change') => {
    const store = useWarehouseStore.getState();
    if (preset === 'flash_sale') {
      useWarehouseStore.setState({
        simulationInput: {
          incomingOrdersMultiplier: 2.2,
          workerCount: 38,
          equipmentFailureFlag: false,
          activePreset: 'flash_sale',
        }
      });
    } else if (preset === 'worker_shortage') {
      useWarehouseStore.setState({
        simulationInput: {
          incomingOrdersMultiplier: 1.0,
          workerCount: 16,
          equipmentFailureFlag: false,
          activePreset: 'worker_shortage',
        }
      });
    } else if (preset === 'layout_change') {
      useWarehouseStore.setState({
        simulationInput: {
          incomingOrdersMultiplier: 1.3,
          workerCount: 30,
          equipmentFailureFlag: true,
          activePreset: 'layout_change',
        }
      });
    }
  };

  const handleRun = () => {
    triggerSimulation(activeWh.id);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Critical') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (status === 'Degraded') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  // Prepare chart comparison data if result exists
  const comparisonData = simulationResult ? [
    { name: 'Throughput', Current: currentThroughput, Projected: simulationResult.throughputPerHour },
    { name: 'Delays (m)', Current: 15, Projected: simulationResult.expectedDelayMinutes },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono uppercase font-sans">Hypothetical Simulation Lab</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Run what-if scenario testing on warehouse queues, labor changes, and machine outages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Parameters Slider (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <h4 className="text-xs font-bold font-mono text-slate-650 dark:text-slate-300 uppercase tracking-widest mb-4">Simulation Parameters</h4>
            
            {/* Scenario presets */}
            <div className="space-y-2 mb-6">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">Load Pre-configured Presets:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePreset('flash_sale')}
                  className={`py-1.5 rounded text-[10px] font-mono font-bold border transition ${
                    simulationInput.activePreset === 'flash_sale'
                      ? 'bg-primary-accent/15 text-primary-accent border-primary-accent/30'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Flash Sale
                </button>
                <button
                  onClick={() => handlePreset('worker_shortage')}
                  className={`py-1.5 rounded text-[10px] font-mono font-bold border transition ${
                    simulationInput.activePreset === 'worker_shortage'
                      ? 'bg-primary-accent/15 text-primary-accent border-primary-accent/30'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Staff Shortage
                </button>
                <button
                  onClick={() => handlePreset('layout_change')}
                  className={`py-1.5 rounded text-[10px] font-mono font-bold border transition ${
                    simulationInput.activePreset === 'layout_change'
                      ? 'bg-primary-accent/15 text-primary-accent border-primary-accent/30'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Conveyor Out
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 font-mono text-xs">
              
              {/* Order multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Inbound Orders Multiplier</span>
                  <span className="text-slate-800 dark:text-white font-bold">{simulationInput.incomingOrdersMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={simulationInput.incomingOrdersMultiplier}
                  onChange={(e) => useWarehouseStore.setState({
                    simulationInput: { ...simulationInput, incomingOrdersMultiplier: parseFloat(e.target.value), activePreset: 'none' }
                  })}
                  className="w-full accent-primary-accent"
                />
              </div>

              {/* Workers level */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Worker Count</span>
                  <span className="text-slate-800 dark:text-white font-bold">{simulationInput.workerCount} operators</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="1"
                  value={simulationInput.workerCount}
                  onChange={(e) => useWarehouseStore.setState({
                    simulationInput: { ...simulationInput, workerCount: parseInt(e.target.value), activePreset: 'none' }
                  })}
                  className="w-full accent-primary-accent"
                />
              </div>

              {/* Equipment block */}
              <div className="flex justify-between items-center py-2 border-t border-slate-200 dark:border-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Forklift/Conveyor Malfunction (Safety Override)</span>
                <input
                  type="checkbox"
                  checked={simulationInput.equipmentFailureFlag}
                  onChange={(e) => useWarehouseStore.setState({
                    simulationInput: { ...simulationInput, equipmentFailureFlag: e.target.checked, activePreset: 'none' }
                  })}
                  className="rounded border-slate-300 dark:border-slate-800 text-primary-accent bg-white dark:bg-slate-950 h-4 w-4"
                />
              </div>

              {/* Run button */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={resetSimulation}
                  className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg font-bold uppercase transition"
                >
                  Reset
                </button>
                <button
                  onClick={handleRun}
                  disabled={isSimulating}
                  className="w-2/3 py-2.5 bg-primary-accent text-slate-950 font-bold uppercase rounded-lg shadow-md shadow-primary-accent/15 hover:bg-blue-400 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Running Engine...</span>
                    </>
                  ) : (
                    <span>Execute Simulation</span>
                  )}
                </button>
              </div>

            </div>
          </Card>
        </div>

        {/* Right: Results comparison charts & metrics (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!simulationResult ? (
            <div className="h-full min-h-[350px] border border-slate-200 dark:border-slate-900 rounded-xl bg-slate-50 dark:bg-slate-900/10 flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 font-mono text-sm">
              <Sliders className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <span>Configure parameters and click execute to evaluate performance output.</span>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Comparative Metrics blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Result status */}
                <Card className="flex items-center space-x-4">
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <AlertTriangle className="h-5 w-5 text-warning-accent" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Projected System Status</span>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 border rounded uppercase ${getStatusBadge(simulationResult.status)}`}>
                      {simulationResult.status}
                    </span>
                  </div>
                </Card>

                {/* Savings/Losses */}
                <Card className="flex items-center space-x-4">
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Projected Savings Yield</span>
                    <span className={`text-sm font-bold font-mono ${
                      simulationResult.operationalSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {simulationResult.operationalSavings >= 0 ? '+' : ''}${simulationResult.operationalSavings.toLocaleString()}/mo
                    </span>
                  </div>
                </Card>

              </div>

              {/* Chart Comparison */}
              <Card>
                <h4 className="text-xs font-bold font-mono text-slate-650 dark:text-slate-400 uppercase tracking-widest mb-4">Operations Metrics Delta</h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={10} className="font-mono" />
                      <YAxis stroke="#64748B" fontSize={10} className="font-mono" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', color: '#F8FAFC' }}
                        labelClassName="text-slate-400 font-mono"
                      />
                      <Bar dataKey="Current" fill="#64748B" name="Current Active" />
                      <Bar dataKey="Projected" fill="#3B82F6" name="Projected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Recommendation Summary */}
              <Card className="border border-primary-accent/15 bg-gradient-to-r from-slate-100/50 to-blue-100/10 dark:from-slate-900/50 dark:to-blue-950/10">
                <div className="flex items-center space-x-1.5 text-primary-accent mb-2">
                  <Sparkles className="h-4 w-4" />
                  <h4 className="text-xs font-bold tracking-widest uppercase font-mono">Simulation Report</h4>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed font-mono">
                  {simulationResult.reportSummary}
                </p>
              </Card>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
