# Environment Variables Documentation

This document provides detailed information about all environment variables used in MCP Advisor.

## Core Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TRANSPORT_TYPE` | Transport method (`stdio`, `sse`, `rest`) | `stdio` | No |
| `SERVER_NAME` | Name of the MCP server | `mcpadvisor` | No |
| `SERVER_VERSION` | Version of the MCP server | `1.0.0` | No |

## HTTP Server Configuration (SSE/REST Transport)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SERVER_PORT` | HTTP server port | `3000` | No |
| `SERVER_HOST` | HTTP server host | `localhost` | No |
| `SSE_PATH` | SSE endpoint path | `/sse` | No |
| `MESSAGE_PATH` | Messages endpoint path | `/messages` | No |
| `ENDPOINT` | REST endpoint path | `/rest` | No |
| `CORS_ORIGIN` | CORS allowed origins (comma-separated) | `*` | No |

## API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `COMPASS_API_BASE` | Base URL for the COMPASS API | `https://registry.mcphub.io` | No |
| `OCEANBASE_API_BASE` | Base URL for the OCEANBASE API | `https://registry.mcphub.io` | No |

## Logging Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DEBUG` | Enable debug logging | `false` | No |
| `ENABLE_FILE_LOGGING` | Enable logging to files | `false` | No |
| `LOG_LEVEL` | Log level (`debug`, `info`, `warn`, `error`) | `info` | No |
| `LOG_DIR` | Directory for log files | `./logs` | No |
| `LOG_MAX_SIZE` | Maximum size of log files before rotation | `10m` | No |
| `LOG_MAX_FILES` | Maximum number of log files to keep | `5` | No |

## Search Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MIN_SIMILARITY` | Minimum similarity score for search results | `0.5` | No |
| `MAX_RESULTS` | Maximum number of search results to return | `10` | No |
| `ENABLE_CACHE` | Enable caching of search results | `false` | No |
| `CACHE_TTL` | Time-to-live for cached results (in seconds) | `3600` | No |

## Usage Examples

### Basic Usage (stdio transport)

```bash
node build/index.js
```

### SSE Transport with Debug Logging

```bash
TRANSPORT_TYPE=sse SERVER_PORT=3000 DEBUG=true ENABLE_FILE_LOGGING=true node build/index.js
```

### REST Transport with Custom API Endpoint

```bash
TRANSPORT_TYPE=rest SERVER_PORT=8080 ENDPOINT=/api/mcp COMPASS_API_BASE=https://custom-registry.example.com node build/index.js
```

### Production Configuration

```bash
TRANSPORT_TYPE=sse SERVER_PORT=3000 SERVER_HOST=0.0.0.0 LOG_LEVEL=warn ENABLE_FILE_LOGGING=true MIN_SIMILARITY=0.7 MAX_RESULTS=5 node build/index.js
```

## Notes

- Boolean variables accept `true`, `1`, `yes` as truthy values and `false`, `0`, `no` as falsy values
- When using SSE or REST transport, make sure the port is not already in use by another application
- For production deployments, consider setting `SERVER_HOST` to `0.0.0.0` to allow external connections
- Setting `DEBUG=true` will override the `LOG_LEVEL` setting and set it to `debug`
