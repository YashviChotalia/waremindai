import React, { useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import {
  ShieldAlert, Sparkles, UserPlus, CheckCircle,
  ArrowRight, Activity, TrendingDown, Clock, Zap
} from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  receive: '#06B6D4',
  pick: '#3B82F6',
  pack: '#10B981',
  dispatch: '#8B5CF6',
};

function UtilizationBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="progress-bar">
      <div
        className="progress-bar-fill"
        style={{
          width: `${Math.min(value, 100)}%`,
          background: value > 88
            ? 'linear-gradient(90deg,#EF4444,#F87171)'
            : value > 74
            ? 'linear-gradient(90deg,#F59E0B,#FCD34D)'
            : `${color}`,
          boxShadow: value > 88 ? '0 0 8px rgba(239,68,68,0.4)' : 'none',
        }}
      />
    </div>
  );
}

export default function BottleneckIntelligence() {
  const { selectedWarehouseId, warehouses, getEngineOutputs, reallocateWorkers } = useWarehouseStore();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [appliedStages, setAppliedStages] = useState<Set<string>>(new Set());

  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];
  const { bottlenecks } = getEngineOutputs(activeWh.id);

  const handleQuickReallocate = (stageId: 'receive' | 'pick' | 'pack' | 'dispatch', suggestedWorkers: number) => {
    reallocateWorkers(activeWh.id, stageId, suggestedWorkers);
    setAppliedStages(prev => new Set([...prev, stageId]));
    setSuccessMessage(`Worker reallocation authorized for ${stageId.toUpperCase()} stage. Congestion dissipating…`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const criticalCount = bottlenecks.filter(b => b.status === 'Critical').length;
  const warningCount = bottlenecks.filter(b => b.status === 'Warning').length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Title */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
            <Activity className="h-3 w-3 text-danger-accent" />
            <span>Warehouse Manager / Bottleneck Intelligence</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Bottleneck Intelligence Center</h2>
          <p className="text-sm text-slate-400 mt-0.5">Flow line analysis · root cause reporting · AI queue rebalancing</p>
        </div>
        <div className="flex items-center space-x-2">
          {criticalCount > 0 && (
            <span className="badge-critical px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-danger-accent animate-pulse" />
              <span>{criticalCount} Critical</span>
            </span>
          )}
          {warningCount > 0 && (
            <span className="badge-warning px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
              {warningCount} Warning
            </span>
          )}
        </div>
      </div>

      {/* Success toast */}
      {successMessage && (
        <div className="p-3.5 gradient-success-glow border border-emerald-500/25 text-emerald-400 text-xs font-mono rounded-xl flex items-center space-x-2.5 animate-fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Pipeline Flow — Horizontal Sequence */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300 uppercase tracking-widest">Fulfillment Pipeline Sequence</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Real-time flow states across all processing stages</p>
          </div>
        </div>

        <div className="flex items-stretch gap-0">
          {bottlenecks.map((stage, idx) => {
            const isLast = idx === bottlenecks.length - 1;
            const stageKey = activeWh.stages[idx]?.id || 'pick';
            const color = STAGE_COLORS[stageKey] || '#3B82F6';
            const rawStage = activeWh.stages[idx];
            const isCritical = stage.status === 'Critical';
            const isWarning = stage.status === 'Warning';

            return (
              <div key={stage.stageId} className="flex items-center flex-1 gap-3">
                <div
                  className={`flex-1 p-4 rounded-xl border flex flex-col gap-4 transition-all ${
                    isCritical
                      ? 'border-rose-500/35 bg-rose-500/5'
                      : isWarning
                      ? 'border-amber-500/25 bg-amber-500/5'
                      : 'border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/20'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest block">Stage 0{idx + 1}</span>
                      <h5 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{stage.name}</h5>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                        isCritical ? 'badge-critical' : isWarning ? 'badge-warning' : 'badge-optimal'
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>

                  {/* Utilization bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>Utilization</span>
                      <span className="text-slate-800 dark:text-white font-bold">{stage.utilizationRate}%</span>
                    </div>
                    <UtilizationBar value={stage.utilizationRate} color={color} />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                    <div className="bg-slate-200/70 dark:bg-slate-950/50 rounded p-1.5">
                      <span className="text-slate-500 block">Queue</span>
                      <span className={`font-bold text-[11px] ${rawStage?.activeQueue > 40 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                        {rawStage?.activeQueue}
                      </span>
                    </div>
                    <div className="bg-slate-200/70 dark:bg-slate-950/50 rounded p-1.5">
                      <span className="text-slate-500 block">Est. Wait</span>
                      <span className={`font-bold text-[11px] ${stage.projectedQueueTime > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>
                        {stage.projectedQueueTime}m
                      </span>
                    </div>
                    <div className="bg-slate-200/70 dark:bg-slate-950/50 rounded p-1.5">
                      <span className="text-slate-500 block">Workers</span>
                      <span className="font-bold text-[11px] text-slate-800 dark:text-white">{rawStage?.workers}</span>
                    </div>
                    <div className="bg-slate-200/70 dark:bg-slate-950/50 rounded p-1.5">
                      <span className="text-slate-500 block">Risk</span>
                      <span className={`font-bold text-[11px] ${stage.delayProbability > 50 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {stage.delayProbability}%
                      </span>
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <ArrowRight className={`h-4 w-4 shrink-0 ${isCritical ? 'text-rose-500/50' : 'text-slate-700'}`} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Root Causes + Delay Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Root Cause Tracker */}
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <h4 className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-widest">Delay Root Causes</h4>
          </div>
          <div className="space-y-2.5">
            {bottlenecks.flatMap(b =>
              b.rootCauses.map((rc, idx) => (
                <div
                  key={`${b.stageId}-${idx}`}
                  className="p-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-900 rounded-xl flex items-start space-x-3"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    b.status === 'Critical' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                  }`}>
                    <TrendingDown className={`h-3.5 w-3.5 ${b.status === 'Critical' ? 'text-rose-500 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  </div>
                  <div>
                    <span className={`text-[9px] font-mono font-bold uppercase block mb-0.5 ${
                      b.status === 'Critical' ? 'text-rose-500 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {b.name}
                    </span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{rc}</p>
                  </div>
                </div>
              ))
            )}
            {bottlenecks.every(b => b.rootCauses.length === 0) && (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                No active anomalies detected. All stages within nominal parameters.
              </div>
            )}
          </div>
        </Card>

        {/* ML Queue Projections */}
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-4 w-4 text-secondary-accent" />
            <h4 className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-widest">ML Queue Delay Projections</h4>
          </div>
          <div className="space-y-3">
            {bottlenecks.map(stage => {
              const stageIdx = bottlenecks.indexOf(stage);
              const color = STAGE_COLORS[activeWh.stages[stageIdx]?.id] || '#3B82F6';
              return (
                <div key={stage.stageId} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-mono mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">{stage.name}</span>
                      <div className="flex items-center space-x-3">
                        <span className={`font-bold ${stage.status === 'Critical' ? 'text-rose-500 dark:text-rose-400' : stage.status === 'Warning' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {stage.projectedQueueTime}m wait
                        </span>
                        <span className="text-slate-500 dark:text-slate-600">Risk: {stage.delayProbability}%</span>
                      </div>
                    </div>
                    <UtilizationBar value={stage.delayProbability} color={color} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Separator + Stage summary table */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/60">
            <div className="grid grid-cols-4 text-[9px] font-mono text-slate-500 uppercase mb-2">
              <span>Stage</span>
              <span className="text-center">Util %</span>
              <span className="text-center">Queue</span>
              <span className="text-right">Workers</span>
            </div>
            {bottlenecks.map((b, i) => (
              <div key={b.stageId} className="grid grid-cols-4 text-[10px] font-mono py-1.5 border-b border-slate-200 dark:border-slate-900/60">
                <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">{activeWh.stages[i]?.name?.split(' ')[0]}</span>
                <span className={`text-center font-bold ${b.utilizationRate > 88 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>{b.utilizationRate}%</span>
                <span className={`text-center font-bold ${activeWh.stages[i]?.activeQueue > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>{activeWh.stages[i]?.activeQueue}</span>
                <span className="text-right text-slate-700 dark:text-slate-300">{activeWh.stages[i]?.workers}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Recommendations Panel */}
      <Card className="border border-primary-accent/15 gradient-blue-glow">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-primary-accent/10 border border-primary-accent/20">
            <Sparkles className="h-4 w-4 text-primary-accent" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono tracking-widest uppercase text-primary-accent">AI Bottleneck Mitigation Recommendations</h4>
            <p className="text-[10px] text-slate-500 font-mono">Engine-generated remediation actions based on real-time telemetry</p>
          </div>
        </div>

        <div className="space-y-3">
          {bottlenecks.filter(b => b.status !== 'Optimal').map(b => {
            const isApplied = appliedStages.has(b.stageId);
            return (
              <div
                key={b.stageId}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isApplied ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-300/60 dark:border-slate-800/60 bg-slate-100/60 dark:bg-slate-950/40'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                      b.status === 'Critical' ? 'badge-critical' : 'badge-warning'
                    }`}>
                      {b.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">{b.name}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{b.recommendation.action}</p>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">{b.recommendation.impact}</span>
                  </div>
                </div>

                {isApplied ? (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-mono font-bold shrink-0">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Applied</span>
                  </div>
                ) : (
                  b.recommendation.actionType === 'allocate_workers' && b.recommendation.suggestedWorkers && (
                    <button
                      onClick={() => handleQuickReallocate(
                        b.stageId,
                        activeWh.stages.find(s => s.id === b.stageId)!.workers + b.recommendation.suggestedWorkers!
                      )}
                      className="px-4 py-2 bg-primary-accent text-slate-950 hover:bg-blue-400 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 shrink-0 transition shadow-md shadow-primary-accent/20"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Authorize Move</span>
                    </button>
                  )
                )}
              </div>
            );
          })}

          {bottlenecks.every(b => b.status === 'Optimal') && (
            <div className="py-6 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 text-xs font-semibold">All processing stages are operating optimally.</p>
              <p className="text-slate-500 text-[10px] font-mono mt-1">No reallocations required at this time.</p>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}
