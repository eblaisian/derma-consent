FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile --filter @derma-consent/frontend

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/frontend/node_modules ./packages/frontend/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY packages/frontend/ ./packages/frontend/

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @derma-consent/frontend build

FROM node:20-alpine AS runner
WORKDIR /app/packages/frontend

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/packages/frontend/public ./public
COPY --from=build /app/packages/frontend/.next/standalone ./../../
COPY --from=build /app/packages/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
