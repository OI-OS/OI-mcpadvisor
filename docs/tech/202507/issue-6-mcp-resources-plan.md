# Issue #6: Support MCP Resources to read log

**Issue Link**: https://github.com/[repository]/issues/6

## Problem Statement

Issue #6 requests implementing MCP (Model Context Protocol) Resources functionality to read log files. Currently, MCPAdvisor only supports MCP Tools but lacks Resources capability, which would allow exposing log files as contextual data to LLM clients.

## Current Architecture

- MCPAdvisor has MCP server functionality in `src/services/core/server/ServerService.ts`
- Uses `@modelcontextprotocol/sdk` for MCP implementation
- Currently supports **tools only** (search and installation tools)
- Uses Express with SSE transport
- No **resources** capability implemented

## MCP Resources Overview

Based on research from MCP specification:
- **Resources**: Core primitives that expose data to LLMs as context
- **Resource Listing**: Via `resources/list` request, returns available resources with URI, name, MIME type
- **Resource Reading**: Via `resources/read` request with resource URI, returns content
- **Log Example**: URI like `file:///logs/app.log` with MIME type `text/plain`

## Implementation Plan

### Phase 1: Infrastructure Setup
1. **Update Server Capabilities**
   - Modify `ServerService.ts` to include resources capability
   - Update server initialization to support resources

2. **Create Resource Handler Base Classes**
   - Create `BaseResourceHandler.ts` (similar to `BaseToolHandler.ts`)
   - Add resource handler interface and abstract methods

### Phase 2: Core Resource Implementation
3. **Create Log Resource Handler**
   - Create `LogResourceHandler.ts`
   - Implement resource listing (discovery of log files)
   - Implement resource reading (reading log file contents)

4. **Update Request Handler Factory**
   - Add resource handlers to `RequestHandlerFactory.ts`
   - Create `createListResourcesHandler` and `createReadResourceHandler`

### Phase 3: Types and Integration
5. **Update Type Definitions**
   - Add resource-related types to `types.ts`
   - Create interfaces for log resources
   - Add resource handler types

6. **Register Resource Handlers**
   - Register resource handlers in `ServerService.ts`
   - Update server configuration to expose resources

### Phase 4: Testing and Validation
7. **Unit Tests**
   - Test resource handler functionality
   - Test log file discovery and reading
   - Test error handling and edge cases

8. **Integration Tests**
   - Test MCP resource protocol compliance
   - Test with MCP inspector tool
   - End-to-end testing with MCP client

## Technical Implementation Details

### Resource Handler Structure
```typescript
export abstract class BaseResourceHandler {
  abstract listResources(): Promise<Resource[]>;
  abstract readResource(uri: string): Promise<ResourceContent>;
}

export class LogResourceHandler extends BaseResourceHandler {
  async listResources(): Promise<Resource[]> {
    // Discover available log files
  }
  
  async readResource(uri: string): Promise<ResourceContent> {
    // Read specific log file content
  }
}
```

### MCP Schema Integration
- Use `ListResourcesRequestSchema` and `ReadResourceRequestSchema` from MCP SDK
- Integrate with existing server request handling pattern

### File Discovery Strategy
- Configure log directories via environment variables
- Support multiple log file formats (.log, .txt)
- Handle log rotation and multiple log files
- Provide proper error handling for missing/inaccessible files

## Success Criteria

1. ✅ MCP server exposes resources capability
2. ✅ Can list available log files via `resources/list`
3. ✅ Can read log file contents via `resources/read`
4. ✅ Proper error handling for missing files
5. ✅ All tests pass
6. ✅ Works with MCP inspector tool
7. ✅ Follows existing code patterns and conventions

## Files to Modify/Create

### New Files:
- `src/services/core/server/resources/BaseResourceHandler.ts`
- `src/services/core/server/resources/LogResourceHandler.ts`
- `src/tests/unit/services/server/LogResourceHandler.test.ts`
- `src/tests/integration/server/mcp-resources.test.ts`

### Modified Files:
- `src/services/core/server/ServerService.ts`
- `src/services/core/server/types.ts`
- `src/services/core/server/handlers/RequestHandlerFactory.ts`

## Notes

- Follow existing code patterns from tool handlers
- Use Winston logger for consistent logging
- Support configurable log directories
- Handle log file permissions and access errors gracefully
- Consider log file size limits for performance