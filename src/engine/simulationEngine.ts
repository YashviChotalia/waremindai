export interface SimulationInput {
  incomingOrdersMultiplier: number; // 0.5 to 3.0
  workerCount: number;             // 10 to 100
  equipmentFailureFlag: boolean;     // conveyer belt error or forklift breakdown
  activePreset: 'none' | 'flash_sale' | 'worker_shortage' | 'layout_change';
}

export interface SimulationResult {
  throughputPerHour: number;
  expectedDelayMinutes: number;
  bottleneckProbability: number;
  operationalSavings: number;
  status: 'Optimal' | 'Degraded' | 'Critical';
  bottleneckZone: 'Receive' | 'Pick' | 'Pack' | 'Dispatch' | 'None';
  reportSummary: string;
}

/**
 * Runs the simulation model based on input overrides.
 */
export function runSimulation(input: SimulationInput, currentThroughput: number): SimulationResult {
  const baseOrderLoad = 250 * input.incomingOrdersMultiplier;
  
  // Calculate potential processing rate: each worker handles 5 units per hour average
  let workerCapacity = input.workerCount * 5.5;
  if (input.equipmentFailureFlag) {
    workerCapacity *= 0.65; // Equipment failure reduces capacity by 35%
  }

  // Projected throughput is the minimum of demand and physical worker capacity
  const projectedThroughput = Math.min(Math.round(baseOrderLoad), Math.round(workerCapacity));
  
  // Delay calculations: if demand exceeds capacity, queue expands exponentially
  const loadRatio = baseOrderLoad / Math.max(10, workerCapacity);
  
  let expectedDelay = 5; // standard base delay in minutes
  if (loadRatio > 1.0) {
    expectedDelay += Math.round((loadRatio - 1.0) * 120);
  } else if (loadRatio > 0.85) {
    expectedDelay += Math.round((loadRatio - 0.85) * 40);
  }

  if (input.equipmentFailureFlag) {
    expectedDelay += 45; // flat error overhead
  }

  // Bottleneck probability
  let bottleneckProb = Math.min(100, Math.round(loadRatio * 70));
  if (input.equipmentFailureFlag) {
    bottleneckProb = Math.min(100, bottleneckProb + 25);
  }

  // Determine status and zone
  let status: 'Optimal' | 'Degraded' | 'Critical' = 'Optimal';
  let bottleneckZone: 'Receive' | 'Pick' | 'Pack' | 'Dispatch' | 'None' = 'None';

  if (loadRatio > 1.25 || expectedDelay > 80) {
    status = 'Critical';
  } else if (loadRatio > 0.9 || expectedDelay > 30) {
    status = 'Degraded';
  }

  if (status !== 'Optimal') {
    if (input.equipmentFailureFlag) {
      bottleneckZone = 'Dispatch'; // dispatch conveyor block
    } else if (input.incomingOrdersMultiplier > 1.8) {
      bottleneckZone = 'Pack'; // packaging station overflow
    } else {
      bottleneckZone = 'Pick'; // picking lanes congested
    }
  }

  // Operational savings/losses compared to current baseline
  // baseline throughput is currentThroughput.
  // Savings can come from optimal sizing (labor reduction), or losses from delay fines
  let operationalSavings = 0;
  if (expectedDelay > 30) {
    // Delays carry SLA penalties of $150 per minute of average delay over 30
    operationalSavings = -Math.round((expectedDelay - 30) * 110);
  } else {
    // Smooth flow yields savings
    operationalSavings = Math.round((projectedThroughput - currentThroughput) * 1.5);
  }

  // Format summary report
  let reportSummary = '';
  if (status === 'Critical') {
    reportSummary = `Simulation predicts operational collapse at ${bottleneckZone} due to demand exceeding processing capability by ${Math.round((loadRatio - 1) * 100)}%. Immediate workforce reallocation is required.`;
  } else if (status === 'Degraded') {
    reportSummary = `Minor queuing detected at ${bottleneckZone}. Expected dispatch delays of ${expectedDelay} mins. Monitor picking velocities to avoid critical status.`;
  } else {
    reportSummary = `Flow is balanced. The warehouse is running at peak economic efficiency with sufficient workforce margin.`;
  }

  return {
    throughputPerHour: projectedThroughput,
    expectedDelayMinutes: expectedDelay,
    bottleneckProbability: bottleneckProb,
    operationalSavings,
    status,
    bottleneckZone,
    reportSummary
  };
}
