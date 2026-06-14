import React, { useMemo, useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { RefreshCw, AlertCircle, Link2, Settings, Plus, X, CheckCircle } from 'lucide-react';

export default function Integrations() {
  const { warehouses } = useWarehouseStore();
  const [syncingAll, setSyncingAll] = useState(false);
  const [lastSyncAll, setLastSyncAll] = useState('Just now');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: 'connected' | 'syncing' | 'error'; lastSynced: string; latencyMs?: number }>>({});
  const [settingsConnectorId, setSettingsConnectorId] = useState<string | null>(null);
  const [newConnectorOpen, setNewConnectorOpen] = useState(false);
  const [customConnectors, setCustomConnectors] = useState<typeof warehouses[number]['connectors']>([]);

  // Gather unique connectors from active warehouses (de-duplicate by name/type)
  const allConnectors = useMemo(() => {
    return [...warehouses.flatMap(w => w.connectors), ...customConnectors].map((connector) => ({
      ...connector,
      ...(statusOverrides[connector.id] || {})
    }));
  }, [warehouses, customConnectors, statusOverrides]);

  const activeSettingsConnector = allConnectors.find(conn => conn.id === settingsConnectorId);

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>CONNECTED</span>
          </span>
        );
      case 'syncing':
        return (
          <span className="flex items-center space-x-1.5 text-blue-400 font-mono text-[10px] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>SYNCING</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 text-rose-400 font-mono text-[10px] bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>ERROR</span>
          </span>
        );
    }
  };

  const handleSyncAll = () => {
    setSyncingAll(true);
    setStatusOverrides(prev => {
      const next = { ...prev };
      allConnectors.forEach(conn => {
        next[conn.id] = { ...next[conn.id], status: 'syncing', lastSynced: 'Syncing...' };
      });
      return next;
    });

    setTimeout(() => {
      setSyncingAll(false);
      setLastSyncAll('Just now');
      setStatusOverrides(prev => {
        const next = { ...prev };
        allConnectors.forEach(conn => {
          next[conn.id] = { status: 'connected', lastSynced: 'Just now', latencyMs: conn.latencyMs === 999 ? 72 : conn.latencyMs };
        });
        return next;
      });
    }, 800);
  };

  const handleSyncConnector = (id: string) => {
    const connector = allConnectors.find(conn => conn.id === id);
    if (!connector) return;

    setStatusOverrides(prev => ({
      ...prev,
      [id]: { status: 'syncing', lastSynced: 'Syncing...', latencyMs: connector.latencyMs }
    }));

    setTimeout(() => {
      setStatusOverrides(prev => ({
        ...prev,
        [id]: { status: 'connected', lastSynced: 'Just now', latencyMs: connector.latencyMs === 999 ? 68 : connector.latencyMs }
      }));
    }, 700);
  };

  const handleAddConnector = () => {
    const nextIndex = customConnectors.length + 1;
    setCustomConnectors(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: `New Connector ${nextIndex}`,
        type: 'API',
        provider: 'REST Endpoint',
        status: 'connected',
        lastSynced: 'Just now',
        latencyMs: 31
      }
    ]);
    setNewConnectorOpen(false);
    setLastSyncAll('Just now');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-theme-primary font-mono uppercase font-sans">Enterprise Connectors Panel</h2>
          <p className="text-sm text-slate-400">Manage connections and sync frequencies between WareMind and existing WMS/ERP databases</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg text-xs font-mono font-bold flex items-center space-x-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>Sync All Channels</span>
          </button>
          
          <button
            onClick={() => setNewConnectorOpen(true)}
            className="px-4 py-2 bg-primary-accent text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center space-x-2 shadow-md shadow-primary-accent/15"
          >
            <Plus className="h-4 w-4" />
            <span>New Connector</span>
          </button>
        </div>
      </div>

      {/* Connection summary bar */}
      <Card className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-slate-200 dark:border-slate-850">
        <div className="flex items-center space-x-3">
          <Link2 className="h-5 w-5 text-primary-accent" />
          <div className="text-sm text-theme-secondary font-mono">
            Active Data Bridges: <span className="text-theme-primary font-bold">{allConnectors.filter(c => c.status === 'connected').length}</span> / {allConnectors.length}
          </div>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Last Global Database Refresh: <span className="text-theme-primary">{lastSyncAll}</span>
        </div>
      </Card>

      {/* Connectors grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allConnectors.map((conn, idx) => (
          <Card key={`${conn.id}-${idx}`} className="flex flex-col justify-between h-48 border-slate-200 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-800 transition">
            
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 text-slate-500 font-mono px-2 py-0.5 rounded font-bold uppercase">
                    {conn.type}
                  </span>
                  <h4 className="text-sm font-bold text-theme-primary tracking-wide mt-1.5">{conn.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">{conn.provider}</p>
                </div>
                {getStatusIndicator(conn.status)}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-900 pt-3 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <div className="flex space-x-2.5">
                <span>LATENCY: <span className="text-theme-primary">{conn.latencyMs}ms</span></span>
                <span>SYNC: <span className="text-theme-primary">{conn.lastSynced}</span></span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleSyncConnector(conn.id)}
                  className="text-slate-500 hover:text-primary-accent p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded transition"
                  title={`Sync ${conn.name}`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${conn.status === 'syncing' ? 'animate-spin text-primary-accent' : ''}`} />
                </button>
                <button
                  onClick={() => setSettingsConnectorId(conn.id)}
                  className="text-slate-500 hover:text-slate-350 dark:hover:text-slate-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded transition"
                  title={`Configure ${conn.name}`}
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </Card>
        ))}
      </div>

      {(newConnectorOpen || activeSettingsConnector) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-sm font-bold text-theme-primary font-mono uppercase">
                  {newConnectorOpen ? 'New Connector' : 'Connector Settings'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {newConnectorOpen ? 'Create a new data bridge.' : activeSettingsConnector?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setNewConnectorOpen(false);
                  setSettingsConnectorId(null);
                }}
                className="text-slate-500 hover:text-white p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {newConnectorOpen ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-theme-secondary">
                  Adds a live mock API connector to validate the panel workflow.
                </div>
                <button
                  onClick={handleAddConnector}
                  className="w-full py-2 bg-primary-accent text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Connector</span>
                </button>
              </div>
            ) : activeSettingsConnector && (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                  <span className="text-slate-500">Provider</span>
                  <span className="text-theme-primary">{activeSettingsConnector.provider}</span>
                </div>
                <div className="flex justify-between border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                  <span className="text-slate-500">Status</span>
                  <span className="text-theme-primary uppercase">{activeSettingsConnector.status}</span>
                </div>
                <div className="flex justify-between border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                  <span className="text-slate-500">Sync Frequency</span>
                  <span className="text-theme-primary">Every 5 minutes</span>
                </div>
                <button
                  onClick={() => {
                    handleSyncConnector(activeSettingsConnector.id);
                    setSettingsConnectorId(null);
                  }}
                  className="w-full py-2 bg-primary-accent text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Save and Sync</span>
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

    </div>
  );
}
