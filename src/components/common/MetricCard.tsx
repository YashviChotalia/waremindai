import React from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
  icon: React.ReactNode;
  statusColor?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export function MetricCard({
  label,
  value,
  change,
  trend,
  subtext,
  icon,
  statusColor = 'neutral'
}: MetricCardProps) {
  const { theme } = useWarehouseStore();
  const isLight = theme === 'light';

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-success-accent mr-1" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-danger-accent mr-1" />;
    return <Minus className="h-3 w-3 text-slate-400 mr-1" />;
  };

  const getStatusColor = () => {
    switch (statusColor) {
      case 'primary': return 'text-primary-accent bg-primary-accent/10 border-primary-accent/20';
      case 'success': return 'text-success-accent bg-success-accent/10 border-success-accent/20';
      case 'warning': return 'text-warning-accent bg-warning-accent/10 border-warning-accent/20';
      case 'danger': return 'text-danger-accent bg-danger-accent/10 border-danger-accent/20';
      // neutral: theme-aware inline styles applied separately
      default: return '';
    }
  };

  return (
    <Card hoverGlow={false} className="relative overflow-hidden">
      {/* Decorative colored glow bar at the bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
        statusColor === 'success' ? 'bg-success-accent/40' :
        statusColor === 'warning' ? 'bg-warning-accent/40' :
        statusColor === 'danger' ? 'bg-danger-accent/40' :
        statusColor === 'primary' ? 'bg-primary-accent/40' :
        'bg-slate-700/20'
      }`} />

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            {label}
          </p>
          <h3 className="text-2xl font-extrabold text-theme-primary tracking-tight font-sans">
            {value}
          </h3>
        </div>
        <div
          className={`p-2 rounded-lg border ${getStatusColor()}`}
          style={statusColor === 'neutral' ? {
            background: isLight ? 'rgba(241,245,249,1)' : 'rgba(30,41,59,0.5)',
            borderColor: isLight ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.3)',
            color: isLight ? '#334155' : '#94A3B8',
          } : {}}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center">
          {change && (
            <span className={`flex items-center font-bold mr-1.5 font-mono ${
              trend === 'up' ? 'text-success-accent' :
              trend === 'down' ? 'text-danger-accent' :
              'text-slate-400'
            }`}>
              {getTrendIcon()}
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-400 font-medium">{subtext}</span>}
        </div>
      </div>
    </Card>
  );
}
