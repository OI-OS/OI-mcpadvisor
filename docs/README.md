# MCP Feature Support Configuration

## Overview
This document outlines the specifications for configuring metadata support in the MCP system. The configuration enables the system to ingest, process, and store metadata from various sources describing MCP servers.

## Key Features
- Multi-source metadata ingestion
- Unified schema processing
- Configurable field indexing
- Automated data processing pipeline

## Configuration Structure

### MCP Sources
The system supports two types of metadata sources:

1. **Remote URLs**
   - Format: HTTP/HTTPS endpoints
   - Example: `https://getmcp.io/api/servers.json`
   - Returns: Structured MCP Manifest in JSON format

2. **Local Files**
   - Format: Local filesystem paths
   - Example: `/Users/me/download/my_local_mcp_servers.json`
   - Contains: MCP servers metadata

### Field Configuration

#### Field Mappings
The system uses field mappings to normalize data from different sources:
- Structure: 
  ```json
  {
    "field_name": ["alias1", "alias2", "alias3"]
  }
  ```
- The array of aliases allows extracting data from different field names into a standardized field

## Data Processing Flow

1. **Initialization**
   - System reads configuration on startup
   - Validates source configurations
   - Initializes field mappings for data normalization

2. **Data Fetching**
   - Sequential processing of configured sources
   - Handles both remote and local data sources
   - Implements error handling for unreachable sources

3. **Data Processing**
   - Extracts required fields using configured mappings
   - Normalizes field names based on mapping configuration
   - Applies schema validation
   - Assigns default values where necessary

4. **Storage**
   - Converts processed data into schema-compliant format
   - Stores in datasource for indexing and search operations
   - Maintains data consistency through schema enforcement

## Sample Configuration
```json
{
  "mcp_sources": {
    "remote_urls": [
      "https://getmcp.io/api/servers.json"
    ],
    "local_files": [
      "/path/to/local/config.json"
    ]
  },
  "mcp_index_fields": {
    "name": ["name", "server_name", "serverName"],
    "description": ["description", "desc"],
    "installations": ["installation", "installations", "install_command"],
    "categories": ["category", "categories"],
    "tags": ["tags", "server_tags"]
  }
}
```

## Configuration Methods

### Default Configuration
The system includes a default configuration in `config/default.json`.

### Environment Variables
You can override configuration using environment variables:
- `MCP_REMOTE_URLS`: JSON array of remote URLs
- `MCP_LOCAL_FILES`: JSON array of local file paths
- `MCP_INDEX_FIELDS`: JSON object with field mappings
- `MCP_SOURCES_FILE`: Path to a JSON file with additional sources
- `CONFIG_FILE`: Path to a complete custom configuration file

### Additional Sources File
You can provide an additional sources file:
```json
{
  "mcp_sources": {
    "remote_urls": ["https://example.com/api/mcpservers"],
    "local_files": ["./data/local-servers.json"]
  },
  "mcp_index_fields": {
    "name": ["name", "title", "id"]
  }
}
```

## Standard Metadata Fields
- name
- description
- installation_command
- categories
- tags
- installations

## Technical Considerations
- All data sources must return JSON-formatted data
- System handles source failures gracefully
- Indexing is performed after successful data processing
- Data schema validation ensures consistency

## Future Development
When implementing this feature, consider:
- Error handling for unreachable remote sources
- Validation of local file permissions
- Rate limiting for remote API calls
- Caching strategy for frequently accessed data
- Monitoring and logging of data processing pipeline 