import type { MoneyState, BalanceEntry, Invoice, TransactionEntry } from '@/src/types';
// import { paperclip } from '@/src/lib/paperclip';

const USE_PAPERCLIP_MOCK = true;
const USE_CONVEX_MOCK = true;

function generateMockMoneyState(): MoneyState {
  const now = Date.now();

  const balances: BalanceEntry[] = [
    { id: 'b1', label: 'Bybit USDT', amount: 45200.5, currency: 'USDT', source: 'Bybit Futures' },
    { id: 'b2', label: 'Bybit Spot', amount: 1250.0, currency: 'USDT', source: 'Bybit Spot' },
    { id: 'b3', label: 'Opay NGN', amount: 1250000, currency: 'NGN', source: 'Opay' },
    { id: 'b4', label: 'Bank NGN', amount: 3400000, currency: 'NGN', source: 'GTBank' },
    { id: 'b5', label: 'Payoneer USD', amount: 4200, currency: 'USD', source: 'Payoneer' },
  ];

  const invoices: Invoice[] = [
    { id: 'inv-1', client: 'Acme Corp', amount: 4500, currency: 'USD', status: 'overdue', issuedAt: new Date(now - 45 * 86400000).toISOString().slice(0, 10), dueAt: new Date(now - 15 * 86400000).toISOString().slice(0, 10) },
    { id: 'inv-2', client: 'TechStart', amount: 2500, currency: 'USD', status: 'issued', issuedAt: new Date(now - 10 * 86400000).toISOString().slice(0, 10), dueAt: new Date(now + 20 * 86400000).toISOString().slice(0, 10) },
    { id: 'inv-3', client: 'Finance Hub', amount: 1450, currency: 'USD', status: 'paid', issuedAt: new Date(now - 30 * 86400000).toISOString().slice(0, 10), dueAt: new Date(now - 10 * 86400000).toISOString().slice(0, 10) },
    { id: 'inv-4', client: 'RetailPro', amount: 3200, currency: 'NGN', status: 'issued', issuedAt: new Date(now - 5 * 86400000).toISOString().slice(0, 10), dueAt: new Date(now + 25 * 86400000).toISOString().slice(0, 10) },
    { id: 'inv-5', client: 'DevLand', amount: 800, currency: 'USD', status: 'draft', issuedAt: new Date(now - 2 * 86400000).toISOString().slice(0, 10), dueAt: new Date(now + 28 * 86400000).toISOString().slice(0, 10) },
  ];

  const transactions: TransactionEntry[] = [
    { id: 'tx-1', type: 'income', category: 'trading', amount: 1245.5, currency: 'USDT', description: 'Futures PnL (session)', timestamp: new Date(now - 2 * 3600000).toISOString() },
    { id: 'tx-2', type: 'income', category: 'p2p', amount: 1800, currency: 'USDT', description: 'P2P USDT sell', timestamp: new Date(now - 5 * 3600000).toISOString() },
    { id: 'tx-3', type: 'income', category: 'service', amount: 5000, currency: 'USD', description: 'Acme Corp milestone payment', timestamp: new Date(now - 3 * 86400000).toISOString() },
    { id: 'tx-4', type: 'expense', category: 'service', amount: 120, currency: 'USD', description: 'Vercel Pro subscription', timestamp: new Date(now - 7 * 86400000).toISOString() },
    { id: 'tx-5', type: 'income', category: 'futures', amount: 450, currency: 'USDT', description: 'ETH short closed', timestamp: new Date(now - 3600000).toISOString() },
  ];

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  return {
    month,
    currency: 'USD',
    revenue: {
      total: 16700,
      trading: 4200,
      service: 12500,
      deltaVsLastMonth: 0.12,
    },
    balances,
    invoices,
    transactions,
  };
}

export async function fetchMoneyState(): Promise<MoneyState> {
  if (!USE_PAPERCLIP_MOCK) {
    // const data = await paperclip.getBudgetState<MoneyState>();
    // merge with Convex live balances when USE_CONVEX_MOCK is false
    // return data;
  }
  return generateMockMoneyState();
}
