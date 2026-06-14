import React, { useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { MetricCard } from '../../components/common/MetricCard';
import { Card } from '../../components/ui/Card';
import {
  DollarSign, ShieldAlert, Award, FileSpreadsheet, Sparkles,
  TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Globe
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { getHealthStatus } from '../../engine/healthScore';

function HealthRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <span className="absolute text-[10px] font-mono font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const { warehouses, theme } = useWarehouseStore();
  const isLight = theme === 'light';

  const totalMonthlySavings = warehouses.reduce((sum, wh) => {
    const weekSavings = wh.dailyThroughputTrend.reduce((acc, t) => acc + t.savings, 0);
    return sum + weekSavings * 4;
  }, 0);

  const allWorkers = warehouses.flatMap(w => w.workers);
  const avgLaborEfficiency = Math.round(
    allWorkers.reduce((sum, w) => sum + w.utilization, 0) / (allWorkers.length || 1)
  );

  const activeAlertsCount = warehouses.flatMap(w => w.alerts.filter(a => !a.isDismissed)).length;
  const highestRisk = activeAlertsCount > 3 ? 'High' : activeAlertsCount > 1 ? 'Medium' : 'Low';

  const totalOpportunity = warehouses.reduce((sum, wh) => {
    const outputs = useWarehouseStore.getState().getEngineOutputs(wh.id);
    return sum + outputs.slotting.recommendations.reduce((acc, r) => acc + r.laborSavings, 0);
  }, 0);

  // Aggregated trend
  const aggregateTrend = warehouses[0].dailyThroughputTrend.map((t, idx) => ({
    date: t.date,
    throughput: warehouses.reduce((sum, wh) => sum + (wh.dailyThroughputTrend[idx]?.throughput || 0), 0),
    capacity: warehouses.reduce((sum, wh) => sum + (wh.dailyThroughputTrend[idx]?.capacity || 0), 0),
    savings: warehouses.reduce((sum, wh) => sum + (wh.dailyThroughputTrend[idx]?.savings || 0), 0),
  }));

  const rankings = [...warehouses].sort((a, b) => b.health.overall - a.health.overall);

  // Radar data — network-level health metrics
  const radarData = [
    { metric: 'Efficiency', value: Math.round(warehouses.reduce((s, w) => s + w.health.efficiency, 0) / warehouses.length) },
    { metric: 'Space', value: Math.round(warehouses.reduce((s, w) => s + w.health.space, 0) / warehouses.length) },
    { metric: 'Labor', value: Math.round(warehouses.reduce((s, w) => s + w.health.laborScore, 0) / warehouses.length) },
    { metric: 'Safety', value: Math.round(100 - warehouses.reduce((s, w) => s + w.health.delayRisk, 0) / warehouses.length) },
    { metric: 'Demand', value: Math.round(100 - warehouses.reduce((s, w) => s + w.health.demandRisk, 0) / warehouses.length) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Title */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            <Globe className="h-3 w-3 text-primary-accent" />
            <span>Company Portal / Executive Dashboard</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-theme-primary">Executive Operations Command</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Enterprise ROI monitoring · cross-node network optimization · AI executive summary</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
          <Activity className="h-3 w-3 text-primary-accent" />
          <span>Network: {warehouses.length} Nodes · {activeAlertsCount} Incidents</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Est. Monthly Savings"
          value={`$${totalMonthlySavings.toLocaleString()}`}
          change="+12.4%"
          trend="up"
          subtext="vs last month"
          icon={<DollarSign className="h-5 w-5" />}
          statusColor="success"
        />
        <MetricCard
          label="Labor Efficiency"
          value={`${avgLaborEfficiency}%`}
          change="+3.1%"
          trend="up"
          subtext="active utilization"
          icon={<Award className="h-5 w-5" />}
          statusColor="primary"
        />
        <MetricCard
          label="Network Threat Level"
          value={highestRisk}
          change={activeAlertsCount}
          trend={activeAlertsCount > 2 ? 'down' : 'neutral'}
          subtext="active bottlenecks"
          icon={<ShieldAlert className="h-5 w-5" />}
          statusColor={highestRisk === 'High' ? 'danger' : highestRisk === 'Medium' ? 'warning' : 'success'}
        />
        <MetricCard
          label="Optimization Opportunity"
          value={`$${totalOpportunity.toLocaleString()}/mo`}
          change={`${warehouses.reduce((sum, wh) => sum + useWarehouseStore.getState().getEngineOutputs(wh.id).slotting.recommendations.length, 0)} actions`}
          trend="neutral"
          subtext="pending slot adjustments"
          icon={<FileSpreadsheet className="h-5 w-5" />}
          statusColor="warning"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Area Chart — Network Throughput (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold tracking-wider text-theme-primary uppercase font-mono">Network Throughput Profile</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Aggregated order processing vs active capacity limits</p>
              </div>
              <div className="flex items-center space-x-3 text-[9px] font-mono">
                <span className="flex items-center space-x-1.5"><span className="h-2 w-4 bg-primary-accent rounded inline-block" /><span className="text-slate-500 dark:text-slate-400">Volume</span></span>
                <span className="flex items-center space-x-1.5"><span className="h-[1px] w-4 border-t-2 border-dashed border-secondary-accent inline-block" /><span className="text-slate-500 dark:text-slate-400">Cap</span></span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aggregateTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="execThroughput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="execCapacity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)'} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" />
                  <Tooltip
                    contentStyle={{ backgroundColor: isLight ? '#FFFFFF' : '#0F172A', borderColor: isLight ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)', color: isLight ? '#0F172A' : '#F8FAFC', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                  />
                  <Area type="monotone" dataKey="throughput" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#execThroughput)" name="Throughput" />
                  <Area type="monotone" dataKey="capacity" stroke="#06B6D4" strokeWidth={1.5} strokeDasharray="5 4" fillOpacity={1} fill="url(#execCapacity)" name="Capacity" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Radar Chart — Multi-Dim Health (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col">
            <div className="mb-2">
              <h4 className="text-xs font-bold tracking-wider text-theme-primary uppercase font-mono">Network Health Radar</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Aggregated cross-node performance indices</p>
            </div>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke={isLight ? 'rgba(59,130,246,0.20)' : 'rgba(255,255,255,0.08)'} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: isLight ? '#374151' : '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Network"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Warehouse Rankings + Alert Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Rankings (7 cols) */}
        <div className="lg:col-span-7">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold tracking-wider text-theme-primary uppercase font-mono">Warehouse Health Rankings</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Performance ranking by composite operational index</p>
              </div>
              <TrendingUp className="h-4 w-4 text-primary-accent" />
            </div>
            <div className="space-y-3">
              {rankings.map((wh, index) => {
                const healthInfo = getHealthStatus(wh.health.overall);
                const weekSavings = wh.dailyThroughputTrend.reduce((acc, t) => acc + t.savings, 0);
                const isPositive = weekSavings > 0;
                return (
                  <div
                    key={wh.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-900 flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-800 transition"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">#{index + 1}</span>
                      <HealthRing score={wh.health.overall} size={44} />
                      <div>
                        <p className="text-sm font-bold text-theme-primary">{wh.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{wh.region} · {wh.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right shrink-0">
                      <div>
                        <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 uppercase block">Weekly Savings</span>
                        <span className={`text-xs font-bold font-mono flex items-center justify-end space-x-0.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          <span>${Math.abs(weekSavings).toLocaleString()}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 uppercase block">Status</span>
                        <span className={`text-[10px] font-bold font-mono ${healthInfo.color}`}>{healthInfo.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Col: AI Summary + Alert Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">

          {/* AI Executive Summary */}
          <Card className="border border-primary-accent/15 gradient-blue-glow">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-1.5 rounded-lg bg-primary-accent/10 border border-primary-accent/20 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary-accent" />
              </div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase font-mono text-primary-accent">Executive AI Summary</h4>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Network operating at <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{avgLaborEfficiency}% workforce utilization</span>.
              Fulfillment delays at <span className="text-rose-600 dark:text-rose-400 font-semibold">Chicago Central (WH-03)</span> are generating SLA risks
              due to picker gridlock in Aisle 4. Executing pending slot relocations at Seattle East can recapture
              <span className="text-amber-600 dark:text-amber-400 font-semibold"> $3,200/mo</span> in labor overhead.
              Tomorrow's packaging demand is projected to surge — pre-deploy staffing at Austin South recommended.
            </p>
          </Card>

          {/* Network Status Feed */}
          <Card>
            <h4 className="text-[10px] font-bold tracking-wider text-theme-secondary font-mono uppercase mb-3">Network Incident Feed</h4>
            <div className="space-y-2 text-[10px] font-mono">
              {[
                ...warehouses.flatMap(wh =>
                  wh.alerts.map(alert => ({
                    ...alert,
                    whName: wh.name,
                    whId: wh.id,
                  }))
                )
              ].sort((a, b) => {
                if (!a.isDismissed && b.isDismissed) return -1;
                if (a.isDismissed && !b.isDismissed) return 1;
                return 0;
              }).map((alert, idx) => {
                if (alert.isDismissed) {
                  return (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg border bg-emerald-500/5 border-emerald-500/15 text-emerald-600 dark:text-emerald-450">
                      <span className="truncate flex-1 line-through opacity-75">[{alert.whId}] {alert.title}</span>
                      <span className="ml-2 shrink-0 uppercase font-bold text-[9px] flex items-center gap-1">
                        ✓ SOLVED {alert.resolvedBy === 'warehouse' ? 'BY WH' : 'BY HQ'}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={idx} className={`flex justify-between items-center p-2.5 rounded-lg border ${
                    alert.severity === 'high'
                      ? 'bg-rose-500/5 border-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-450'
                  }`}>
                    <span className="truncate flex-1">[{alert.whId}] {alert.title}</span>
                    <span className="ml-2 shrink-0 uppercase font-bold text-[9px]">
                      {alert.severity === 'high' ? 'CRITICAL' : 'WARNING'}
                    </span>
                  </div>
                );
              })}
              {warehouses.flatMap(wh => wh.alerts).length === 0 && (
                <div className="py-4 text-center text-slate-600 dark:text-slate-400 text-[10px]">
                  No incidents recorded in the system.
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>

    </div>
  );
}
