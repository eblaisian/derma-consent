---
name: pr
description: Create a pull request with proper template and description
argument-hint: "[title]"
disable-model-invocation: true
---

Create a pull request for the current branch.

1. Check current state:
```bash
git status
git log --oneline master..HEAD
git diff master...HEAD --stat
```

2. If on master, create a feature branch first:
```bash
git checkout -b feature/<descriptive-name>
```

3. Push the branch:
```bash
git push -u origin HEAD
```

4. Analyze ALL commits on the branch (not just the last one) and create PR:

Use this format:
```bash
gh pr create --title "$ARGUMENTS" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing what changed and why>

## Changes
<list of key files/modules affected>

## Test plan
- [ ] Backend tests pass (`make test-backend`)
- [ ] Frontend tests pass (`make test-frontend`)
- [ ] Production build succeeds (`make build`)
- [ ] Manual testing done for affected flows

## Security checklist
- [ ] No plaintext PII — all patient data uses encrypted_* columns
- [ ] Auth guards present on new endpoints
- [ ] No hardcoded secrets or credentials

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If no title provided in $ARGUMENTS, generate one from the commits (under 70 chars).
