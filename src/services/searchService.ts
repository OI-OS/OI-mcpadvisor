/**
 * Search service for MCP servers
 * Implements the search functionality with extensibility for different providers
 */

import { MCPServerResponse, SearchOptions, SearchProvider } from '../types/index.js';
import { GetMcpSearchProvider } from './search/GetMcpSearchProvider.js';
import { CompassSearchProvider } from './search/CompassSearchProvider.js';
import logger from '../utils/logger.js';

/**
 * 默认搜索选项
 */
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  limit: 10,
  minSimilarity: 0.5
};

/**
 * Search service that can use multiple search providers
 */
export class SearchService {
  private providers: SearchProvider[];

  /**
   * Create a new search service with the specified providers
   * @param providers - Array of search providers to use
   */
  constructor(providers: SearchProvider[] = []) {
    this.providers = providers;
    logger.info(`SearchService initialized with ${providers.length} providers`);
  }

  /**
   * Add a new search provider
   * @param provider - The search provider to add
   */
  addProvider(provider: SearchProvider): void {
    this.providers.push(provider);
    logger.info(`New provider added, total providers: ${this.providers.length}`);
  }

  /**
   * Remove a search provider
   * @param index - The index of the provider to remove
   */
  removeProvider(index: number): void {
    if (index >= 0 && index < this.providers.length) {
      this.providers.splice(index, 1);
      logger.info(`Provider removed, total providers: ${this.providers.length}`);
    } else {
      logger.warn(`Invalid provider index: ${index}`);
    }
  }

  /**
   * Get all current providers
   * @returns Array of search providers
   */
  getProviders(): SearchProvider[] {
    return [...this.providers];
  }

  /**
   * Search for MCP servers using all providers
   * @param query - The search query
   * @param options - Optional search configuration
   * @returns Promise with array of MCP server responses
   */
  async search(query: string, options?: SearchOptions): Promise<MCPServerResponse[]> {
    if (this.providers.length === 0) {
      logger.warn('No search providers available');
      return [];
    }

    try {
      // 合并默认选项
      const mergedOptions = { ...DEFAULT_SEARCH_OPTIONS, ...options };
      
      logger.info(`Searching with ${this.providers.length} providers for query: ${query}`);
      
      // Collect results from all providers in parallel
      const providerPromises = this.providers.map(provider => 
        provider.search(query).catch(error => {
          logger.error(`Provider search failed: ${error instanceof Error ? error.message : String(error)}`);
          return [] as MCPServerResponse[];
        })
      );
      
      const providerResults = await Promise.all(providerPromises);
      
      // Merge results from all providers
      let mergedResults = providerResults.flat();
      
      // Remove duplicates based on github_url
      const uniqueUrls = new Set<string>();
      mergedResults = mergedResults.filter(server => {
        if (uniqueUrls.has(server.github_url)) {
          return false;
        }
        uniqueUrls.add(server.github_url);
        return true;
      });
      
      // Sort by similarity score (highest first)
      mergedResults.sort((a, b) => b.similarity - a.similarity);
      
      // Apply filtering based on options
      if (mergedOptions.minSimilarity !== undefined) {
        mergedResults = mergedResults.filter(
          server => server.similarity >= mergedOptions.minSimilarity!
        );
      }
      
      if (mergedOptions.limit !== undefined && mergedOptions.limit > 0) {
        mergedResults = mergedResults.slice(0, mergedOptions.limit);
      }
      
      logger.debug(`Merged results: ${mergedResults.length} servers after filtering`);
      return mergedResults;
    } catch (error) {
      logger.error(`Error in search service: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 使用 GetMCP 搜索提供者搜索
   * 便捷方法，直接使用 GetMcpSearchProvider
   */
  static async searchGetMcp(
    query: string, 
    options: SearchOptions = {}
  ): Promise<MCPServerResponse[]> {
    try {
      logger.info(`Searching GetMCP with query: "${query}"`);
      
      // 创建 GetMcpSearchProvider 实例
      const provider = new GetMcpSearchProvider();
      
      // 创建 SearchService 实例
      const service = new SearchService([provider]);
      
      // 执行搜索
      return service.search(query, options);
    } catch (error) {
      logger.error(`Error searching GetMCP: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 使用 Compass 搜索提供者搜索
   * 便捷方法，直接使用 CompassSearchProvider
   */
  static async searchCompass(
    query: string, 
    options: SearchOptions = {}
  ): Promise<MCPServerResponse[]> {
    try {
      logger.info(`Searching Compass with query: "${query}"`);
      
      // 创建 CompassSearchProvider 实例
      const provider = new CompassSearchProvider();
      
      // 创建 SearchService 实例
      const service = new SearchService([provider]);
      
      // 执行搜索
      return service.search(query, options);
    } catch (error) {
      logger.error(`Error searching Compass: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
