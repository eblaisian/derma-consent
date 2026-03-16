import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { API_URL, createAuthFetcher } from '@/lib/api';

interface FeatureFlags {
  whatsappEnabled: boolean;
}

const DEFAULTS: FeatureFlags = {
  whatsappEnabled: false,
};

export function useFeatureFlags() {
  const { data: session } = useSession();

  const { data, isLoading } = useSWR<FeatureFlags>(
    session?.accessToken ? `${API_URL}/api/features` : null,
    createAuthFetcher(session?.accessToken),
    { refreshInterval: 300_000, dedupingInterval: 60_000 },
  );

  return {
    ...(data || DEFAULTS),
    isLoading,
  };
}
