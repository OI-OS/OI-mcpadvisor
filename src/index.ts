#!/usr/bin/env node

import { SearchService } from './services/searchService.js';
import { CompassSearchProvider } from './services/search/CompassSearchProvider.js';
import { ServerService, TransportType, TransportConfig } from './services/serverService.js';
import logger from './utils/logger.js';
import { GetMcpSearchProvider } from './services/search/GetMcpSearchProvider.js';

const DEFAULT_TRANSPORT_CONFIG: TransportConfig = {
  port: parseInt(process.env.SERVER_PORT || '3000', 10),
  host: process.env.SERVER_HOST || 'localhost',
  path: process.env.SSE_PATH || '/sse',
  messagePath: process.env.MESSAGE_PATH || '/messages',
  endpoint: process.env.ENDPOINT || '/rest',
};

/**
 * Main application entry point
 * Initializes services and starts the MCP server
 */
async function main() {
  try {
    logger.info('Starting MCP Compass application');
    const compassSearchProvider = new CompassSearchProvider();
    const getMcpSearchProvider = new GetMcpSearchProvider();
    const searchService = new SearchService([compassSearchProvider,getMcpSearchProvider]);
    let transportType = TransportType.STDIO;
    if (process.env.TRANSPORT_TYPE === 'sse') {
      transportType = TransportType.SSE;
    } else if (process.env.TRANSPORT_TYPE === 'rest') {
      transportType = TransportType.REST;
    }
    
    const serverService = new ServerService(searchService);
    await serverService.start(transportType, DEFAULT_TRANSPORT_CONFIG);
  } catch (error) {
    logger.error(`Fatal error in main(): ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(`Fatal error in main(): ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
