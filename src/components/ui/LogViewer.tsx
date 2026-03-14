import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { ForgeIcon } from './ForgeIcon';
import { MonoText } from './Primitives';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  source: string;
  message: string;
}

interface LogViewerProps {
  logs?: LogEntry[];
  maxLogs?: number;
  autoScroll?: boolean;
  className?: string;
  simulateInput?: boolean;
}

const LOG_LEVEL_COLORS = {
  info: 'text-status-info',
  warn: 'text-status-degraded',
  error: 'text-status-incident',
  debug: 'text-text-muted',
  success: 'text-status-healthy',
};

export const LogViewer = ({
  logs: initialLogs = [],
  maxLogs = 100,
  autoScroll = true,
  className,
  simulateInput = false,
}: LogViewerProps) => {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (simulateInput) {
      const sources = ['NETWORK', 'AUTH', 'DB', 'GATEWAY', 'STRATEGY', 'NEURAL_CORE'];
      const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug', 'success'];
      const messages = [
        'Connection established to node-72',
        'Handshake completed in 42ms',
        'Packet drop detected on ingress-4',
        'Re-routing traffic via secondary bridge',
        'Neural weights synchronized',
        'Unauthorized access attempt blocked',
        'Database query optimized: index scan used',
        'Heartbeat signal received from agent-alpha',
        'Memory buffer threshold reached: 85%',
        'Garbage collection cycle completed',
      ];

      const interval = setInterval(() => {
        const newLog: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString().split('T')[1].split('.')[0],
          level: levels[Math.floor(Math.random() * levels.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
        };

        setLogs(prev => [...prev.slice(-(maxLogs - 1)), newLog]);
      }, 2000 + Math.random() * 3000);

      return () => clearInterval(interval);
    }
  }, [simulateInput, maxLogs]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <div className={cn(
      "flex flex-col bg-surface-base border border-surface-border rounded-lg overflow-hidden font-mono text-[11px]",
      className
    )}>
      <div className="px-3 py-2 border-b border-surface-border bg-surface-raised flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ForgeIcon name="document-text" size={14} className="text-emerald-accent" />
          <span className="text-text-secondary font-bold uppercase tracking-widest">System Logs</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-status-healthy animate-pulse" />
            <span className="text-[9px] text-text-muted uppercase">Live Feed</span>
          </div>
          <button 
            onClick={() => setLogs([])}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <ForgeIcon name="refresh" size={12} />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-[200px]"
      >
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center text-text-muted italic">
            Waiting for input...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 group hover:bg-surface-hover/50 rounded px-1 -mx-1 transition-colors">
            <span className="text-text-muted shrink-0">[{log.timestamp}]</span>
            <span className={cn("font-bold shrink-0 w-16", LOG_LEVEL_COLORS[log.level])}>
              {log.level.toUpperCase()}
            </span>
            <span className="text-emerald-accent/70 shrink-0">[{log.source}]</span>
            <span className="text-text-primary break-all">{log.message}</span>
          </div>
        ))}
      </div>

      <div className="px-3 py-1.5 border-t border-surface-border bg-surface-raised/50 flex items-center justify-between text-[9px] text-text-muted">
        <span>TOTAL ENTRIES: {logs.length}</span>
        <span>BUFFER: {Math.round((logs.length / maxLogs) * 100)}%</span>
      </div>
    </div>
  );
};
