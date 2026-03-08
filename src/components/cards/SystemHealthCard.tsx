import React from 'react';
import { StatusCard } from './StatusCard';
import { OverviewState } from '@/src/types';
import { 
  TrendingUp, 
  Globe, 
  Box, 
  MessageSquare, 
  DollarSign, 
  AlertTriangle, 
  FileText 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SystemHealthCardProps {
  data: OverviewState;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ data }) => {
  const icons = {
    trading: TrendingUp,
    web: Globe,
    deployments: Box,
    messaging: MessageSquare,
    finance: DollarSign,
    incidents: AlertTriangle,
    audit: FileText,
  };

  return (
    <StatusCard
      label="SYSTEM HEALTH"
      title="Global Infrastructure Summary"
      status={data.globalStatus}
      timestamp={data.meta.generatedAt}
      footerAction="View sub-services →"
    >
      <div className="grid grid-cols-1 gap-1 py-2">
        {data.domains.map((domain) => {
          const Icon = icons[domain.id as keyof typeof icons] || Box;
          const statusColors = {
            healthy: 'bg-status-healthy',
            degraded: 'bg-status-degraded',
            incident: 'bg-status-incident',
            offline: 'bg-status-neutral',
            unknown: 'bg-status-neutral'
          };

          return (
            <div 
              key={domain.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-hover cursor-pointer transition-colors group"
            >
              <Icon className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />
              <span className="text-body-sm flex-1">{domain.name}</span>
              <div className="flex items-center gap-2">
                {domain.degradedSinceMs && (
                  <span className="text-mono-sm text-status-degraded italic">
                    Degraded for {Math.floor(domain.degradedSinceMs / 60000)}m
                  </span>
                )}
                <div className={cn("w-1.5 h-1.5 rounded-full", statusColors[domain.status])} />
              </div>
            </div>
          );
        })}
      </div>
    </StatusCard>
  );
};
