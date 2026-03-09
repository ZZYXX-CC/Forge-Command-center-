import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { 
  Search, 
  Globe, 
  TrendingUp, 
  Box, 
  MessageSquare, 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Zap, 
  RefreshCw, 
  History, 
  Shield, 
  Trash2,
  Clock,
  ArrowRight,
  Command as CommandIcon
} from 'lucide-react';
import { Badge } from './ui/Feedback';

interface CommandItem {
  id: string;
  label: string;
  icon: any;
  category: 'Navigation' | 'Actions' | 'Filter' | 'System' | 'Recent';
  domain?: string;
  shortcut?: string;
  isDestructive?: boolean;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [needsConfirmation, setNeedsConfirmation] = useState<string | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setNeedsConfirmation(null);
      setTimeout(() => inputRef.current?.focus(), 10);
      
      // Load recent commands from localStorage
      const saved = localStorage.getItem('forge_recent_commands');
      if (saved) setRecentCommands(JSON.parse(saved));
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    // Navigation
    { id: 'nav-overview', label: 'Go to Overview', icon: Globe, category: 'Navigation', domain: 'Global', shortcut: 'G O', action: () => navigate('/') },
    { id: 'nav-trading', label: 'Go to Trading Ops', icon: TrendingUp, category: 'Navigation', domain: 'Trading', shortcut: 'G T', action: () => navigate('/trading') },
    { id: 'nav-trading-p2p', label: 'Go to P2P Fiat Trading', icon: Zap, category: 'Navigation', domain: 'Trading', action: () => navigate('/trading/p2p') },
    { id: 'nav-web', label: 'Go to Web Ops', icon: Globe, category: 'Navigation', domain: 'Web', shortcut: 'G W', action: () => navigate('/web-ops') },
    { id: 'nav-deploy', label: 'Go to Deployments', icon: Box, category: 'Navigation', domain: 'Infra', shortcut: 'G D', action: () => navigate('/deployments') },
    { id: 'nav-messaging', label: 'Go to Messaging', icon: MessageSquare, category: 'Navigation', domain: 'Comms', shortcut: 'G M', action: () => navigate('/messaging') },
    { id: 'nav-finance', label: 'Go to Finance', icon: DollarSign, category: 'Navigation', domain: 'Finance', shortcut: 'G F', action: () => navigate('/finance') },
    { id: 'nav-incidents', label: 'Go to Incidents', icon: AlertTriangle, category: 'Navigation', domain: 'Global', shortcut: 'G I', action: () => navigate('/incidents') },
    { id: 'nav-audit', label: 'Go to Audit Log', icon: FileText, category: 'Navigation', domain: 'Security', shortcut: 'G A', action: () => navigate('/audit') },
    
    // Actions
    { id: 'ack-all', label: 'Acknowledge all alerts', icon: Shield, category: 'Actions', domain: 'Global', action: () => {} },
    { id: 'purge-cdn', label: 'Purge CDN cache', icon: Trash2, category: 'Actions', domain: 'Web', isDestructive: true, action: () => {} },
    { id: 'rollback-deploy', label: 'Roll back deployment', icon: History, category: 'Actions', domain: 'Infra', isDestructive: true, action: () => {} },
    { id: 'health-check', label: 'Trigger health check', icon: RefreshCw, category: 'Actions', domain: 'Global', action: () => {} },
    
    // Filters
    { id: 'filter-1h', label: 'Switch to 1H view', icon: Clock, category: 'Filter', domain: 'View', action: () => {} },
    { id: 'filter-24h', label: 'Switch to 24H view', icon: Clock, category: 'Filter', domain: 'View', action: () => {} },
    { id: 'filter-prod', label: 'Filter to Production only', icon: Shield, category: 'Filter', domain: 'View', action: () => {} },
    
    // System
    { id: 'sys-settings', label: 'Open settings', icon: Settings, category: 'System', domain: 'App', shortcut: 'G S', action: () => navigate('/settings') },
    { id: 'sys-export', label: 'Export audit log', icon: FileText, category: 'System', domain: 'App', action: () => {} },
    { id: 'sys-compact', label: 'Toggle compact mode', icon: Zap, category: 'System', domain: 'App', action: () => {} },
  ];

  const filteredItems = query.length === 0 
    ? items.filter(i => recentCommands.includes(i.id)).slice(0, 5).map(i => ({ ...i, category: 'Recent' as const }))
    : items.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase()) || 
        item.domain?.toLowerCase().includes(query.toLowerCase())
      );

  const handleAction = (item: CommandItem) => {
    if (item.isDestructive && needsConfirmation !== item.id) {
      setNeedsConfirmation(item.id);
      return;
    }

    item.action();
    
    // Update recent commands
    const newRecent = [item.id, ...recentCommands.filter(id => id !== item.id)].slice(0, 5);
    setRecentCommands(newRecent);
    localStorage.setItem('forge_recent_commands', JSON.stringify(newRecent));
    
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        const selected = filteredItems[selectedIndex];
        if (selected) handleAction(selected);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredItems, selectedIndex, needsConfirmation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface-base/80 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-surface-overlay border border-surface-border rounded-xl shadow-raised overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-surface-border">
          <Search className="w-5 h-5 text-text-muted mr-3" />
          <input 
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-heading-md placeholder:text-text-muted"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
              setNeedsConfirmation(null);
            }}
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-surface-raised border border-surface-border">
              <span className="text-[10px] font-bold text-text-muted">ESC</span>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-text-primary text-heading-md">No commands match "{query}"</div>
              <div className="text-text-secondary text-label-sm">Try searching for "cdn", "deploy", or "settings"</div>
            </div>
          ) : (
            <div className="space-y-4">
              {['Recent', 'Navigation', 'Actions', 'Filter', 'System'].map(category => {
                const categoryItems = filteredItems.filter(i => i.category === category);
                if (categoryItems.length === 0) return null;
                
                return (
                  <div key={category}>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">{category}</div>
                    <div className="space-y-0.5 mt-1">
                      {categoryItems.map((item, idx) => {
                        const globalIdx = filteredItems.indexOf(item);
                        const isSelected = selectedIndex === globalIdx;
                        const isConfirming = needsConfirmation === item.id;

                        return (
                          <button
                            key={item.id}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group relative",
                              isSelected ? "bg-surface-hover" : "hover:bg-surface-hover/50"
                            )}
                            onClick={() => handleAction(item)}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                          >
                            <div className={cn(
                              "p-2 rounded-md transition-colors",
                              isSelected ? "bg-accent-subtle text-accent-primary" : "bg-surface-raised text-text-muted"
                            )}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-heading-sm truncate",
                                  isSelected ? "text-text-primary" : "text-text-secondary"
                                )}>
                                  {item.label}
                                </span>
                                {item.isDestructive && (
                                  <Badge variant="error" className="text-[8px] px-1 py-0 h-3.5">DESTRUCTIVE</Badge>
                                )}
                              </div>
                              <div className="text-label-xs text-text-muted">{item.domain}</div>
                            </div>

                            {isConfirming ? (
                              <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                <span className="text-label-xs text-status-incident font-bold">PRESS ENTER TO CONFIRM</span>
                                <ArrowRight className="w-3 h-3 text-status-incident" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                {item.shortcut && (
                                  <div className="flex gap-1">
                                    {item.shortcut.split(' ').map(key => (
                                      <span key={key} className="text-[10px] px-1 rounded bg-surface-overlay border border-surface-border text-text-muted font-mono">
                                        {key}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <ArrowRight className={cn(
                                  "w-3.5 h-3.5 text-text-muted transition-all",
                                  isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                                )} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-surface-raised border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="text-[10px] px-1 rounded bg-surface-overlay border border-surface-border text-text-muted font-bold">↑</span>
                <span className="text-[10px] px-1 rounded bg-surface-overlay border border-surface-border text-text-muted font-bold">↓</span>
              </div>
              <span className="text-label-xs text-text-muted">Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1 rounded bg-surface-overlay border border-surface-border text-text-muted font-bold">ENTER</span>
              <span className="text-label-xs text-text-muted">Execute</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <CommandIcon className="w-3 h-3" />
            <span className="text-label-xs font-bold tracking-widest">FORGE COMMAND CENTER</span>
          </div>
        </div>
      </div>
    </div>
  );
};
