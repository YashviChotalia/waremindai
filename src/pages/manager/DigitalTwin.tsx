import React, { useEffect, useRef, useState } from 'react';
import { useWarehouseStore } from '../../store/useWarehouseStore';
import { Card } from '../../components/ui/Card';
import { Play, Pause, ZoomIn, Eye, Activity, Clock } from 'lucide-react';

export default function DigitalTwin() {
  const { timeTravelMode, setTimeTravel } = useWarehouseStore();

  // Controls States
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showRobots, setShowRobots] = useState<boolean>(true);
  const [showWorkers, setShowWorkers] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = (canvas.width = 700);
    const height = (canvas.height = 360);

    // Entity definitions
    interface Agent {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      speed: number;
      color: string;
      radius: number;
      label: string;
    }

    const robots: Agent[] = [
      { x: 100, y: 80, targetX: 200, targetY: 80, speed: 1.2, color: '#3B82F6', radius: 6, label: 'AGV-01' },
      { x: 300, y: 140, targetX: 500, targetY: 140, speed: 0.8, color: '#3B82F6', radius: 6, label: 'AGV-02' },
      { x: 150, y: 220, targetX: 150, targetY: 280, speed: 1.5, color: '#3B82F6', radius: 6, label: 'AGV-03' },
    ];

    const workers: Agent[] = [
      { x: 580, y: 90, targetX: 580, targetY: 130, speed: 0.4, color: '#10B981', radius: 5, label: 'Chen' },
      { x: 580, y: 230, targetX: 580, targetY: 270, speed: 0.3, color: '#10B981', radius: 5, label: 'Novak' },
    ];

    // Heatmaps positions shift dynamically with time travel values
    const getHeatmapCongestionPoints = () => {
      if (timeTravelMode === 'past') {
        // High picking aisle gridlock
        return [
          { x: 180, y: 110, radius: 45, intensity: 0.8 },
          { x: 200, y: 180, radius: 35, intensity: 0.6 }
        ];
      } else if (timeTravelMode === 'forecast') {
        // Packing stations bottleneck peak tomorrow
        return [
          { x: 550, y: 100, radius: 50, intensity: 0.85 },
          { x: 550, y: 250, radius: 45, intensity: 0.75 }
        ];
      } else {
        // Live (dispatch dock blockage)
        return [
          { x: 380, y: 280, radius: 55, intensity: 0.8 },
          { x: 120, y: 120, radius: 30, intensity: 0.4 }
        ];
      }
    };

    const drawWarehouseGrid = () => {
      // Draw shelving racks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      // Draw shelf rectangles
      const shelfRows = [60, 120, 180, 240];
      const shelfWidth = 120;
      const shelfHeight = 30;

      shelfRows.forEach(y => {
        // Rack left
        ctx.fillRect(80, y, shelfWidth, shelfHeight);
        ctx.strokeRect(80, y, shelfWidth, shelfHeight);
        // Rack right
        ctx.fillRect(280, y, shelfWidth, shelfHeight);
        ctx.strokeRect(280, y, shelfWidth, shelfHeight);
      });

      // Draw Workstations (Pick/Pack zones)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1.5;
      
      // Pick station 1
      ctx.fillRect(520, 70, 120, 80);
      ctx.strokeRect(520, 70, 120, 80);
      ctx.fillStyle = '#64748B';
      ctx.font = '8px JetBrains Mono';
      ctx.fillText('PICK_STATION_A', 530, 85);

      // Pack station 2
      ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.fillRect(520, 210, 120, 80);
      ctx.strokeRect(520, 210, 120, 80);
      ctx.fillStyle = '#64748B';
      ctx.fillText('PACK_STATION_B', 530, 225);

      // Conveyor belt paths
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(480, 110);
      ctx.lineTo(480, 250);
      ctx.lineTo(520, 250);
      ctx.stroke();
    };

    const drawHeatmap = () => {
      const points = getHeatmapCongestionPoints();
      points.forEach(pt => {
        const gradient = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, pt.radius);
        gradient.addColorStop(0, `rgba(239, 68, 68, ${pt.intensity})`);
        gradient.addColorStop(0.5, `rgba(245, 158, 11, ${pt.intensity * 0.4})`);
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const updateAndDrawAgents = (list: Agent[]) => {
      list.forEach(agent => {
        if (isPlaying) {
          const dx = agent.targetX - agent.x;
          const dy = agent.targetY - agent.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 4) {
            // swap targets
            const tempX = agent.x;
            const tempY = agent.y;
            agent.targetX = agent.x < 250 ? agent.x + 120 : agent.x - 120;
            agent.targetY = agent.y;
          } else {
            agent.x += (dx / dist) * agent.speed * playbackSpeed;
            agent.y += (dy / dist) * agent.speed * playbackSpeed;
          }
        }

        // Draw dot
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
        ctx.fill();

        // Label border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Mini text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '7px JetBrains Mono';
        ctx.fillText(agent.label, agent.x - 10, agent.y - 10);
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Black background
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, width, height);

      drawWarehouseGrid();

      if (showHeatmap) drawHeatmap();
      if (showRobots) updateAndDrawAgents(robots);
      if (showWorkers) updateAndDrawAgents(workers);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [showHeatmap, showRobots, showWorkers, isPlaying, playbackSpeed, timeTravelMode]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono uppercase font-sans">Digital Twin Operations Center</h2>
        <p className="text-sm text-slate-400">High-fidelity Canvas rendering of warehouse shelves, automated vehicles, and workers</p>
      </div>

      {/* Main Canvas view panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Twin Map & Time Travel (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
            {/* Visual Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-900 bg-slate-100/70 dark:bg-slate-950/40 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-accent"></span>
                </span>
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300">Live Twin Stream</span>
              </div>
              
              <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-900 p-0.5 rounded text-[10px] font-mono">
                <span className="text-slate-500 px-1">MODE:</span>
                <span className="text-primary-accent font-bold uppercase">{timeTravelMode} VIEW</span>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="bg-slate-800 dark:bg-slate-950 flex justify-center p-4 relative overflow-hidden" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
              <canvas ref={canvasRef} className="rounded-lg shadow-inner max-w-full" />
            </div>

            {/* Time Travel Slider Control */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/20 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Clock className="h-4 w-4 text-primary-accent" />
                  <span>Time Travel Index: <span className="text-slate-800 dark:text-white font-bold">{timeTravelMode.toUpperCase()}</span></span>
                </span>
                <span className="text-slate-500">Telemetry Replay</span>
              </div>

              {/* Step buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTimeTravel('past', '10:00 AM')}
                  className={`py-2 rounded-lg text-xs font-mono font-bold transition border ${
                    timeTravelMode === 'past'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/35'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Past (10:00 AM Gridlock)
                </button>
                <button
                  onClick={() => setTimeTravel('live', 'Live')}
                  className={`py-2 rounded-lg text-xs font-mono font-bold transition border ${
                    timeTravelMode === 'live'
                      ? 'bg-primary-accent/10 text-primary-accent border-primary-accent/35'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Live (Current Status)
                </button>
                <button
                  onClick={() => setTimeTravel('forecast', 'Tomorrow')}
                  className={`py-2 rounded-lg text-xs font-mono font-bold transition border ${
                    timeTravelMode === 'forecast'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/35'
                      : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Forecast (Tomorrow Peak)
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Controls & Layer Filters (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Controls Card */}
          <Card>
            <h4 className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4">Display Overlays</h4>
            
            <div className="space-y-4 text-xs font-mono">
              {/* Heatmap Toggle */}
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Heatmap Overlays</span>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 text-primary-accent bg-white dark:bg-slate-950 h-4 w-4"
                />
              </div>

              {/* Robots Toggle */}
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Robots (AGV Telemetry)</span>
                <input
                  type="checkbox"
                  checked={showRobots}
                  onChange={(e) => setShowRobots(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 text-primary-accent bg-white dark:bg-slate-950 h-4 w-4"
                />
              </div>

              {/* Workers Toggle */}
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Staff Movement</span>
                <input
                  type="checkbox"
                  checked={showWorkers}
                  onChange={(e) => setShowWorkers(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 text-primary-accent bg-white dark:bg-slate-950 h-4 w-4"
                />
              </div>

              {/* Zoom control */}
              <div className="space-y-1.5 pt-2 border-t border-slate-900">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Zoom Level</span>
                  <span>{zoomLevel.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="w-full accent-primary-accent"
                />
              </div>

              {/* Playback speed */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Playback Speed</span>
                  <span>{playbackSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                  className="w-full accent-primary-accent"
                />
              </div>

              {/* Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-900 text-slate-700 dark:text-slate-300 rounded font-bold uppercase transition flex items-center justify-center space-x-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-slate-300" />
                    <span>Resume Stream</span>
                  </>
                )}
              </button>

            </div>
          </Card>

          {/* Telemetry info */}
          <Card>
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest mb-2">Sensor Readouts</h4>
            <div className="space-y-1.5 font-mono text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>AGV Batteries:</span>
                <span className="text-emerald-400 font-bold">100% OK</span>
              </div>
              <div className="flex justify-between">
                <span>Conveyor Temperature:</span>
                <span className="text-white font-bold">42°C</span>
              </div>
              <div className="flex justify-between">
                <span>Aisle Gridlock:</span>
                <span className={timeTravelMode === 'past' ? 'text-rose-400 font-bold' : 'text-slate-400 font-bold'}>
                  {timeTravelMode === 'past' ? 'Aisle 4 Blocked' : 'Clear'}
                </span>
              </div>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
