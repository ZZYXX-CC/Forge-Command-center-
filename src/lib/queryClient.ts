import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

export const REFETCH_INTERVALS = {
  overview: 10_000,
  trading: 5_000,
  p2p: 15_000,
  sites: 60_000,
  money: 30_000,
  tasks: 30_000,
  clients: 60_000,
  team: 15_000,
  content: 60_000,
} as const;
