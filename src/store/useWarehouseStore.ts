import { create } from 'zustand';
import { calculateHealthScore, HealthScores } from '../engine/healthScore';
import { analyzeBottlenecks, ProcessStage, BottleneckAnalysis } from '../engine/bottleneckEngine';
import { analyzeSlotting, SKUInfo, SlottingRecommendation } from '../engine/slottingEngine';
import { generateForecasts, ForecastReport } from '../engine/forecastEngine';
import { runSimulation, SimulationResult, SimulationInput } from '../engine/simulationEngine';

// Types definitions
export interface WorkerInfo {
  id: string;
  name: string;
  role: 'Picker' | 'Packer' | 'Receiver' | 'Dispatcher' | 'Supervisor';
  currentStage: 'receive' | 'pick' | 'pack' | 'dispatch';
  utilization: number; // 0-100
  idleMinutes: number;
  completedTasks: number;
}

export interface IncidentAlert {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  stage: 'receive' | 'pick' | 'pack' | 'dispatch' | 'system';
  timestamp: string; // "10:10"
  description: string;
  isDismissed: boolean;
  resolvedAt?: string;
  resolvedBy?: 'warehouse' | 'corporate';
}

export interface ConnectorInfo {
  id: string;
  name: string;
  type: 'WMS' | 'ERP' | 'File' | 'API';
  provider: string; // SAP, Oracle, CSV, REST API
  status: 'connected' | 'syncing' | 'error';
  lastSynced: string;
  latencyMs: number;
}

export interface Warehouse {
  id: string;
  name: string;
  region: string;
  baseEfficiency: number;
  baseSpace: number;
  baseDelayRisk: number;
  baseDemandRisk: number;
  baseLaborScore: number;
  // Dynamic fields recalculated
  health: HealthScores;
  stages: ProcessStage[];
  skus: SKUInfo[];
  workers: WorkerInfo[];
  alerts: IncidentAlert[];
  connectors: ConnectorInfo[];
  dailyThroughputTrend: { date: string; throughput: number; capacity: number; savings: number }[];
}

export interface WarehouseStore {
  portalRole: 'company' | 'warehouse' | 'none';
  selectedWarehouseId: string;
  warehouses: Warehouse[];
  timeTravelMode: 'past' | 'live' | 'forecast';
  timeTravelHour: string; // "Live" or "10:00 AM", "02:00 PM", "Tomorrow"
  theme: 'dark' | 'light';

  // Simulations
  simulationInput: SimulationInput;
  simulationResult: SimulationResult | null;
  isSimulating: boolean;

  // Actions
  setPortalRole: (role: 'company' | 'warehouse' | 'none') => void;
  setSelectedWarehouse: (id: string) => void;
  setTimeTravel: (mode: 'past' | 'live' | 'forecast', hour: string) => void;
  toggleTheme: () => void;
  dismissAlert: (warehouseId: string, alertId: string, resolvedBy?: 'warehouse' | 'corporate') => void;
  reallocateWorkers: (warehouseId: string, stageId: 'receive' | 'pick' | 'pack' | 'dispatch', count: number) => void;
  executeSlotMove: (warehouseId: string, sku: string, targetZone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D') => void;
  triggerSimulation: (warehouseId: string) => void;
  resetSimulation: () => void;
  getEngineOutputs: (warehouseId: string) => {
    bottlenecks: BottleneckAnalysis[];
    slotting: {
      spaceUtilizationPercent: number;
      deadSpacePercent: number;
      recommendations: SlottingRecommendation[];
    };
    forecast: ForecastReport;
  };
}

// Helper initial data
const initialWarehouses: Warehouse[] = [
  {
    id: 'WH-01',
    name: 'Seattle East Distribution',
    region: 'Northwest',
    baseEfficiency: 88,
    baseSpace: 76,
    baseDelayRisk: 15,
    baseDemandRisk: 10,
    baseLaborScore: 92,
    health: { overall: 0, efficiency: 0, space: 0, delayRisk: 0, demandRisk: 0, laborScore: 0 },
    stages: [
      { id: 'receive', name: 'Receiving Dock', throughput: 180, capacity: 250, activeQueue: 12, workers: 6 },
      { id: 'pick', name: 'Picking Lanes', throughput: 310, capacity: 350, activeQueue: 48, workers: 8 },
      { id: 'pack', name: 'Packing & Sorting', throughput: 280, capacity: 300, activeQueue: 22, workers: 7 },
      { id: 'dispatch', name: 'Dispatch Bay', throughput: 240, capacity: 280, activeQueue: 15, workers: 5 },
    ],
    skus: [
      { sku: 'SKU-8829', name: 'Acoustic Soundproofing Foam', currentZone: 'Zone D', pickFrequency: 145, itemVelocity: 'High', sizePercent: 12 },
      { sku: 'SKU-4022', name: 'USB-C Charging Dock (Dual)', currentZone: 'Zone A', pickFrequency: 210, itemVelocity: 'High', sizePercent: 3 },
      { sku: 'SKU-1104', name: 'Ergonomic Mesh Office Chair', currentZone: 'Zone C', pickFrequency: 130, itemVelocity: 'High', sizePercent: 18 },
      { sku: 'SKU-9021', name: 'Cat 6 Ethernet Cable 100ft', currentZone: 'Zone A', pickFrequency: 85, itemVelocity: 'Medium', sizePercent: 6 },
      { sku: 'SKU-0043', name: 'Smart RGB LED Strip Lights', currentZone: 'Zone B', pickFrequency: 90, itemVelocity: 'Medium', sizePercent: 4 },
      { sku: 'SKU-7751', name: 'Adjustable Standing Desk Leg Frame', currentZone: 'Zone C', pickFrequency: 15, itemVelocity: 'Low', sizePercent: 15 },
      { sku: 'SKU-3129', name: 'Heavy Duty Steel Wire Shelf', currentZone: 'Zone A', pickFrequency: 8, itemVelocity: 'Low', sizePercent: 20 },
    ],
    workers: [
      { id: 'W-01', name: 'Sarah Chen', role: 'Picker', currentStage: 'pick', utilization: 88, idleMinutes: 8, completedTasks: 145 },
      { id: 'W-02', name: 'Marcus Miller', role: 'Picker', currentStage: 'pick', utilization: 92, idleMinutes: 4, completedTasks: 160 },
      { id: 'W-03', name: 'Elena Rostova', role: 'Packer', currentStage: 'pack', utilization: 82, idleMinutes: 12, completedTasks: 110 },
      { id: 'W-04', name: 'David Kim', role: 'Receiver', currentStage: 'receive', utilization: 78, idleMinutes: 15, completedTasks: 95 },
      { id: 'W-05', name: 'Aisha Yusuf', role: 'Dispatcher', currentStage: 'dispatch', utilization: 85, idleMinutes: 10, completedTasks: 130 },
      { id: 'W-06', name: 'James O\'Connor', role: 'Supervisor', currentStage: 'pick', utilization: 60, idleMinutes: 30, completedTasks: 45 },
    ],
    alerts: [
      { id: 'alt-01', title: 'Pick Aisle 4 Congestion', severity: 'medium', stage: 'pick', timestamp: '10:10 AM', description: 'Picker travel times increased due to dual pallet loader blockage in Main Corridor Aisle 4.', isDismissed: false },
      { id: 'alt-02', title: 'Dispatch Conveyor Throttle', severity: 'high', stage: 'dispatch', timestamp: '10:30 AM', description: 'Conveyor sorter #3 reported motor temperature surge. Throughput rate safety-throttled to 60%.', isDismissed: false }
    ],
    connectors: [
      { id: 'conn-01', name: 'SAP ERP Integration', type: 'ERP', provider: 'SAP S/4HANA', status: 'connected', lastSynced: 'Just now', latencyMs: 24 },
      { id: 'conn-02', name: 'Oracle WMS Cloud', type: 'WMS', provider: 'Oracle Fusion', status: 'connected', lastSynced: '2 mins ago', latencyMs: 42 },
      { id: 'conn-03', name: 'Carrier Shipping API', type: 'API', provider: 'FedEx/UPS REST API', status: 'syncing', lastSynced: '15 secs ago', latencyMs: 128 },
      { id: 'conn-04', name: 'Inventory Import (Local)', type: 'File', provider: 'CSV Upload', status: 'connected', lastSynced: '1 hour ago', latencyMs: 0 }
    ],
    dailyThroughputTrend: [
      { date: 'Jun 06', throughput: 2100, capacity: 2500, savings: 3200 },
      { date: 'Jun 07', throughput: 2300, capacity: 2500, savings: 3600 },
      { date: 'Jun 08', throughput: 2450, capacity: 2500, savings: 4100 },
      { date: 'Jun 09', throughput: 2200, capacity: 2500, savings: 3400 },
      { date: 'Jun 10', throughput: 2600, capacity: 2800, savings: 4900 },
      { date: 'Jun 11', throughput: 2850, capacity: 3000, savings: 5600 },
      { date: 'Jun 12', throughput: 2980, capacity: 3100, savings: 6100 },
    ]
  },
  {
    id: 'WH-02',
    name: 'Austin South Fulfillment',
    region: 'South',
    baseEfficiency: 92,
    baseSpace: 84,
    baseDelayRisk: 8,
    baseDemandRisk: 25,
    baseLaborScore: 88,
    health: { overall: 0, efficiency: 0, space: 0, delayRisk: 0, demandRisk: 0, laborScore: 0 },
    stages: [
      { id: 'receive', name: 'Receiving Dock', throughput: 290, capacity: 350, activeQueue: 8, workers: 8 },
      { id: 'pick', name: 'Picking Lanes', throughput: 410, capacity: 450, activeQueue: 14, workers: 12 },
      { id: 'pack', name: 'Packing & Sorting', throughput: 390, capacity: 400, activeQueue: 35, workers: 9 },
      { id: 'dispatch', name: 'Dispatch Bay', throughput: 380, capacity: 400, activeQueue: 9, workers: 8 },
    ],
    skus: [
      { sku: 'SKU-2041', name: 'Portable Air Conditioner 12000 BTU', currentZone: 'Zone D', pickFrequency: 180, itemVelocity: 'High', sizePercent: 15 },
      { sku: 'SKU-5011', name: 'Smart Doorbell Camera 1080p', currentZone: 'Zone A', pickFrequency: 240, itemVelocity: 'High', sizePercent: 2 },
      { sku: 'SKU-8940', name: 'Outdoor Patio Lounge Umbrella', currentZone: 'Zone C', pickFrequency: 110, itemVelocity: 'High', sizePercent: 14 },
      { sku: 'SKU-6602', name: 'Wireless Ergonomic Keyboard', currentZone: 'Zone B', pickFrequency: 95, itemVelocity: 'Medium', sizePercent: 3 },
      { sku: 'SKU-1002', name: 'Smart Plant Water Sensor Pack', currentZone: 'Zone B', pickFrequency: 60, itemVelocity: 'Medium', sizePercent: 1 },
      { sku: 'SKU-5544', name: 'Inflatable Queen Camping Mattress', currentZone: 'Zone A', pickFrequency: 9, itemVelocity: 'Low', sizePercent: 8 },
      { sku: 'SKU-9901', name: 'Industrial Grade Heavy Steel Hanger', currentZone: 'Zone A', pickFrequency: 4, itemVelocity: 'Low', sizePercent: 22 },
    ],
    workers: [
      { id: 'W-21', name: 'Liam Murphy', role: 'Picker', currentStage: 'pick', utilization: 86, idleMinutes: 10, completedTasks: 180 },
      { id: 'W-22', name: 'Sofia Rodriguez', role: 'Picker', currentStage: 'pick', utilization: 90, idleMinutes: 5, completedTasks: 195 },
      { id: 'W-23', name: 'Raj Patel', role: 'Packer', currentStage: 'pack', utilization: 94, idleMinutes: 2, completedTasks: 210 },
      { id: 'W-24', name: 'John Doe', role: 'Receiver', currentStage: 'receive', utilization: 75, idleMinutes: 18, completedTasks: 120 },
      { id: 'W-25', name: 'Anna Novak', role: 'Dispatcher', currentStage: 'dispatch', utilization: 82, idleMinutes: 12, completedTasks: 160 },
    ],
    alerts: [
      { id: 'alt-21', title: 'Pack Station Sorter Jam', severity: 'high', stage: 'pack', timestamp: '09:45 AM', description: 'Barcode scanner assembly jammed on belt 2. Packer rate throttled.', isDismissed: false }
    ],
    connectors: [
      { id: 'conn-21', name: 'SAP ERP Integration', type: 'ERP', provider: 'SAP S/4HANA', status: 'connected', lastSynced: 'Just now', latencyMs: 28 },
      { id: 'conn-22', name: 'Oracle WMS Cloud', type: 'WMS', provider: 'Oracle Fusion', status: 'connected', lastSynced: '1 min ago', latencyMs: 38 },
      { id: 'conn-23', name: 'Carrier Shipping API', type: 'API', provider: 'FedEx/UPS REST API', status: 'connected', lastSynced: 'Just now', latencyMs: 76 }
    ],
    dailyThroughputTrend: [
      { date: 'Jun 06', throughput: 3100, capacity: 3300, savings: 4800 },
      { date: 'Jun 07', throughput: 3200, capacity: 3300, savings: 5000 },
      { date: 'Jun 08', throughput: 3350, capacity: 3400, savings: 5400 },
      { date: 'Jun 09', throughput: 3400, capacity: 3400, savings: 5600 },
      { date: 'Jun 10', throughput: 3600, capacity: 3800, savings: 6400 },
      { date: 'Jun 11', throughput: 3750, capacity: 3900, savings: 6900 },
      { date: 'Jun 12', throughput: 3910, capacity: 4000, savings: 7500 },
    ]
  },
  {
    id: 'WH-03',
    name: 'Chicago Central Logistics',
    region: 'Midwest',
    baseEfficiency: 74,
    baseSpace: 91,
    baseDelayRisk: 42,
    baseDemandRisk: 30,
    baseLaborScore: 78,
    health: { overall: 0, efficiency: 0, space: 0, delayRisk: 0, demandRisk: 0, laborScore: 0 },
    stages: [
      { id: 'receive', name: 'Receiving Dock', throughput: 210, capacity: 280, activeQueue: 38, workers: 5 },
      { id: 'pick', name: 'Picking Lanes', throughput: 280, capacity: 350, activeQueue: 92, workers: 8 },
      { id: 'pack', name: 'Packing & Sorting', throughput: 260, capacity: 300, activeQueue: 64, workers: 6 },
      { id: 'dispatch', name: 'Dispatch Bay', throughput: 250, capacity: 300, activeQueue: 45, workers: 5 },
    ],
    skus: [
      { sku: 'SKU-3091', name: 'Steel Core Dumbbell Barbell Set', currentZone: 'Zone D', pickFrequency: 130, itemVelocity: 'High', sizePercent: 16 },
      { sku: 'SKU-4033', name: 'Rechargeable LED Headlamp', currentZone: 'Zone D', pickFrequency: 155, itemVelocity: 'High', sizePercent: 2 },
      { sku: 'SKU-2099', name: 'Multi-Position Adjustable Workout Bench', currentZone: 'Zone C', pickFrequency: 140, itemVelocity: 'High', sizePercent: 20 },
      { sku: 'SKU-6022', name: 'High-Density yoga Mat (Blue)', currentZone: 'Zone B', pickFrequency: 80, itemVelocity: 'Medium', sizePercent: 4 },
      { sku: 'SKU-0091', name: 'Adjustable Hand Grip Strengthener', currentZone: 'Zone B', pickFrequency: 75, itemVelocity: 'Medium', sizePercent: 1 },
      { sku: 'SKU-6671', name: 'Heavy Punching Bag Wall Hanger', currentZone: 'Zone A', pickFrequency: 12, itemVelocity: 'Low', sizePercent: 15 },
      { sku: 'SKU-9943', name: 'Commercial Squat Cage Frame', currentZone: 'Zone A', pickFrequency: 3, itemVelocity: 'Low', sizePercent: 25 },
    ],
    workers: [
      { id: 'W-31', name: 'Robert Kovac', role: 'Picker', currentStage: 'pick', utilization: 96, idleMinutes: 2, completedTasks: 135 },
      { id: 'W-32', name: 'Jane Lin', role: 'Picker', currentStage: 'pick', utilization: 94, idleMinutes: 3, completedTasks: 130 },
      { id: 'W-33', name: 'Omar Al-Jamil', role: 'Packer', currentStage: 'pack', utilization: 88, idleMinutes: 8, completedTasks: 105 },
      { id: 'W-34', name: 'Carlos Santos', role: 'Receiver', currentStage: 'receive', utilization: 80, idleMinutes: 12, completedTasks: 90 },
      { id: 'W-35', name: 'Yuki Sato', role: 'Dispatcher', currentStage: 'dispatch', utilization: 84, idleMinutes: 10, completedTasks: 115 },
    ],
    alerts: [
      { id: 'alt-31', title: 'Severe Picker Gridlock', severity: 'high', stage: 'pick', timestamp: '10:00 AM', description: 'Massive queue bottleneck in pick corridor D. Multiple SKUs blocked.', isDismissed: false },
      { id: 'alt-32', title: 'Conveyor Slip Alert', severity: 'medium', stage: 'pack', timestamp: '10:15 AM', description: 'Sorter belt 1 friction drop detected. Speed adjusted to 75%.', isDismissed: false }
    ],
    connectors: [
      { id: 'conn-31', name: 'SAP ERP Integration', type: 'ERP', provider: 'SAP S/4HANA', status: 'connected', lastSynced: 'Just now', latencyMs: 34 },
      { id: 'conn-32', name: 'Oracle WMS Cloud', type: 'WMS', provider: 'Oracle Fusion', status: 'error', lastSynced: '5 mins ago', latencyMs: 999 },
      { id: 'conn-33', name: 'Carrier Shipping API', type: 'API', provider: 'FedEx/UPS REST API', status: 'connected', lastSynced: '10 secs ago', latencyMs: 65 }
    ],
    dailyThroughputTrend: [
      { date: 'Jun 06', throughput: 1700, capacity: 2500, savings: -1200 },
      { date: 'Jun 07', throughput: 1800, capacity: 2500, savings: -800 },
      { date: 'Jun 08', throughput: 1950, capacity: 2500, savings: -200 },
      { date: 'Jun 09', throughput: 1850, capacity: 2500, savings: -600 },
      { date: 'Jun 10', throughput: 2100, capacity: 2700, savings: 800 },
      { date: 'Jun 11', throughput: 2250, capacity: 2800, savings: 1400 },
      { date: 'Jun 12', throughput: 2380, capacity: 3000, savings: 1900 },
    ]
  }
];

// Recalculate health for all initial warehouses
const preparedWarehouses = initialWarehouses.map(wh => {
  const bottlenecks = analyzeBottlenecks(wh.stages);
  const avgDelayRisk = Math.round(bottlenecks.reduce((sum, b) => sum + b.delayProbability, 0) / bottlenecks.length);
  
  // calculate health
  const health = calculateHealthScore(
    wh.baseEfficiency,
    wh.baseSpace,
    avgDelayRisk,
    wh.baseDemandRisk,
    wh.baseLaborScore
  );

  return { ...wh, health };
});

export const useWarehouseStore = create<WarehouseStore>((set, get) => ({
  portalRole: 'none',
  selectedWarehouseId: 'WH-01',
  warehouses: preparedWarehouses,
  timeTravelMode: 'live',
  timeTravelHour: 'Live',
  theme: 'dark',

  // Simulations
  simulationInput: {
    incomingOrdersMultiplier: 1.0,
    workerCount: 35,
    equipmentFailureFlag: false,
    activePreset: 'none',
  },
  simulationResult: null,
  isSimulating: false,

  setPortalRole: (role) => set({ portalRole: role }),

  setSelectedWarehouse: (id) => set({ selectedWarehouseId: id }),

  setTimeTravel: (mode, hour) => {
    set({ timeTravelMode: mode, timeTravelHour: hour });
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('light', next === 'light');
      return { theme: next };
    });
  },

  dismissAlert: (warehouseId, alertId, resolvedBy = 'corporate') => {
    set((state) => {
      const updatedWarehouses = state.warehouses.map((wh) => {
        if (wh.id !== warehouseId) return wh;
        const updatedAlerts = wh.alerts.map((alt) => 
          alt.id === alertId ? { 
            ...alt, 
            isDismissed: true,
            resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            resolvedBy
          } : alt
        );
        return { ...wh, alerts: updatedAlerts };
      });
      return { warehouses: updatedWarehouses };
    });
  },

  reallocateWorkers: (warehouseId, stageId, count) => {
    set((state) => {
      const updatedWarehouses = state.warehouses.map((wh) => {
        if (wh.id !== warehouseId) return wh;

        // Count current workers total
        const targetStage = wh.stages.find(s => s.id === stageId);
        if (!targetStage) return wh;

        const currentAssigned = targetStage.workers;
        const diff = count - currentAssigned;

        // Balance difference by taking/adding to other stages
        const updatedStages = wh.stages.map((stage) => {
          if (stage.id === stageId) {
            return { ...stage, workers: count };
          } else {
            // Subtract/add from other stages proportionally to maintain constant workforce sum
            const share = 1 / (wh.stages.length - 1);
            const adjust = Math.round(diff * share);
            return { ...stage, workers: Math.max(2, stage.workers - adjust) };
          }
        });

        // Recalculate health
        const bottlenecks = analyzeBottlenecks(updatedStages);
        const avgDelayRisk = Math.round(bottlenecks.reduce((sum, b) => sum + b.delayProbability, 0) / bottlenecks.length);
        const newHealth = calculateHealthScore(
          wh.baseEfficiency,
          wh.baseSpace,
          avgDelayRisk,
          wh.baseDemandRisk,
          wh.baseLaborScore
        );

        // Auto-resolve stage-specific alerts
        const updatedAlerts = wh.alerts.map((alt) => {
          if (alt.stage === stageId && !alt.isDismissed) {
            return {
              ...alt,
              isDismissed: true,
              resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              resolvedBy: 'warehouse' as const
            };
          }
          return alt;
        });

        return {
          ...wh,
          stages: updatedStages,
          health: newHealth,
          alerts: updatedAlerts
        };
      });

      return { warehouses: updatedWarehouses };
    });
  },

  executeSlotMove: (warehouseId, sku, targetZone) => {
    set((state) => {
      const updatedWarehouses = state.warehouses.map((wh) => {
        if (wh.id !== warehouseId) return wh;

        const updatedSkus = wh.skus.map((item) => {
          if (item.sku === sku) {
            // Recalculate item velocity characteristics upon move
            return {
              ...item,
              currentZone: targetZone,
              // Move closer = boost efficiency
            };
          }
          return item;
        });

        // Recompute optimization stats
        const slotting = analyzeSlotting(updatedSkus);
        const efficiencyDelta = targetZone === 'Zone A' ? 2 : targetZone === 'Zone B' ? 1 : -1;
        const newEff = Math.min(100, Math.max(50, wh.baseEfficiency + efficiencyDelta));

        // Recompute health
        const bottlenecks = analyzeBottlenecks(wh.stages);
        const avgDelayRisk = Math.round(bottlenecks.reduce((sum, b) => sum + b.delayProbability, 0) / bottlenecks.length);

        const newHealth = calculateHealthScore(
          newEff,
          slotting.spaceUtilizationPercent,
          avgDelayRisk,
          wh.baseDemandRisk,
          wh.baseLaborScore
        );

        return {
          ...wh,
          skus: updatedSkus,
          baseEfficiency: newEff,
          baseSpace: slotting.spaceUtilizationPercent,
          health: newHealth
        };
      });

      return { warehouses: updatedWarehouses };
    });
  },

  triggerSimulation: (warehouseId) => {
    set({ isSimulating: true });
    
    // Simulate slight loading delay (700ms) for premium dashboard feedback
    setTimeout(() => {
      const state = get();
      const warehouse = state.warehouses.find(w => w.id === warehouseId);
      if (!warehouse) {
        set({ isSimulating: false });
        return;
      }

      // Calculate baseline throughput sum from active stages
      const baseline = warehouse.stages.reduce((sum, s) => sum + s.throughput, 0);

      const result = runSimulation(state.simulationInput, baseline);
      
      set({
        simulationResult: result,
        isSimulating: false
      });
    }, 700);
  },

  resetSimulation: () => {
    set({
      simulationInput: {
        incomingOrdersMultiplier: 1.0,
        workerCount: 35,
        equipmentFailureFlag: false,
        activePreset: 'none',
      },
      simulationResult: null
    });
  },

  getEngineOutputs: (warehouseId) => {
    const warehouse = get().warehouses.find(w => w.id === warehouseId)!;
    
    // 1. Bottlenecks
    const bottlenecks = analyzeBottlenecks(warehouse.stages);

    // 2. Slotting
    const slotting = analyzeSlotting(warehouse.skus);

    // 3. Forecast
    // Evaluate if there is an active event corresponding to time travel forecast
    const activeEvent = get().timeTravelMode === 'forecast' ? 'flash_sale' : 'none';
    const forecast = generateForecasts(1.2, activeEvent);

    return {
      bottlenecks,
      slotting,
      forecast
    };
  }
}));
