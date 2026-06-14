export interface ProcessStage {
  id: 'receive' | 'pick' | 'pack' | 'dispatch';
  name: string;
  throughput: number; // units/hr
  capacity: number;   // max units/hr
  activeQueue: number; // count of orders waiting
  workers: number;     // number of assigned workers
}

export interface BottleneckAnalysis {
  stageId: 'receive' | 'pick' | 'pack' | 'dispatch';
  name: string;
  utilizationRate: number; // 0-100
  delayProbability: number; // 0-100
  projectedQueueTime: number; // in minutes
  status: 'Optimal' | 'Warning' | 'Critical';
  rootCauses: string[];
  recommendation: {
    action: string;
    impact: string;
    actionType: 'allocate_workers' | 'maintenance' | 'reroute';
    suggestedWorkers?: number;
  };
}

/**
 * Analyzes stages to detect bottlenecks and compute projections.
 */
export function analyzeBottlenecks(stages: ProcessStage[]): BottleneckAnalysis[] {
  return stages.map(stage => {
    // Dynamic capacity calculation: each worker adds roughly 40 units/hr of capacity, up to maximum theoretical stage capacity
    const effectiveCapacity = Math.min(stage.capacity, stage.workers * 55 + 100);
    const utilizationRate = Math.min(100, Math.round((stage.throughput / Math.max(1, effectiveCapacity)) * 100));
    
    // Queue time calculation: direct function of queue length and effective processing speed
    const unitsPerMinute = effectiveCapacity / 60;
    const projectedQueueTime = Math.max(
      0, 
      Math.round(stage.activeQueue / Math.max(0.1, unitsPerMinute))
    );

    // Delay probability increases as utilization and queue length increase
    let delayProbability = 0;
    if (utilizationRate > 50) delayProbability += (utilizationRate - 50) * 1.2;
    delayProbability += (stage.activeQueue / (stage.capacity / 10)) * 20;
    delayProbability = Math.min(100, Math.round(delayProbability));

    let status: 'Optimal' | 'Warning' | 'Critical' = 'Optimal';
    if (utilizationRate > 90 || projectedQueueTime > 45 || delayProbability > 75) {
      status = 'Critical';
    } else if (utilizationRate > 75 || projectedQueueTime > 20 || delayProbability > 40) {
      status = 'Warning';
    }

    const rootCauses: string[] = [];
    if (stage.workers < 4) {
      rootCauses.push(`Severe workforce shortage (${stage.workers} assigned, recommended minimum 5)`);
    } else if (utilizationRate > 95) {
      rootCauses.push(`Inflow throughput (${stage.throughput} u/h) exceeds physical capacity limit (${effectiveCapacity} u/h)`);
    }

    if (stage.activeQueue > 80) {
      rootCauses.push(`Backlog accumulation: ${stage.activeQueue} orders currently stuck in queue`);
    }

    if (stage.id === 'pick' && stage.activeQueue > 50) {
      rootCauses.push('Zone congestion: High pick density in Aisle 4 causing transit delays');
    }
    if (stage.id === 'pack' && stage.workers < 5) {
      rootCauses.push('Packaging material depletion: Station 3 paused for roll replenishment');
    }
    if (stage.id === 'dispatch' && utilizationRate > 85) {
      rootCauses.push('Loading dock congestion: Truck arrival delay backlog');
    }

    // fallback root cause if everything is fine but slightly warned
    if (rootCauses.length === 0 && status !== 'Optimal') {
      rootCauses.push(`Temporary queue buildup due to transient surge in orders`);
    }

    // Recommendation logic
    let action = '';
    let impact = '';
    let actionType: 'allocate_workers' | 'maintenance' | 'reroute' = 'allocate_workers';
    let suggestedWorkers = 0;

    if (stage.workers < 6 && (status === 'Critical' || status === 'Warning')) {
      suggestedWorkers = Math.max(2, Math.round((stage.throughput / 55) - stage.workers));
      if (suggestedWorkers < 1) suggestedWorkers = 2;
      action = `Reallocate ${suggestedWorkers} idle workers from lower queue zones to ${stage.name}`;
      impact = `Reduce queue time by ${Math.round(projectedQueueTime * 0.6)}m and lower delay risk to < 20%`;
      actionType = 'allocate_workers';
    } else if (stage.id === 'dispatch' && status !== 'Optimal') {
      action = 'Reroute ready packages to auxiliary Loading Dock C';
      impact = 'Bypass dock blockage, saving 15-20 min in loading queue delays';
      actionType = 'reroute';
    } else {
      action = `Recalibrate conveyor speed and balance station sorting bins`;
      impact = 'Increase process throughput baseline by 10-15%';
      actionType = 'maintenance';
    }

    return {
      stageId: stage.id,
      name: stage.name,
      utilizationRate,
      delayProbability,
      projectedQueueTime,
      status,
      rootCauses,
      recommendation: {
        action,
        impact,
        actionType,
        suggestedWorkers: suggestedWorkers > 0 ? suggestedWorkers : undefined
      }
    };
  });
}
