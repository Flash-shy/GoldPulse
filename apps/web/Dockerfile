# syntax=docker/dockerfile:1
# Build from repository root: docker build -f apps/web/Dockerfile .
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_BASE=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared ./packages/shared
# `COPY apps/web` overwrites workspace `apps/web/node_modules` from the deps stage; reinstall before build.
RUN npm ci
WORKDIR /app/apps/web
RUN node ./node_modules/next/dist/bin/next build --webpack
WORKDIR /app

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
