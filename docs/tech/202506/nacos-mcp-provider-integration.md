# NacosMcpProvider Integration Technical Design

## Overview

This document outlines the technical design for the `NacosMcpProvider` implementation in the mcpadvisor project. The provider integrates with Nacos for service discovery and leverages a vector database for semantic search capabilities.

## Background

The mcpadvisor project implements a `SearchProvider` interface that defines a common contract for searching MCP servers:

```typescript
export interface SearchProvider {
  search(params: SearchParams): Promise<MCPServerResponse[]>;
  close?(): Promise<void>;
}
```

The `NacosMcpProvider` implements this interface while providing additional capabilities:
- Integration with Nacos for service discovery
- Vector database for semantic search
- Environment-based configuration
- Asynchronous initialization
- Comprehensive error handling

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NacosMcpProvider                            │
│                                                                     │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│  │             │     │                 │     │                 │  │
│  │ NacosClient │◄───►│    McpManager   │◄───►│   VectorDB      │  │
│  │             │     │                 │     │                 │  │
│  └─────────────┘     └─────────────────┘     └─────────────────┘  │
│          │                     │                                      │
│          ▼                     │                                      │
│  ┌─────────────────┐           │                                      │
│  │  Nacos Server   │           │                                      │
│  └─────────────────┘           │                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **NacosMcpProvider**: Implements the `SearchProvider` interface and coordinates between components
2. **NacosClient**: Handles communication with the Nacos server
3. **VectorDB**: Manages vector embeddings and similarity search
4. **McpManager**: Synchronizes Nacos services with the vector database

## Technology Stack

1. **Nacos Client**
   - Service discovery and configuration management
   - Handles service registration and discovery

2. **Vector Database**
   - In-memory vector storage with `@xenova/transformers` for embeddings
   - Supports semantic search through vector similarity

3. **TypeScript/JavaScript**
   - Written in TypeScript with strict typing
   - Modern ES6+ features
   - Async/await for asynchronous operations

4. **Environment Configuration**
   - Configuration through environment variables
   - Supports different environments (development, production, testing)

5. **Error Handling**
   - Comprehensive error handling with custom error types
   - Graceful degradation with fallback search

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NACOS_SERVER_ADDR` | Yes | - | Nacos server address (e.g., `http://localhost:8848`) |
| `NACOS_USERNAME` | Yes | - | Nacos username |
| `NACOS_PASSWORD` | Yes | - | Nacos password |
| `MCP_HOST` | No | `localhost` | MCP server host |
| `MCP_PORT` | No | `3000` | MCP server port |
| `AUTH_TOKEN` | No | - | Authentication token for MCP server |
| `NACOS_DEBUG` | No | `false` | Enable debug logging |

### Provider Configuration

The provider can be configured with the following options:

```typescript
interface NacosMcpProviderConfig {
  serverAddr: string;      // Nacos server address
  username: string;        // Nacos username
  password: string;        // Nacos password
  mcpHost?: string;        // MCP server host (default: 'localhost')
  mcpPort?: number;       // MCP server port (default: 3000)
  authToken?: string;     // Authentication token
  minSimilarity?: number;  // Minimum similarity score (0-1, default: 0.3)
  limit?: number;         // Maximum number of results (default: 10)
  debug?: boolean;        // Enable debug logging (default: false)
}
```

## Implementation Details

### 1. NacosMcpProvider Class

The `NacosMcpProvider` class implements the `SearchProvider` interface with the following key features:

- Asynchronous initialization
- Vector database integration
- Fallback search mechanism
- Resource cleanup

```typescript
class NacosMcpProvider implements SearchProvider {
  private readonly config: NacosMcpProviderConfig;
  private readonly nacosClient: NacosClient;
  private vectorDB: VectorDB | null = null;
  private mcpManager: McpManager | null = null;
  private isInitialized = false;

  constructor(
    config: NacosMcpProviderConfig,
    private readonly testMode: boolean = false
  ) {
    this.config = {
      minSimilarity: 0.3,
      limit: 10,
      debug: false,
      mcpHost: 'localhost',
      ...config
    };

    this.nacosClient = new NacosClient({
      serverAddr: this.config.serverAddr,
      username: this.config.username,
      password: this.config.password,
      mcpHost: this.config.mcpHost,
      mcpPort: this.config.mcpPort,
      authToken: this.config.authToken
    });
  }


  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize Nacos client
      await this.nacosClient.connect();
      
      // Initialize vector database
      this.vectorDB = new VectorDB();
      await this.vectorDB.start();
      await this.vectorDB.isReady();
      
      // Initialize MCP Manager
      this.mcpManager = new McpManager(this.nacosClient, this.vectorDB, 5000);
      
      // Start syncing services
      await this.mcpManager.startSync();
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize NacosMcpProvider: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async search(params: SearchParams): Promise<MCPServerResponse[]> {
    if (!this.isInitialized) {
      await this.init();
    }

    // Implementation details...
  }


  async close(): Promise<void> {
    try {
      if (this.mcpManager) {
        await this.mcpManager.stopSync();
      }
      if (this.nacosClient) {
        await this.nacosClient.disconnect();
      }
    } catch (error) {
      throw new Error(`Error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
export interface NacosMcpProviderConfig {
  routerConfig?: RouterConfig;
  minSimilarity?: number;
  providerPriority?: number;
}
```

### 2. Search Flow

The search process follows these steps:

1. **Initialization**
   - Connect to Nacos server
   - Initialize vector database
   - Start MCP manager synchronization

2. **Search Execution**
   - Extract keywords from the query
   - Perform vector similarity search
   - Fallback to keyword search if needed
   - Transform and return results

3. **Resource Cleanup**
   - Stop synchronization
   - Close Nacos connection
   - Release resources

### 3. Response Format

The provider returns an array of `MCPServerResponse` objects with the following structure:

```typescript
{
  id: string;                    // Unique identifier
  name: string;                  // Service name
  description: string;           // Service description
  sourceUrl: string;             // URL to access the service
  similarity: number;            // Similarity score (0-1)
  score?: number;               // Relevance score
  installations?: any[];         // Installation information
  categories?: string[];         // Service categories
  tags?: string[];              // Service tags
  metadata: {                   // Additional metadata
    provider: string;           // Provider identifier ('nacos')
    lastUpdated: string;       // ISO timestamp
    [key: string]: any;         // Additional service-specific data
  }
}
```

### 4. Error Handling

The provider implements comprehensive error handling:

1. **Initialization Errors**
   - Nacos connection failures
   - Vector DB initialization errors
   - Configuration validation

2. **Search Errors**
   - Invalid search parameters
   - Timeout handling
   - Fallback to keyword search

3. **Resource Management**
   - Connection cleanup
   - Error recovery
   - Graceful degradation

### 5. Performance Considerations

1. **Lazy Initialization**
   - Components are initialized on first use
   - Reduces startup time

2. **Connection Pooling**
   - Reuses Nacos connections
   - Configurable timeouts

3. **Vector Search**
   - In-memory vector database
   - Efficient similarity search
   - Configurable result limits

4. **Caching**
   - Caches search results
   - Configurable TTL

## Getting Started

### Prerequisites

- Node.js 16+
- Nacos server (local or remote)
- MCP server (optional)

### Installation

1. Install the required dependencies:

```bash
npm install @xenova/transformers
```

### Basic Usage

```typescript
import { NacosMcpProvider } from './services/search/NacosMcpProvider';

async function main() {
  // Initialize the provider
  const provider = new NacosMcpProvider({
    serverAddr: 'http://localhost:8848',
    username: 'nacos',
    password: 'nacos',
    mcpHost: 'localhost',
    mcpPort: 3000,
    debug: true
  });

  try {
    // Initialize the provider
    await provider.init();

    // Perform a search
    const results = await provider.search({
      taskDescription: 'Find MCP servers for data analysis',
      keywords: ['analytics', 'visualization']
    });

    console.log('Search results:', results);
  } catch (error) {
    console.error('Search failed:', error);
  } finally {
    // Clean up
    await provider.close();
  }
}

main().catch(console.error);
```

### Environment Configuration

Create a `.env` file in your project root:

```env
# Nacos Configuration
NACOS_SERVER_ADDR=http://localhost:8848
NACOS_USERNAME=nacos
NACOS_PASSWORD=nacos

# MCP Configuration
MCP_HOST=localhost
MCP_PORT=3000
AUTH_TOKEN=your-auth-token

# Debugging
NACOS_DEBUG=true
```

## Advanced Configuration

### Customizing Search Behavior

```typescript
const provider = new NacosMcpProvider({
  serverAddr: 'http://localhost:8848',
  username: 'nacos',
  password: 'nacos',
  minSimilarity: 0.4,    // Adjust similarity threshold
  limit: 20,             // Maximum number of results
  debug: process.env.NODE_ENV === 'development'
});
```

### Error Handling

```typescript
try {
  const results = await provider.search(params);
  // Process results
} catch (error) {
  if (error instanceof NacosConnectionError) {
    console.error('Failed to connect to Nacos:', error.message);
  } else if (error instanceof VectorDBError) {
    console.error('Vector database error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Performance Tuning

### Vector Database

- Adjust the embedding model for better accuracy/performance
- Configure the vector dimension size
- Tune the similarity threshold

### Nacos Client

- Configure connection timeouts
- Adjust retry policies
- Enable/disable connection pooling

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify Nacos server is running
   - Check network connectivity
   - Validate credentials

2. **Vector Search Errors**
   - Check embedding model compatibility
   - Verify vector dimensions match
   - Check for NaN/Infinity values

3. **Performance Issues**
   - Monitor memory usage
   - Check for connection leaks
   - Profile search queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

[Your License Here]

## Future Enhancements

1. **Advanced Filtering**
   - Support for complex query filters
   - Custom scoring functions

2. **Performance**
   - Implement result caching
   - Add query optimization

3. **Monitoring**
   - Add metrics collection
   - Integration with monitoring tools

4. **Extensibility**
   - Plugin system for custom providers
   - Support for additional vector databases
