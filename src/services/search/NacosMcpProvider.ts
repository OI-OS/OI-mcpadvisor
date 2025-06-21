import type { SearchProvider, MCPServerResponse } from '../../types/index.js';
import type { SearchParams } from '../../types/search.js';
import type { INacosClient, NacosMcpProviderConfig, NacosMcpServer } from '../../types/nacos.js';
import { NacosClient } from '../nacos/NacosClient.js';
import logger from '../../utils/logger.js';

/**
 * Nacos MCP Provider implementation for searching MCP servers via Nacos
 */
export class NacosMcpProvider implements SearchProvider {
  private readonly config: Required<NacosMcpProviderConfig>;
  private nacosClient: INacosClient | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Creates a new instance of NacosMcpProvider
   * @param config Configuration for the Nacos MCP provider
   * @param testMode If true, skips automatic initialization (for testing)
   */
  constructor(
    config: NacosMcpProviderConfig & { authToken?: string },
    private readonly testMode: boolean = false
  ) {
    this.config = {
      minSimilarity: 0.3,
      limit: 10,
      debug: false,
      mcpHost: 'localhost',
      mcpPort: 3000,
      ...config,
    };
  }

  /**
   * Initialize the Nacos client.
   * This must be called after construction and before any other methods.
   * @throws Error if initialization fails
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Prevent multiple initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    // In test mode, skip real initialization
    if (this.testMode) {
      this.isInitialized = true;
      return;
    }
    
    // Create a new promise for initialization
    this.initializationPromise = (async () => {
      try {
        if (this.isInitialized) {
          return;
        }
        
        this.nacosClient = new NacosClient({
          serverAddr: this.config.serverAddr,
          username: this.config.username,
          password: this.config.password,
          mcpHost: this.config.mcpHost,
          mcpPort: this.config.mcpPort,
          authToken: this.config.authToken,
        });

        await this.nacosClient.init();
        this.isInitialized = true;
        
        if (this.config.debug) {
          logger.info('NacosMcpProvider initialized successfully');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to initialize NacosMcpProvider:', error);
        this.isInitialized = false;
        this.nacosClient = null;
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();
    
    return this.initializationPromise;
  }

  /**
   * Search for MCP servers using the provided search parameters
   * @param params Search parameters including task description and keywords
   * @returns Array of MCP server responses
   * @throws Error if provider is not initialized or initialization fails
   */
  async search(params: SearchParams): Promise<MCPServerResponse[]> {
    // Ensure we're initialized
    if (!this.isInitialized) {
      try {
        await this.init();
      } catch (error) {
        throw new Error(`Failed to initialize NacosMcpProvider: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (!this.nacosClient) {
      throw new Error('NacosClient is not available');
    }

    const { taskDescription, keywords = [] } = params;
    
    try {
      if (this.config.debug) {
        logger.debug('Searching Nacos MCP servers', {
          taskDescription,
          keywords,
          config: {
            minSimilarity: this.config.minSimilarity,
            limit: this.config.limit,
          },
        });
      }

      // Ensure we have at least one keyword
      const searchKeywords = keywords.length > 0 
        ? keywords 
        : this.extractKeywords(taskDescription);

      // Search for MCP servers
      const results = await this.searchNacosMcpServers(taskDescription, searchKeywords);
      
      if (this.config.debug) {
        logger.debug(`Found ${results.length} MCP servers`, {
          taskDescription,
          resultCount: results.length,
        });
      }

      return results;
    } catch (error) {
      logger.error('Error searching Nacos MCP servers:', {
        error: error instanceof Error ? error.message : String(error),
        taskDescription,
        keywords,
      });
      throw error;
    }
  }

  /**
   * Search for MCP servers using Nacos
   * @param taskDescription Task description
   * @param keywords Search keywords
   * @returns Array of MCP server responses
   */
  private async  searchNacosMcpServers(
    taskDescription: string,
    keywords: string[]
  ): Promise<MCPServerResponse[]> {
    if (!this.nacosClient) {
      throw new Error('Nacos client is not initialized');
    }

    const mcpServers: NacosMcpServer[] = [];

    // Search by keywords first
    for (const keyword of keywords) {
      try {
        const results = await this.nacosClient.searchMcpByKeyword(keyword);
        if (results.length > 0) {
          mcpServers.push(...results);
        }
      } catch (error) {
        logger.warn(`Failed to search MCP by keyword '${keyword}':`, error);
        // Continue with other keywords
      }
    }

    // If we don't have enough results, try to get more using the task description
    if (mcpServers.length < this.config.limit) {
      try {
        const additionalServers = await this.nacosClient.getMcpServer(
          taskDescription,
          this.config.limit - mcpServers.length
        );
        
        // Add only unique servers
        const existingNames = new Set(mcpServers.map(s => s.name));
        for (const server of additionalServers) {
          if (!existingNames.has(server.name)) {
            mcpServers.push(server);
            existingNames.add(server.name);
          }
        }
      } catch (error) {
        logger.warn('Failed to get additional MCP servers by description:', error);
      }
    }

    // Convert to MCPServerResponse format
    return mcpServers.map(server => this.mapToMcpServerResponse(server));
  }

  /**
   * Extract keywords from task description
   * @param description Task description
   * @returns Array of keywords
   */
  private extractKeywords(description: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP if needed
    return description
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter out short words
      .map(word => word.replace(/[^\w\s]/g, '').toLowerCase()) // Remove punctuation and convert to lowercase
      .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicates
      .slice(0, 5); // Limit to 5 keywords
  }

  /**
   * Map NacosMcpServer to MCPServerResponse
   * @param server Nacos MCP server
   * @returns MCPServerResponse
   */
  private mapToMcpServerResponse(server: NacosMcpServer): MCPServerResponse {
    // Extract categories and tags from agent config if available
    const categories = server.agentConfig?.categories || [];
    const tags = server.agentConfig?.tags || [];

    return {
      id: server.name,
      title: server.name,
      description: server.description,
      sourceUrl: this.getSourceUrl(server),
      similarity: 1.0, // Default similarity score
      score: 1.0, // Default score
      installations: server.agentConfig,
      categories: Array.isArray(categories) ? categories : [categories],
      tags: Array.isArray(tags) ? tags : [tags],
    };
  }

  /**
   * Generate a source URL for the MCP server
   * @param server Nacos MCP server
   * @returns Source URL
   */
  private getSourceUrl(server: NacosMcpServer): string {
    // Try to extract URL from agent config or construct a default one
    if (server.agentConfig?.url) {
      return server.agentConfig.url;
    }
    
    if (server.agentConfig?.repository) {
      return server.agentConfig.repository;
    }
    
    // Fallback to a generic URL
    return `nacos://${server.name}`;
  }

  /**
   * Close the provider and release resources
   */
  async close(): Promise<void> {
    if (this.nacosClient) {
      await this.nacosClient.close();
      this.nacosClient = null;
      this.isInitialized = false;
      
      if (this.config.debug) {
        logger.info('NacosMcpProvider closed');
      }
    }
  }
}
