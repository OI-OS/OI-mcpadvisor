#!/bin/bash
# 启动本地 Meilisearch 实例

set -e

echo "🚀 Starting local Meilisearch for MCPAdvisor..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if master key is provided
if [ -z "$MEILI_MASTER_KEY" ]; then
    echo "❌ MEILI_MASTER_KEY environment variable is required"
    echo "Please set it to a secure value:"
    echo "  export MEILI_MASTER_KEY=your_secure_master_key_here"
    exit 1
fi

# Start Meilisearch
docker-compose -f docker-compose.meilisearch.yml up -d

# Wait for health check
echo "⏳ Waiting for Meilisearch to be ready..."
timeout=60
counter=0
while ! curl -sf http://localhost:7700/health > /dev/null 2>&1; do
    if [ $counter -eq $timeout ]; then
        echo "❌ Meilisearch failed to start within ${timeout}s"
        exit 1
    fi
    counter=$((counter + 1))
    sleep 1
done

echo "✅ Meilisearch is ready at http://localhost:7700"
echo "🔑 Master key: $MEILI_MASTER_KEY"
echo ""
echo "To stop Meilisearch, run:"
echo "  docker-compose -f docker-compose.meilisearch.yml down"
echo ""
echo "To use local Meilisearch in MCPAdvisor, set these environment variables:"
echo "  export MEILISEARCH_INSTANCE=local"
echo "  export MEILISEARCH_LOCAL_HOST=http://localhost:7700"
echo "  export MEILISEARCH_MASTER_KEY=$MEILI_MASTER_KEY"