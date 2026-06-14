import React, { useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { Sliders, Award, AlertCircle, ArrowRight, Play, CheckCircle } from 'lucide-react';

export default function SpaceOptimization() {
  const { selectedWarehouseId, warehouses, getEngineOutputs, executeSlotMove } = useWarehouseStore();
  const [optSuccessMessage, setOptSuccessMessage] = useState<string | null>(null);

  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];
  const { slotting } = getEngineOutputs(activeWh.id);

  const handleSlotMove = (sku: string, targetZone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D', expectedGain: number) => {
    executeSlotMove(activeWh.id, sku, targetZone);
    
    setOptSuccessMessage(`SKU ${sku} successfully relocated to ${targetZone}. Recalculating path velocity. (+${expectedGain}% efficiency)`);
    setTimeout(() => {
      setOptSuccessMessage(null);
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono uppercase font-sans">Space Slotting Optimization</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Dead space detection indicators and automated bin slot reallocation recommendations</p>
      </div>

      {optSuccessMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>{optSuccessMessage}</span>
        </div>
      )}

      {/* Utilization summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Utilization Gauge */}
        <Card className="flex flex-col justify-between h-44">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-300 dark:text-slate-400 uppercase tracking-widest mb-1">Active Space Utilization</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Percentage of total bin storage capacity currently occupied</p>
          </div>
          
          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 dark:text-slate-500">Slot Occupancy:</span>
              <span className="text-slate-800 dark:text-white font-bold">{slotting.spaceUtilizationPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-950 h-2 rounded overflow-hidden">
              <div 
                className={`h-full rounded transition-all duration-500 ${
                  slotting.spaceUtilizationPercent > 90 ? 'bg-rose-500' : slotting.spaceUtilizationPercent > 75 ? 'bg-amber-500' : 'bg-primary-accent'
                }`}
                style={{ width: `${slotting.spaceUtilizationPercent}%` }} 
              />
            </div>
          </div>
        </Card>

        {/* Dead Space indicators */}
        <Card className="flex flex-col justify-between h-44">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">Dead Space Footprint</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Space taken by slow-velocity SKUs resting in premium zones</p>
          </div>

          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 dark:text-slate-500">Idle Premium Bin Footprint:</span>
              <span className="text-rose-400 font-bold">{slotting.deadSpacePercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-950 h-2 rounded overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded transition-all duration-500" 
                style={{ width: `${slotting.deadSpacePercent}%` }} 
              />
            </div>
          </div>
        </Card>

      </div>

      {/* Optimization recommendations list */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest">Target relocation tasks</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Move items close to dispatch corridors to reduce picker travel latency</p>
          </div>
        </div>

        <div className="space-y-4">
          {slotting.recommendations.map((rec) => (
            <div 
              key={rec.id} 
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">{rec.sku}</span>
                  <span className="text-slate-800 dark:text-white font-bold">{rec.name}</span>
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-sans text-xs">{rec.reason}</p>
                
                <div className="flex items-center space-x-4 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>SWAP PATH: <span className="text-slate-800 dark:text-white font-bold">{rec.currentZone} → {rec.targetZone}</span></span>
                  <span>ROI: <span className="text-emerald-600 dark:text-emerald-400 font-bold">+${rec.laborSavings}/mo</span></span>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 justify-between sm:justify-end">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{rec.expectedGain}% Throughput</span>
                <button
                  onClick={() => handleSlotMove(rec.sku, rec.targetZone, rec.expectedGain)}
                  className="px-3.5 py-2 bg-primary-accent hover:bg-blue-400 text-slate-950 font-bold uppercase rounded text-[10px] tracking-wider flex items-center space-x-1.5 transition"
                >
                  <Play className="h-3 w-3 fill-slate-950" />
                  <span>Execute Move</span>
                </button>
              </div>
            </div>
          ))}

          {slotting.recommendations.length === 0 && (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
              All shelves slots are fully balanced. Zero path delays detected.
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}
