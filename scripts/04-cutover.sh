#!/usr/bin/env bash
# ─── Nazrah Al Alam — Phase 4.3 Zero-Downtime Cutover ─────────────────────────
# Performs a rolling, zero-downtime deployment (blue/green) via Docker Compose.
# Traefik will route traffic to both containers while the new one starts, and
# only when healthy, the old container is removed.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/env.sh"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: env.sh not found."
    exit 1
fi
source "$ENV_FILE"

PARENT_DIR="$(dirname "$SCRIPT_DIR")"

NEW_SHA=$(git rev-parse --short HEAD)
if [ -z "$NEW_SHA" ]; then
    echo "ERROR: Could not determine git short SHA."
    exit 1
fi

echo "========================================================================"
echo "          ZERO-DOWNTIME CUTOVER SCRIPT"
echo "========================================================================"
echo "Deploying Git SHA: $NEW_SHA"

for service in "${APP_SERVICES[@]}"; do
    echo ""
    echo "------------------------------------------------------------------------"
    echo "SERVICE: $service"
    echo "------------------------------------------------------------------------"
    
    # 1. Identify the current running old container
    echo "Identifying current active container for $service..."
    OLD_CONTAINER_ID=$(docker compose -f "$PARENT_DIR/docker-compose.yml" ps -q "$service" | head -n 1 || true)
    
    if [ -z "$OLD_CONTAINER_ID" ]; then
        echo "No running container found for $service. Performing a clean scale-up to 1."
        APP_TAG="${NEW_SHA}" docker compose -f "$PARENT_DIR/docker-compose.yml" up -d --no-deps "$service"
        echo "✅ Deployment completed for $service."
        continue
    fi
    
    echo "Found old container ID: $OLD_CONTAINER_ID"
    
    # 2. Scale Up (Start new container alongside old)
    echo ""
    echo "Step 1: Scaling up to 2 containers (Old + New)..."
    echo "Executing: APP_TAG=${NEW_SHA} docker compose up -d --scale ${service}=2 --no-recreate --no-deps ${service}"
    APP_TAG="${NEW_SHA}" docker compose -f "$PARENT_DIR/docker-compose.yml" up -d --scale "${service}=2" --no-recreate --no-deps "$service"
    
    # 3. Verify Healthcheck of New Container
    echo ""
    echo "Step 2: Waiting for Traefik healthcheck on new container..."
    
    # Find the new container ID
    NEW_CONTAINER_ID=$(docker compose -f "$PARENT_DIR/docker-compose.yml" ps -q "$service" | grep -v "^${OLD_CONTAINER_ID}$" | head -n 1 || true)
    
    if [ -z "$NEW_CONTAINER_ID" ]; then
        echo "ERROR: Failed to identify the newly created container!"
        exit 1
    fi
    
    echo "New container ID: $NEW_CONTAINER_ID"
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    HEALTHY=false
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$NEW_CONTAINER_ID" 2>/dev/null || echo "unknown")
        
        if [ "$STATUS" = "healthy" ]; then
            HEALTHY=true
            break
        elif [ "$STATUS" = "unhealthy" ]; then
            echo "ERROR: New container became unhealthy during startup!"
            break
        fi
        
        echo "  Attempt $((RETRY_COUNT+1))/$MAX_RETRIES: Status is '$STATUS'. Waiting 5s..."
        sleep 5
        RETRY_COUNT=$((RETRY_COUNT+1))
    done
    
    if [ "$HEALTHY" != "true" ]; then
        echo "========================================================================"
        echo "❌ ROLLBACK REQUIRED ❌"
        echo "The new container failed the healthcheck gate."
        echo "Traefik continues routing all traffic to the old container ($OLD_CONTAINER_ID)."
        echo "Removing failed new container ($NEW_CONTAINER_ID)..."
        docker rm -f "$NEW_CONTAINER_ID"
        APP_TAG="${NEW_SHA}" docker compose -f "$PARENT_DIR/docker-compose.yml" up -d --scale "${service}=1" --no-recreate --no-deps "$service"
        echo "Rollback complete. System is stable. Please investigate logs."
        exit 1
    fi
    
    echo "✅ New container is HEALTHY and receiving traffic from Traefik."
    
    # 4. Scale Down (Remove Old Container)
    echo ""
    echo "Step 3: Scaling down (removing old container)..."
    echo "Executing: docker stop $OLD_CONTAINER_ID && docker rm $OLD_CONTAINER_ID"
    docker stop "$OLD_CONTAINER_ID" >/dev/null
    docker rm "$OLD_CONTAINER_ID" >/dev/null
    
    # Reset docker-compose state to 1 container gracefully
    echo "Executing: APP_TAG=${NEW_SHA} docker compose up -d --scale ${service}=1 --no-recreate --no-deps ${service}"
    APP_TAG="${NEW_SHA}" docker compose -f "$PARENT_DIR/docker-compose.yml" up -d --scale "${service}=1" --no-recreate --no-deps "$service"
    
    echo "✅ Zero-downtime cutover completed successfully for $service."
done

echo "========================================================================"
echo "Phase 4.3 deployment verified and complete."
echo "========================================================================"
