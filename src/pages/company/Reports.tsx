import React, { useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { Calendar, FileDown, Activity, DollarSign, Database } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ReportsProps {
  mode: 'company' | 'warehouse';
}

export default function Reports({ mode }: ReportsProps) {
  const { warehouses, selectedWarehouseId } = useWarehouseStore();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [exporting, setExporting] = useState<string | null>(null);

  const activeWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];

  // Helper to generate trend data based on timeframe
  const getTrendData = () => {
    const rawDaily = mode === 'company'
      ? warehouses[0].dailyThroughputTrend.map((t, idx) => {
          const totalThroughput = warehouses.reduce((sum, wh) => sum + (wh.dailyThroughputTrend[idx]?.throughput || 0), 0);
          const totalCapacity = warehouses.reduce((sum, wh) => sum + (wh.dailyThroughputTrend[idx]?.capacity || 0), 0);
          const totalSavings = warehouses.reduce((sum, wh) => sum + (wh.dailyThroughputTrend[idx]?.savings || 0), 0);
          return {
            date: t.date,
            throughput: totalThroughput,
            capacity: totalCapacity,
            savings: totalSavings
          };
        })
      : activeWh.dailyThroughputTrend;

    if (timeframe === 'daily') {
      return rawDaily;
    } else if (timeframe === 'weekly') {
      // Group or scale daily data to represent 5 weeks
      const baseThroughput = rawDaily.reduce((sum, d) => sum + d.throughput, 0);
      const baseCapacity = rawDaily.reduce((sum, d) => sum + d.capacity, 0);
      const baseSavings = rawDaily.reduce((sum, d) => sum + d.savings, 0);
      
      return [
        { date: 'Jun Week 1', throughput: Math.round(baseThroughput * 5.2), capacity: Math.round(baseCapacity * 5.5), savings: Math.round(baseSavings * 5.1) },
        { date: 'Jun Week 2', throughput: Math.round(baseThroughput * 5.4), capacity: Math.round(baseCapacity * 5.5), savings: Math.round(baseSavings * 5.3) },
        { date: 'Jun Week 3', throughput: Math.round(baseThroughput * 5.1), capacity: Math.round(baseCapacity * 5.5), savings: Math.round(baseSavings * 4.9) },
        { date: 'Jun Week 4', throughput: Math.round(baseThroughput * 5.6), capacity: Math.round(baseCapacity * 5.5), savings: Math.round(baseSavings * 5.7) },
        { date: 'Jul Week 1', throughput: Math.round(baseThroughput * 5.8), capacity: Math.round(baseCapacity * 5.5), savings: Math.round(baseSavings * 6.2) },
      ];
    } else {
      // Monthly aggregate trends
      const baseThroughput = rawDaily.reduce((sum, d) => sum + d.throughput, 0);
      const baseCapacity = rawDaily.reduce((sum, d) => sum + d.capacity, 0);
      const baseSavings = rawDaily.reduce((sum, d) => sum + d.savings, 0);

      return [
        { date: 'Jan 2026', throughput: Math.round(baseThroughput * 22), capacity: Math.round(baseCapacity * 24), savings: Math.round(baseSavings * 20) },
        { date: 'Feb 2026', throughput: Math.round(baseThroughput * 21), capacity: Math.round(baseCapacity * 24), savings: Math.round(baseSavings * 19) },
        { date: 'Mar 2026', throughput: Math.round(baseThroughput * 23), capacity: Math.round(baseCapacity * 24), savings: Math.round(baseSavings * 22) },
        { date: 'Apr 2026', throughput: Math.round(baseThroughput * 24), capacity: Math.round(baseCapacity * 24), savings: Math.round(baseSavings * 24) },
        { date: 'May 2026', throughput: Math.round(baseThroughput * 25), capacity: Math.round(baseCapacity * 24), savings: Math.round(baseSavings * 26) },
        { date: 'Jun 2026', throughput: Math.round(baseThroughput * 26.5), capacity: Math.round(baseCapacity * 24), savings: Math.round(baseSavings * 28.5) },
      ];
    }
  };

  const reportData = getTrendData();

  // Aggregate stats
  const totalThroughput = reportData.reduce((sum, t) => sum + t.throughput, 0);
  const avgThroughput = Math.round(totalThroughput / (reportData.length * 24)); // Average per hour
  const totalSavings = reportData.reduce((sum, t) => sum + t.savings, 0);

  const buildPdfDocument = (lines: string[]) => {
    const escapePdf = (value: string) => value.replace(/[\\()]/g, '\\$&');
    const commands = [
      'BT',
      '/F1 18 Tf',
      '72 760 Td',
      `(${escapePdf(lines[0])}) Tj`,
      '/F1 10 Tf'
    ];

    lines.slice(1).forEach((line) => {
      commands.push('0 -18 Td', `(${escapePdf(line)}) Tj`);
    });
    commands.push('ET');

    const stream = commands.join('\n');
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object) => {
      offsets.push(pdf.length);
      pdf += `${object}\n`;
    });

    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    return pdf;
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    setExporting(format);
    
    // Simulate slight loading latency for premium UX feel
    setTimeout(() => {
      const nodeRef = mode === 'company' ? 'AGGREGATED_LOG_NODE' : activeWh.id;
      
      if (format === 'csv') {
        const headers = 'DATE,NODE REFERENCE,THROUGHPUT VOLUME,CAPACITY LIMIT,SAVINGS YIELD\n';
        const rows = reportData.map(item => {
          return `"${item.date}","${nodeRef}",${item.throughput},${item.capacity},${item.savings}`;
        }).join('\n');
        const content = headers + rows;
        
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `WareMind_${mode}_Report_${timeframe}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const pdfLines = [
          'WAREMIND AI - ENTERPRISE OPERATIONS REPORT',
          `Portal Mode: ${mode.toUpperCase()} ANALYTICS`,
          `Timeframe: ${timeframe.toUpperCase()}`,
          `Generated: ${new Date().toLocaleString()}`,
          `Target Node: ${mode === 'company' ? 'ALL_NODES' : activeWh.name + ' (' + activeWh.id + ')'}`,
          '',
          'SUMMARY METRICS',
          `Total Throughput: ${totalThroughput.toLocaleString()} units`,
          `Period Cost Savings: $${totalSavings.toLocaleString()}`,
          `Average Hourly Rate: ${avgThroughput} units/hour`,
          '',
          'RAW OPERATIONS LOG'
        ];

        reportData.forEach(item => {
          pdfLines.push(`${item.date} | ${mode === 'company' ? 'AGGREGATED_NODE' : activeWh.id} | throughput ${item.throughput} | capacity ${item.capacity} | savings $${item.savings}`);
        });
        pdfLines.push('', 'CONFIDENTIAL - WAREMIND AI SECURE NETWORKS');

        const blob = new Blob([buildPdfDocument(pdfLines)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `WareMind_${mode}_Report_${timeframe}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      setExporting(null);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-theme-primary font-mono uppercase font-sans">
            {mode === 'company' ? 'Network Analytics Reports' : `${activeWh.name} Reports`}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Exportable operational logs and financial throughput analytics</p>
        </div>
 
        {/* Toolbar controls */}
        <div className="flex items-center space-x-2">
          {/* Timeframe */}
          <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition uppercase cursor-pointer ${
                  timeframe === t
                    ? 'bg-primary-accent text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
 
          {/* Export buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
              title="Download CSV"
            >
              <FileDown className="h-4 w-4" />
              <span className="text-[10px] font-mono hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
              title="Download PDF"
            >
              <FileDown className="h-4 w-4" />
              <span className="text-[10px] font-mono hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export status toast overlay */}
      {exporting && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 backdrop-blur-xl rounded-xl shadow-2xl flex items-center space-x-3 text-sm text-slate-800 dark:text-slate-200 animate-slide-in">
          <div className="h-2 w-2 rounded-full bg-primary-accent animate-ping" />
          <span>Generating operational {exporting.toUpperCase()} document...</span>
        </div>
      )}

      {/* Reports Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center space-x-4">
          <div className="p-2.5 rounded-lg bg-primary-accent/10 border border-primary-accent/20 text-primary-accent">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Total Throughput (Period)</span>
            <span className="text-lg font-bold text-theme-primary font-mono">{totalThroughput.toLocaleString()} units</span>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase font-sans">Period Cost Savings</span>
            <span className="text-lg font-bold text-theme-primary font-mono">${totalSavings.toLocaleString()}</span>
          </div>
        </Card>

        <Card className="flex items-center space-x-4">
          <div className="p-2.5 rounded-lg bg-secondary-accent/10 border border-secondary-accent/20 text-secondary-accent">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase font-sans">Avg Hourly Rate</span>
            <span className="text-lg font-bold text-theme-primary font-mono">{avgThroughput} units/hr</span>
          </div>
        </Card>
      </div>

      {/* Recharts BarChart display */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold font-mono text-theme-primary uppercase tracking-widest">Savings and Throughput History</h4>
            <p className="text-[11px] text-slate-500">Volumetric logs compared against economic savings values ({timeframe})</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData} margin={{ top: 10, right: 16, left: 8, bottom: 0 }} barCategoryGap="28%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} className="font-mono" tick={{ fill: '#94A3B8' }} />
              {/* Left Y-axis — Throughput Volume (units) */}
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#64748B"
                fontSize={10}
                tick={{ fill: '#94A3B8' }}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                width={40}
              />
              {/* Right Y-axis — Savings ($) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748B"
                fontSize={10}
                tick={{ fill: '#10B981' }}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface, #1E293B)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: '#F8FAFC',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, name) => {
                  const num = typeof value === 'number' ? value : Number(value ?? 0);
                  return name === 'Savings ($)'
                    ? [`$${num.toLocaleString()}`, name as string]
                    : [`${num.toLocaleString()} units`, name as string];
                }}
                labelStyle={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }}
                formatter={(value) => <span style={{ color: '#94A3B8' }}>{value}</span>}
              />
              <Bar yAxisId="left"  dataKey="throughput" fill="#3B82F6" name="Volume (units)" radius={[3, 3, 0, 0]} maxBarSize={52} />
              <Bar yAxisId="right" dataKey="savings"    fill="#10B981" name="Savings ($)"   radius={[3, 3, 0, 0]} maxBarSize={52} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabular logs list */}
      <Card>
        <h4 className="text-xs font-bold font-mono text-theme-primary uppercase tracking-widest mb-4">RAW OPERATIONAL LOG SHEETS</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-900 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">DATE</th>
                <th className="pb-3 font-semibold">NODE REFERENCE</th>
                <th className="pb-3 font-semibold text-right">THROUGHPUT VOLUME</th>
                <th className="pb-3 font-semibold text-right">CAPACITY LIMIT</th>
                <th className="pb-3 font-semibold text-right">SAVINGS YIELD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-900/60 text-theme-secondary">
              {reportData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/25 transition">
                  <td className="py-3 font-bold text-theme-primary">{item.date}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">
                    {mode === 'company' ? 'AGGREGATED_LOG_NODE' : activeWh.id}
                  </td>
                  <td className="py-3 text-right font-bold text-theme-primary">{item.throughput.toLocaleString()} units</td>
                  <td className="py-3 text-right">{item.capacity.toLocaleString()} units</td>
                  <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">${item.savings.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
