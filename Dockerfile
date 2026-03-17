# =============================================================================
# Banjir Indonesia Dashboard — Dockerfile
# Stack : Next.js 16 · Tailwind CSS 4 · DuckDB-WASM · Deck.gl
# Author: Muhammad Ayyas
#
# Build stages
#   1. deps    → install all npm deps (cache-friendly layer)
#   2. builder → compile the Next.js app (webpack, no Turbopack)
#   3. runner  → lean production image (no devDeps, no source files)
#
# Heroku notes
#   • Heroku Container Stack injects $PORT at runtime — not compile time.
#   • CMD uses ${PORT:-3000} so `docker run` locally still works on port 3000.
#   • The 73 MB parquet file is baked into the image (public/) so no CDN needed.
# =============================================================================

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Alpine needs libc6-compat for some native Node modules
RUN apk add --no-cache libc6-compat

# Copy manifests first to leverage Docker layer caching.
# Only re-runs `npm ci` when package.json / package-lock.json change.
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Inherit all dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source (src/, public/, next.config.ts, tsconfig.json, etc.)
COPY . .

# Disable Next.js anonymous telemetry during CI/CD build
ENV NEXT_TELEMETRY_DISABLED=1

# `npm run build` resolves to `next build --webpack`
# (see package.json) — the --webpack flag bypasses Turbopack,
# which has a known incompatibility with @duckdb/duckdb-wasm ≥ 1.33.
RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install *only* production dependencies (excludes @types/*, eslint, tailwind)
# The `next` binary is in dependencies, so it is included here.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy the compiled Next.js output
COPY --from=builder /app/.next ./.next

# Copy public assets — includes the 73 MB parquet file and GeoJSON.
# DuckDB-WASM fetches these at runtime from the browser.
COPY --from=builder /app/public ./public

# next.config.ts is read by `next start` for runtime headers/rewrites
COPY --from=builder /app/next.config.ts ./next.config.ts

# Non-root user for security hardening
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs
USER nextjs

# Document the default port (Heroku overrides this via $PORT env var)
EXPOSE 3000

# Heroku sets $PORT dynamically at container start.
# We pass it to `next start -p` so the server binds to the correct port.
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3000}"]
