import React, { useState, useEffect } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { MetricCard } from '../../components/common/MetricCard';
import { Card } from '../../components/ui/Card';
import {
  Package, Layers, CheckCircle, Clock, Sparkles,
  TrendingUp, ArrowRight, Activity, Zap, AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const STAGE_COLORS: Record<string, { stroke: string; fill: string; badge: string }> = {
  receive: { stroke: '#06B6D4', fill: '#06B6D4', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  pick: { stroke: '#3B82F6', fill: '#3B82F6', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  pack: { stroke: '#10B981', fill: '#10B981', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  dispatch: { stroke: '#8B5CF6', fill: '#8B5CF6', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
};

const LOG_MESSAGES = [
  'System: Sorting lane #1 capacity balanced.',
  'Receiving: Inbound truck carrier FedEx checked in.',
  'Picker Chen: Commencing batch #830 in Zone A.',
  'Packer Yusuf: Station #2 queue processed (8 orders).',
  'System: Conveyor belt speed recalibrated (+2%).',
  'Dispatcher Kim: Delivery van loaded successfully.',
  'System: AGV-02 recharged and re-deployed to Zone B.',
  'Receiving: 6 new pallets scanned into Dock B.',
];

function StageFlowCard({
  stage,
  stageKey,
  idx,
  isLast,
}: {
  stage: { throughput: number; capacity: number; activeQueue: number; workers: number; name: string };
  stageKey: string;
  idx: number;
  isLast: boolean;
}) {
  const colors = STAGE_COLORS[stageKey] || STAGE_COLORS.pick;
  const pct = Math.round((stage.throughput / stage.capacity) * 100);
  const isCritical = pct > 88;
  const isWarning = pct > 74 && !isCritical;

  return (
    <div className="flex items-center gap-3 flex-1">
      <div
        className={`flex-1 p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 ${isCritical
            ? 'border-rose-500/30 bg-rose-500/5'
            : isWarning
              ? 'border-amber-500/25 bg-amber-500/5'
              : 'border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30'
          }`}
        style={{ animationDelay: `${idx * 0.08}s` }}
      >
        {/* Stage Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Stage 0{idx + 1}</span>
            <h5 className="text-sm font-bold text-slate-800 dark:text-white leading-snug mt-0.5">{stage.name}</h5>
          </div>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${isCritical ? 'badge-critical' : isWarning ? 'badge-warning' : 'badge-optimal'
              }`}
          >
            {isCritical ? 'HOT' : isWarning ? 'BUSY' : 'OK'}
          </span>
        </div>

        {/* Utilization bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-mono text-slate-500 dark:text-slate-400">
            <span>Utilization</span>
            <span className="text-slate-800 dark:text-white font-bold">{pct}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${pct}%`,
                background: isCritical
                  ? 'linear-gradient(90deg,#EF4444,#F87171)'
                  : isWarning
                    ? 'linear-gradient(90deg,#F59E0B,#FCD34D)'
                    : `linear-gradient(90deg,${colors.stroke},${colors.stroke}99)`,
              }}
            />
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9px]">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Throughput</span>
            <span className="text-slate-800 dark:text-white font-bold">{stage.throughput}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Queue</span>
            <span className={`font-bold ${stage.activeQueue > 40 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
              {stage.activeQueue}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Workers</span>
            <span className="text-slate-800 dark:text-white font-bold">{stage.workers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Capacity</span>
            <span className="text-slate-800 dark:text-white font-bold">{stage.capacity}</span>
          </div>
        </div>
      </div>

      {!isLast && (
        <div className="flex flex-col items-center shrink-0">
          <ArrowRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
      )}
    </div>
  );
}

export default function Operations() {
  const { selectedWarehouseId, warehouses, dismissAlert } = useWarehouseStore();
  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];

  const totalBacklog = activeWh.stages.reduce((sum, s) => sum + s.activeQueue, 0);
  const pickStage = activeWh.stages.find(s => s.id === 'pick')!;
  const packStage = activeWh.stages.find(s => s.id === 'pack')!;
  const avgQueueTime = Math.round(
    activeWh.stages.reduce((sum, s) => {
      const uPerMin = (s.workers * 55 + 100) / 60;
      return sum + s.activeQueue / uPerMin;
    }, 0) / activeWh.stages.length
  );
  const networkEfficiency = Math.round(
    (activeWh.stages.reduce((sum, s) => sum + s.throughput, 0) /
      activeWh.stages.reduce((sum, s) => sum + s.capacity, 0)) * 100
  );

  const [logs, setLogs] = useState<{ text: string; level: 'info' | 'warn' | 'ok' }[]>([
    { text: '[10:44 AM] System: Dispatch scanner calibration success.', level: 'ok' },
    { text: '[10:40 AM] Picker Chen: Completed batch #829 (15 SKUs).', level: 'ok' },
    { text: '[10:38 AM] Receiving: 4 inbound pallets checked into Dock A.', level: 'info' },
    { text: '[10:30 AM] Sorter #3: Safety throttle applied (temp limit).', level: 'warn' },
    { text: '[10:25 AM] Picker Miller: Re-routed from aisle 4 to aisle 2.', level: 'warn' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      const level: 'info' | 'warn' | 'ok' = msg.includes('System') ? 'ok' : msg.includes('Picker') ? 'info' : 'info';
      setLogs(prev => [{ text: `[${now}] ${msg}`, level }, ...prev.slice(0, 4)]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleResolveAlert = (alertId: string, alertTitle: string) => {
    dismissAlert(activeWh.id, alertId, 'warehouse');
    
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      { text: `[${now}] Manager: Solved "${alertTitle}" incident.`, level: 'ok' },
      ...prev.slice(0, 4)
    ]);
  };

  const stageKeys = ['receive', 'pick', 'pack', 'dispatch'];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Title */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
            <Activity className="h-3 w-3 text-primary-accent" />
            <span>Warehouse Manager / Operations</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{activeWh.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Live operational telemetry · queue management · stage performance</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Live Feed Active</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Order Backlog"
          value={totalBacklog}
          change="+4"
          trend="up"
          subtext="orders in queue"
          icon={<Package className="h-5 w-5" />}
          statusColor="warning"
        />
        <MetricCard
          label="Pick Throughput"
          value={`${pickStage.throughput} u/h`}
          change="+15"
          trend="up"
          subtext="pick speed"
          icon={<TrendingUp className="h-5 w-5" />}
          statusColor="primary"
        />
        <MetricCard
          label="Pack Speed"
          value={`${packStage.throughput} u/h`}
          change="-8"
          trend="down"
          subtext="pack speed"
          icon={<CheckCircle className="h-5 w-5" />}
          statusColor="success"
        />
        <MetricCard
          label="Net Efficiency"
          value={`${networkEfficiency}%`}
          change="+1.5%"
          trend="up"
          subtext="target: 90%"
          icon={<Zap className="h-5 w-5" />}
          statusColor="primary"
        />
        <MetricCard
          label="Avg Queue Delay"
          value={`${avgQueueTime}m`}
          change="+3m"
          trend="up"
          subtext="estimated wait"
          icon={<Clock className="h-5 w-5" />}
          statusColor={avgQueueTime > 25 ? 'danger' : 'neutral'}
        />
      </div>

      {/* Stage Pipeline Flow */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest">Process Stage Pipeline</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">End-to-end fulfillment flow · real-time queue and capacity states</p>
          </div>
          <div className="flex items-center space-x-1.5 text-[9px] font-mono text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-primary-accent animate-pulse" />
            <span>LIVE TELEMETRY</span>
          </div>
        </div>

        <div className="flex items-stretch gap-0">
          {activeWh.stages.map((stage, idx) => (
            <StageFlowCard
              key={stage.id}
              stage={stage}
              stageKey={stageKeys[idx]}
              idx={idx}
              isLast={idx === activeWh.stages.length - 1}
            />
          ))}
        </div>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Chart (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-650 dark:text-slate-400 uppercase tracking-widest">Throughput Velocity — 7 Day</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Hourly processed orders vs. physical capacity limits</p>
              </div>
              <div className="flex items-center space-x-3 text-[9px] font-mono">
                <span className="flex items-center space-x-1"><span className="h-2 w-4 rounded bg-primary-accent inline-block" /><span className="text-slate-500 dark:text-slate-400">Throughput</span></span>
                <span className="flex items-center space-x-1"><span className="h-[1px] w-4 border-t-2 border-dashed border-secondary-accent inline-block" /><span className="text-slate-500 dark:text-slate-400">Capacity</span></span>
              </div>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeWh.dailyThroughputTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="opsThroughput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="opsCapacity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.08)', color: '#F8FAFC', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                  />
                  <Area type="monotone" dataKey="throughput" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#opsThroughput)" name="Throughput" />
                  <Area type="monotone" dataKey="capacity" stroke="#06B6D4" strokeWidth={1.5} strokeDasharray="5 4" fillOpacity={1} fill="url(#opsCapacity)" name="Limit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Live Telemetry Log */}
          <Card>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest">Live Telemetry Logs</h4>
              <div className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400 uppercase">Streaming</span>
              </div>
            </div>
            <div className="space-y-1.5 font-mono text-[10px]">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center space-x-2 transition-all duration-500 ${idx === 0 ? 'animate-fade-in' : ''
                    } ${log.level === 'warn'
                      ? 'bg-amber-500/5 border-amber-500/15 text-amber-700 dark:text-amber-300'
                      : log.level === 'ok'
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900/80 text-slate-700 dark:text-slate-400'
                    }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${log.level === 'warn' ? 'bg-amber-400' : log.level === 'ok' ? 'bg-emerald-400' : 'bg-slate-500'
                    }`} />
                  <span className="truncate">{log.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Timeline (4 cols) */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col">
            <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-5">Event Chronology</h4>

            <div className="relative border-l border-slate-300 dark:border-slate-800 pl-5 space-y-6 flex-1">
              {[
                ...activeWh.alerts.map(alt => ({
                  id: alt.id,
                  isDynamic: true,
                  time: alt.timestamp,
                  title: alt.title,
                  desc: alt.description,
                  severity: alt.severity as 'low' | 'medium' | 'high' | undefined,
                  isDismissed: alt.isDismissed,
                  resolvedAt: alt.resolvedAt,
                  resolvedBy: alt.resolvedBy,
                  color: alt.isDismissed 
                    ? 'border-emerald-500' 
                    : alt.severity === 'high' 
                    ? 'border-rose-500' 
                    : 'border-amber-500',
                  textColor: alt.isDismissed
                    ? 'text-emerald-600 dark:text-emerald-450'
                    : alt.severity === 'high'
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-amber-600 dark:text-amber-450 font-bold',
                })),
                {
                  id: 'static-1',
                  isDynamic: false,
                  time: '10:00 AM',
                  title: 'Inflow Demand Spike',
                  desc: 'Amazon integration triggered batch order surge (+35%). Pick stage queues expanded significantly.',
                  color: 'border-primary-accent',
                  textColor: 'text-slate-700 dark:text-white',
                  isDismissed: false,
                  severity: undefined,
                  resolvedAt: undefined,
                  resolvedBy: undefined,
                },
                {
                  id: 'static-4',
                  isDynamic: false,
                  time: '10:44 AM',
                  title: 'System Recalibration',
                  desc: 'Dispatch scanner recalibrated. Outbound throughput recovering to baseline levels.',
                  color: 'border-emerald-500',
                  textColor: 'text-emerald-500',
                  isDismissed: false,
                  severity: undefined,
                  resolvedAt: undefined,
                  resolvedBy: undefined,
                },
              ].sort((a, b) => {
                if (a.isDynamic && !b.isDynamic) return -1;
                if (!a.isDynamic && b.isDynamic) return 1;
                return 0;
              }).map((ev) => (
                <div key={ev.id} className="relative">
                  <span className={`absolute -left-[21px] top-1 bg-white dark:bg-slate-950 border-2 ${ev.color} rounded-full h-3 w-3`} />
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{ev.time}</span>
                      {ev.isDynamic && ev.isDismissed && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                          Solved
                        </span>
                      )}
                      {ev.isDynamic && !ev.isDismissed && (
                        <span className={`text-[8px] border px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                          ev.severity === 'high' 
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/25' 
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                        }`}>
                          {ev.severity === 'high' ? 'Critical' : 'Warning'}
                        </span>
                      )}
                    </div>
                    <h5 className={`font-bold leading-snug ${ev.textColor} ${ev.isDynamic && ev.isDismissed ? 'line-through opacity-60' : ''}`}>
                      {ev.title}
                    </h5>
                    <p className={`font-sans leading-relaxed text-[11px] ${ev.isDynamic && ev.isDismissed ? 'text-slate-500 opacity-60' : 'text-slate-600 dark:text-slate-400'}`}>
                      {ev.desc}
                    </p>
                    {ev.isDynamic && !ev.isDismissed && (
                      <button
                        onClick={() => handleResolveAlert(ev.id, ev.title)}
                        className="mt-2 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-mono font-bold flex items-center space-x-1 transition cursor-pointer"
                      >
                        <CheckCircle className="h-2.5 w-2.5" />
                        <span>Resolve Incident</span>
                      </button>
                    )}
                    {ev.isDynamic && ev.isDismissed && ev.resolvedAt && (
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block mt-1">
                        ✓ Solved at {ev.resolvedAt} {ev.resolvedBy === 'corporate' ? 'by HQ' : 'by Console'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 mt-4 text-[9px] text-slate-650 dark:text-slate-450 font-mono">
              Showing active incidents and operational alerts.
            </div>
          </Card>
        </div>

      </div>

      {/* AI Summary bar */}
      <Card className="border border-primary-accent/15 gradient-blue-glow">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-primary-accent/10 border border-primary-accent/20 shrink-0">
            <Sparkles className="h-4 w-4 text-primary-accent" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-primary-accent block mb-1">AI Operations Summary</span>
            <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed">
              Pick stage at <span className="text-amber-600 dark:text-amber-400 font-semibold">{pickStage.activeQueue} queued orders</span> —
              approaching congestion threshold. Pack stage throughput is <span className="text-rose-600 dark:text-rose-400 font-semibold">below baseline</span> due to conveyor throttle event.
              Recommend reallocating <span className="text-emerald-600 dark:text-emerald-450 font-semibold">2 workers</span> from Receiving to Picking lanes to balance the flow rate.
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
}
