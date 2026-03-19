'use client';

import { useAiStatus, type PremiumFeatures } from '@/hooks/use-ai-status';

interface PremiumFeatureGateProps {
  feature: keyof PremiumFeatures;
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export function PremiumFeatureGate({ feature, children, fallback }: PremiumFeatureGateProps) {
  const { features, premiumFeatures } = useAiStatus();

  if (features[feature]) return <>{children}</>;
  if (premiumFeatures[feature]) return <>{fallback}</>;
  return null;
}
