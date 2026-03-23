import type { SendStatus } from './types';

function getKey(campaign: string, email: string): string {
  return `campaign_${campaign}_${email}`;
}

export function loadStatus(campaign: string, email: string): SendStatus {
  if (typeof window === 'undefined') return 'pending';
  return (localStorage.getItem(getKey(campaign, email)) as SendStatus) || 'pending';
}

export function saveStatus(campaign: string, email: string, status: SendStatus) {
  localStorage.setItem(getKey(campaign, email), status);
}
