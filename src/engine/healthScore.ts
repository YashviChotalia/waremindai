export interface HealthScores {
  overall: number;
  efficiency: number;
  space: number;
  delayRisk: number;
  demandRisk: number;
  laborScore: number;
}

/**
 * Calculates overall and category health scores for a warehouse.
 * Formula: Health = 0.3 * Efficiency + 0.2 * Space + 0.2 * (100 - DelayRisk) + 0.15 * (100 - DemandRisk) + 0.15 * LaborScore
 */
export function calculateHealthScore(
  efficiency: number,
  spaceUtilization: number,
  delayRisk: number,
  demandRisk: number,
  laborScore: number
): HealthScores {
  // Clamp values between 0 and 100
  const eff = Math.min(100, Math.max(0, efficiency));
  const space = Math.min(100, Math.max(0, spaceUtilization));
  const delay = Math.min(100, Math.max(0, delayRisk));
  const demand = Math.min(100, Math.max(0, demandRisk));
  const labor = Math.min(100, Math.max(0, laborScore));

  const overall = Math.round(
    0.3 * eff +
    0.2 * space +
    0.2 * (100 - delay) +
    0.15 * (100 - demand) +
    0.15 * labor
  );

  return {
    overall,
    efficiency: eff,
    space: space,
    delayRisk: delay,
    demandRisk: demand,
    laborScore: labor
  };
}

export function getHealthStatus(score: number): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  if (score >= 90) {
    return {
      label: 'Optimal',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    };
  } else if (score >= 75) {
    return {
      label: 'Stable',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    };
  } else if (score >= 60) {
    return {
      label: 'Warning',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    };
  } else {
    return {
      label: 'Critical',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
    };
  }
}
