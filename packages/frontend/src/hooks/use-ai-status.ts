import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { API_URL, createAuthFetcher } from '@/lib/api';

interface AiFeatures {
  explainer: boolean;
  communications: boolean;
  aftercare: boolean;
  analyticsInsights: boolean;
  noShowRisk: boolean;
  retention: boolean;
}

interface AiStatus {
  aiEnabled: boolean;
  features: AiFeatures;
}

const DEFAULT_STATUS: AiStatus = {
  aiEnabled: false,
  features: {
    explainer: false,
    communications: false,
    aftercare: false,
    analyticsInsights: false,
    noShowRisk: true,
    retention: true,
  },
};

export function useAiStatus() {
  const { data: session } = useSession();

  const { data, isLoading } = useSWR<AiStatus>(
    session?.accessToken ? `${API_URL}/api/ai/status` : null,
    createAuthFetcher(session?.accessToken),
    { refreshInterval: 300_000, dedupingInterval: 60_000 },
  );

  return {
    ...(data || DEFAULT_STATUS),
    isLoading,
  };
}

const publicFetcher = (url: string) =>
  fetch(url).then((res) => (res.ok ? res.json() : { aiEnabled: false }));

export function usePublicAiStatus() {
  const { data, isLoading } = useSWR<{ aiEnabled: boolean }>(
    `${API_URL}/api/ai/public-status`,
    publicFetcher,
    { refreshInterval: 300_000, dedupingInterval: 60_000 },
  );

  return {
    aiEnabled: data?.aiEnabled ?? false,
    isLoading,
  };
}
