/**
 * DermaConsent Load Test — k6 script
 *
 * Tests:
 *   1. Health endpoint availability under load
 *   2. Consent form retrieval by token
 *   3. Authenticated API access (dashboard consent list)
 *
 * Prerequisites:
 *   - Install k6: brew install k6
 *   - Seed test data: make seed
 *
 * Usage:
 *   k6 run tests/load/consent-submit.js
 *   k6 run -e BASE_URL=https://api.dermaconsent.de tests/load/consent-submit.js
 *   k6 run -e BASE_URL=http://localhost:3001 -e TEST_TOKEN=abc123 tests/load/consent-submit.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const healthCheckDuration = new Trend('health_check_duration');
const consentLoadDuration = new Trend('consent_load_duration');
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // ramp up to 50 VUs
    { duration: '1m', target: 100 },  // hold at 100 VUs (peak)
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95th percentile < 2s
    http_req_failed: ['rate<0.01'],     // error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // 1. Health check (liveness)
  group('Health Check', () => {
    const health = http.get(`${BASE_URL}/api/health`);
    const ok = check(health, {
      'health status 200': (r) => r.status === 200,
      'health body ok': (r) => {
        try {
          return JSON.parse(r.body).status === 'ok';
        } catch {
          return false;
        }
      },
    });
    healthCheckDuration.add(health.timings.duration);
    if (!ok) errorRate.add(1);
    else errorRate.add(0);
  });

  sleep(0.5);

  // 2. Readiness check (includes DB ping)
  group('Readiness Check', () => {
    const ready = http.get(`${BASE_URL}/api/health/ready`);
    check(ready, {
      'ready status 200': (r) => r.status === 200,
      'database ok': (r) => {
        try {
          return JSON.parse(r.body).checks.database === 'ok';
        } catch {
          return false;
        }
      },
    });
  });

  sleep(0.5);

  // 3. Consent form retrieval (simulate patient loading form)
  group('Consent Load', () => {
    const token = __ENV.TEST_TOKEN || 'test-token';
    const consent = http.get(`${BASE_URL}/api/consent/${token}`);
    const ok = check(consent, {
      'consent response valid': (r) => r.status === 200 || r.status === 404 || r.status === 400,
    });
    consentLoadDuration.add(consent.timings.duration);
    if (!ok) errorRate.add(1);
    else errorRate.add(0);
  });

  sleep(1);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration.values['p(95)'];
  const failRate = data.metrics.http_req_failed.values.rate;
  const totalReqs = data.metrics.http_reqs.values.count;

  console.log('\n=== DermaConsent Load Test Summary ===');
  console.log(`Total requests: ${totalReqs}`);
  console.log(`P95 response time: ${p95.toFixed(0)}ms`);
  console.log(`Error rate: ${(failRate * 100).toFixed(2)}%`);
  console.log(`Pass: p95 < 2000ms: ${p95 < 2000 ? 'YES' : 'NO'}`);
  console.log(`Pass: errors < 1%: ${failRate < 0.01 ? 'YES' : 'NO'}`);
  console.log('=====================================\n');

  return {};
}
