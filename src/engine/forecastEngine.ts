export interface ForecastHour {
  hour: string; // "08:00", "09:00", etc.
  projectedOrders: number;
  capacityLimit: number;
  riskStatus: 'Normal' | 'Elevated' | 'Critical';
}

export interface CategoryForecast {
  category: string;
  currentWeekUnits: number;
  projectedWeekUnits: number;
  growthPercent: number;
  confidenceScore: number; // 0-100
}

export interface ForecastReport {
  targetDate: string;
  overallRisk: 'Low' | 'Medium' | 'High';
  peakHour: string;
  likelyBottleneckStage: 'Receive' | 'Pick' | 'Pack' | 'Dispatch';
  projectedVolumeIncreasePercent: number;
  hourlyTrends: ForecastHour[];
  categoryForecasts: CategoryForecast[];
}

/**
 * Generates next-day forecasting analytics.
 * Modifies forecasts based on custom events (e.g. Flash Sales, Holidays).
 */
export function generateForecasts(
  baseDemandMultiplier: number, // e.g. 1.2
  activeEvent?: 'flash_sale' | 'worker_shortage' | 'layout_change' | 'none'
): ForecastReport {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Event adjustments
  let multiplier = baseDemandMultiplier;
  let eventRisk: 'Low' | 'Medium' | 'High' = 'Low';
  let forecastBottleneck: 'Receive' | 'Pick' | 'Pack' | 'Dispatch' = 'Pick';

  if (activeEvent === 'flash_sale') {
    multiplier *= 2.2;
    eventRisk = 'High';
    forecastBottleneck = 'Pack';
  } else if (activeEvent === 'worker_shortage') {
    eventRisk = 'High';
    forecastBottleneck = 'Pick';
  } else if (activeEvent === 'layout_change') {
    eventRisk = 'Medium';
    forecastBottleneck = 'Receive';
  } else if (multiplier > 1.4) {
    eventRisk = 'Medium';
  }

  // Hourly profile (typical logistics shape: high morning load, low lunch, peak afternoon 14:00-16:00, taper evening)
  const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const hourlyTrends: ForecastHour[] = hours.map(hour => {
    let baseLoad = 80;
    const hr = parseInt(hour.split(':')[0]);

    if (hr === 8 || hr === 9) baseLoad = 120;
    else if (hr === 10 || hr === 11) baseLoad = 150;
    else if (hr === 12) baseLoad = 90; // Lunch dip
    else if (hr === 13) baseLoad = 110;
    else if (hr === 14 || hr === 15) baseLoad = 220; // Peak afternoon
    else if (hr === 16 || hr === 17) baseLoad = 180;
    else baseLoad = 70; // Taper

    const projectedOrders = Math.round(baseLoad * multiplier);
    const capacityLimit = 250; // standard warehouse hourly capacity

    let riskStatus: 'Normal' | 'Elevated' | 'Critical' = 'Normal';
    if (projectedOrders >= capacityLimit) {
      riskStatus = 'Critical';
    } else if (projectedOrders > capacityLimit * 0.75) {
      riskStatus = 'Elevated';
    }

    return {
      hour,
      projectedOrders,
      capacityLimit,
      riskStatus
    };
  });

  // Find peak hour
  let peakVal = 0;
  let peakHour = '14:00';
  hourlyTrends.forEach(t => {
    if (t.projectedOrders > peakVal) {
      peakVal = t.projectedOrders;
      peakHour = t.hour;
    }
  });

  // Category Forecasts
  const categoryForecasts: CategoryForecast[] = [
    {
      category: 'Consumer Electronics',
      currentWeekUnits: 14200,
      projectedWeekUnits: Math.round(14200 * multiplier),
      growthPercent: Math.round((multiplier - 1) * 100),
      confidenceScore: Math.round(92 - (multiplier > 1.5 ? 12 : 0))
    },
    {
      category: 'Apparel & Footwear',
      currentWeekUnits: 28500,
      projectedWeekUnits: Math.round(28500 * (multiplier * 0.95)),
      growthPercent: Math.round(((multiplier * 0.95) - 1) * 100),
      confidenceScore: 89
    },
    {
      category: 'Home & Kitchen Essentials',
      currentWeekUnits: 18900,
      projectedWeekUnits: Math.round(18900 * (multiplier * 1.05)),
      growthPercent: Math.round(((multiplier * 1.05) - 1) * 100),
      confidenceScore: 94
    },
    {
      category: 'Automotive & Hardware',
      currentWeekUnits: 8300,
      projectedWeekUnits: Math.round(8300 * (1 + (multiplier - 1) * 0.4)),
      growthPercent: Math.round(((1 + (multiplier - 1) * 0.4) - 1) * 100),
      confidenceScore: 96
    }
  ];

  return {
    targetDate: dateStr,
    overallRisk: eventRisk,
    peakHour,
    likelyBottleneckStage: forecastBottleneck,
    projectedVolumeIncreasePercent: Math.round((multiplier - 1) * 100),
    hourlyTrends,
    categoryForecasts
  };
}
