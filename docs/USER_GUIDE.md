# MCP Advisor User Guide

This guide provides detailed instructions on how to use MCP Advisor effectively, from basic setup to advanced features.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Configuration Options](#configuration-options)
- [Search Techniques](#search-techniques)
- [Integration with AI Assistants](#integration-with-ai-assistants)
- [Troubleshooting](#troubleshooting)

## Basic Usage

### Finding MCP Servers

MCP Advisor allows you to discover and use MCP servers through natural language queries. Here's how to use it:

1. **Direct Query**: Ask your AI assistant about MCP servers for specific tasks
   ```
   What MCP servers are available for vector database integration?
   ```

2. **Specific Functionality**: Request servers with particular capabilities
   ```
   Find an MCP server for image generation
   ```

3. **Task-Based Search**: Describe what you're trying to accomplish
   ```
   I need to analyze financial data, which MCP server should I use?
   ```

### Understanding Results

MCP Advisor returns results with the following information:

- **Server Name**: The name of the MCP server
- **Description**: A brief description of the server's capabilities
- **GitHub URL**: Link to the server's repository
- **Installation Instructions**: How to install and configure the server
- **Relevance Score**: How closely the server matches your query

## Configuration Options

### Environment Variables

MCP Advisor can be configured using the following environment variables:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TRANSPORT_TYPE` | Transport method (stdio or sse) | stdio | `TRANSPORT_TYPE=sse` |
| `PORT` | Port for SSE server | 3000 | `PORT=3001` |
| `LOG_LEVEL` | Logging verbosity | info | `LOG_LEVEL=debug` |
| `SEARCH_PROVIDER` | Primary search provider | hybrid | `SEARCH_PROVIDER=meilisearch` |
| `VECTOR_DB_URL` | Vector database URL | - | `VECTOR_DB_URL=http://localhost:7700` |

For a complete list of configuration options, see the [INSTALLATION.md](./INSTALLATION.md) guide.

### Configuration File

You can also use a configuration file (`config/default.json`) to set options:

```json
{
  "server": {
    "port": 3000,
    "transportType": "stdio"
  },
  "search": {
    "provider": "hybrid",
    "limit": 5,
    "minSimilarity": 0.3
  }
}
```

## Search Techniques

### Effective Query Formulation

To get the best results from MCP Advisor:

1. **Be Specific**: Include key functionality requirements
   ```
   Find an MCP server for OCR with support for multiple languages
   ```

2. **Include Domain Context**: Mention your application domain
   ```
   MCP server for financial data analysis with regulatory compliance features
   ```

3. **Specify Technical Requirements**: Include any technical constraints
   ```
   Find a lightweight MCP server for image processing that works offline
   ```

### Advanced Search Options

When using MCP Advisor programmatically, you can specify additional search parameters:

```typescript
const results = await searchService.search("vector database", {
  limit: 10,
  minSimilarity: 0.2,
  includeMetadata: true
});
```

## Integration with AI Assistants

### Claude Desktop

1. Add MCP Advisor to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "mcpadvisor": {
         "command": "npx",
         "args": ["-y", "@xiaohui-wang/mcpadvisor"]
       }
     }
   }
   ```

2. Restart Claude Desktop
3. Ask Claude to find MCP servers for your tasks

### Other AI Assistants

For integration with other AI assistants that support the Model Context Protocol:

1. Install MCP Advisor globally:
   ```bash
   npm install -g @xiaohui-wang/mcpadvisor
   ```

2. Configure the assistant to use MCP Advisor as a server
3. Refer to your assistant's documentation for specific MCP integration steps

## Troubleshooting

For common issues and solutions, please refer to the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide.

If you encounter problems not covered in the troubleshooting guide, please [open an issue](https://github.com/istarwyh/mcpadvisor/issues) on GitHub.
