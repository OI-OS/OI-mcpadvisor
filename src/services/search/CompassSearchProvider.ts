/**
 * Default COMPASS API search provider implementation
 */

import { MCPServerResponse, SearchProvider } from '../../types/index.js';
import { COMPASS_API_BASE } from '../../config/constants.js';
import logger from '../../utils/logger.js';

export class CompassSearchProvider implements SearchProvider {
  private apiBase: string;

  constructor(apiBase: string = COMPASS_API_BASE) {
    this.apiBase = apiBase;
    logger.info(`CompassSearchProvider initialized with API base: ${this.apiBase}`);
  }

  /**
   * Search for MCP servers using the COMPASS API
   * @param query - The search query
   * @returns Promise with array of MCP server responses
   */
  async search(query: string): Promise<MCPServerResponse[]> {
    try {
      logger.info(`Searching for MCP servers with query: ${query}`);
      const response = await fetch(`${this.apiBase}/recommend?description=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorMsg = `COMPASS API request failed with status ${response.status}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      logger.debug(`Received ${data.length} results from COMPASS API`);
      return data as MCPServerResponse[];
    } catch (error) {
      logger.error(`Error fetching from COMPASS API: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}