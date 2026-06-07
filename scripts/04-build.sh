#!/usr/bin/env bash
# ─── Nazrah Al Alam — Phase 4.1 Build Tagged Images ─────────────────────────
# Pulls main, retrieves the git short SHA, and builds tagged images for each
# service defined in APP_SERVICES using the appropriate Dockerfile.
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

# Load environment variables from .env if available
if [ -f "$ENV_PATH" ]; then
    echo "==> Loading environment variables from $ENV_PATH"
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line//[[:space:]]/}" ]] && continue
        
        # Strip export prefix if present, then export the variable
        clean_line="${line#export }"
        eval export "$clean_line"
    done < "$ENV_PATH"
fi

echo "========================================================================"
# 1. Pull main/master branch
echo "Step 1/3: Checking out and pulling the main branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch is: $CURRENT_BRANCH"

if git show-ref --verify --quiet refs/heads/main; then
    TARGET_BRANCH="main"
elif git show-ref --verify --quiet refs/heads/master; then
    TARGET_BRANCH="master"
else
    echo "Warning: Neither main nor master branch found. Building on current branch."
    TARGET_BRANCH="$CURRENT_BRANCH"
fi

if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo "Switching to branch: $TARGET_BRANCH"
    git checkout "$TARGET_BRANCH"
fi

echo "Pulling latest changes for $TARGET_BRANCH..."
git pull origin "$TARGET_BRANCH"

# 2. Get git short SHA
echo ""
echo "Step 2/3: Retrieving git short SHA..."
NEW_SHA=$(git rev-parse --short HEAD)
if [ -z "$NEW_SHA" ]; then
    echo "ERROR: Failed to retrieve git short SHA."
    exit 1
fi
echo "NEW_SHA: $NEW_SHA"

# 3. Build docker images for each service
echo ""
echo "Step 3/3: Building Docker images for configured services..."
echo "APP_SERVICES: ${APP_SERVICES[*]}"
echo "========================================================================"

for service in "${APP_SERVICES[@]}"; do
    # Strip "nazrah-" prefix if present in the service name
    clean_name="${service#nazrah-}"
    image_name="nazrah-${clean_name}"
    dockerfile_suffix="${clean_name}"
    
    DOCKERFILE="${PARENT_DIR}/Dockerfile.${dockerfile_suffix}"
    
    if [ ! -f "$DOCKERFILE" ]; then
        echo "ERROR: Dockerfile not found at $DOCKERFILE for service $service"
        exit 1
    fi
    
    TAG_NAME="${image_name}:${NEW_SHA}"
    
    echo "------------------------------------------------------------------------"
    echo "Building service: $service"
    echo "Dockerfile:       $DOCKERFILE"
    echo "Tagging image as: $TAG_NAME"
    echo "------------------------------------------------------------------------"
    
    docker build \
        -f "$DOCKERFILE" \
        -t "$TAG_NAME" \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" \
        --build-arg NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://nazrah-mainx.algarni.online}" \
        --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}" \
        --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}" \
        --build-arg VITE_APP_VERSION="${NEW_SHA}" \
        "$PARENT_DIR"
        
    echo ""
    echo "✅ Successfully built and tagged: $TAG_NAME"
done

echo "========================================================================"
echo "Build stage completed successfully."
echo "========================================================================"
