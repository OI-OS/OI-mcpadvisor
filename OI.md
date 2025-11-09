# OI OS Integration Guide for OI-mcpadvisor

This guide provides complete instructions for AI agents to install, configure, and use the OI-mcpadvisor MCP server in OI OS (Brain Trust 4).

## 🚀 Installation

### Prerequisites

| Requirement | Version        |
| ----------- | -------------- |
| **Node.js** | 18.x or higher |
| **pnpm**    | 9.15.0+        |
| **Git**     | Any            |

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/OI-OS/OI-mcpadvisor.git
   ```

2. **Navigate to the server directory:**
   ```bash
   cd MCP-servers/OI-mcpadvisor
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

   **Note:** This project requires `pnpm` instead of `npm`. If you don't have `pnpm` installed:
   ```bash
   npm install -g pnpm
   ```

4. **Build the project:**
   ```bash
   pnpm run build
   ```

5. **Connect the server to OI OS:**
   ```bash
   cd ../../ # Go back to the OI OS root directory
   ./brain-trust4 connect OI-mcpadvisor node -- "$(pwd)/MCP-servers/OI-mcpadvisor/build/index.js"
   ```

## 🔧 Configuration

### Environment Variables (Optional)

The server supports optional environment variables for advanced features:

```bash
# Nacos Service Discovery (Optional)
export NACOS_SERVER_ADDR="http://localhost:8848"
export NACOS_USERNAME="nacos"
export NACOS_PASSWORD="nacos"
export MCP_HOST="localhost"
export MCP_PORT="3000"
export AUTH_TOKEN=""
export NACOS_DEBUG="false"

# Meilisearch (Optional)
export MEILISEARCH_URL="http://localhost:7700"
export MEILISEARCH_API_KEY=""
export MEILISEARCH_INDEX_NAME="mcp_servers"
```

**Note:** The server works without these environment variables. They enable additional search providers and features.

## 📋 Creating Intent Mappings

Intent mappings connect natural language keywords to specific MCP server tools.

**SQL to create intent mappings:**

```sql
BEGIN TRANSACTION;

-- Intent mappings for OI-mcpadvisor
INSERT OR REPLACE INTO intent_mappings (keyword, server_name, tool_name, priority) VALUES
('recommend mcp server', 'OI-mcpadvisor', 'recommend-mcp-servers', 10),
('find mcp server', 'OI-mcpadvisor', 'recommend-mcp-servers', 10),
('search mcp server', 'OI-mcpadvisor', 'recommend-mcp-servers', 10),
('mcp server recommendation', 'OI-mcpadvisor', 'recommend-mcp-servers', 10),
('recommend mcp', 'OI-mcpadvisor', 'recommend-mcp-servers', 10),
('find mcp', 'OI-mcpadvisor', 'recommend-mcp-servers', 10),
('search mcp', 'OI-mcpadvisor', 'recommend-mcp-servers', 10),
('install mcp server', 'OI-mcpadvisor', 'install-mcp-server', 10),
('install mcp', 'OI-mcpadvisor', 'install-mcp-server', 10),
('mcp installation guide', 'OI-mcpadvisor', 'install-mcp-server', 10),
('mcp setup guide', 'OI-mcpadvisor', 'install-mcp-server', 10);

COMMIT;
```

## 📝 Creating Parameter Rules

Parameter rules define which fields are required and how to extract them from natural language queries.

**SQL to create parameter rules:**

```sql
BEGIN TRANSACTION;

-- Parameter rules for OI-mcpadvisor
INSERT OR REPLACE INTO parameter_rules (server_name, tool_name, tool_signature, required_fields, field_generators, patterns) VALUES
('OI-mcpadvisor', 'recommend-mcp-servers', 'OI-mcpadvisor::recommend-mcp-servers', '["taskDescription"]',
 '{"taskDescription": {"FromQuery": "OI-mcpadvisor::recommend-mcp-servers.taskDescription"}, "keywords": {"FromQuery": "OI-mcpadvisor::recommend-mcp-servers.keywords"}, "capabilities": {"FromQuery": "OI-mcpadvisor::recommend-mcp-servers.capabilities"}}', '[]'),
('OI-mcpadvisor', 'install-mcp-server', 'OI-mcpadvisor::install-mcp-server', '["mcpName", "sourceUrl"]',
 '{"mcpName": {"FromQuery": "OI-mcpadvisor::install-mcp-server.mcpName"}, "sourceUrl": {"FromQuery": "OI-mcpadvisor::install-mcp-server.sourceUrl"}, "mcpClient": {"FromQuery": "OI-mcpadvisor::install-mcp-server.mcpClient"}}', '[]');

COMMIT;
```

## 🔍 Parameter Extractors

Add these patterns to `parameter_extractors.toml.default`:

```toml
# ============================================================================
# OI-mcpadvisor Parameter Extractors
# ============================================================================

# recommend-mcp-servers
"OI-mcpadvisor::recommend-mcp-servers.taskDescription" = "template:{{query}}"
"OI-mcpadvisor::recommend-mcp-servers.keywords" = "regex:(?:keywords?|key[\\s_-]?words?)[\\s:]+([^,]+(?:,[^,]+)*)"
"OI-mcpadvisor::recommend-mcp-servers.capabilities" = "regex:(?:capabilities?|features?|functions?)[\\s:]+([^,]+(?:,[^,]+)*)"

# install-mcp-server
"OI-mcpadvisor::install-mcp-server.mcpName" = "regex:(?:mcp[\\s_-]?name|name|server[\\s_-]?name)[\\s:]+([a-zA-Z0-9_-]+)"
"OI-mcpadvisor::install-mcp-server.sourceUrl" = "regex:(?:source[\\s_-]?url|url|github[\\s_-]?url|repo[\\s_-]?url)[\\s:]+(https?://[^\\s]+|[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)"
"OI-mcpadvisor::install-mcp-server.mcpClient" = "regex:(?:client|mcp[\\s_-]?client)[\\s:]+([a-zA-Z0-9_-]+)"
```

## 🛠️ Available Tools

### 1. `recommend-mcp-servers`

**Description:** Recommends MCP servers based on task description, keywords, and capabilities. Searches multiple registries (Meilisearch, GetMCP, Compass, Nacos) to find the best matches.

**Parameters:**
- `taskDescription` (required): Detailed description of the task or use case
- `keywords` (optional): Array of search keywords
- `capabilities` (optional): Array of required capabilities/features

**Example Direct Call:**
```bash
./brain-trust4 call OI-mcpadvisor recommend-mcp-servers '{
  "taskDescription": "Find MCP servers for natural language processing and text analysis",
  "keywords": ["NLP", "text processing"],
  "capabilities": ["sentiment analysis", "entity recognition"]
}'
```

**Example Natural Language:**
```bash
./oi "recommend mcp server for natural language processing"
./oi "find mcp server for text analysis with sentiment analysis capabilities"
```

### 2. `install-mcp-server`

**Description:** Generates installation and configuration guides for MCP servers. Provides step-by-step instructions for different MCP clients (Claude Desktop, Windsurf, Cursor, Cline, etc.).

**Parameters:**
- `mcpName` (required): Name of the MCP server to install
- `sourceUrl` (required): GitHub URL or repository URL of the MCP server
- `mcpClient` (optional): MCP client name (e.g., "Claude Desktop", "Windsurf", "Cursor", "Cline")

**Example Direct Call:**
```bash
./brain-trust4 call OI-mcpadvisor install-mcp-server '{
  "mcpName": "pipedrive-mcp-server-extended",
  "sourceUrl": "https://github.com/OI-OS/pipedrive-mcp-server-extended",
  "mcpClient": "OI OS"
}'
```

**Example Natural Language:**
```bash
./oi "install mcp server pipedrive-mcp-server-extended from https://github.com/OI-OS/pipedrive-mcp-server-extended"
./oi "install mcp server OI-In-Memoria from https://github.com/OI-OS/OI-In-Memoria for OI OS"
```

## 📚 Usage Examples

### Example 1: Finding MCP Servers

**Query:**
```bash
./oi "find mcp server for database management"
```

**What happens:**
1. Intent mapping matches "find mcp server" → `recommend-mcp-servers`
2. Parameter extraction extracts `taskDescription: "for database management"`
3. Tool searches multiple registries
4. Returns list of matching MCP servers with descriptions

### Example 2: Installing an MCP Server

**Query:**
```bash
./oi "install mcp server OI-Memory-Orchestrator from https://github.com/OI-OS/OI-Memory-Orchestrator"
```

**What happens:**
1. Intent mapping matches "install mcp server" → `install-mcp-server`
2. Parameter extraction extracts:
   - `mcpName: "OI-Memory-Orchestrator"`
   - `sourceUrl: "https://github.com/OI-OS/OI-Memory-Orchestrator"`
3. Tool generates installation guide
4. Returns step-by-step installation instructions

### Example 3: Advanced Search with Keywords

**Query:**
```bash
./oi "recommend mcp server for vector database with keywords embeddings search"
```

**What happens:**
1. Intent mapping matches "recommend mcp server" → `recommend-mcp-servers`
2. Parameter extraction extracts:
   - `taskDescription: "for vector database"`
   - `keywords: ["embeddings", "search"]`
3. Tool searches with enhanced keyword matching
4. Returns relevant MCP servers

## 🔍 Search Providers

The server uses multiple search providers in parallel:

1. **Meilisearch Provider**: Fast, fault-tolerant text search
2. **GetMCP Provider**: API search from GetMCP registry with vector search
3. **Compass Provider**: API search from Compass registry
4. **Nacos Provider**: Service discovery integration (optional, requires environment variables)
5. **Offline Provider**: Hybrid search combining text matching and vector search

Results are merged, deduplicated, and ranked by relevance.

## 🐛 Troubleshooting

### Build Fails with "only-allow pnpm"

**Error:** `npm error command failed: npm error command sh -c npx only-allow pnpm`

**Solution:** This project requires `pnpm` instead of `npm`. Install `pnpm`:
```bash
npm install -g pnpm
```

Then use `pnpm install` and `pnpm run build`.

### No Search Results

**Issue:** `recommend-mcp-servers` returns no results

**Possible causes:**
1. Network connectivity issues (search providers require internet)
2. Search query too specific or too vague
3. Search providers not configured (Meilisearch, Nacos)

**Solutions:**
- Try a more general query
- Check network connection
- Configure optional search providers if needed

### Installation Guide Not Generated

**Issue:** `install-mcp-server` fails to generate guide

**Possible causes:**
1. Invalid GitHub URL
2. Repository not accessible
3. Missing README or installation instructions

**Solutions:**
- Verify the GitHub URL is correct and accessible
- Ensure the repository has a README file
- Check network connectivity

## 📖 Additional Resources

- **GitHub Repository:** https://github.com/OI-OS/OI-mcpadvisor
- **Original Repository:** https://github.com/istarwyh/mcpadvisor
- **MCP Protocol:** https://modelcontextprotocol.org
- **Documentation:** See `docs/` directory in the repository

## ✅ Verification

After installation, verify the server is working:

```bash
# List tools
./brain-trust4 tools OI-mcpadvisor

# Test recommendation
./oi "recommend mcp server for task management"

# Test installation guide
./oi "install mcp server test-server from https://github.com/example/test-server"
```

## 🎯 Summary

The OI-mcpadvisor server provides two powerful tools:
1. **Recommend MCP Servers**: Find the right MCP servers for your tasks
2. **Install MCP Servers**: Get step-by-step installation guides

Both tools work with natural language queries, making it easy to discover and install MCP servers in OI OS.

