export interface SKUInfo {
  sku: string;
  name: string;
  currentZone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D'; // Zone A is closest to Dispatch, D is furthest
  pickFrequency: number; // picks per day
  itemVelocity: 'High' | 'Medium' | 'Low';
  sizePercent: number; // SKU space footprint
}

export interface SlottingRecommendation {
  id: string;
  sku: string;
  name: string;
  currentZone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D';
  targetZone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D';
  expectedGain: number; // percentage (e.g. 18)
  laborSavings: number; // dollars saved per month (e.g. 450)
  difficulty: 'Low' | 'Medium' | 'High';
  reason: string;
}

/**
 * Calculates current space utilization stats and recommends optimal slotting moves.
 * Moves high-frequency SKUs closer to Dispatch (Zone A) and low-frequency ones further out.
 */
export function analyzeSlotting(skus: SKUInfo[]): {
  spaceUtilizationPercent: number;
  deadSpacePercent: number;
  recommendations: SlottingRecommendation[];
} {
  // Total size sum
  const totalUsedSize = skus.reduce((sum, item) => sum + item.sizePercent, 0);
  // Assume physical limit is 85% of total capacity for active safety guidelines
  const spaceUtilizationPercent = Math.min(100, Math.round(totalUsedSize));
  
  // Dead space is defined as space allocated to items that haven't been picked or have very low frequency in premium zones
  let deadSpace = 0;
  skus.forEach(item => {
    if (item.currentZone === 'Zone A' && item.pickFrequency < 10) {
      deadSpace += item.sizePercent;
    } else if (item.currentZone === 'Zone B' && item.pickFrequency < 5) {
      deadSpace += item.sizePercent * 0.5;
    }
  });
  
  const deadSpacePercent = Math.min(spaceUtilizationPercent, Math.round(deadSpace));

  // Generate recommendations
  const recommendations: SlottingRecommendation[] = [];
  
  // High pick frequency items in Zone D or C should be moved to Zone A or B
  // Low pick frequency items in Zone A should be swapped out to Zone D
  const highFrequencyFar = skus.filter(item => 
    item.pickFrequency >= 120 && 
    (item.currentZone === 'Zone C' || item.currentZone === 'Zone D')
  );

  const lowFrequencyClose = skus.filter(item => 
    item.pickFrequency <= 20 && 
    (item.currentZone === 'Zone A' || item.currentZone === 'Zone B')
  );

  highFrequencyFar.forEach((hItem, idx) => {
    const targetZone = 'Zone A';
    // Find a potential swappable item in Zone A
    const swapItem = lowFrequencyClose[idx];
    const targetLabel = swapItem ? `swap with ${swapItem.sku} in ${targetZone}` : `move to vacant slot in ${targetZone}`;

    // Expected gain is proportional to frequency diff and zone distance
    const distanceDiff = hItem.currentZone === 'Zone D' ? 3 : 2;
    const expectedGain = Math.round(distanceDiff * 6.5 + (hItem.pickFrequency / 30));
    const laborSavings = Math.round(expectedGain * 32);

    recommendations.push({
      id: `slot-rec-${hItem.sku}`,
      sku: hItem.sku,
      name: hItem.name,
      currentZone: hItem.currentZone,
      targetZone: targetZone,
      expectedGain,
      laborSavings,
      difficulty: distanceDiff > 2 ? 'Medium' : 'Low',
      reason: `High velocity item (${hItem.pickFrequency} picks/day) sitting in far ${hItem.currentZone}. Swapping reduces picker travel time.`
    });
  });

  // Add individual low frequency items that need to go to D to free up space
  lowFrequencyClose.forEach((lItem, idx) => {
    // only if we didn't use it in highFrequency swaps
    if (idx >= highFrequencyFar.length) {
      const expectedGain = Math.round(8 + (20 - lItem.pickFrequency) * 0.5);
      const laborSavings = Math.round(expectedGain * 15);
      recommendations.push({
        id: `slot-rec-${lItem.sku}`,
        sku: lItem.sku,
        name: lItem.name,
        currentZone: lItem.currentZone,
        targetZone: 'Zone D',
        expectedGain,
        laborSavings,
        difficulty: 'Low',
        reason: `Slow moving item (${lItem.pickFrequency} picks/day) is taking up premium space in ${lItem.currentZone}. Move to storage Zone D.`
      });
    }
  });

  return {
    spaceUtilizationPercent,
    deadSpacePercent,
    recommendations: recommendations.sort((a, b) => b.expectedGain - a.expectedGain)
  };
}
