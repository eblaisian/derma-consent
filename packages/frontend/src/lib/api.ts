import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function handleResponse(res: Response) {
  if (res.status === 401) {
    toast.error('Session expired. Please log in again.');
    await signOut({ redirectTo: '/login' });
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export function createAuthFetcher(accessToken?: string) {
  return (url: string) =>
    fetch(url, {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    }).then(handleResponse);
}

export const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  });
