import { p2pTradingState } from './_mock';

export default function handler(req: any, res: any) {
  const timeRange = (req.query.timeRange as string) || '24h';
  const token = (req.query.token as string) || 'USDT';
  const fiat = (req.query.fiat as string) || 'NGN';
  res.status(200).json(p2pTradingState(timeRange, token, fiat));
}
