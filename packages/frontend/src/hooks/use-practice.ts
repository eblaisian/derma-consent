'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import type { Practice } from '@/lib/types';

export function usePractice() {
  const { data: session, status } = useSession();
  const practiceId = session?.user?.practiceId ?? null;
  const accessToken = session?.accessToken;

  const { data: practice, isLoading: swrLoading, error, mutate } = useSWR<Practice>(
    practiceId && accessToken
      ? `${API_URL}/api/practice`
      : null,
    createAuthFetcher(accessToken),
  );

  return {
    practiceId,
    practice: practice ?? null,
    isLoading: status === 'loading' || swrLoading,
    error,
    session,
    mutate,
  };
}
