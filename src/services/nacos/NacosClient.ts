import type { INacosClient, NacosMcpServer } from '../../types/nacos.js';
import { NacosHttpClient } from './NacosHttpClient.js';
import logger from '../../utils/logger.js';

/**
 * Implementation of the Nacos client that interacts with Nacos server
 * to discover and manage MCP servers.
 */
export class NacosClient implements INacosClient {
  private readonly httpClient: NacosHttpClient;
  private isInitialized = false;

  constructor(
    private readonly config: {
      serverAddr: string;
      username: string;
      password: string;
      mcpHost?: string;
      mcpPort?: number;
      authToken?: string;
    }
  ) {
    this.httpClient = new NacosHttpClient(
      config.serverAddr,
      config.username,
      config.password
    );
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if Nacos server is reachable
      const isReady = await this.httpClient.isReady();
      if (!isReady) {
        throw new Error('Failed to connect to Nacos server');
      }

      logger.info('Successfully connected to Nacos server');
      this.isInitialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize NacosClient: ${errorMessage}`);
      throw error;
    }
  }

  async searchMcpByKeyword(keyword: string): Promise<NacosMcpServer[]> {
    if (!this.isInitialized) {
      throw new Error('NacosClient is not initialized. Call init() first.');
    }

    try {
      // Get all MCP servers and filter by keyword
      const allServers = await this.httpClient.getMcpServers();
      
      // Simple case-insensitive search in name and description
      const searchTerm = keyword.toLowerCase();
      return allServers.filter(server => 
        server.name.toLowerCase().includes(searchTerm) || 
        server.description?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error searching MCP by keyword '${keyword}': ${errorMessage}`);
      throw error;
    }
  }

  async getMcpServer(name: string, limit: number = 10): Promise<NacosMcpServer[]> {
    if (!this.isInitialized) {
      throw new Error('NacosClient is not initialized. Call init() first.');
    }

    try {
      // Get specific MCP server by name
      const server = await this.httpClient.getMcpServerByName(name);
      return server ? [server] : [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error getting MCP server '${name}': ${errorMessage}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      // Clean up any resources if needed
      this.isInitialized = false;
      logger.info('NacosClient closed successfully');
    } catch (error) {
      logger.error('Error closing NacosClient:', error);
      throw error;
    }
  }
}
