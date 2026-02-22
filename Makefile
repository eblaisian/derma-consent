.PHONY: dev setup install db db-stop migrate migrate-deploy generate test test-backend test-frontend load-test build clean seed kill-ports help docs docs-build docs-preview

# Helper: source .env then run a command
# Usage: $(call dotenv,my_command)
define dotenv
	set -a && [ -f .env ] && . ./.env; set +a && $1
endef

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ── One-command setup + run ─────────────────────────────────────────

dev: setup kill-ports ## Start everything (DB + backend + frontend)
	@echo "\n\033[32m✓ Starting dev servers...\033[0m"
	@echo "  Backend:  http://localhost:3001"
	@echo "  Frontend: http://localhost:3000\n"
	@set -a && . ./.env; set +a && pnpm dev

setup: .env node_modules db migrate generate ## Install deps, start DB, run migrations
	@echo "\033[32m✓ Setup complete\033[0m"

# ── Individual targets ──────────────────────────────────────────────

.env: ## Create .env from .env.example if missing
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "\033[33m→ Created .env from .env.example\033[0m"; \
	fi

node_modules: package.json pnpm-workspace.yaml ## Install all dependencies
	pnpm install --recursive
	@touch node_modules

db: ## Start PostgreSQL via Docker
	@if ! docker compose ps --status running 2>/dev/null | grep -q db; then \
		echo "\033[33m→ Starting PostgreSQL...\033[0m"; \
		docker compose up -d --wait; \
	else \
		echo "\033[32m✓ PostgreSQL already running\033[0m"; \
	fi

db-stop: ## Stop PostgreSQL
	docker compose down

kill-ports: ## Free ports 3000 and 3001
	@lsof -ti :3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti :3001 | xargs kill -9 2>/dev/null || true

migrate: db .env ## Run Prisma migrations (dev)
	@$(call dotenv,cd packages/backend && npx prisma migrate dev)

migrate-deploy: db .env ## Run Prisma migrations (production)
	@$(call dotenv,cd packages/backend && npx prisma migrate deploy)

generate: .env ## Generate Prisma client
	@$(call dotenv,cd packages/backend && npx prisma generate)

seed: setup ## Seed DB with practice + consents (password: Test1234!)
	@$(call dotenv,cd packages/backend && npx tsx prisma/seed.ts)

# ── Testing ─────────────────────────────────────────────────────────

test: test-backend test-frontend ## Run all tests

test-backend: node_modules ## Run backend tests (GDT service)
	cd packages/backend && npx jest

test-frontend: node_modules ## Run frontend tests (crypto)
	cd packages/frontend && npx vitest run

load-test: ## Run k6 load tests against backend
	k6 run tests/load/consent-submit.js

# ── Build ───────────────────────────────────────────────────────────

build: node_modules generate ## Build both packages for production
	@$(call dotenv,pnpm --filter @derma-consent/backend build)
	@$(call dotenv,pnpm --filter @derma-consent/frontend build)

# ── Documentation ──────────────────────────────────────────────────

docs: node_modules ## Start docs dev server (VitePress)
	pnpm --filter @derma-consent/docs dev

docs-build: node_modules ## Build docs for production
	pnpm --filter @derma-consent/docs build

docs-preview: node_modules ## Preview production docs build
	pnpm --filter @derma-consent/docs preview

# ── Cleanup ─────────────────────────────────────────────────────────

clean: ## Remove node_modules, dist, .next, Docker volumes
	rm -rf node_modules packages/*/node_modules
	rm -rf packages/backend/dist
	rm -rf packages/frontend/.next
	docker compose down -v 2>/dev/null || true
	@echo "\033[32m✓ Cleaned\033[0m"
