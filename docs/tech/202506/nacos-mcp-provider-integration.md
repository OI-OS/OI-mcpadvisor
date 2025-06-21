# NacosMcpProvider Integration Technical Design

## Overview

This document outlines the technical design for integrating the `searchNacosMcpServer` functionality from the nacos-mcp-router project into the mcpadvisor project as a new implementation of the `SearchProvider` interface.

## Background

The mcpadvisor project currently has a `SearchProvider` interface that defines a common contract for searching MCP servers:

```typescript
export interface SearchProvider {
  search(params: SearchParams): Promise<MCPServerResponse[]>;
}
```

The nacos-mcp-router project has a `searchNacosMcpServer` method that provides similar functionality but with a different interface:

```typescript
public async searchNacosMcpServer(taskDescription: string, keyWords: [string, ...string[]]) {
  // Implementation...
}
```

This integration will bridge these two interfaces, allowing the nacos-mcp-router functionality to be used within the mcpadvisor ecosystem.

## Design Goals

1. Create a new `NacosMcpProvider` class that implements the `SearchProvider` interface
2. Adapt the `searchNacosMcpServer` method to work with the `SearchParams` structure
3. Transform `NacosMcpServer` objects into `MCPServerResponse` objects
4. Ensure proper error handling and logging
5. Maintain the existing behavior and performance characteristics

## Technology Stack

The original `searchNacosMcpServer` implementation in nacos-mcp-router uses the following technologies:

1. **Nacos Client**: For service discovery and configuration management
   - Uses `NacosHttpClient` for interacting with Nacos server
   - Handles service registration and discovery

2. **Model Context Protocol (MCP)**: For model communication
   - Uses `@modelcontextprotocol/sdk` for MCP server implementation
   - Implements MCP tools for server discovery and management

3. **Vector Database**: For semantic search capabilities
   - Uses an in-memory vector database implementation (`MemoryVectorDB`)
   - Supports vector similarity search for finding relevant MCP servers

4. **TypeScript/JavaScript**:
   - Written in TypeScript with strong typing
   - Uses modern ES6+ features

5. **Dependency Injection**:
   - Uses constructor injection for dependencies
   - Follows the dependency inversion principle

6. **Error Handling**:
   - Custom error classes extending `McpError`
   - Comprehensive error codes and messages

7. **Logging**:
   - Uses a custom logger implementation
   - Structured logging with context information

## Dependencies

The implementation will require the following dependencies:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.0.0",
    "axios": "^1.6.0"
  }
}

// For development and testing
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

## Implementation Details

### 1. NacosMcpProvider Class

The `NacosMcpProvider` class will implement the `SearchProvider` interface and will require:

- A reference to a `Router` instance from nacos-mcp-router
- Configuration options for customizing behavior

```typescript
export interface NacosMcpProviderConfig {
  routerConfig?: RouterConfig;
  minSimilarity?: number;
  providerPriority?: number;
}
```

### 2. Parameter Mapping

The `search` method will map from `SearchParams` to the parameters expected by `searchNacosMcpServer`:

- `taskDescription` → directly mapped from `params.taskDescription`
- `keyWords` → derived from `params.keywords` (with fallback handling if not provided)

### 3. Response Transformation

The `NacosMcpServer` objects returned by `searchNacosMcpServer` will be transformed into `MCPServerResponse` objects:

```typescript
// From NacosMcpServer:
{
  name: string;
  description: string;
  agentConfig: Record<string, any>;
}

// To MCPServerResponse:
{
  id?: string;             // Will use name
  title: string;           // Will use name
  description: string;     // Will use description
  sourceUrl: string;       // Will be constructed
  similarity: number;      // Will be calculated or default
  score?: number;          // Will be calculated based on similarity and priority
  installations?: Record<string, any>; // Will use agentConfig if applicable
  categories?: string[] | string;      // Will be extracted if available
  tags?: string[] | string;            // Will be extracted if available
}
```

### 4. Integration Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                 │     │                   │     │                 │
│  SearchService  │────▶│ NacosMcpProvider │────▶│ Router (Nacos)  │
│                 │     │                   │     │                 │
└─────────────────┘     └───────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                 │     │                   │     │                 │
│ SearchParams    │────▶│ taskDescription   │────▶│ NacosMcpServer  │
│ keywords        │     │ keyWords          │     │ objects         │
│                 │     │                   │     │                 │
└─────────────────┘     └───────────────────┘     └─────────────────┘
                                                          │
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │                 │
                                                 │MCPServerResponse│
                                                 │ objects         │
                                                 │                 │
                                                 └─────────────────┘
```

### 5. Error Handling

The provider will implement comprehensive error handling:

- Connection errors to Nacos
- Transformation errors
- Empty result handling
- Timeout handling

### 6. Performance Considerations

- Lazy initialization of the Router instance
- Connection pooling for Nacos client
- Caching of frequently accessed MCP servers

## Implementation Plan

1. Create a new file `src/services/search/NacosMcpProvider.ts`
2. Implement the `NacosMcpProvider` class with the `SearchProvider` interface
3. Add necessary dependencies and imports
4. Implement the transformation logic
5. Add error handling and logging
6. Register the provider in the search service factory

## Usage Example

```typescript
// Initialize the provider
const nacosMcpProvider = new NacosMcpProvider({
  routerConfig: {
    nacos: {
      serverAddr: 'http://localhost:8848',
      username: 'nacos',
      password: 'nacos'
    },
    mcp: {
      host: 'localhost',
      port: 3000
    }
  }
});

// Use the provider
const results = await nacosMcpProvider.search({
  taskDescription: 'Find MCP servers for data analysis',
  keywords: ['analytics', 'visualization']
});
```

## Future Enhancements

1. Add support for more advanced filtering and sorting
2. Implement caching for improved performance
3. Add support for batch operations
4. Enhance error recovery mechanisms
