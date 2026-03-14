import React from 'react';
import { NeuralCommandMap } from '../components/ui/NeuralCommandMap';

export const BotTeam: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col min-h-0 bg-surface-base overflow-hidden">
      <NeuralCommandMap />
    </main>
  );
};
