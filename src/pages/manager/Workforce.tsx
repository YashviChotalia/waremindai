import React, { useState } from 'react';
import { useWarehouseStore, WorkerInfo } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/common/MetricCard';
import {
  Users, UserCheck, Award, Clock, TrendingUp,
  Activity, Zap, BarChart2, Filter
} from 'lucide-react';

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Picker:     { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
  Packer:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Receiver:   { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20' },
  Dispatcher: { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
  Supervisor: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
};

const STAGE_LABELS: Record<string, string> = {
  receive: 'Receiving',
  pick: 'Picking',
  pack: 'Packing',
  dispatch: 'Dispatch',
};

function UtilizationRing({ value }: { value: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const color = value >= 90 ? '#EF4444' : value >= 75 ? '#F59E0B' : '#10B981';

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 4px ${color}66)` }}
        />
      </svg>
      <span className="absolute text-[9px] font-mono font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function WorkerCard({ worker }: { worker: WorkerInfo }) {
  const roleStyle = ROLE_COLORS[worker.role] || ROLE_COLORS.Picker;
  const isOverloaded = worker.utilization >= 90;
  const isIdle = worker.utilization < 60;

  return (
    <div className={`p-4 rounded-xl border glass-card flex items-center gap-4 transition-all group hover:translate-y-[-2px] ${
      isOverloaded ? 'border-rose-500/20' : isIdle ? 'border-slate-800/40' : 'border-slate-800/60'
    }`}>

      {/* Avatar ring */}
      <UtilizationRing value={worker.utilization} />

      {/* Worker Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-0.5">
          <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{worker.name}</span>
          {isOverloaded && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />}
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
            {worker.role}
          </span>
          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
            → {STAGE_LABELS[worker.currentStage] || worker.currentStage}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right shrink-0">
        <div>
          <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Tasks</span>
          <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{worker.completedTasks}</span>
        </div>
        <div>
          <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 block uppercase">Idle</span>
          <span className={`text-xs font-bold font-mono ${worker.idleMinutes > 20 ? 'text-amber-400' : 'text-slate-800 dark:text-white'}`}>
            {worker.idleMinutes}m
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Workforce() {
  const { selectedWarehouseId, warehouses } = useWarehouseStore();
  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];
  const workers = activeWh.workers;

  const [filterRole, setFilterRole] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'utilization' | 'tasks' | 'idle'>('utilization');

  const roles = ['All', ...Array.from(new Set(workers.map(w => w.role)))];

  const filteredWorkers = [...workers]
    .filter(w => filterRole === 'All' || w.role === filterRole)
    .sort((a, b) => {
      if (sortBy === 'utilization') return b.utilization - a.utilization;
      if (sortBy === 'tasks') return b.completedTasks - a.completedTasks;
      if (sortBy === 'idle') return b.idleMinutes - a.idleMinutes;
      return 0;
    });

  const avgUtilization = Math.round(workers.reduce((sum, w) => sum + w.utilization, 0) / workers.length);
  const totalTasks = workers.reduce((sum, w) => sum + w.completedTasks, 0);
  const overloadedCount = workers.filter(w => w.utilization >= 90).length;
  const idleCount = workers.filter(w => w.idleMinutes > 15).length;

  // Role distribution for the mini chart
  const roleGroups = roles.filter(r => r !== 'All').map(role => ({
    role,
    count: workers.filter(w => w.role === role).length,
    avgUtil: Math.round(workers.filter(w => w.role === role).reduce((s, w) => s + w.utilization, 0) /
      (workers.filter(w => w.role === role).length || 1)),
  }));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
          <Users className="h-3 w-3 text-primary-accent" />
          <span>Warehouse Manager / Workforce Hub</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{activeWh.name} — Workforce</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Staff performance telemetry · utilization analytics · shift optimization</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Workers"
          value={workers.length}
          change={`${overloadedCount} overloaded`}
          trend={overloadedCount > 0 ? 'down' : 'up'}
          subtext="total on shift"
          icon={<Users className="h-5 w-5" />}
          statusColor="primary"
        />
        <MetricCard
          label="Avg Utilization"
          value={`${avgUtilization}%`}
          change={avgUtilization > 85 ? '+3%' : '-1%'}
          trend={avgUtilization > 85 ? 'up' : 'down'}
          subtext="workforce efficiency"
          icon={<Activity className="h-5 w-5" />}
          statusColor={avgUtilization > 90 ? 'danger' : avgUtilization > 75 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Tasks Completed"
          value={totalTasks.toLocaleString()}
          change="+18"
          trend="up"
          subtext="this shift"
          icon={<Award className="h-5 w-5" />}
          statusColor="success"
        />
        <MetricCard
          label="Idle Workers"
          value={idleCount}
          change={idleCount > 2 ? 'Rebalance' : 'Optimal'}
          trend={idleCount > 2 ? 'down' : 'neutral'}
          subtext={`>${15}m idle time`}
          icon={<Clock className="h-5 w-5" />}
          statusColor={idleCount > 2 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Worker Cards List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">

          {/* Filter + Sort bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl">
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-mono">
              <Filter className="h-3 w-3" />
              <span>FILTER:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-full border transition ${
                    filterRole === role
                       ? 'bg-primary-accent/15 text-primary-accent border-primary-accent/30'
                       : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">SORT:</span>
              {(['utilization', 'tasks', 'idle'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                   className={`px-2 py-1 text-[9px] font-mono rounded border transition capitalize ${
                    sortBy === opt
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-900 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredWorkers.map((worker, idx) => (
              <div key={worker.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                <WorkerCard worker={worker} />
              </div>
            ))}
            {filteredWorkers.length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-mono border border-slate-200 dark:border-slate-900 rounded-xl">
                No workers match this filter.
              </div>
            )}
          </div>
        </div>

        {/* Right: Analytics Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Role Distribution */}
          <Card>
            <div className="flex items-center space-x-2 mb-4">
              <BarChart2 className="h-4 w-4 text-secondary-accent" />
              <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest">Role Breakdown</h4>
            </div>
            <div className="space-y-3">
              {roleGroups.map(({ role, count, avgUtil }) => {
                const style = ROLE_COLORS[role] || ROLE_COLORS.Picker;
                return (
                  <div key={role} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] border font-bold uppercase ${style.bg} ${style.text} ${style.border}`}>
                          {role}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">{count} workers</span>
                      </div>
                      <span className={`font-bold ${avgUtil > 88 ? 'text-rose-400' : avgUtil > 74 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {avgUtil}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${avgUtil}%`,
                          background: avgUtil > 88 ? '#EF4444' : avgUtil > 74 ? '#F59E0B' : '#10B981',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Performers */}
          <Card>
            <div className="flex items-center space-x-2 mb-4">
              <Award className="h-4 w-4 text-warning-accent" />
              <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest">Top Performers</h4>
            </div>
            <div className="space-y-2.5">
              {[...workers]
                .sort((a, b) => b.completedTasks - a.completedTasks)
                .slice(0, 4)
                .map((w, i) => {
                  const style = ROLE_COLORS[w.role] || ROLE_COLORS.Picker;
                  return (
                    <div key={w.id} className="flex items-center space-x-3 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900">
                      <span className="text-[10px] font-mono font-bold text-slate-600">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{w.name}</p>
                        <span className={`text-[8px] font-mono font-bold ${style.text}`}>{w.role}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-white">{w.completedTasks}</span>
                        <span className="text-[8px] text-slate-500 dark:text-slate-400 font-mono block">tasks</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          {/* AI Shift Suggestion */}
          <Card className="border border-primary-accent/15 gradient-blue-glow">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-primary-accent" />
              <h4 className="text-[10px] font-mono font-bold text-primary-accent uppercase tracking-widest">AI Shift Suggestion</h4>
            </div>
            <p className="text-[11px] text-slate-300 dark:text-slate-400 leading-relaxed">
              {overloadedCount > 0
                ? `${overloadedCount} worker(s) operating at ≥90% utilization. Consider adding 1–2 workers to the most congested stage to reduce burnout risk.`
                : idleCount > 1
                ? `${idleCount} workers have been idle for 15+ minutes. Reassign to Pack or Dispatch stages to improve throughput balance.`
                : 'Workforce is balanced and operating within optimal parameters. No reallocation needed at this time.'}
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
}
