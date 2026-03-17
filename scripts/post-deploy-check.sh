#!/usr/bin/env bash
# =============================================================================
# post-deploy-check.sh — Banjir Indonesia Dashboard: post-deployment checks
# Author : Muhammad Ayyas — IT Business Analyst, PT Dahana
# Usage  : ./scripts/post-deploy-check.sh [APP_URL]
#          APP_URL defaults to https://$HEROKU_APP_NAME.herokuapp.com
#
# What this script checks:
#   1. HTTP 200 on the dashboard homepage
#   2. The parquet data file is served and has the expected size (~73 MB)
#   3. The GeoJSON provinces file is reachable
#
# Note: DuckDB-WASM runs entirely in the browser — the 370,156 row count
#       cannot be verified server-side. This script confirms all static
#       assets are reachable; open the app in a browser to verify the map.
# =============================================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

ok()   { echo -e "${GREEN}✅ $*${NC}"; }
fail() { echo -e "${RED}❌ $*${NC}"; exit 1; }
info() { echo -e "${BLUE}ℹ  $*${NC}"; }
warn() { echo -e "${YELLOW}⚠  $*${NC}"; }

# ── Resolve app URL ───────────────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
  APP_URL="${1%/}"          # strip trailing slash if supplied
elif [ -n "${HEROKU_APP_NAME:-}" ]; then
  APP_URL="https://${HEROKU_APP_NAME}.herokuapp.com"
else
  fail "No APP_URL provided.\n  Usage: $0 <app-url>\n  Or set HEROKU_APP_NAME env var."
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Banjir Indonesia — Post-Deployment Check${NC}"
echo -e "${BLUE}  Target: ${APP_URL}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

PASS=0
FAIL=0

# ── Helper: HTTP check ────────────────────────────────────────────────────────
check_http() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local extra_flags="${4:-}"

  # shellcheck disable=SC2086
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 30 --retry 2 --retry-delay 3 \
    $extra_flags "$url")

  if [ "$status" -eq "$expected" ] || \
     { [ "$expected" -eq 200 ] && [ "$status" -eq 206 ]; }; then
    ok "$label (HTTP $status)"
    PASS=$((PASS + 1))
    echo "$status"   # return value
  else
    warn "$label returned HTTP $status (expected $expected)"
    FAIL=$((FAIL + 1))
    echo "$status"
  fi
}

# ── 1. Homepage ────────────────────────────────────────────────────────────────
info "Checking dashboard homepage…"
check_http "Homepage" "$APP_URL" 200 > /dev/null

# ── 2. Parquet file ────────────────────────────────────────────────────────────
info "Checking flood data file (indonesia_floods.parquet)…"
PARQUET_URL="$APP_URL/indonesia_floods.parquet"

# Fetch only the first 1 KB to avoid downloading the full 73 MB
PARQUET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 30 -r 0-1023 "$PARQUET_URL")

if [ "$PARQUET_STATUS" -eq 200 ] || [ "$PARQUET_STATUS" -eq 206 ]; then
  # Check Content-Length header to verify the file wasn't truncated
  CONTENT_LENGTH=$(curl -sI --max-time 15 "$PARQUET_URL" \
    | grep -i "^content-length:" | awk '{print $2}' | tr -d '\r')

  if [ -n "$CONTENT_LENGTH" ]; then
    SIZE_MB=$(echo "scale=1; $CONTENT_LENGTH / 1048576" | bc)
    ok "Parquet file accessible (HTTP $PARQUET_STATUS) — ${SIZE_MB} MB"
    # Expected: ~73 MB (70–80 MB)
    SIZE_INT=$(echo "$CONTENT_LENGTH / 1048576" | bc)
    if [ "$SIZE_INT" -lt 50 ]; then
      warn "File size looks too small — expected ~73 MB, got ${SIZE_MB} MB"
    fi
  else
    ok "Parquet file accessible (HTTP $PARQUET_STATUS) — size unknown"
  fi
  PASS=$((PASS + 1))
else
  warn "Parquet file not accessible (HTTP $PARQUET_STATUS)"
  FAIL=$((FAIL + 1))
fi

# ── 3. GeoJSON provinces file ─────────────────────────────────────────────────
info "Checking provinces GeoJSON (indonesia_provinces.geojson)…"
check_http "Provinces GeoJSON" \
  "$APP_URL/indonesia_provinces.geojson" 200 > /dev/null

# ── 4. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "  Results: ${GREEN}${PASS} passed${NC} · ${RED}${FAIL} failed${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  fail "One or more checks failed. Review the output above."
fi

ok "All checks passed!"
echo ""
info "DuckDB-WASM loads 370,156 flood records client-side."
info "Open ${APP_URL} in a browser to verify the dashboard renders."
info "Expected: Map of Indonesia with choropleth flood overlay."
echo ""
