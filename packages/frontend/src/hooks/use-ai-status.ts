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

export interface PremiumFeatures {
  communications: boolean;
  aftercare: boolean;
  analyticsInsights: boolean;
}

interface AiStatus {
  aiEnabled: boolean;
  features: AiFeatures;
  premiumFeatures: PremiumFeatures;
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
  premiumFeatures: {
    communications: false,
    aftercare: false,
    analyticsInsights: false,
  },
};

export function useAiStatus() {
  const { data: session, status: sessionStatus } = useSession();

  const { data, isLoading: swrLoading } = useSWR<AiStatus>(
    session?.accessToken ? `${API_URL}/api/ai/status` : null,
    createAuthFetcher(session?.accessToken),
    { refreshInterval: 300_000, dedupingInterval: 60_000 },
  );

  const isLoading = sessionStatus === 'loading' || swrLoading || (!data && sessionStatus === 'authenticated');

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
