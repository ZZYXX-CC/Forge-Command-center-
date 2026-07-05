import type { ContentState, ContentItem } from '@/src/types';
// import { paperclip } from '@/src/lib/paperclip';

const USE_PAPERCLIP_MOCK = true;

function generateMockContentState(): ContentState {
  const now = Date.now();

  const pipeline: ContentItem[] = [
    { id: 'c1', title: 'Summer Collection - Look 1', type: 'PHOTO', stage: 'SHOT', client: 'RetailPro', isPersonal: false, dueAt: new Date(now + 5 * 86400000).toISOString().slice(0, 10), shootDate: new Date(now - 2 * 86400000).toISOString().slice(0, 10) },
    { id: 'c2', title: 'Brand Story Reel', type: 'REEL', stage: 'EDITING', isPersonal: true, dueAt: new Date(now + 10 * 86400000).toISOString().slice(0, 10), shootDate: new Date(now - 5 * 86400000).toISOString().slice(0, 10) },
    { id: 'c3', title: 'Product Demo Video', type: 'VIDEO', stage: 'REVIEW', client: 'TechStart', isPersonal: false, dueAt: new Date(now + 3 * 86400000).toISOString().slice(0, 10), shootDate: new Date(now - 7 * 86400000).toISOString().slice(0, 10) },
    { id: 'c4', title: 'Office Tour BTS', type: 'PHOTO', stage: 'SCHEDULED', isPersonal: true, dueAt: new Date(now + 14 * 86400000).toISOString().slice(0, 10), shootDate: new Date(now + 7 * 86400000).toISOString().slice(0, 10) },
    { id: 'c5', title: 'Acme Campaign Assets', type: 'PHOTO', stage: 'DELIVERED', client: 'Acme Corp', isPersonal: false, shootDate: new Date(now - 14 * 86400000).toISOString().slice(0, 10) },
    { id: 'c6', title: 'nuvue Portfolio Update', type: 'REEL', stage: 'EDITING', isPersonal: true, dueAt: new Date(now + 8 * 86400000).toISOString().slice(0, 10) },
    { id: 'c7', title: 'RetailPro Look 2-4', type: 'PHOTO', stage: 'SHOT', client: 'RetailPro', isPersonal: false, dueAt: new Date(now + 5 * 86400000).toISOString().slice(0, 10), shootDate: new Date(now - 1 * 86400000).toISOString().slice(0, 10) },
  ];

  const upcomingShoots = pipeline.filter(
    (c) => c.stage === 'SCHEDULED' && c.shootDate
  );

  const pendingEdits = pipeline.filter(
    (c) => c.stage === 'EDITING' || c.stage === 'REVIEW'
  );

  return {
    pipeline,
    upcomingShoots,
    pendingEdits,
  };
}

export async function fetchContentState(): Promise<ContentState> {
  if (!USE_PAPERCLIP_MOCK) {
    // const data = await paperclip.getContentState<ContentState>();
    // return data;
  }
  return generateMockContentState();
}
