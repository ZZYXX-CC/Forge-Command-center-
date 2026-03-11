import React, { useState, useEffect, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { OverviewState } from './types';
import { HealthStrip } from './components/layout/HealthStrip';
import { IncidentBanner } from './components/layout/IncidentBanner';
import { DomainNav } from './components/layout/DomainNav';
import { MorningBrief } from './pages/MorningBrief';
const TradingOps = lazy(() => import('./pages/TradingOps').then((m) => ({ default: m.TradingOps })));
const TradingP2P = lazy(() => import('./pages/TradingP2P').then((m) => ({ default: m.TradingP2P })));
const Sites = lazy(() => import('./pages/Sites').then((m) => ({ default: m.Sites })));
const Money = lazy(() => import('./pages/Money').then((m) => ({ default: m.Money })));
const Tasks = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.Tasks })));
const Clients = lazy(() => import('./pages/Clients').then((m) => ({ default: m.Clients })));
const BotTeam = lazy(() => import('./pages/BotTeam').then((m) => ({ default: m.BotTeam })));
const Content = lazy(() => import('./pages/Content').then((m) => ({ default: m.Content })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const ComponentLibrary = lazy(() => import('./pages/ComponentLibrary').then((m) => ({ default: m.ComponentLibrary })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette })));

import { cn } from './lib/utils';
import { ToastProvider } from './components/primitives/Toast';

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex-1 p-6 flex items-center justify-center">
    <div className="text-text-secondary animate-pulse">Loading module…</div>
  </div>
);

function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading, error, isFetching, dataUpdatedAt, refetch } = useQuery<OverviewState>({
    queryKey: ['overview-state'],
    queryFn: async () => {
      const res = await fetch('/api/overview-state');
      if (!res.ok) throw new Error('Failed to fetch dashboard state');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10s
  });

  // Keyboard Shortcuts
  useEffect(() => {
    let keysPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = true;

      // g t => trading page
      if (keysPressed['g'] && keysPressed['t']) {
        navigate('/trading');
        keysPressed = {};
      }

      // g w => web ops page
      if (keysPressed['g'] && keysPressed['w']) {
        navigate('/web-ops');
        keysPressed = {};
      }

      // g d => deployments page
      if (keysPressed['g'] && keysPressed['d']) {
        navigate('/deployments');
        keysPressed = {};
      }

      // g m => messaging page
      if (keysPressed['g'] && keysPressed['m']) {
        navigate('/messaging');
        keysPressed = {};
      }

      // g f => finance page
      if (keysPressed['g'] && keysPressed['f']) {
        navigate('/finance');
        keysPressed = {};
      }

      // g i => incidents page
      if (keysPressed['g'] && keysPressed['i']) {
        navigate('/incidents');
        keysPressed = {};
      }

      // g a => audit page
      if (keysPressed['g'] && keysPressed['a']) {
        navigate('/audit');
        keysPressed = {};
      }

      // g p => p2p trading page
      if (keysPressed['g'] && keysPressed['p']) {
        navigate('/trading/p2p');
        keysPressed = {};
      }

      // g s => settings page
      if (keysPressed['g'] && keysPressed['s']) {
        navigate('/settings');
        keysPressed = {};
      }

      // g l => library page
      if (keysPressed['g'] && keysPressed['l']) {
        navigate('/library');
        keysPressed = {};
      }

      // g o => overview page
      if (keysPressed['g'] && keysPressed['o']) {
        navigate('/');
        keysPressed = {};
      }

      // k => command palette (meta+k or just k if not typing)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      } else if (e.key === 'k' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsPaletteOpen(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      delete keysPressed[e.key.toLowerCase()];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-label-md animate-pulse">Initializing FORGE Ops...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-surface-raised border border-status-incident rounded-lg text-center">
          <div className="text-status-incident text-display-lg mb-4">SYSTEM ERROR</div>
          <p className="text-body-md text-text-secondary mb-6">
            Failed to connect to the operations backend. Check your network or system status.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent-primary text-text-inverse rounded-md font-bold hover:bg-accent-dim transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const activeNavId = 
    location.pathname === '/' || location.pathname === '/morning-brief' ? 'overview' : 
    location.pathname === '/trading' ? 'trading' : 
    location.pathname === '/trading/p2p' || location.pathname === '/p2p' ? 'p2p' : 
    location.pathname === '/sites' ? 'sites' : 
    location.pathname === '/money' ? 'money' : 
    location.pathname === '/tasks' ? 'tasks' : 
    location.pathname === '/clients' ? 'clients' : 
    location.pathname === '/bots' ? 'bots' : 
    location.pathname === '/content' ? 'content' : 
    location.pathname === '/settings' ? 'settings' : 
    location.pathname === '/library' ? 'library' : 
    'overview';

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <HealthStrip 
        data={data} 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        currentFilter=""
        onFilterChange={() => {}}
      />
      
      <div className="flex flex-col flex-1 pt-12">
        <IncidentBanner data={data} />
        
        <div className="flex flex-1 relative">
          {/* Left Rail - Desktop */}
          <div className="hidden lg:block">
            <DomainNav data={data} activeId={activeNavId} />
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 z-[150] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="absolute inset-0 bg-surface-base/80 backdrop-blur-sm" />
              <div 
                className="absolute inset-y-0 left-0 w-[280px] bg-surface-base shadow-raised border-r border-surface-border"
                onClick={e => e.stopPropagation()}
              >
                <DomainNav 
                  data={data} 
                  activeId={activeNavId}
                  isMobile 
                  onSelect={() => setIsMobileMenuOpen(false)} 
                />
              </div>
            </div>
          )}

          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/morning-brief" replace />} />
              <Route path="/morning-brief" element={<MorningBrief data={data} isLoading={isFetching} isError={!!error} onRetry={refetch} fetchedAt={dataUpdatedAt} />} />
              <Route path="/trading" element={<TradingOps />} />
              <Route path="/trading/p2p" element={<TradingP2P />} />
              <Route path="/p2p" element={<Navigate to="/trading/p2p" replace />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/money" element={<Money />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/bots" element={<BotTeam />} />
              <Route path="/content" element={<Content />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/library" element={<ComponentLibrary />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
