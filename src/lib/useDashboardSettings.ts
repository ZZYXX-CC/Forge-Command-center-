import { useState, useEffect } from 'react';

export type WidgetId = 'health' | 'trading' | 'web' | 'deployments' | 'messaging' | 'tasks' | 'changes';

export interface DashboardSettings {
  visibleWidgets: WidgetId[];
}

const DEFAULT_SETTINGS: DashboardSettings = {
  visibleWidgets: ['health', 'trading', 'web', 'deployments', 'messaging', 'tasks', 'changes'],
};

const STORAGE_KEY = 'forge_dashboard_settings';

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleWidget = (id: WidgetId) => {
    setSettings(prev => {
      const isVisible = prev.visibleWidgets.includes(id);
      if (isVisible) {
        return {
          ...prev,
          visibleWidgets: prev.visibleWidgets.filter(w => w !== id),
        };
      } else {
        return {
          ...prev,
          visibleWidgets: [...prev.visibleWidgets, id],
        };
      }
    });
  };

  const reorderWidgets = (newOrder: WidgetId[]) => {
    setSettings(prev => ({
      ...prev,
      visibleWidgets: newOrder,
    }));
  };

  return {
    settings,
    toggleWidget,
    reorderWidgets,
  };
}
