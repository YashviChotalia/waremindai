import React, { useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { Sparkles, DollarSign, TrendingUp, Check, Play, AlertCircle } from 'lucide-react';

export default function RecommendationFeed() {
  const { warehouses, executeSlotMove, reallocateWorkers } = useWarehouseStore();
  const [deployedActions, setDeployedActions] = useState<Record<string, boolean>>({});

  // 1. Gather slotting and workforce recommendations across all nodes
  const allRecommendations = warehouses.flatMap(wh => {
    const outputs = useWarehouseStore.getState().getEngineOutputs(wh.id);

    // Slot recommendations
    const slotRecs = outputs.slotting.recommendations.map(r => ({
      id: r.id,
      warehouseId: wh.id,
      warehouseName: wh.name,
      type: 'Space Slotting',
      sku: r.sku,
      action: `Move ${r.name} (${r.sku})`,
      moveDetail: `${r.currentZone} → ${r.targetZone}`,
      expectedGain: `+${r.expectedGain}% Throughput`,
      laborSavings: r.laborSavings,
      difficulty: r.difficulty,
      reason: r.reason,
      execute: () => executeSlotMove(wh.id, r.sku, r.targetZone)
    }));

    // Bottleneck / workforce recommendations
    const workforceRecs = outputs.bottlenecks
      .filter(b => b.status !== 'Optimal')
      .map(b => ({
        id: `work-rec-${wh.id}-${b.stageId}`,
        warehouseId: wh.id,
        warehouseName: wh.name,
        type: 'Workforce Allocation',
        action: `Rebalance Workers at ${b.name}`,
        moveDetail: `Allocate +${b.recommendation.suggestedWorkers || 2} staff`,
        expectedGain: b.recommendation.impact,
        laborSavings: b.status === 'Critical' ? 620 : 280,
        difficulty: 'Low',
        reason: b.rootCauses[0] || `Fulfillment delay warning due to queue buildup.`,
        execute: () => reallocateWorkers(wh.id, b.stageId, (wh.stages.find(s => s.id === b.stageId)?.workers || 4) + (b.recommendation.suggestedWorkers || 2))
      }));


    return [...slotRecs, ...workforceRecs];
  }).sort((a, b) => b.laborSavings - a.laborSavings);

  const handleDeploy = (id: string, actionFn: () => void) => {
    // Run the state update function in Zustand
    actionFn();
    
    // Set deployment state visually
    setDeployedActions(prev => ({ ...prev, [id]: true }));

    // Reset after 3 seconds so recommendation updates
    setTimeout(() => {
      setDeployedActions(prev => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'High') return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (diff === 'Medium') return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-theme-primary font-mono uppercase font-sans">Active Recommendations Feed</h2>
          <p className="text-sm text-slate-400">High impact machine learning optimizations ranked by projected monthly ROI</p>
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {allRecommendations.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm font-mono border border-slate-900 rounded-xl bg-slate-900/10">
            No pending recommendations. All systems are slot-optimized and balanced.
          </div>
        ) : (
          allRecommendations.map((rec) => {
            const isDeployed = deployedActions[rec.id];

            return (
              <div
                key={rec.id}
                className="glass-card rounded-xl p-5 border border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary-accent/20 transition"
              >
                
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-[10px] font-mono text-primary-accent bg-primary-accent/10 border border-primary-accent/20 px-2 py-0.5 rounded font-bold uppercase">
                      {rec.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{rec.warehouseName}</span>
                    <span className={`text-[9px] font-mono border px-1.5 rounded uppercase ${getDifficultyColor(rec.difficulty)}`}>
                      {rec.difficulty} Effort
                    </span>
                  </div>

                  <h3 className="text-md font-bold text-theme-primary font-sans">{rec.action}</h3>
                  <div className="text-xs text-theme-secondary font-mono flex items-center space-x-2">
                    <span className="text-slate-500">ADJUSTMENT:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rec.moveDetail}</span>
                  </div>

                  <p className="text-xs text-theme-secondary font-sans leading-relaxed pt-1 flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>{rec.reason}</span>
                  </p>
                </div>

                {/* Right: ROI & Action Button */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-900 pt-4 md:pt-0 gap-4 min-w-[150px]">
                  
                  <div className="text-left md:text-right">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">Projected Value Gain</span>
                    <span className="text-lg font-bold text-theme-primary font-mono flex items-center justify-start md:justify-end">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {rec.laborSavings}
                      <span className="text-xs text-slate-400 dark:text-slate-400 font-normal">/mo</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block font-semibold">{rec.expectedGain}</span>
                  </div>

                  <button
                    onClick={() => handleDeploy(rec.id, rec.execute)}
                    disabled={isDeployed}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition duration-200 flex items-center space-x-2 ${
                      isDeployed
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-primary-accent hover:bg-blue-400 text-slate-950 shadow-md shadow-primary-accent/15'
                    }`}
                  >
                    {isDeployed ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Optimized</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-slate-950" />
                        <span>Apply Action</span>
                      </>
                    )}
                  </button>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
