import React from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/common/MetricCard';
import { Clock, TrendingUp, AlertTriangle, HelpCircle, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateForecasts } from '../../engine/forecastEngine';

export default function DemandIntelligence() {
  const { selectedWarehouseId, warehouses } = useWarehouseStore();
  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];

  const forecastData = generateForecasts(1.25, 'none');

  // Hardcode safety replenishment requirements for mockup items
  const replenishmentSKUs = [
    { sku: 'SKU-8829', name: 'Acoustic Soundproofing Foam', currentStock: 45, minSafety: 100, suggestedReplenish: 120, status: 'Urgent' },
    { sku: 'SKU-4022', name: 'USB-C Charging Dock (Dual)', currentStock: 18, minSafety: 50, suggestedReplenish: 80, status: 'Urgent' },
    { sku: 'SKU-9021', name: 'Cat 6 Ethernet Cable 100ft', currentStock: 68, minSafety: 60, suggestedReplenish: 50, status: 'Stable' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono uppercase font-sans">Demand Forecasting Intelligence</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Hourly load profile modeling and safety stock replenishment warnings</p>
      </div>

      {/* Demand summary grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Forecast Peak hour"
          value={forecastData.peakHour}
          change="+18% surge"
          trend="up"
          subtext="expected at 2:00 PM"
          icon={<Clock className="h-5 w-5" />}
          statusColor="warning"
        />
        <MetricCard
          label="Next-Day Units Volume"
          value="2,850 Units"
          change="+15%"
          trend="up"
          subtext="vs 7-day average"
          icon={<TrendingUp className="h-5 w-5" />}
          statusColor="primary"
        />
        <MetricCard
          label="Likely Bottleneck Area"
          value={forecastData.likelyBottleneckStage.toUpperCase()}
          change="High Risk"
          trend="neutral"
          subtext="based on packing load"
          icon={<AlertTriangle className="h-5 w-5" />}
          statusColor="danger"
        />
      </div>

      {/* Demand Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-650 dark:text-slate-400 uppercase tracking-widest">Simulated Hourly Inflow Load</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Projected incoming workload spikes for the next 24 hours</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={10} className="font-mono" />
                  <YAxis stroke="#64748B" fontSize={10} className="font-mono" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', color: '#F8FAFC' }}
                    labelClassName="text-slate-400 font-mono"
                  />
                  <Area type="monotone" dataKey="projectedOrders" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#glowColor)" name="Projected Orders" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Category Weekly stats summary */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold font-mono text-slate-650 dark:text-slate-400 uppercase tracking-widest mb-3">WEEKLY VOLUMETRIC CHANGES</h4>
              <div className="space-y-3 font-mono text-xs">
                {forecastData.categoryForecasts.map((cat, idx) => (
                  <div key={idx} className="flex justify-between border-b border-slate-200 dark:border-slate-900 pb-2">
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{cat.category}:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{cat.growthPercent}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-200 dark:border-slate-900 mt-4 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Projections run hourly on past 30-day moving sequences.
            </div>
          </Card>
        </div>

      </div>

      {/* Replenishment alerts table */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-650 dark:text-slate-400 uppercase tracking-widest">Inventory Replenishment Warnings</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Items below recommended safety limits based on 7-day velocity forecasts</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-900 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">SKU</th>
                <th className="pb-3 font-semibold">ITEM DESCRIPTION</th>
                <th className="pb-3 font-semibold text-right">CURRENT STOCK</th>
                <th className="pb-3 font-semibold text-right">MIN SAFETY LIMIT</th>
                <th className="pb-3 font-semibold text-right font-bold text-primary-accent">SUGGESTED REPLENISH</th>
                <th className="pb-3 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-900/60 text-theme-secondary">
              {replenishmentSKUs.map((item) => (
                <tr key={item.sku} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/25 transition">
                  <td className="py-3 font-bold text-slate-800 dark:text-white">{item.sku}</td>
                  <td className="py-3">{item.name}</td>
                  <td className="py-3 text-right">{item.currentStock} units</td>
                  <td className="py-3 text-right">{item.minSafety} units</td>
                  <td className="py-3 text-right font-bold text-primary-accent">+{item.suggestedReplenish} units</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                      item.status === 'Urgent'
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                        : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/20'
                    }`}>
                      {item.status}
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
