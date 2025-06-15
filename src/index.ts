#!/usr/bin/env node

import { SearchService } from './services/searchService.js';
import { CompassSearchProvider } from './services/search/CompassSearchProvider.js';
import { ServerService, TransportType, TransportConfig } from './services/server/index.js';
import logger from './utils/logger.js';
import { GetMcpSearchProvider } from './services/search/GetMcpSearchProvider.js';
import { MeilisearchSearchProvider } from './services/search/MeilisearchSearchProvider.js';
import { getParamValue } from '@chatmcp/sdk/utils/index.js';

/**
 * Main application entry point
 * Initializes services and starts the MCP server
 */
async function main() {
  try {
    logger.info('Starting MCP Advisor application');

    // Get parameters from command line or environment variables
    const mode = getParamValue('mode') || process.env.TRANSPORT_TYPE || 'stdio';
    const port = parseInt(
      getParamValue('port') || process.env.SERVER_PORT || '3000',
      10,
    );
    const host =
      getParamValue('host') || process.env.SERVER_HOST || 'localhost';
    const messagePath =
      getParamValue('messagePath') || '/messages';
    const endpoint =
      getParamValue('endpoint') || process.env.ENDPOINT || '/rest';

    // Configure transport
    const transportConfig: TransportConfig = {
      port,
      host,
      ssePath: '/sse',
      messagePath,
      endpoint,
    };

    // Initialize search providers
    const searchProviders = [
      new MeilisearchSearchProvider(),
      new CompassSearchProvider(),
      new GetMcpSearchProvider(),
    ];
    
    const searchService = new SearchService(searchProviders);

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

    logger.info(`MCP Advisor server started with ${transportType} transport,endpoint:${endpoint}`);
  } catch (error) {
    logger.error(
      `Fatal error in main(): ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

main().catch(error => {
  logger.error(
    `Fatal error in main(): ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
