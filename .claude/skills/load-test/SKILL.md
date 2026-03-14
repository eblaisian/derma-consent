---
name: load-test
description: Run k6 load tests against the API
disable-model-invocation: true
---

Run k6 load tests for derma-consent.

1. Verify the dev environment is running:
```bash
curl -s http://localhost:3001/health | head -1
```

If not running, warn the user to start it first with `/dev-start`.

2. Run load tests:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && npx k6 run tests/load/consent-submit.js
```

3. Report results:
- Request rate (req/s)
- Response times (p50, p95, p99)
- Error rate
- Whether thresholds passed (p95 < 2s, error rate < 1%)
