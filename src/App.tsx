import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { OverviewState } from './types';
import { HealthStrip } from './components/layout/HealthStrip';
import { IncidentBanner } from './components/layout/IncidentBanner';
import { DomainNav } from './components/layout/DomainNav';
import { CommandPalette } from './components/CommandPalette';
import { MorningBrief } from './pages/MorningBrief';
import { TradingOps } from './pages/TradingOps';
import { TradingP2P } from './pages/TradingP2P';
import { WebOps } from './pages/WebOps';
import { Money } from './pages/Money';
import { Tasks } from './pages/Tasks';
import { Clients } from './pages/Clients';
import { BotTeam } from './pages/BotTeam';
import { Content } from './pages/Content';
import { Finance } from './pages/Finance';
import { Incidents } from './pages/Incidents';
import { Deployments } from './pages/Deployments';
import { Audit } from './pages/Audit';
import { Messaging } from './pages/Messaging';
import { Settings } from './pages/Settings';
import { ComponentLibrary } from './pages/ComponentLibrary';
import { NeuralMapPage } from './pages/ui/NeuralMapPage';
import { PrimitivesPage } from './pages/ui/PrimitivesPage';
import { FeedbackPage } from './pages/ui/FeedbackPage';
import { DataDisplayPage } from './pages/ui/DataDisplayPage';
import { LayoutPage } from './pages/ui/LayoutPage';
import { cn } from './lib/utils';
import { ToastProvider } from './components/primitives/Toast';
import { generateMockOverviewData } from './lib/mockData';

const queryClient = new QueryClient();

function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading, error } = useQuery<OverviewState>({
    queryKey: ['overview-state'],
    queryFn: async () => {
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockOverviewData();
    },
    refetchInterval: 30000,
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

      // g u => neural map page
      if (keysPressed['g'] && keysPressed['u']) {
        navigate('/ui/neural-map');
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
    location.pathname === '/' ? 'overview' : 
    location.pathname === '/trading' ? 'trading' : 
    location.pathname === '/p2p' ? 'p2p' : 
    location.pathname === '/sites' ? 'sites' : 
    location.pathname === '/money' ? 'money' : 
    location.pathname === '/tasks' ? 'tasks' : 
    location.pathname === '/clients' ? 'clients' : 
    location.pathname === '/bots' ? 'bots' : 
    location.pathname === '/content' ? 'content' : 
    location.pathname === '/settings' ? 'settings' : 
    location.pathname === '/library' ? 'library' : 
    location.pathname === '/ui/neural-map' ? 'ui-neural' : 
    location.pathname === '/ui/primitives' ? 'ui-primitives' : 
    location.pathname === '/ui/feedback' ? 'ui-feedback' : 
    location.pathname === '/ui/data-display' ? 'ui-data' : 
    location.pathname === '/ui/layout' ? 'ui-layout' : 
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
        
        <div className="flex flex-1 relative min-w-0">
          {/* Left Rail - Desktop */}
          <div className="hidden lg:block shrink-0">
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
            <Route path="/" element={<MorningBrief data={data} />} />
            <Route path="/trading" element={<TradingOps />} />
            <Route path="/p2p" element={<TradingP2P />} />
            <Route path="/sites" element={<WebOps />} />
            <Route path="/money" element={<Money data={data} />} />
            <Route path="/finance" element={<Finance data={data} />} />
            <Route path="/incidents" element={<Incidents data={data} />} />
            <Route path="/deployments" element={<Deployments data={data} />} />
            <Route path="/audit" element={<Audit data={data} />} />
            <Route path="/messaging" element={<Messaging data={data} />} />
            <Route path="/tasks" element={<Tasks data={data} />} />
            <Route path="/clients" element={<Clients data={data} />} />
            <Route path="/bots" element={<BotTeam />} />
            <Route path="/content" element={<Content data={data} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/library" element={<ComponentLibrary />} />
            <Route path="/ui/neural-map" element={<NeuralMapPage />} />
            <Route path="/ui/primitives" element={<PrimitivesPage />} />
            <Route path="/ui/feedback" element={<FeedbackPage />} />
            <Route path="/ui/data-display" element={<DataDisplayPage />} />
            <Route path="/ui/layout" element={<LayoutPage />} />
          </Routes>
        </div>
      </div>

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
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
