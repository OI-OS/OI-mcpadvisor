# MCP Advisor API Reference

This document provides comprehensive details about the MCP Advisor API, including endpoints, request/response formats, and usage examples.

## Table of Contents

- [Core API](#core-api)
  - [Search API](#search-api)
  - [Server Information API](#server-information-api)
- [Transport Methods](#transport-methods)
  - [Stdio Transport](#stdio-transport)
  - [SSE Transport](#sse-transport)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Library Usage](#library-usage)

## Core API

### Search API

The primary API for searching MCP servers based on natural language queries.

#### MCP Protocol Method

```
recommend-mcp-servers
```

#### Request Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `query` | string | Natural language query describing the desired MCP server functionality | Yes |

#### Response Format

```typescript
{
  servers: Array<{
    name: string;          // Server name
    description: string;   // Server description
    githubUrl: string;     // GitHub repository URL
    category: string;      // Server category
    relevanceScore: number; // Relevance score (0-1)
    installationGuide?: string; // Installation instructions (if available)
  }>
}
```

#### Example

**Request:**
```json
{
  "query": "vector database integration"
}
```

**Response:**
```json
{
  "servers": [
    {
      "name": "vector-db",
      "description": "MCP server for vector database operations including embedding generation, similarity search, and vector storage",
      "githubUrl": "https://github.com/example/vector-db-mcp",
      "category": "Database",
      "relevanceScore": 0.92,
      "installationGuide": "# Installation\n\n```bash\nnpm install @example/vector-db-mcp\n```"
    },
    {
      "name": "data-integration",
      "description": "Data integration MCP server with support for various databases including vector databases",
      "githubUrl": "https://github.com/example/data-integration-mcp",
      "category": "Integration",
      "relevanceScore": 0.78
    }
  ]
}
```

### Server Information API

Retrieve detailed information about a specific MCP server.

#### MCP Protocol Method

```
install-mcp-server
```

#### Request Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `mcpName` | string | Name of the MCP server | Yes |
| `githubUrl` | string | GitHub URL of the MCP server | Yes |
| `mcpClient` | string | Optional client name (e.g., "Claude Desktop", "Windsurf") | No |

#### Response Format

```typescript
{
  name: string;          // Server name
  githubUrl: string;     // GitHub repository URL
  installationGuide: string; // Installation instructions
  clientSpecificInstructions?: Record<string, string>; // Client-specific installation instructions
}
```

#### Example

**Request:**
```json
{
  "mcpName": "vector-db",
  "githubUrl": "https://github.com/example/vector-db-mcp",
  "mcpClient": "Claude Desktop"
}
```

**Response:**
```json
{
  "name": "vector-db",
  "githubUrl": "https://github.com/example/vector-db-mcp",
  "installationGuide": "# Installation\n\n```bash\nnpm install @example/vector-db-mcp\n```",
  "clientSpecificInstructions": {
    "Claude Desktop": "Add the following to your claude_desktop_config.json:\n\n```json\n{\n  \"mcpServers\": {\n    \"vector-db\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@example/vector-db-mcp\"]\n    }\n  }\n}\n```"
  }
}
```

## Transport Methods

MCP Advisor supports multiple transport methods for communication.

### Stdio Transport

The default transport method using standard input/output for command-line integration.

**Usage:**
```bash
npx @xiaohui-wang/mcpadvisor
```

### SSE Transport

Server-Sent Events transport for web-based integration.

**Configuration:**
```
TRANSPORT_TYPE=sse PORT=3000
```

**Endpoints:**

- `/sse` - SSE connection endpoint
- `/messages` - Message handling endpoint
- `/health` - Health check endpoint

**Example Client:**
```javascript
const eventSource = new EventSource('http://localhost:3000/sse');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};

// Send a message
fetch('http://localhost:3000/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'function_call',
    function: {
      name: 'recommend-mcp-servers',
      arguments: { query: 'vector database' }
    }
  })
});
```

## Data Models

### Server Model

```typescript
interface Server {
  name: string;
  description: string;
  githubUrl: string;
  category: string;
  tags?: string[];
  relevanceScore?: number;
  installationGuide?: string;
}
```

### Search Options

```typescript
interface SearchOptions {
  limit?: number;         // Maximum number of results (default: 5)
  minSimilarity?: number; // Minimum similarity score (default: 0.3)
  includeMetadata?: boolean; // Include additional metadata (default: false)
  providers?: string[];   // Search providers to use (default: all configured providers)
}
```

## Error Handling

MCP Advisor uses standard error codes and messages:

| Error Code | Description |
|------------|-------------|
| `INVALID_REQUEST` | Invalid request parameters |
| `SEARCH_FAILED` | Search operation failed |
| `PROVIDER_ERROR` | Error with specific search provider |
| `TRANSPORT_ERROR` | Error with transport layer |
| `NOT_FOUND` | Requested resource not found |

Error responses follow this format:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

## Library Usage

MCP Advisor can be used as a library in Node.js applications:

```typescript
import { SearchService } from '@xiaohui-wang/mcpadvisor';

// Initialize search service
const searchService = new SearchService();

// Search for MCP servers
const results = await searchService.search('vector database integration');
console.log(results);

// With options
const customResults = await searchService.search('image generation', {
  limit: 10,
  minSimilarity: 0.2,
  providers: ['meilisearch', 'getmcp']
});
```

For more advanced usage examples, see the [examples directory](https://github.com/istarwyh/mcpadvisor/tree/main/examples) in the repository.
