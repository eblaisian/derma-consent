'use client';

import { signOut, useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { API_URL } from './api';

export function useAuthFetch() {
  const { data: session } = useSession();

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      if (session?.accessToken) {
        headers.set('Authorization', `Bearer ${session.accessToken}`);
      }
      if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        toast.error('Session expired. Please log in again.');
        await signOut({ redirectTo: '/login' });
        throw new Error('Session expired');
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Request failed');
      }

      return res.json();
    },
    [session?.accessToken],
  );

  return authFetch;
}
