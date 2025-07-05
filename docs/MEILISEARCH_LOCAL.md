# Local Meilisearch Integration for MCPAdvisor

This integration allows MCPAdvisor to use a local self-hosted Meilisearch instance instead of or as a fallback to the cloud service.

## Quick Start

### 1. Start Local Meilisearch

```bash
# Start the local Meilisearch instance
pnpm meilisearch:start

# Check if it's running
pnpm meilisearch:health
```

### 2. Configure Environment Variables

```bash
export MEILISEARCH_INSTANCE=local
export MEILISEARCH_LOCAL_HOST=http://localhost:7700
export MEILISEARCH_MASTER_KEY=developmentKey123
```

### 3. Run MCPAdvisor

MCPAdvisor will now use the local Meilisearch instance for search operations.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MEILISEARCH_INSTANCE` | Instance type: 'local' or 'cloud' | 'cloud' |
| `MEILISEARCH_LOCAL_HOST` | Local Meilisearch URL | 'http://localhost:7700' |
| `MEILISEARCH_MASTER_KEY` | Master key for local instance | 'developmentKey' |
| `MEILISEARCH_INDEX_NAME` | Index name for local instance | 'mcp_servers' |
| `MEILISEARCH_CLOUD_API_KEY` | API key for cloud instance | (built-in default) |

## Testing

### Run All Meilisearch Tests
```bash
pnpm test:meilisearch:all
```

### Run Specific Test Suites
```bash
# Unit tests
pnpm test:meilisearch:config
pnpm test:meilisearch:failover

# Integration tests (requires running Meilisearch)
pnpm test:meilisearch:local

# E2E tests (requires MCP Inspector and Meilisearch)
pnpm test:meilisearch:e2e
```

## Management Commands

```bash
# Start local Meilisearch
pnpm meilisearch:start

# Stop local Meilisearch
pnpm meilisearch:stop

# View logs
pnpm meilisearch:logs

# Check health
pnpm meilisearch:health
```

## Features

- ✅ **Automatic Failover**: Falls back to cloud instance if local fails
- ✅ **Health Monitoring**: Built-in health checks and monitoring
- ✅ **Environment-based Configuration**: Easy switching between local/cloud
- ✅ **Docker Deployment**: One-command local setup
- ✅ **Comprehensive Testing**: Unit, integration, and E2E tests
- ✅ **Performance Monitoring**: Response time tracking and comparison

## Architecture

The integration uses the Strategy Pattern with a Failover Client:

```
MeilisearchSearchProvider
├── FailoverMeilisearchClient
    ├── PrimaryClient (LocalMeilisearchController | CloudClient)
    └── FallbackClient (CloudClient | null)
```

When `MEILISEARCH_INSTANCE=local`:
- Primary: Local Meilisearch instance
- Fallback: Cloud Meilisearch instance

When `MEILISEARCH_INSTANCE=cloud`:
- Primary: Cloud Meilisearch instance  
- Fallback: None

## Troubleshooting

### Local Meilisearch Won't Start
```bash
# Check Docker
docker info

# Check port conflicts
lsof -i :7700

# View detailed logs
docker-compose -f docker-compose.meilisearch.yml logs
```

### Tests Failing
```bash
# Ensure Meilisearch is running
pnpm meilisearch:health

# Check environment variables
echo $MEILISEARCH_INSTANCE
echo $TEST_MEILISEARCH_HOST

# Run with debug output
MEILISEARCH_INSTANCE=local pnpm test:meilisearch:local
```

### Performance Issues
- Check available memory: Local Meilisearch is configured with 256MB limit
- Monitor response times using the built-in monitoring tools
- Consider adjusting `MEILI_MAX_INDEXING_MEMORY` in docker-compose.yml

## Production Deployment

For production use:

1. **Security**: Use a strong master key
2. **Resources**: Adjust memory and CPU limits in docker-compose.yml
3. **Persistence**: Ensure volume mounts are properly configured
4. **Monitoring**: Enable the monitoring system
5. **Backup**: Implement regular data backups

```bash
# Production environment variables
export MEILISEARCH_INSTANCE=local
export MEILISEARCH_LOCAL_HOST=http://your-meilisearch-host:7700
export MEILISEARCH_MASTER_KEY=your-secure-master-key
export MEILISEARCH_INDEX_NAME=mcp_servers_prod
```