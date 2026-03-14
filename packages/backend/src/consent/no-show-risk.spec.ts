import { computeNoShowRisk } from './no-show-risk';

describe('computeNoShowRisk', () => {
  // Use fixed "now" — a Wednesday (day 3)
  const FIXED_NOW = new Date('2026-03-11T12:00:00Z'); // Wednesday

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const hours = (h: number) => h * 3600_000;
  const days = (d: number) => d * 24 * 3600_000;

  const makeConsent = (type: string, createdAt: Date, expiresAt: Date) => ({
    type,
    createdAt,
    expiresAt,
  });

  it('returns LOW for fresh BOTOX on weekday (0pt + 0pt + 0pt = 0)', () => {
    // Created 1 hour ago on Wed, expires in 7 days
    const created = new Date(FIXED_NOW.getTime() - hours(1));
    const expires = new Date(created.getTime() + days(7));
    expect(computeNoShowRisk(makeConsent('BOTOX', created, expires))).toBe('LOW');
  });

  it('returns LOW for FILLER at 30% consumed on weekday (0pt + 0pt + 0pt = 0)', () => {
    const created = new Date(FIXED_NOW.getTime() - days(2.1)); // 30% of 7 days
    const expires = new Date(created.getTime() + days(7));
    expect(computeNoShowRisk(makeConsent('FILLER', created, expires))).toBe('LOW');
  });

  it('returns MEDIUM for MICRONEEDLING at 50% on weekday (1pt + 1pt + 0pt = 2)', () => {
    const created = new Date(FIXED_NOW.getTime() - days(3.5)); // 50%
    const expires = new Date(created.getTime() + days(7));
    expect(computeNoShowRisk(makeConsent('MICRONEEDLING', created, expires))).toBe('MEDIUM');
  });

  it('returns MEDIUM for PRP at 45% on Sunday (1pt + 1pt + 1pt = 3)', () => {
    // Created on Sunday 2026-03-08
    const created = new Date('2026-03-08T00:00:00Z'); // Sunday
    const expires = new Date(created.getTime() + days(7));
    // elapsed = Wed 12:00 - Sun 00:00 = ~3.5 days = 50% → 1pt
    expect(computeNoShowRisk(makeConsent('PRP', created, expires))).toBe('MEDIUM');
  });

  it('returns HIGH for LASER at 90% on Saturday (3pt + 2pt + 1pt = 6)', () => {
    // Created on Saturday 2026-03-07, 7 day window
    const created = new Date('2026-03-05T00:00:00Z'); // Thursday actually — need Sat
    const createdSat = new Date('2026-03-07T00:00:00Z'); // Saturday
    const expires = new Date(createdSat.getTime() + days(7)); // expires Mar 14
    // elapsed = Wed Mar 11 12:00 - Sat Mar 7 00:00 = 4.5 days = 64% → 1pt time
    // Need higher consumed. Use shorter window.
    const created2 = new Date('2026-03-07T00:00:00Z'); // Saturday
    const expires2 = new Date(created2.getTime() + days(5)); // 5 day window
    // elapsed = 4.5 days / 5 days = 90% → 3pt time + 2pt LASER + 1pt weekend = 6 = HIGH
    expect(computeNoShowRisk(makeConsent('LASER', created2, expires2))).toBe('HIGH');
  });

  it('returns HIGH for CHEMICAL_PEEL at 75% on weekday (2pt + 2pt + 0pt = 4)', () => {
    const created = new Date(FIXED_NOW.getTime() - days(5.25)); // 75% of 7
    const expires = new Date(created.getTime() + days(7));
    expect(computeNoShowRisk(makeConsent('CHEMICAL_PEEL', created, expires))).toBe('HIGH');
  });

  it('returns MEDIUM for BOTOX at 88% on weekday (3pt + 0pt + 0pt = 3)', () => {
    const created = new Date(FIXED_NOW.getTime() - days(6.16)); // 88% of 7
    const expires = new Date(created.getTime() + days(7));
    expect(computeNoShowRisk(makeConsent('BOTOX', created, expires))).toBe('MEDIUM');
  });

  it('returns HIGH for unknown type at 90% on weekday (3pt + 1pt + 0pt = 4)', () => {
    const created = new Date(FIXED_NOW.getTime() - days(6.3)); // 90% of 7
    const expires = new Date(created.getTime() + days(7));
    expect(computeNoShowRisk(makeConsent('UNKNOWN', created, expires))).toBe('HIGH');
  });
});
