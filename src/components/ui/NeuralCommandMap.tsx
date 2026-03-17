import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/src/lib/utils';
import { Agent, Relationship, AGENTS, RELATIONSHIPS, AgentTier, AgentStatus } from '@/src/types/agents';
import { ForgeIcon } from './ForgeIcon';

/**
 * NEURAL COMMAND MAP & CHAT SYSTEM
 * --------------------------------
 * Location: src/components/ui/NeuralCommandMap.tsx
 * 
 * This component is the primary interface for agent interaction and network visualization.
 * It handles three main views:
 * 1. MAP: SVG-based neural network visualization with draggable nodes and relationship edges.
 * 2. ROSTER: Categorized list of all active agents with status indicators.
 * 3. CHAT: Multi-channel messaging interface for direct agent directives and broadcast mode.
 * 
 * Key Features:
 * - Real-time status synchronization using the AgentStatus type system.
 * - Contextual "Intelligence Tools" sidebar that adapts to the selected agent.
 * - SVG relationship mapping with "Blocked Policy" enforcement visualization.
 * - Responsive design with mobile-optimized headers and collapsible sidebars.
 * 
 * Engineering Note: 
 * Status colors are driven by the FORGE design system tokens defined in src/index.css.
 * Use the STATUS_BG_CLASSES and STATUS_TEXT_CLASSES maps for consistent color application.
 */

// --- Constants & Helpers ---

const STATUS_COLORS: Record<AgentStatus, string> = {
  healthy: 'var(--color-status-healthy)',
  degraded: 'var(--color-status-degraded)',
  incident: 'var(--color-status-incident)',
  paused: 'var(--color-status-healthy)',
  neutral: 'var(--color-status-neutral)',
};

const STATUS_BG_CLASSES: Record<AgentStatus, string> = {
  healthy: 'bg-status-healthy',
  degraded: 'bg-status-degraded',
  incident: 'bg-status-incident',
  paused: 'bg-status-healthy',
  neutral: 'bg-status-neutral',
};

const STATUS_TEXT_CLASSES: Record<AgentStatus, string> = {
  healthy: 'text-status-healthy',
  degraded: 'text-status-degraded',
  incident: 'text-status-incident',
  paused: 'text-status-healthy',
  neutral: 'text-status-neutral',
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

  const opacity = isHighlighted ? 1 : isDimmed ? 0.1 : (isReportsTo ? 0.15 : 0.3);
  const strokeWidth = isHighlighted ? 2.5 : (isReportsTo ? 1 : 1.5);
  const color = isBlocked ? 'var(--color-status-incident)' : (isHighlighted ? 'var(--color-emerald-accent)' : 'var(--color-surface-border)');

  return (
    <g style={{ opacity }} className="transition-opacity duration-500">
      {/* Glow Effect for Highlighted Edges */}
      {isHighlighted && (
        <motion.line
          x1={fromPos.x}
          y1={fromPos.y}
          x2={toPos.x}
          y2={toPos.y}
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          style={{ filter: 'blur(8px)', opacity: 0.3 }}
        />
      )}

      {/* Base Line */}
      <motion.line
        x1={fromPos.x}
        y1={fromPos.y}
        x2={toPos.x}
        y2={toPos.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={isBlocked ? "4,2" : "none"}
        strokeLinecap="round"
      />

      {/* Neural Pulse (Traveling Wave) */}
      {!isBlocked && !isReportsTo && (
        <motion.circle
          r={isHighlighted ? 3 : 1.5}
          fill={isHighlighted ? "var(--color-emerald-accent)" : "var(--color-emerald-mid)"}
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ 
            duration: isHighlighted ? 2 : 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
          style={{ 
            offsetPath: `path('M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}')`,
            filter: isHighlighted ? 'blur(2px)' : 'none'
          }}
        />
      )}

      {/* Blocked Indicator (Firewall Style) */}
      {isBlocked && (
        <g transform={`translate(${(fromPos.x + toPos.x) / 2}, ${(fromPos.y + toPos.y) / 2})`}>
          <motion.circle 
            r={12} 
            fill="var(--color-surface-base)" 
            stroke="var(--color-status-incident)" 
            strokeWidth={1}
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <ForgeIcon name="shield-cross" style="bold" size="sm" className="text-status-incident -translate-x-1.75 -translate-y-1.75" />
        </g>
      )}

      {/* Arrow for Routes-via */}
      {isRoutesVia && (
        <motion.path
          d={`M ${toPos.x} ${toPos.y} l -8 -4 l 0 8 z`}
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
  onDragEnd
}: any) => {
  const size = TIER_SIZES[agent.tier] * (agent.id === 'miguel' ? 1.2 : 1);
  const statusColor = STATUS_COLORS[agent.status];

  return (
    <motion.g
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragEnd={(_, info) => onDragEnd(agent.id, info.offset.x, info.offset.y)}
      onMouseEnter={() => onHover(agent.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(agent.id); }}
      style={{ cursor: 'grab', opacity: isDimmed ? 0.3 : 1 }}
      className="transition-opacity duration-300 active:cursor-grabbing"
      initial={false}
      animate={{ x: pos.x, y: pos.y }}
    >
      {/* Ambient Breathing Glow */}
      <motion.circle
        r={size * 1.5}
        fill={statusColor}
        initial={{ opacity: 0.1 }}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
        style={{ filter: 'blur(20px)' }}
      />

      {/* Rotating Ring for Core Agents */}
      {agent.tier === 'core' && (
        <motion.circle
          r={size + 8}
          fill="none"
          stroke={statusColor}
          strokeWidth={1}
          strokeDasharray="10,20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ opacity: 0.3 }}
        />
      )}

      {/* Node Shape */}
      {agent.tier === 'pipeline' ? (
        <circle
          r={size}
          fill="var(--color-surface-raised)"
          stroke={statusColor}
          strokeWidth={1}
        />
      ) : (
        <g>
          {/* Outer Glow Ring */}
          <motion.path
            d={`M 0 ${-size-6} L ${size+6} 0 L 0 ${size+6} L ${-size-6} 0 Z`}
            fill="none"
            stroke={statusColor}
            strokeWidth={0.5}
            opacity={0.1}
            animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          {/* Main Diamond Shape */}
          <motion.path
            d={`M 0 ${-size} L ${size} 0 L 0 ${size} L ${-size} 0 Z`}
            fill="var(--color-surface-raised)"
            stroke={isSelected ? "var(--color-emerald-accent)" : statusColor}
            strokeWidth={isSelected ? 2.5 : 1.5}
            animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
            className="drop-shadow-[0_0_15px_rgba(95,184,122,0.3)]"
          />
          {/* Tech Accents on Corners */}
          <g opacity={0.6}>
            <line x1={0} y1={-size-2} x2={0} y2={-size+4} stroke={statusColor} strokeWidth={1} />
            <line x1={0} y1={size+2} x2={0} y2={size-4} stroke={statusColor} strokeWidth={1} />
            <line x1={-size-2} y1={0} x2={-size+4} y2={0} stroke={statusColor} strokeWidth={1} />
            <line x1={size+2} y1={0} x2={size-4} y2={0} stroke={statusColor} strokeWidth={1} />
          </g>
        </g>
      )}

      {/* Inner Glass Highlight */}
      {agent.tier !== 'pipeline' && (
        <g pointerEvents="none">
          <path
            d={`M 0 ${-size + 5} L ${size - 5} 0 L 0 ${size - 5} L ${-size + 5} 0 Z`}
            fill="url(#glassGradient)"
            opacity={0.15}
          />
        </g>
      )}

      {/* Content */}
      {agent.tier !== 'pipeline' && (
        <g pointerEvents="none">
          <text
            y={-5}
            textAnchor="middle"
            fill="var(--color-text-primary)"
            className="text-[14px] font-bold font-ui uppercase tracking-tighter"
          >
            {agent.name}
          </text>
          <text
            y={15}
            textAnchor="middle"
            fill="var(--color-text-secondary)"
            className="text-[8px] font-mono uppercase opacity-60"
          >
            {agent.model}
          </text>
          <text
            y={-25}
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
              x={-60}
              y={-size - 45}
              width={120}
              height={35}
              rx={4}
              fill="var(--color-surface-overlay)"
              stroke="var(--color-surface-border)"
            />
            <text y={-size - 30} textAnchor="middle" fill="var(--color-text-primary)" className="text-[10px] font-bold">
              {agent.name}
            </text>
            <text y={-size - 18} textAnchor="middle" fill="var(--color-text-mono)" className="text-[8px] font-mono">
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
  const [view, setView] = useState<'map' | 'roster' | 'chat'>('map');
  const [activeChannel, setActiveChannel] = useState<string>('network');
  const [isTyping, setIsTyping] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [showBlockedPolicy, setShowBlockedPolicy] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Record<string, Array<{ id: string; sender: string; text: string; time: string; isAgent: boolean }>>>({
    network: [
      { id: '1', sender: 'MIGUEL', text: 'Neural network stable. All agents reporting nominal status.', time: '13:45', isAgent: true },
      { id: '2', sender: 'VAEL', text: 'Security audit complete. No breaches detected.', time: '13:48', isAgent: true },
    ],
    miguel: [
      { id: 'm1', sender: 'MIGUEL', text: 'Operator, I am standing by for strategic directives.', time: '12:00', isAgent: true }
    ]
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [view, messages, activeChannel]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const channel = activeChannel;
    const newMsg = {
      id: Date.now().toString(),
      sender: 'OPERATOR',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAgent: false
    };
    
    setMessages(prev => ({
      ...prev,
      [channel]: [...(prev[channel] || []), newMsg]
    }));
    setChatInput('');
    setIsTyping(true);

    // Mock response
    setTimeout(() => {
      const senderName = channel === 'network' ? 'MIGUEL' : AGENTS.find(a => a.id === channel)?.name || 'SYSTEM';
      const response = {
        id: (Date.now() + 1).toString(),
        sender: senderName,
        text: channel === 'network' ? 'Acknowledged. Broadcasting to all nodes.' : `Direct directive received. Executing ${chatInput.split(' ')[0]}...`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAgent: true
      };
      setMessages(prev => ({
        ...prev,
        [channel]: [...(prev[channel] || []), response]
      }));
      setIsTyping(false);
    }, 1500);
  };

  // Handle window resize to prevent "not responding" feel if layout shifts
  useEffect(() => {
    const handleResize = () => {
      // Force a re-render if needed or just ensure layout is stable
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleDragEnd = (id: string, offsetX: number, offsetY: number) => {
    setPositions(prev => {
      const current = prev[id];
      // Contain within 0-1000 viewBox
      const newX = Math.min(Math.max(current.x + offsetX / zoom, 50), 950);
      const newY = Math.min(Math.max(current.y + offsetY / zoom, 50), 950);
      return {
        ...prev,
        [id]: { x: newX, y: newY }
      };
    });
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
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-surface-base relative overflow-hidden font-ui">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-surface-border flex items-center justify-between z-20 bg-surface-base/80 backdrop-blur-md shrink-0 gap-4">
        <div className="min-w-0">
          <h1 className="text-text-primary font-bold tracking-widest text-label-md uppercase truncate">Team Overview</h1>
          <div className="text-text-muted text-[10px] flex gap-2 mt-0.5 whitespace-nowrap overflow-hidden">
            <span>12 AGENTS</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">5 CORE</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex bg-surface-raised p-0.5 sm:p-1 rounded-md border border-surface-border shrink-0">
            <button 
              onClick={() => setView('map')}
              className={cn(
                "px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold rounded transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                view === 'map' ? "bg-emerald-subtle text-emerald-accent" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <ForgeIcon name="graph-new" size="sm" />
              <span className="hidden xs:inline">MAP</span>
              <span className="xs:hidden">MAP</span>
            </button>
            <button 
              onClick={() => setView('roster')}
              className={cn(
                "px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold rounded transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                view === 'roster' ? "bg-emerald-subtle text-emerald-accent" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <ForgeIcon name="clipboard-list" size="sm" />
              <span className="hidden xs:inline">ROSTER</span>
              <span className="xs:hidden">LIST</span>
            </button>
            <button 
              onClick={() => setView('chat')}
              className={cn(
                "px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold rounded transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                view === 'chat' ? "bg-emerald-subtle text-emerald-accent" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <ForgeIcon name="chat-round-dots" size="sm" />
              <span className="hidden xs:inline">CHAT</span>
              <span className="xs:hidden">CHAT</span>
            </button>
          </div>
          <button 
            onClick={resetView}
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
            title="Reset View"
          >
            <ForgeIcon name="restart" size="md" />
          </button>
        </div>
      </header>

      {/* Status Strip - Only visible in Chat View */}
      {view === 'chat' && (
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between z-20 bg-surface-base/50 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex gap-8 shrink-0">
            {/* Neural Network Channel */}
            <div 
              className={cn(
                "flex items-center gap-3 group cursor-pointer border-r border-surface-border pr-8",
                activeChannel === 'network' ? "text-emerald-accent" : "text-text-secondary"
              )} 
              onClick={() => setActiveChannel('network')}
            >
              <div className={cn("w-2 h-2 rounded-full animate-pulse bg-emerald-accent")} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase group-hover:text-emerald-accent transition-colors leading-none">Neural Network</span>
                <span className="text-[8px] font-mono uppercase tracking-tighter mt-0.5 opacity-70">Broadcast</span>
              </div>
            </div>

            {/* Individual Agents */}
            {AGENTS.filter(a => a.tier !== 'pipeline').map(agent => (
              <div key={agent.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveChannel(agent.id)}>
                <div className={cn("w-2 h-2 rounded-full animate-pulse", STATUS_BG_CLASSES[agent.status])} />
                <div className="flex flex-col">
                  <span className={cn("text-[10px] font-bold uppercase group-hover:text-emerald-accent transition-colors leading-none", activeChannel === agent.id ? "text-emerald-accent" : "text-text-secondary")}>{agent.name}</span>
                  <span className={cn("text-[8px] font-mono uppercase tracking-tighter mt-0.5", STATUS_TEXT_CLASSES[agent.status])}>
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 relative flex min-h-0 min-w-0">
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
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--color-surface-raised)_0%,var(--color-surface-base)_70%)] opacity-50" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(var(--color-emerald-accent) 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
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
                <defs>
                  <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-text-primary)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--color-text-primary)" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                <motion.g
                  animate={{ 
                    x: pan.x, 
                    y: pan.y, 
                    scale: zoom,
                  }}
                  transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                  style={{ transformOrigin: 'center' }}
                >
                  {/* Background Neural Noise */}
                  <g opacity={0.1}>
                    {[...Array(5)].map((_, i) => (
                      <motion.path
                        key={i}
                        d={`M ${100 + i * 200} 0 Q ${500} ${500} ${900 - i * 200} 1000`}
                        fill="none"
                        stroke="var(--color-emerald-accent)"
                        strokeWidth={0.5}
                        animate={{
                          opacity: [0.1, 0.3, 0.1],
                          pathLength: [0, 1, 0],
                        }}
                        transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
                      />
                    ))}
                  </g>

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
                    stroke="var(--color-surface-border)"
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
                        onDragEnd={handleDragEnd}
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
                      <ForgeIcon name="shield-warning" size="lg" />
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
          ) : view === 'roster' ? (
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
                          <div className={cn("w-2 h-2 rounded-full", STATUS_BG_CLASSES[agent.status])} />
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
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col min-h-0 bg-surface-base relative"
            >
              {/* Chat Sidebar - Bot Intelligence Tools */}
              <AnimatePresence>
                {(showChatSidebar || true) && (
                  <motion.div 
                    initial={false}
                    animate={{ x: 0 }}
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-64 border-r border-surface-border bg-surface-raised z-30 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0",
                      !showChatSidebar && "-translate-x-full lg:translate-x-0"
                    )}
                  >
                    <div className="p-4 border-b border-surface-border flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Intelligence Tools</h3>
                      <button onClick={() => setShowChatSidebar(false)} className="lg:hidden p-1 text-text-muted hover:text-text-primary">
                        <ForgeIcon name="close-circle" size="md" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                      {activeChannel !== 'network' ? (
                        <div className="px-2 py-2">
                          <div className="flex items-center gap-3 p-3 mb-4 bg-surface-base border border-surface-border rounded-xl">
                            <div className="text-2xl">{AGENTS.find(a => a.id === activeChannel)?.emoji}</div>
                            <div className="min-w-0">
                              <div className="text-label-sm font-bold text-text-primary truncate">{AGENTS.find(a => a.id === activeChannel)?.name}</div>
                              <div className="text-[9px] font-mono text-text-muted truncate uppercase">{AGENTS.find(a => a.id === activeChannel)?.role}</div>
                            </div>
                          </div>

                          <h3 className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Bot Internals</h3>
                          <div className="space-y-1">
                            <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all text-left">
                              <ForgeIcon name="document-text" size="sm" className="text-emerald-accent" />
                              <span className="text-label-sm font-medium">Open Logs</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all text-left">
                              <ForgeIcon name="cpu" size="sm" className="text-emerald-accent" />
                              <span className="text-label-sm font-medium">Memory Browser</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all text-left">
                              <ForgeIcon name="calendar" size="sm" className="text-emerald-accent" />
                              <span className="text-label-sm font-medium">Schedules</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all text-left">
                              <ForgeIcon name="settings" size="sm" className="text-emerald-accent" />
                              <span className="text-label-sm font-medium">Bot Configuration</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <ForgeIcon name="users-group-two-rounded" size="xl" className="mx-auto text-text-muted mb-4 opacity-20" />
                          <p className="text-[10px] text-text-muted uppercase tracking-widest leading-relaxed">
                            Neural Network Broadcast Mode Active. Select an agent to access internal tools.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Sidebar Overlay */}
              {showChatSidebar && (
                <div 
                  className="absolute inset-0 bg-black/50 z-20 lg:hidden" 
                  onClick={() => setShowChatSidebar(false)}
                />
              )}

              <div className="flex-1 flex flex-col min-h-0 min-w-0 lg:ml-64">
                {/* Chat Header */}
                <div className="px-4 sm:px-6 py-3 border-b border-surface-border bg-surface-raised/20 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => setShowChatSidebar(true)}
                      className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary"
                    >
                      <ForgeIcon name="hamburger-menu" size="md" />
                    </button>
                    <div className="text-xl shrink-0">
                      {activeChannel === 'network' ? <ForgeIcon name="users-group-two-rounded" className="text-emerald-accent" /> : AGENTS.find(a => a.id === activeChannel)?.emoji}
                    </div>
                    <div 
                      className="min-w-0 cursor-pointer group"
                      onClick={() => activeChannel !== 'network' && setSelectedId(activeChannel)}
                    >
                      <h3 className="text-label-md font-bold text-text-primary uppercase tracking-wider truncate group-hover:text-emerald-accent transition-colors">
                        {activeChannel === 'network' ? 'Neural Network' : AGENTS.find(a => a.id === activeChannel)?.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1 h-1 rounded-full animate-pulse", activeChannel === 'network' ? "bg-status-healthy" : STATUS_BG_CLASSES[AGENTS.find(a => a.id === activeChannel)?.status || 'neutral'])} />
                        <span className={cn("text-[9px] font-mono uppercase tracking-tighter truncate", activeChannel === 'network' ? "text-status-healthy" : STATUS_TEXT_CLASSES[AGENTS.find(a => a.id === activeChannel)?.status || 'neutral'])}>
                          {activeChannel === 'network' ? 'Operational' : AGENTS.find(a => a.id === activeChannel)?.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-6 shrink-0 ml-auto sm:ml-0">
                    {activeChannel !== 'network' && (
                      <div className="hidden xs:flex items-center gap-4 sm:gap-6 mr-2">
                        <div className="flex flex-col items-end">
                          <span className="text-[7px] text-text-muted uppercase font-mono leading-none">Runtime</span>
                          <span className="text-[9px] text-text-mono font-mono mt-0.5">42h</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[7px] text-text-muted uppercase font-mono leading-none">Heartbeat</span>
                          <span className="text-[9px] text-text-mono font-mono mt-0.5">14s</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button className="hidden sm:block p-2 text-text-muted hover:text-text-primary transition-colors"><ForgeIcon name="videocamera-record" size="md" /></button>
                      <button className="p-2 text-text-muted hover:text-text-primary transition-colors lg:hidden" onClick={() => setShowChatSidebar(true)}>
                        <ForgeIcon name="settings" size="md" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  {(messages[activeChannel] || []).map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.isAgent ? "self-start" : "self-end items-end")}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest", msg.isAgent ? "text-emerald-accent" : "text-text-muted")}>
                          {msg.sender}
                        </span>
                        <span className="text-[8px] text-text-muted font-mono">{msg.time}</span>
                      </div>
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 rounded-2xl text-label-sm leading-relaxed shadow-sm",
                          msg.isAgent 
                            ? "bg-surface-raised border border-surface-border text-text-primary rounded-tl-none" 
                            : "bg-emerald-accent text-surface-base font-medium rounded-tr-none"
                        )}
                      >
                        {msg.text}
                      </motion.div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="self-start flex flex-col">
                      <div className="text-[10px] font-bold text-emerald-accent uppercase tracking-widest mb-1.5">
                        {activeChannel === 'network' ? 'MIGUEL' : AGENTS.find(a => a.id === activeChannel)?.name} is typing...
                      </div>
                      <div className="flex gap-1 p-2 bg-surface-raised rounded-lg border border-surface-border">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-surface-border/50">
                  {['Status Report', 'Run Diagnostics', 'Sync Neural Map', 'Clear Logs'].map(action => (
                    <button 
                      key={action}
                      onClick={() => setChatInput(action)}
                      className="whitespace-nowrap px-3 py-1 bg-surface-raised border border-surface-border rounded-full text-[9px] font-bold text-text-muted hover:text-emerald-accent hover:border-emerald-accent/50 transition-all"
                    >
                      {action.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="p-6 border-t border-surface-border bg-surface-raised/50">
                  <div className="flex gap-3 max-w-4xl mx-auto relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
                      <button className="text-text-muted hover:text-emerald-accent"><ForgeIcon name="paperclip" size="md" /></button>
                    </div>
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={`Message ${activeChannel === 'network' ? 'Neural Network' : AGENTS.find(a => a.id === activeChannel)?.name}...`}
                      className="flex-1 bg-surface-base border border-surface-border rounded-xl pl-12 pr-5 py-3 text-text-primary text-label-sm focus:outline-none focus:border-emerald-accent focus:ring-1 focus:ring-emerald-accent/20 transition-all"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="px-4 sm:px-6 bg-emerald-accent text-text-inverse rounded-xl font-bold text-label-sm hover:bg-emerald-mid transition-all flex items-center gap-2 shadow-lg shadow-emerald-accent/10 active:scale-95"
                    >
                      <ForgeIcon name="send" size="md" />
                      <span className="hidden xs:inline">SEND</span>
                    </button>
                  </div>
                </div>
              </div>
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
              className="absolute top-0 right-0 bottom-0 w-full sm:w-[320px] bg-surface-overlay border-l border-surface-border shadow-raised z-30 flex flex-col"
            >
              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl mb-2">{selectedAgent.emoji}</div>
                    <h2 className="text-display-sm font-bold text-text-primary tracking-tighter">{selectedAgent.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase")} style={{ backgroundColor: `var(--color-status-${selectedAgent.status}-bg)`, color: STATUS_COLORS[selectedAgent.status] }}>
                        {selectedAgent.status}
                      </div>
                      <span className="text-[10px] font-mono text-text-muted uppercase">{selectedAgent.model}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="p-2 text-text-muted hover:text-text-primary">
                    <ForgeIcon name="close-circle" size="lg" />
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
                      <ForgeIcon name="shield-warning" size="sm" />
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
