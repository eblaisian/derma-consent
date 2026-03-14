---
name: dev-start
description: Start the full development environment
disable-model-invocation: true
---

Start the derma-consent development environment:

1. Check if PostgreSQL is running:
```bash
pg_isready -h localhost -p 5432
```

If not running, start it:
```bash
brew services start postgresql@16
```

2. Start backend and frontend in development mode:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && make dev
```

Report the status of each service.
