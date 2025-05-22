# MCP Advisor Search Providers

This document details the search providers available in MCP Advisor, their configuration options, and how they work together to deliver optimal search results.

## Table of Contents

- [Overview](#overview)
- [Available Providers](#available-providers)
  - [Meilisearch Provider](#meilisearch-provider)
  - [GetMCP Provider](#getmcp-provider)
  - [Compass Provider](#compass-provider)
  - [Offline Provider](#offline-provider)
  - [OceanBase Provider](#oceanbase-provider)
- [Hybrid Search Strategy](#hybrid-search-strategy)
- [Provider Configuration](#provider-configuration)
- [Implementing Custom Providers](#implementing-custom-providers)

## Overview

MCP Advisor uses a multi-provider search architecture that allows different search engines to work in parallel, combining their results for optimal recommendations. Each provider has specific strengths and use cases, and the system is designed to gracefully degrade if any provider is unavailable.

## Available Providers

### Meilisearch Provider

A vector search provider that uses Meilisearch as the backend.

**Key Features:**
- Fast vector similarity search
- Support for filtering and faceting
- Low latency responses
- HNSW indexing for efficient nearest neighbor search

**Configuration:**
```
SEARCH_PROVIDER=meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=your_api_key
```

**Best For:**
- Production environments with dedicated Meilisearch instance
- Applications requiring fast search responses
- Scenarios where search quality is critical

### GetMCP Provider

An API-based provider that queries the GetMCP registry for up-to-date server information.

**Key Features:**
- Always up-to-date with the latest MCP servers
- Rich metadata and descriptions
- Community-maintained server information
- No local infrastructure required

**Configuration:**
```
SEARCH_PROVIDER=getmcp
GETMCP_API_URL=https://api.getmcp.org
```

**Best For:**
- Ensuring access to the latest MCP servers
- Environments without local search infrastructure
- Supplementing local search results with community data

### Compass Provider

An API-based provider that queries the Compass registry for MCP server information.

**Key Features:**
- Curated server listings
- Verified installation instructions
- Category-based browsing
- Regular updates

**Configuration:**
```
SEARCH_PROVIDER=compass
COMPASS_API_URL=https://compass-api.example.org
```

**Best For:**
- Enterprise environments requiring verified servers
- Applications needing curated server recommendations
- Supplementing other search providers

### Offline Provider

A local search provider that works without external dependencies, combining vector search and text matching.

**Key Features:**
- Works completely offline
- Hybrid search combining vector and text matching
- Pre-packaged server data
- No external API dependencies

**Configuration:**
```
SEARCH_PROVIDER=offline
```

**Best For:**
- Offline environments
- Fallback when other providers are unavailable
- Quick local development
- Privacy-sensitive applications

### OceanBase Provider

A vector search provider using OceanBase for storage and retrieval.

**Key Features:**
- Enterprise-grade database backend
- High availability and scalability
- HNSW indexing for vector search
- Support for complex queries and filters

**Configuration:**
```
SEARCH_PROVIDER=oceanbase
OCEANBASE_HOST=localhost
OCEANBASE_PORT=2881
OCEANBASE_USER=root
OCEANBASE_PASSWORD=password
OCEANBASE_DATABASE=mcpadvisor
```

**Best For:**
- Enterprise environments already using OceanBase
- Applications requiring high availability
- Scenarios with large volumes of server data

## Hybrid Search Strategy

MCP Advisor implements a sophisticated hybrid search strategy that combines multiple search techniques:

1. **Vector Search**: Converts queries to vector embeddings for semantic similarity matching
2. **Text Matching**: Uses keyword and metadata matching for precise results
3. **Weighted Merging**: Combines results with configurable weights (default: 70% vector, 30% text)
4. **Parallel Execution**: Runs searches in parallel for optimal performance
5. **Adaptive Filtering**: Dynamically adjusts similarity thresholds based on result quality

The hybrid approach provides several advantages:
- Better handling of ambiguous queries
- Improved results for non-English queries
- Resilience to vocabulary mismatches
- Balance between semantic understanding and keyword precision

## Provider Configuration

MCP Advisor allows configuring multiple providers simultaneously, with priority and fallback mechanisms.

### Configuration Options

**Environment Variables:**
```
# Primary provider
SEARCH_PROVIDER=hybrid

# Provider weights (for hybrid search)
VECTOR_SEARCH_WEIGHT=0.7
TEXT_SEARCH_WEIGHT=0.3

# Provider-specific options
MEILISEARCH_URL=http://localhost:7700
GETMCP_API_URL=https://api.getmcp.org
```

**Configuration File:**
```json
{
  "search": {
    "provider": "hybrid",
    "providers": {
      "meilisearch": {
        "enabled": true,
        "url": "http://localhost:7700",
        "apiKey": "your_api_key",
        "weight": 0.4
      },
      "getmcp": {
        "enabled": true,
        "url": "https://api.getmcp.org",
        "weight": 0.3
      },
      "offline": {
        "enabled": true,
        "weight": 0.3
      }
    },
    "fallbackOrder": ["meilisearch", "getmcp", "offline"]
  }
}
```

### Provider Selection Logic

1. If `SEARCH_PROVIDER` is set to a specific provider, only that provider is used
2. If set to `hybrid`, all enabled providers are used with configured weights
3. If a provider fails, the system falls back to the next provider in `fallbackOrder`
4. If all providers fail, the system returns an error

## Implementing Custom Providers

MCP Advisor supports custom search providers through a simple interface:

```typescript
interface ISearchProvider {
  search(query: string, options?: SearchOptions): Promise<Server[]>;
  getName(): string;
  getWeight(): number;
}
```

To implement a custom provider:

1. Create a new class implementing the `ISearchProvider` interface
2. Register your provider with the `SearchService`

**Example:**

```typescript
import { ISearchProvider, SearchOptions, Server } from '../types';

export class CustomProvider implements ISearchProvider {
  private weight = 0.5;

  async search(query: string, options?: SearchOptions): Promise<Server[]> {
    // Implement your search logic here
    return [
      {
        name: 'example-server',
        description: 'An example server',
        githubUrl: 'https://github.com/example/server',
        category: 'Example',
        relevanceScore: 0.9
      }
    ];
  }

  getName(): string {
    return 'custom';
  }

  getWeight(): number {
    return this.weight;
  }
}

// Register your provider
import { SearchService } from '../services';
const searchService = new SearchService();
searchService.registerProvider(new CustomProvider());
```

For more detailed implementation examples, see the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) document.
