import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/src/lib/utils';
import { Agent, Relationship, AGENTS, RELATIONSHIPS, AgentTier, AgentStatus } from '@/src/types/agents';

// --- Constants & Helpers ---

const STATUS_COLORS: Record<AgentStatus, string> = {
  healthy: '#5fb87a',
  degraded: '#d4a847',
  incident: '#c95f5f',
  paused: '#5fb87a', // Using emerald for paused as per prompt "stable"
  neutral: '#5e6360',
};

const TIER_SIZES: Record<AgentTier, number> = {
  core: 60,
  support: 45,
  pipeline: 15,
};

// Default positions (relative to 1000x1000 canvas)
const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  miguel: { x: 500, y: 450 },
  vael: { x: 300, y: 250 },
  kern: { x: 700, y: 250 },
  edge: { x: 250, y: 650 },
  bridge: { x: 750, y: 650 },
  tester: { x: 500, y: 680 },
  // Pipeline cluster at bottom
  p1: { x: 400, y: 880 },
  p2: { x: 440, y: 920 },
  p3: { x: 500, y: 940 },
  p4: { x: 560, y: 920 },
  p5: { x: 600, y: 880 },
  p6: { x: 500, y: 860 },
};

// --- Sub-components ---

const Edge = ({ 
  rel, 
  fromPos, 
  toPos, 
  isHighlighted, 
  isDimmed 
}: { 
  rel: Relationship; 
  fromPos: { x: number; y: number }; 
  toPos: { x: number; y: number };
  isHighlighted: boolean;
  isDimmed: boolean;
}) => {
  const isBlocked = rel.type === 'blocked';
  const isReportsTo = rel.type === 'reports-to';
  const isRoutesVia = rel.type === 'routes-via';

  const opacity = isHighlighted ? 1 : isDimmed ? 0.15 : (isReportsTo ? 0.2 : 0.4);
  const strokeWidth = isHighlighted ? 2 : (isReportsTo ? 1 : 1.5);
  const color = isBlocked ? '#c95f5f' : (isHighlighted ? '#5fb87a' : '#1f2a1e');

  return (
    <g style={{ opacity }} className="transition-opacity duration-300">
      {/* Base Line */}
      <motion.line
        x1={fromPos.x}
        y1={fromPos.y}
        x2={toPos.x}
        y2={toPos.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={isBlocked ? "5,5" : "none"}
      />

      {/* Particles for Collaborates */}
      {rel.type === 'collaborates' && !isBlocked && (
        <motion.circle
          r={2}
          fill="#5fb87a"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ 
            duration: isHighlighted ? 1.5 : 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{ offsetPath: `path('M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}')` }}
        />
      )}

      {/* Blocked Indicator */}
      {isBlocked && (
        <g transform={`translate(${(fromPos.x + toPos.x) / 2}, ${(fromPos.y + toPos.y) / 2})`}>
          <circle r={10} fill="#0c0f0d" stroke="#c95f5f" strokeWidth={1} />
          <Icon icon="solar:lock-bold" width={12} className="text-status-incident -translate-x-1.5 -translate-y-1.5" />
        </g>
      )}

      {/* Arrow for Routes-via */}
      {isRoutesVia && (
        <motion.path
          d={`M ${toPos.x} ${toPos.y} l -10 -5 l 0 10 z`}
          fill={color}
          style={{ 
            rotate: Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x) * (180 / Math.PI),
            transformOrigin: 'center'
          }}
        />
      )}
    </g>
  );
};

const AgentNode = ({ 
  agent, 
  pos, 
  isHovered, 
  isSelected, 
  isDimmed,
  onHover,
  onClick,
  onDrag
}: any) => {
  const size = TIER_SIZES[agent.tier] * (agent.id === 'miguel' ? 1.2 : 1);
  const statusColor = STATUS_COLORS[agent.status];

  return (
    <motion.g
      drag
      dragMomentum={false}
      onDrag={(_, info) => onDrag(agent.id, info.point.x, info.point.y)}
      onMouseEnter={() => onHover(agent.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(agent.id); }}
      style={{ cursor: 'pointer', opacity: isDimmed ? 0.3 : 1 }}
      className="transition-opacity duration-300"
    >
      {/* Ambient Breathing Glow */}
      <motion.circle
        cx={pos.x}
        cy={pos.y}
        r={size * 1.5}
        fill={statusColor}
        initial={{ opacity: 0.1 }}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
        style={{ filter: 'blur(20px)' }}
      />

      {/* Node Shape */}
      {agent.tier === 'pipeline' ? (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={size}
          fill="#111410"
          stroke={statusColor}
          strokeWidth={1}
        />
      ) : (
        <motion.path
          d={`M ${pos.x} ${pos.y - size} L ${pos.x + size} ${pos.y - size/2} L ${pos.x + size} ${pos.y + size/2} L ${pos.x} ${pos.y + size} L ${pos.x - size} ${pos.y + size/2} L ${pos.x - size} ${pos.y - size/2} Z`}
          fill="#111410"
          stroke={isSelected ? "#5fb87a" : statusColor}
          strokeWidth={isSelected ? 3 : 1.5}
          animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
        />
      )}

      {/* Content */}
      {agent.tier !== 'pipeline' && (
        <g pointerEvents="none">
          <text
            x={pos.x}
            y={pos.y - 5}
            textAnchor="middle"
            fill="#e8e6e1"
            className="text-[14px] font-bold font-ui uppercase tracking-tighter"
          >
            {agent.name}
          </text>
          <text
            x={pos.x}
            y={pos.y + 15}
            textAnchor="middle"
            fill="#9a9890"
            className="text-[8px] font-mono uppercase opacity-60"
          >
            {agent.model}
          </text>
          <text
            x={pos.x}
            y={pos.y - 25}
            textAnchor="middle"
            className="text-[16px]"
          >
            {agent.emoji}
          </text>
        </g>
      )}

      {/* Tooltip on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            pointerEvents="none"
          >
            <rect
              x={pos.x - 60}
              y={pos.y - size - 45}
              width={120}
              height={35}
              rx={4}
              fill="#161b14"
              stroke="#1f2a1e"
            />
            <text x={pos.x} y={pos.y - size - 30} textAnchor="middle" fill="#e8e6e1" className="text-[10px] font-bold">
              {agent.name}
            </text>
            <text x={pos.x} y={pos.y - size - 18} textAnchor="middle" fill="#7ec99a" className="text-[8px] font-mono">
              {agent.status.toUpperCase()} • {agent.lastHeartbeat}
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </motion.g>
  );
};

// --- Main Component ---

export const NeuralCommandMap: React.FC = () => {
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'roster'>('map');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [showBlockedPolicy, setShowBlockedPolicy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 3));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !hoveredId) {
      setIsDraggingCanvas(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const selectedAgent = useMemo(() => AGENTS.find(a => a.id === selectedId), [selectedId]);

  const handleDrag = (id: string, x: number, y: number) => {
    // In a real app, we'd convert screen coords to SVG coords
    // For now, let's just keep them static or implement a basic offset
  };

  const resetView = () => {
    setPositions(INITIAL_POSITIONS);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedId(null);
    setShowBlockedPolicy(false);
  };

  // Derived states for highlighting
  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set();
    const ids = new Set([hoveredId]);
    RELATIONSHIPS.forEach(r => {
      if (r.from === hoveredId) ids.add(r.to);
      if (r.to === hoveredId) ids.add(r.from);
    });
    return ids;
  }, [hoveredId]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-base relative overflow-hidden font-ui">
      {/* Header */}
      <header className="px-6 py-4 border-b border-surface-border flex items-center justify-between z-20 bg-surface-base/80 backdrop-blur-md">
        <div>
          <h1 className="text-text-primary font-bold tracking-widest text-label-md uppercase">Team Overview</h1>
          <div className="text-text-muted text-[10px] flex gap-2 mt-0.5">
            <span>12 AGENTS</span>
            <span>•</span>
            <span>5 CORE</span>
            <span>•</span>
            <span>1 SUPPORT</span>
            <span>•</span>
            <span>6 PIPELINE</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-surface-raised p-1 rounded-md border border-surface-border">
            <button 
              onClick={() => setView('map')}
              className={cn(
                "px-3 py-1 text-[10px] font-bold rounded transition-colors",
                view === 'map' ? "bg-emerald-subtle text-emerald-accent" : "text-text-muted hover:text-text-secondary"
              )}
            >
              NEURAL MAP
            </button>
            <button 
              onClick={() => setView('roster')}
              className={cn(
                "px-3 py-1 text-[10px] font-bold rounded transition-colors",
                view === 'roster' ? "bg-emerald-subtle text-emerald-accent" : "text-text-muted hover:text-text-secondary"
              )}
            >
              ROSTER
            </button>
          </div>
          <button 
            onClick={resetView}
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
            title="Reset View"
          >
            <Icon icon="solar:restart-bold-duotone" width={20} />
          </button>
        </div>
      </header>

      {/* Status Strip */}
      <div className="px-6 py-2 border-b border-surface-border flex gap-8 z-20 bg-surface-base/50">
        {AGENTS.filter(a => a.tier !== 'pipeline').map(agent => (
          <div key={agent.id} className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", `bg-[${STATUS_COLORS[agent.status]}]`)} style={{ backgroundColor: STATUS_COLORS[agent.status] }} />
            <span className="text-[9px] font-mono text-text-secondary uppercase">{agent.name}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 relative flex min-h-0">
        <AnimatePresence mode="wait">
          {view === 'map' ? (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 relative cursor-grab active:cursor-grabbing"
              ref={containerRef}
            >
              {/* Background Shimmer & Grid */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#111410_0%,#0c0f0d_70%)] opacity-50" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#5fb87a 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
              </div>

              <svg 
                viewBox="0 0 1000 1000" 
                className="w-full h-full"
                onClick={() => setSelectedId(null)}
                onWheel={handleWheel}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                <motion.g
                  animate={{ 
                    x: pan.x, 
                    y: pan.y, 
                    scale: zoom,
                  }}
                  transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                  style={{ transformOrigin: 'center' }}
                >
                  {/* Relationship Edges */}
                  <g>
                    {RELATIONSHIPS.map((rel, idx) => {
                      const fromPos = positions[rel.from];
                      const toPos = positions[rel.to];
                      if (!fromPos || !toPos) return null;

                      const isHighlighted = hoveredId === rel.from || hoveredId === rel.to;
                      const isDimmed = !!hoveredId && !isHighlighted;

                      return (
                        <g 
                          key={`${rel.from}-${rel.to}-${idx}`}
                          onClick={(e) => {
                            if (rel.type === 'blocked') {
                              e.stopPropagation();
                              setShowBlockedPolicy(true);
                            }
                          }}
                          className={cn(rel.type === 'blocked' && "cursor-help")}
                        >
                          <Edge 
                            rel={rel}
                            fromPos={fromPos}
                            toPos={toPos}
                            isHighlighted={isHighlighted}
                            isDimmed={isDimmed}
                          />
                        </g>
                      );
                    })}
                  </g>

                  {/* Pipeline Cluster Boundary */}
                  <motion.path
                    d="M 350 840 Q 500 820 650 840 L 650 960 Q 500 980 350 960 Z"
                    fill="none"
                    stroke="#1f2a1e"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    opacity={0.3}
                  />

                  {/* Nodes */}
                  <g>
                    {AGENTS.map(agent => (
                      <AgentNode 
                        key={agent.id}
                        agent={agent}
                        pos={positions[agent.id]}
                        isHovered={hoveredId === agent.id}
                        isSelected={selectedId === agent.id}
                        isDimmed={!!hoveredId && !connectedIds.has(agent.id)}
                        onHover={setHoveredId}
                        onClick={setSelectedId}
                        onDrag={handleDrag}
                      />
                    ))}
                  </g>
                </motion.g>
              </svg>

              {/* Blocked Policy Tooltip */}
              <AnimatePresence>
                {showBlockedPolicy && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-surface-overlay border border-status-incident p-6 rounded-xl shadow-raised max-w-xs"
                  >
                    <div className="flex items-center gap-3 text-status-incident mb-3">
                      <Icon icon="solar:shield-warning-bold-duotone" width={24} />
                      <h3 className="font-bold uppercase tracking-widest text-label-md">Security Policy</h3>
                    </div>
                    <p className="text-text-secondary text-label-sm leading-relaxed">
                      EDGE and BRIDGE are strictly forbidden from direct communication. All synchronization must be routed through MIGUEL to ensure risk compliance.
                    </p>
                    <button 
                      onClick={() => setShowBlockedPolicy(false)}
                      className="mt-4 w-full py-2 bg-surface-raised border border-surface-border rounded text-[10px] font-bold text-text-muted hover:text-text-primary transition-colors"
                    >
                      ACKNOWLEDGE
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="roster"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {/* Roster View */}
              {['core', 'support', 'pipeline'].map(tier => (
                <div key={tier} className="space-y-3">
                  <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">{tier} AGENTS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {AGENTS.filter(a => a.tier === tier).map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedId(agent.id)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all text-left",
                          selectedId === agent.id 
                            ? "bg-emerald-subtle-bg border-emerald-accent" 
                            : "bg-surface-raised border-surface-border hover:border-text-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", `bg-[${STATUS_COLORS[agent.status]}]`)} style={{ backgroundColor: STATUS_COLORS[agent.status] }} />
                          <div>
                            <div className="text-text-primary font-bold text-label-md flex items-center gap-2">
                              {agent.name} <span className="text-lg">{agent.emoji}</span>
                            </div>
                            <div className="text-[10px] font-mono text-text-secondary uppercase">{agent.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-text-muted uppercase">{agent.model}</div>
                          <div className="text-[9px] font-mono text-text-secondary mt-1">{agent.lastHeartbeat}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-[320px] bg-surface-overlay border-l border-surface-border shadow-raised z-30 flex flex-col"
            >
              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl mb-2">{selectedAgent.emoji}</div>
                    <h2 className="text-display-sm font-bold text-text-primary tracking-tighter">{selectedAgent.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", `bg-[${STATUS_COLORS[selectedAgent.status]}20] text-[${STATUS_COLORS[selectedAgent.status]}]`)} style={{ backgroundColor: `${STATUS_COLORS[selectedAgent.status]}20`, color: STATUS_COLORS[selectedAgent.status] }}>
                        {selectedAgent.status}
                      </div>
                      <span className="text-[10px] font-mono text-text-muted uppercase">{selectedAgent.model}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="p-2 text-text-muted hover:text-text-primary">
                    <Icon icon="solar:close-circle-bold-duotone" width={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-base p-3 rounded border border-surface-border">
                    <div className="text-[9px] font-mono text-text-muted uppercase mb-1">Heartbeat</div>
                    <div className="text-text-primary font-mono text-label-md">{selectedAgent.lastHeartbeat}</div>
                  </div>
                  <div className="bg-surface-base p-3 rounded border border-surface-border">
                    <div className="text-[9px] font-mono text-text-muted uppercase mb-1">Actions Today</div>
                    <div className="text-text-primary font-mono text-label-md">{selectedAgent.actionsToday}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Owns</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.owns.map(item => (
                      <span key={item} className="px-2 py-1 bg-surface-raised border border-surface-border rounded text-[10px] text-text-secondary">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Collaborates With</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.collaboratesWith.map(id => {
                      const other = AGENTS.find(a => a.id === id);
                      return (
                        <button 
                          key={id} 
                          onClick={() => setSelectedId(id)}
                          className="px-2 py-1 bg-emerald-subtle-bg border border-emerald-subtle text-emerald-accent rounded text-[10px] hover:bg-emerald-subtle transition-colors"
                        >
                          {other?.name || id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Tools</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.tools.map(tool => (
                      <span key={tool} className="text-[9px] font-mono text-text-muted bg-surface-base px-1.5 py-0.5 rounded border border-surface-border">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedAgent.schedules && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Schedules</h4>
                    <div className="space-y-2">
                      {selectedAgent.schedules.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="text-text-secondary">{s.task}</span>
                          <span className="text-text-mono font-mono">{s.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAgent.policy && (
                  <div className="p-4 bg-status-degraded-bg border border-status-degraded/30 rounded-lg">
                    <div className="flex items-center gap-2 text-status-degraded mb-2">
                      <Icon icon="solar:shield-warning-bold-duotone" width={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Policy Restriction</span>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-relaxed italic">
                      "{selectedAgent.policy}"
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NeuralCommandMap;
