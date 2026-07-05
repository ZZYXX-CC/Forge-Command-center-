import type { ClientsState, Client, ClientProject } from '@/src/types';
// import { paperclip } from '@/src/lib/paperclip';

const USE_PAPERCLIP_MOCK = true;

function generateMockClientsState(): ClientsState {
  const now = Date.now();

  const clients: Client[] = [
    {
      id: 'c1',
      name: 'Acme Corp',
      status: 'active',
      projects: [
        { id: 'p1a', name: 'Brand Refresh', status: 'active', nextDeadline: new Date(now + 2 * 86400000).toISOString().slice(0, 10) },
        { id: 'p1b', name: 'Marketing Site', status: 'completed' },
      ] as ClientProject[],
      outstandingAmount: 4500,
      currency: 'USD',
      lastContactAt: new Date(now - 3 * 86400000).toISOString(),
      notes: ['Invoice #442 overdue - follow up today'],
    },
    {
      id: 'c2',
      name: 'TechStart',
      status: 'active',
      projects: [
        { id: 'p2a', name: 'SaaS Platform', status: 'active', nextDeadline: new Date(now + 5 * 86400000).toISOString().slice(0, 10) },
      ] as ClientProject[],
      outstandingAmount: 0,
      currency: 'USD',
      lastContactAt: new Date(now - 1 * 86400000).toISOString(),
      notes: ['API integration in progress'],
    },
    {
      id: 'c3',
      name: 'RetailPro',
      status: 'overdue',
      projects: [
        { id: 'p3a', name: 'E-commerce', status: 'active', nextDeadline: new Date(now - 1 * 86400000).toISOString().slice(0, 10) },
        { id: 'p3b', name: 'Product Shoots', status: 'active', nextDeadline: new Date(now + 3 * 86400000).toISOString().slice(0, 10) },
      ] as ClientProject[],
      outstandingAmount: 3200,
      currency: 'NGN',
      lastContactAt: new Date(now - 7 * 86400000).toISOString(),
      notes: ['Checkout bug - awaiting payment gateway docs'],
    },
    {
      id: 'c4',
      name: 'Finance Hub',
      status: 'active',
      projects: [
        { id: 'p4a', name: 'Dashboard', status: 'active', nextDeadline: new Date(now + 7 * 86400000).toISOString().slice(0, 10) },
      ] as ClientProject[],
      outstandingAmount: 0,
      currency: 'USD',
      lastContactAt: new Date(now - 14 * 86400000).toISOString(),
      notes: [],
    },
    {
      id: 'c5',
      name: 'DevLand',
      status: 'archived',
      projects: [
        { id: 'p5a', name: 'Staging Setup', status: 'completed' },
      ] as ClientProject[],
      outstandingAmount: 0,
      currency: 'USD',
      lastContactAt: new Date(now - 90 * 86400000).toISOString(),
      notes: ['Project completed Q2 - may return for new work'],
    },
  ];

  return { clients };
}

export async function fetchClientsState(): Promise<ClientsState> {
  if (!USE_PAPERCLIP_MOCK) {
    // const data = await paperclip.getClientsState<ClientsState>();
    // return data;
  }
  return generateMockClientsState();
}
