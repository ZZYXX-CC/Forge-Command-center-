import React from 'react';
import { cn } from '@/src/lib/utils';
import { Tooltip } from './ChartsAndOverlays';

interface HeatmapData {
  hour: number;
  day: string;
  opportunityScore: number;
}

interface SpreadHeatmapProps {
  data: HeatmapData[];
}

export const SpreadHeatmap: React.FC<SpreadHeatmapProps> = ({ data }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Today", "Yesterday", "2 Days Ago"];

  const getColor = (score: number) => {
    if (score > 80) return 'bg-status-healthy'; // High opportunity
    if (score > 60) return 'bg-emerald-mid';
    if (score > 40) return 'bg-emerald-subtle';
    if (score > 20) return 'bg-surface-hover';
    return 'bg-surface-border';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-status-healthy" />
            <span className="text-label-sm text-text-secondary">High Opp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-surface-border" />
            <span className="text-label-sm text-text-secondary">Low Opp</span>
          </div>
        </div>
        <div className="text-label-sm text-text-muted">Spread Opportunity by Hour</div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between py-1 text-label-xs text-text-muted">
          {days.map(day => <span key={day}>{day}</span>)}
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-1">
          {days.map(day => (
            <div key={day} className="flex gap-1 h-8">
              {hours.map(hour => {
                const cell = data.find(d => d.day === day && d.hour === hour);
                const score = cell?.opportunityScore || 0;
                
                return (
                  <div 
                    key={hour}
                    className={cn(
                      "flex-1 rounded-sm transition-all hover:scale-110 hover:z-10 cursor-crosshair",
                      getColor(score)
                    )}
                    title={`${day} ${hour}:00 - Score: ${score}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <div className="w-12" />
        <div className="flex justify-between text-[10px] text-text-muted px-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>
  );
};
