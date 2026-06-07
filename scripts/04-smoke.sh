#!/usr/bin/env bash
# ─── Nazrah Al Alam — Phase 4.2 Smoke Test ────────────────────────────────────
# Runs each new image off-traffic, verifies it serves the Next.js routes
# correctly (/en, /ar), and checks for new section markers (testimonial, faq).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/env.sh"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: env.sh not found. Run Phase 0.2 first."
    exit 1
fi
source "$ENV_FILE"

PARENT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_PATH="${REPO:-$PARENT_DIR}/.env"

NEW_SHA=$(git rev-parse --short HEAD)
if [ -z "$NEW_SHA" ]; then
    echo "ERROR: Could not determine git short SHA."
    exit 1
fi

PORT=8080

for service in "${APP_SERVICES[@]}"; do
    clean_name="${service#nazrah-}"
    image_name="nazrah-${clean_name}:${NEW_SHA}"
    container_name="smoke-test-${clean_name}-${NEW_SHA}"
    
    echo "========================================================================"
    echo "Smoke testing image: $image_name"
    echo "========================================================================"
    
    # Check if image exists
    if ! docker image inspect "$image_name" > /dev/null 2>&1; then
        echo "ERROR: Image $image_name not found. Run 04-build.sh first."
        exit 1
    fi
    
    echo "Starting container $container_name on port $PORT..."
    # Ensure no leftover container
    docker rm -f "$container_name" >/dev/null 2>&1 || true
    
    ENV_ARGS=""
    if [ -f "$ENV_PATH" ]; then
        ENV_ARGS="--env-file $ENV_PATH"
    fi
    
    # Run container off-traffic
    # Note: Using $ENV_ARGS unquoted allows word splitting intentionally for --env-file /path/.env
    # shellcheck disable=SC2086
    docker run -d $ENV_ARGS -e NODE_ENV=production --name "$container_name" -p "${PORT}:80" "$image_name"
    
    # Setup cleanup trap to ensure container is removed even if script fails
    trap 'echo "Cleaning up container $container_name..."; docker rm -f "$container_name" >/dev/null 2>&1 || true' EXIT
    
    echo "Waiting for service to become ready..."
    # Nginx starts instantly but Next.js takes a few seconds. Wait until /en returns 200.
    MAX_RETRIES=20
    RETRY_COUNT=0
    READY=false
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/en || true)
        if [ "$STATUS" = "200" ]; then
            READY=true
            break
        fi
        echo "  Attempt $((RETRY_COUNT+1))/$MAX_RETRIES: HTTP Status $STATUS, waiting 2s..."
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT+1))
    done
    
    if [ "$READY" != "true" ]; then
        echo "ERROR: Container $container_name failed to become ready (status $STATUS)."
        echo "--- Container Logs ---"
        docker logs --tail 50 "$container_name"
        exit 1
    fi
    
    echo "Service is ready. Running smoke tests..."
    
    # Test 1: Check /en
    echo "Testing /en..."
    EN_BODY=$(curl -s http://localhost:${PORT}/en)
    if ! echo "$EN_BODY" | grep -qi "testimonial"; then
        echo "ERROR: Marker 'testimonial' not found in /en response."
        exit 1
    fi
    if ! echo "$EN_BODY" | grep -qi "faq"; then
        echo "ERROR: Marker 'faq' not found in /en response."
        exit 1
    fi
    echo "  ✅ /en passed."
    
    # Test 2: Check /ar
    echo "Testing /ar..."
    AR_BODY=$(curl -s http://localhost:${PORT}/ar)
    if ! echo "$AR_BODY" | grep -qi "testimonial"; then
        echo "ERROR: Marker 'testimonial' not found in /ar response."
        exit 1
    fi
    if ! echo "$AR_BODY" | grep -qi "faq"; then
        echo "ERROR: Marker 'faq' not found in /ar response."
        exit 1
    fi
    echo "  ✅ /ar passed."
    
    echo "Smoke test passed. Removing container $container_name..."
    docker rm -f "$container_name" >/dev/null
    trap - EXIT # Clear trap since we removed it successfully
    
    echo "✅ Image $image_name passed smoke testing."
done

echo "========================================================================"
echo "All smoke tests completed successfully."
echo "========================================================================"
