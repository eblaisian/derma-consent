export type NoShowRisk = 'LOW' | 'MEDIUM' | 'HIGH';

const ANXIETY_TIERS: Record<string, number> = {
  BOTOX: 0,
  FILLER: 0,
  MICRONEEDLING: 1,
  PRP: 1,
  LASER: 2,
  CHEMICAL_PEEL: 2,
};

export function computeNoShowRisk(consent: {
  type: string;
  createdAt: Date;
  expiresAt: Date;
}): NoShowRisk {
  const now = Date.now();
  const created = consent.createdAt.getTime();
  const expires = consent.expiresAt.getTime();
  const totalWindow = expires - created;
  const elapsed = now - created;
  const percentConsumed = totalWindow > 0 ? elapsed / totalWindow : 1;

  let score = 0;

  // Signal 1: Time window consumed (0-3 points)
  if (percentConsumed >= 0.85) {
    score += 3;
  } else if (percentConsumed >= 0.7) {
    score += 2;
  } else if (percentConsumed >= 0.4) {
    score += 1;
  }

  // Signal 2: Procedure anxiety tier (0-2 points)
  score += ANXIETY_TIERS[consent.type] ?? 1;

  // Signal 3: Weekend creation (0-1 point)
  const dayOfWeek = consent.createdAt.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    score += 1;
  }

  // Map total score (0-6) to risk level
  if (score <= 1) return 'LOW';
  if (score <= 3) return 'MEDIUM';
  return 'HIGH';
}
