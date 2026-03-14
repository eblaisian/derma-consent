---
name: deploy
description: Deploy to staging or production on OCI Kubernetes
argument-hint: "[staging|production]"
disable-model-invocation: true
---

Deploy derma-consent to the specified environment. Default: staging.

Environment: $ARGUMENTS (default: staging)

## Pre-deploy checks

1. Ensure all tests pass:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && make test
```

2. Ensure production build succeeds:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && make build
```

3. Check current git status — warn if there are uncommitted changes:
```bash
git status --short
```

4. Check current branch — warn if not on master for production deploys.

## Deploy

If deploying to **staging**:
- Confirm with the user before proceeding
- Push to master triggers the GitHub Actions deploy workflow automatically
- Check workflow status: `gh run list --workflow=deploy.yml --limit=3`
- Monitor: `gh run watch`

If deploying to **production**:
- Remind user that production deploy requires manual approval in GitHub Actions
- Check staging is healthy first
- Push to master, then approve the production environment in GitHub Actions

## Post-deploy

- Check workflow status: `gh run list --workflow=deploy.yml --limit=1`
- Report deployment outcome
