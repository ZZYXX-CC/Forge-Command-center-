import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { Command, Search, X, TrendingUp, Globe, Box, MessageSquare, DollarSign, AlertTriangle, FileText } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { id: 'nav-overview', label: 'Navigate to Overview', icon: Globe, category: 'Navigation', action: () => navigate('/') },
    { id: 'nav-trading', label: 'Navigate to Trading Ops', icon: TrendingUp, category: 'Navigation', action: () => navigate('/trading') },
    { id: 'nav-web', label: 'Navigate to Web Ops', icon: Globe, category: 'Navigation', action: () => navigate('/web-ops') },
    { id: 'nav-deploy', label: 'Navigate to Deployments', icon: Box, category: 'Navigation', action: () => navigate('/deployments') },
    { id: 'nav-messaging', label: 'Navigate to Messaging', icon: MessageSquare, category: 'Navigation', action: () => navigate('/messaging') },
    { id: 'nav-finance', label: 'Navigate to Finance', icon: DollarSign, domainId: 'finance', category: 'Navigation', action: () => navigate('/finance') },
    { id: 'nav-incidents', label: 'Navigate to Incidents', icon: AlertTriangle, category: 'Navigation', action: () => navigate('/incidents') },
    { id: 'nav-audit', label: 'Navigate to Audit / Logs', icon: FileText, category: 'Navigation', action: () => navigate('/audit') },
    { id: 'ack-all', label: 'Acknowledge all active alerts', icon: Search, category: 'Actions', action: () => {} },
    { id: 'filter-1h', label: 'Set time range to 1H', icon: Search, category: 'Filter', action: () => {} },
    { id: 'filter-24h', label: 'Set time range to 24H', icon: Search, category: 'Filter', action: () => {} },
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-surface-base/80 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl bg-surface-overlay border border-surface-border rounded-lg shadow-raised overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-surface-border">
          <Search className="w-5 h-5 text-text-muted mr-3" />
          <input 
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-heading-md placeholder:text-text-muted"
            placeholder="Search commands, domains, or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 px-1.5 py-0.5 rounded bg-surface-raised border border-surface-border">
            <span className="text-label-sm text-text-muted">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-body-md">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              {['Navigation', 'Actions', 'Filter'].map(category => {
                const categoryItems = filteredItems.filter(i => i.category === category);
                if (categoryItems.length === 0) return null;
                
                return (
                  <div key={category}>
                    <div className="px-2 py-1 text-label-sm text-text-muted">{category}</div>
                    <div className="space-y-1 mt-1">
                      {categoryItems.map(item => (
                        <button
                          key={item.id}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-hover transition-colors text-left group"
                          onClick={() => handleAction(item.action)}
                        >
                          <item.icon className="w-4 h-4 text-text-muted group-hover:text-accent-primary" />
                          <span className="text-heading-sm flex-1">{item.label}</span>
                          <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-surface-raised border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1 rounded bg-surface-overlay border border-surface-border text-text-muted">↑↓</span>
              <span className="text-label-sm text-text-muted">Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1 rounded bg-surface-overlay border border-surface-border text-text-muted">ENTER</span>
              <span className="text-label-sm text-text-muted">Select</span>
            </div>
          </div>
          <div className="text-label-sm text-text-muted">
            FORGE v1.1
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
