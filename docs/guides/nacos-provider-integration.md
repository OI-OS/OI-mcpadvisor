# Nacos MCP Provider Integration Guide

## Overview

The Nacos MCP Provider enables integration with Nacos service discovery to search for and interact with MCP (Model Context Protocol) servers. This document provides a comprehensive guide to using and configuring the Nacos MCP Provider.

## Features

- Seamless integration with Nacos service discovery
- Automatic MCP server registration and discovery
- Support for both keyword-based and description-based searches
- Configurable connection parameters
- Comprehensive error handling and logging
- Asynchronous initialization with proper resource management

## Prerequisites

- Node.js 16.x or later
- Access to a Nacos server (local or remote)
- MCP servers registered in Nacos

## Installation

If you haven't already installed the package:

```bash
npm install @xiaohui-wang/mcpadvisor
```

## Configuration

The Nacos MCP Provider can be configured using environment variables or directly in code.

### Environment Variables

```env
# Required
NACOS_SERVER_ADDR=http://localhost:8848
NACOS_USERNAME=nacos
NACOS_PASSWORD=nacos
MCP_HOST=localhost
MCP_PORT=3000
MCP_AUTH_TOKEN=your-auth-token

# Optional
NACOS_DEBUG=true  # Enable debug logging
```

### Programmatic Configuration

```typescript
import { NacosMcpProvider } from '@xiaohui-wang/mcpadvisor';

const provider = new NacosMcpProvider({
  serverAddr: 'http://localhost:8848',
  username: 'nacos',
  password: 'nacos',
  mcpHost: 'localhost',
  mcpPort: 3000,
  authToken: 'your-auth-token',
  debug: true, // Optional, enables debug logging
});
```

## Usage

### Basic Search

```typescript
// Using keywords
const results1 = await provider.search({
  taskDescription: 'Find MCP servers for testing',
  keywords: ['test', 'mcp'],
});

// Using task description only
const results2 = await provider.search({
  taskDescription: 'Find MCP servers for testing without keywords',
});
```

### Error Handling

The provider includes comprehensive error handling:

```typescript
try {
  const results = await provider.search({
    taskDescription: 'Find MCP servers',
  });
  console.log('Search results:', results);
} catch (error) {
  console.error('Search failed:', error instanceof Error ? error.message : String(error));
}
```

### Resource Management

Always close the provider when done to release resources:

```typescript
try {
  // Use the provider...
} finally {
  await provider.close();
}
```

## Integration with SearchMcpFactory

The Nacos MCP Provider is pre-integrated with the `SearchMcpFactory` for easy use:

```typescript
import { getSearchFunction } from '@xiaohui-wang/mcpadvisor';

// Using environment variables
const search = getSearchFunction('nacos');

// Or with explicit configuration
const searchWithConfig = getSearchFunction('nacos', {
  serverAddr: 'http://localhost:8848',
  // ... other options
});

// Use the search function
const results = await search({
  taskDescription: 'Find MCP servers',
});
```

## Testing

The package includes comprehensive tests. To run them:

```bash
# Run all tests
npm test

# Run Nacos provider tests only
npm test src/services/search/__tests__/NacosMcpProvider.test.ts
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify Nacos server is running and accessible
   - Check firewall settings
   - Verify host and port configuration

2. **Authentication Failed**
   - Verify username and password
   - Check Nacos authentication configuration

3. **No Results**
   - Verify MCP servers are registered in Nacos
   - Check service naming conventions

### Debugging

Enable debug logging for detailed information:

```typescript
const provider = new NacosMcpProvider({
  // ... other options
  debug: true,
});
```

## Best Practices

1. **Connection Pooling**: Reuse provider instances when possible
2. **Error Handling**: Always implement proper error handling
3. **Resource Management**: Always call `close()` when done
4. **Configuration**: Use environment variables for sensitive data
5. **Logging**: Enable debug logging during development

## API Reference

### NacosMcpProvider

#### Constructor

```typescript
new NacosMcpProvider(config: NacosMcpProviderConfig)
```

**Parameters:**

- `config`: Configuration object
  - `serverAddr`: Nacos server address (e.g., 'http://localhost:8848')
  - `username`: Nacos username
  - `password`: Nacos password
  - `mcpHost`: MCP server host
  - `mcpPort`: MCP server port
  - `authToken`: Authentication token for MCP server
  - `debug`: Enable debug logging (optional, default: `false`)

#### Methods

##### search(params: SearchParams): Promise<MCPServerResponse[]>

Search for MCP servers.

**Parameters:**
- `params`: Search parameters
  - `taskDescription`: Task description
  - `keywords`: Optional array of keywords

**Returns:** Array of MCP server responses

##### close(): Promise<void>

Close the provider and release resources.

## Contributing

Contributions are welcome! Please follow the project's coding standards and include tests with your changes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
