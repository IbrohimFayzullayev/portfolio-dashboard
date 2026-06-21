# syntax=docker/dockerfile:1

# ---- base (pnpm via corepack) ----
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The dashboard calls the API from the BROWSER (React Query), so this MUST be
# the public API URL reachable from the client, not the internal compose name.
ARG NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
# This repo has no /public dir; create one so the runtime COPY succeeds.
RUN mkdir -p public && pnpm build

# ---- runtime ----
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3001
CMD ["node", "server.js"]
