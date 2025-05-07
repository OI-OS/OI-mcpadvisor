#!/usr/bin/env node

import { SearchService } from './services/searchService.js';
import { CompassSearchProvider } from './services/search/CompassSearchProvider.js';
import { ServerService, TransportType, TransportConfig } from './services/serverService.js';
import logger from './utils/logger.js';
import { GetMcpSearchProvider } from './services/search/GetMcpSearchProvider.js';
import { MeilisearchSearchProvider } from './services/search/MeilisearchSearchProvider.js';
import { getParamValue } from "@chatmcp/sdk/utils/index.js";

/**
 * Main application entry point
 * Initializes services and starts the MCP server
 */
async function main() {
  try {
    logger.info('Starting MCP Compass application');
    
    // Get parameters from command line or environment variables
    const mode = getParamValue("mode") || process.env.TRANSPORT_TYPE || "stdio";
    const port = parseInt(getParamValue("port") || process.env.SERVER_PORT || "3000", 10);
    const host = getParamValue("host") || process.env.SERVER_HOST || "localhost";
    const path = getParamValue("path") || process.env.SSE_PATH || "/sse";
    const messagePath = getParamValue("messagePath") || process.env.MESSAGE_PATH || "/messages";
    const endpoint = getParamValue("endpoint") || process.env.ENDPOINT || "/rest";
    
    // Configure transport
    const transportConfig: TransportConfig = {
      port,
      host,
      path,
      messagePath,
      endpoint
    };
    
    // Initialize search providers
    const compassSearchProvider = new CompassSearchProvider();
    const getMcpSearchProvider = new GetMcpSearchProvider();
    const meilisearchSearchProvider = new MeilisearchSearchProvider();
    const searchService = new SearchService([meilisearchSearchProvider, compassSearchProvider, getMcpSearchProvider]);
    
    // Determine transport type
    let transportType = TransportType.STDIO;
    if (mode === 'sse') {
      transportType = TransportType.SSE;
    } else if (mode === 'rest') {
      transportType = TransportType.REST;
    }
    
    // Start server
    const serverService = new ServerService(searchService);
    await serverService.start(transportType, transportConfig);
    
    logger.info(`MCP Advisor server started with ${transportType} transport`);
  } catch (error) {
    logger.error(`Fatal error in main(): ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(`Fatal error in main(): ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
