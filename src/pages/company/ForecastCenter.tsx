import React from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { TrendingUp, AlertTriangle, Clock, Activity, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateForecasts } from '../../engine/forecastEngine';

export default function ForecastCenter() {
  const { selectedWarehouseId, warehouses } = useWarehouseStore();
  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];

  // Run forecast engine for active warehouse
  // Base demand multiplier comes from warehouse properties, assume 1.25 base
  const forecastData = generateForecasts(1.25, 'none');

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'High':
        return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'Medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-theme-primary font-mono uppercase font-sans">Predictive Demand Forecast Center</h2>
        <p className="text-sm text-slate-400">Machine learning hourly demand simulations and pipeline congestion warnings</p>
      </div>

      {/* Forecast Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Risk Badge */}
        <Card className="flex items-center space-x-4">
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <AlertTriangle className="h-5 w-5 text-warning-accent" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Tomorrow Risk Profile</span>
            <span className={`text-sm font-bold font-mono px-2 py-0.5 border rounded uppercase ${getRiskBadge(forecastData.overallRisk)}`}>
              {forecastData.overallRisk} RISK
            </span>
          </div>
        </Card>

        {/* Volume shift */}
        <Card className="flex items-center space-x-4">
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <TrendingUp className="h-5 w-5 text-primary-accent" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Projected Volume Shift</span>
            <span className="text-sm font-bold text-theme-primary font-mono">
              +{forecastData.projectedVolumeIncreasePercent}% Units
            </span>
          </div>
        </Card>

        {/* Peak Hour */}
        <Card className="flex items-center space-x-4">
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <Clock className="h-5 w-5 text-secondary-accent" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Peak Hourly Load</span>
            <span className="text-sm font-bold text-theme-primary font-mono">
              {forecastData.peakHour} PM Peak
            </span>
          </div>
        </Card>

        {/* Expected Bottleneck */}
        <Card className="flex items-center space-x-4">
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <Activity className="h-5 w-5 text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Primary Bottleneck</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono uppercase">
              {forecastData.likelyBottleneckStage} Stage
            </span>
          </div>
        </Card>

      </div>

      {/* Hourly Trend Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold font-mono text-theme-primary uppercase tracking-widest">Hourly Demand Simulation</h4>
                <p className="text-[11px] text-slate-500">Projected incoming orders compared to physical capacity limit</p>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-950 px-2 py-1 border border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-400 rounded">
                Target: {forecastData.targetDate}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData.hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={10} className="font-mono" />
                  <YAxis stroke="#64748B" fontSize={10} className="font-mono" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', color: '#F8FAFC' }}
                    labelClassName="text-slate-400 font-mono"
                  />
                  <Line type="monotone" dataKey="projectedOrders" stroke="#3B82F6" strokeWidth={2.5} activeDot={{ r: 5 }} name="Projected Orders" />
                  <Line type="monotone" dataKey="capacityLimit" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Safety Limit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Predictive analysis sidebar text */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold font-mono text-theme-primary uppercase tracking-widest mb-3">ML DELAY COEFFICIENTS</h4>
              <p className="text-xs text-theme-secondary leading-relaxed font-sans mb-4">
                The forecasting engine predicts a high probability of bottlenecking during the 14:00 shift. 
                Incoming order rates are simulated to exceed standard Pick Station processing limits by 
                14 units/hour.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-900 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Peak Queue Congestion:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">85% probability</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pick Station Backlog:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">+28 orders</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SLA Breach Warning:</span>
                <span className="text-theme-primary font-bold">None projected</span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Category Forecasts Table */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xs font-bold font-mono text-theme-primary uppercase tracking-widest">Inventory Category Projections</h4>
          <span className="text-[10px] text-slate-500 font-mono">Weekly aggregate totals</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-900 text-slate-500">
                <th className="pb-3 font-semibold">PRODUCT CATEGORY</th>
                <th className="pb-3 font-semibold text-right">CURRENT WEEK (UNITS)</th>
                <th className="pb-3 font-semibold text-right">FORECAST WEEK (UNITS)</th>
                <th className="pb-3 font-semibold text-right">GROWTH RATE</th>
                <th className="pb-3 font-semibold text-right">CONFIDENCE VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-900/60 text-theme-secondary">
              {forecastData.categoryForecasts.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/25">
                  <td className="py-3.5 font-bold text-theme-primary">{cat.category}</td>
                  <td className="py-3.5 text-right">{cat.currentWeekUnits.toLocaleString()}</td>
                  <td className="py-3.5 text-right font-bold text-theme-primary">{cat.projectedWeekUnits.toLocaleString()}</td>
                  <td className="py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">+{cat.growthPercent}%</td>
                  <td className="py-3.5 text-right">
                    <span className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded">
                      {cat.confidenceScore}% Acc
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
