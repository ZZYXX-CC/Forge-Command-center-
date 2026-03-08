import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { OverviewState } from './types';
import { HealthStrip } from './components/layout/HealthStrip';
import { IncidentBanner } from './components/layout/IncidentBanner';
import { DomainNav } from './components/layout/DomainNav';
import { SystemHealthCard } from './components/cards/SystemHealthCard';
import { TradingSnapshotCard } from './components/cards/TradingSnapshotCard';
import { WebOpsCard } from './components/cards/WebOpsCard';
import { DeploymentCard } from './components/cards/DeploymentCard';
import { MessagingCard } from './components/cards/MessagingCard';
import { RecentChangesCard } from './components/cards/RecentChangesCard';
import { PriorityAlertsPanel } from './components/panels/PriorityAlertsPanel';
import { ActionQueuePanel } from './components/panels/ActionQueuePanel';
import { CommandPalette } from './components/CommandPalette';
import { TradingOps } from './pages/TradingOps';
import { WebOps } from './pages/WebOps';
import { Deployments } from './pages/Deployments';
import { Messaging } from './pages/Messaging';
import { Finance } from './pages/Finance';
import { Incidents } from './pages/Incidents';
import { Audit } from './pages/Audit';
import { ComponentLibrary } from './pages/ComponentLibrary';
import { cn } from './lib/utils';

const queryClient = new QueryClient();

function DashboardOverview({ data }: { data: OverviewState }) {
  return (
    <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          <SystemHealthCard data={data} />
          <TradingSnapshotCard data={data} />
          <WebOpsCard data={data} />
          <DeploymentCard data={data} />
          <MessagingCard data={data} />
          <RecentChangesCard data={data} />
        </div>
      </div>

      {/* Mobile-only panels at bottom */}
      <div className="lg:hidden mt-8 space-y-8 pb-8">
        <div className="h-px bg-surface-border" />
        <PriorityAlertsPanel data={data} />
        <div className="h-px bg-surface-border" />
        <ActionQueuePanel data={data} />
      </div>
    </main>
  );
}

function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading, error } = useQuery<OverviewState>({
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
    location.pathname === '/trading' ? 'trading' : 
    location.pathname === '/web-ops' ? 'web' : 
    location.pathname === '/deployments' ? 'deployments' : 
    location.pathname === '/messaging' ? 'messaging' : 
    location.pathname === '/finance' ? 'finance' : 
    location.pathname === '/incidents' ? 'incidents' : 
    location.pathname === '/audit' ? 'audit' : 
    location.pathname === '/library' ? 'library' : 
    'overview';

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <HealthStrip 
        data={data} 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
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

          <Routes>
            <Route path="/" element={<DashboardOverview data={data} />} />
            <Route path="/trading" element={<TradingOps />} />
            <Route path="/web-ops" element={<WebOps />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/library" element={<ComponentLibrary />} />
          </Routes>

          {/* Right Rail - Desktop (Only on Overview) */}
          {location.pathname === '/' && (
            <aside className="hidden lg:flex w-[300px] sticky top-12 h-[calc(100vh-48px)] bg-surface-base border-l border-surface-border flex-col p-4 overflow-hidden">
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <PriorityAlertsPanel data={data} />
              </div>
              
              <div className="h-px bg-surface-border my-6" />
              
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <ActionQueuePanel data={data} />
              </div>
            </aside>
          )}
        </div>
      </div>

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
