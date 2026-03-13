FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/backend/package.json ./packages/backend/
RUN pnpm install --frozen-lockfile --filter @derma-consent/backend

FROM node:20-alpine AS build
WORKDIR /app/packages/backend
RUN corepack enable pnpm
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/packages/backend/node_modules ./node_modules
COPY packages/backend/ .
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

ENV NODE_ENV=production

COPY --from=build /app/packages/backend/dist ./dist
COPY --from=build /app/packages/backend/node_modules ./node_modules
COPY --from=build /app/packages/backend/prisma ./prisma
COPY --from=build /app/packages/backend/package.json ./package.json

USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"]
