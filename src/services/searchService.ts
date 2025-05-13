/**
 * Search service for MCP servers
 * Implements the search functionality with extensibility for different providers
 */

import { MCPServerResponse, SearchOptions, SearchProvider } from '../types/index.js';
import { GetMcpSearchProvider } from './search/GetMcpSearchProvider.js';
import { CompassSearchProvider } from './search/CompassSearchProvider.js';
import { MeilisearchSearchProvider } from './search/MeilisearchSearchProvider.js';
import { OfflineSearchProvider } from './search/OfflineSearchProvider.js';
import logger from '../utils/logger.js';
import { filterFromEndUntilLimit } from '../utils/ListUtils.js';
import config from 'config';

/**
 * 默认搜索选项
 */
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  limit: 5,
  minSimilarity: 0.5
};

/**
 * 离线模式配置选项
 */
interface OfflineConfig {
  /**
   * 是否启用离线模式
   */
  enabled: boolean;
  
  /**
   * 自定义兜底数据路径
   */
  fallbackDataPath?: string;
  
  /**
   * 最小相似度阈值
   */
  minSimilarity?: number;
}

/**
 * 默认离线模式配置
 */
const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
  enabled: true,
  minSimilarity: 0.3
};

/**
 * Search service that can use multiple search providers
 */
export class SearchService {
  private providers: SearchProvider[];

  /**
   * 离线搜索提供者
   * 用于在网络不可用时提供兜底推荐
   */
  private offlineProvider?: OfflineSearchProvider;
  
  /**
   * 离线模式配置
   */
  private offlineConfig: OfflineConfig;

  /**
   * Create a new search service with the specified providers
   * @param providers - Array of search providers to use
   * @param offlineConfig - 离线模式配置，默认启用
   */
  constructor(
    providers: SearchProvider[] = [], 
    offlineConfig: Partial<OfflineConfig> = {}
  ) {
    this.providers = providers;
    
    // 合并离线模式配置
    this.offlineConfig = {
      ...DEFAULT_OFFLINE_CONFIG,
      ...offlineConfig
    };
    
    // 如果启用了离线模式，初始化离线搜索提供者
    if (this.offlineConfig.enabled) {
      this.initOfflineProvider();
    }
    
    logger.info(`SearchService initialized with ${providers.length} providers`, {
      providerCount: providers.length,
      offlineMode: this.offlineConfig.enabled
    });
  }
  
  /**
   * 初始化离线搜索提供者
   */
  private initOfflineProvider(): void {
    try {
      this.offlineProvider = new OfflineSearchProvider({
        fallbackDataPath: this.offlineConfig.fallbackDataPath,
        minSimilarity: this.offlineConfig.minSimilarity
      });
      logger.info('Offline search provider initialized');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize offline search provider: ${message}`, { error });
    }
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
    if (this.providers.length === 0 && !this.offlineProvider) {
      logger.warn('No search providers available');
      return [];
    }

    try {
      // 合并默认选项
      const mergedOptions = { ...DEFAULT_SEARCH_OPTIONS, ...options };
      
      logger.info(`Searching with ${this.providers.length} providers for query: ${query}`, 'SearchService', { providerCount: this.providers.length });
      
      // 准备所有提供者的列表，包括离线提供者
      const allProviders = [...this.providers];
      let offlineProviderIndex = -1;
      
      // 如果启用了离线模式，添加离线提供者
      if (this.offlineConfig.enabled && this.offlineProvider) {
        offlineProviderIndex = allProviders.length;
        allProviders.push(this.offlineProvider);
      }
      
      // Collect results from all providers in parallel
      const providerPromises = allProviders.map((provider, index) => {
        const providerName = provider.constructor.name;
        logger.info(`Starting search with provider ${index + 1}/${this.providers.length}: ${providerName}`, 'Provider', { 
          providerName,
          providerIndex: index,
          query 
        });
        
        return provider.search(query)
          .then(results => {
            logger.info(`Provider ${providerName} returned ${results.length} results`, 'Provider', {
              providerName,
              resultCount: results.length,
              topResults: results.slice(0, 3).map(r => ({ 
                title: r.title, 
                similarity: r.similarity,
                github_url: r.github_url 
              }))
            });
            
            // Log full results at debug level
            if (results.length > 0) {
              logger.debug(`Full results from provider ${providerName}:`, 'Provider', {
                providerName,
                results
              });
            }
            
            return {
              providerName,
              results
            };
          })
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Provider ${providerName} search failed: ${errorMessage}`, 'Provider', {
              providerName,
              error: errorMessage
            });
            return {
              providerName,
              results: [] as MCPServerResponse[]
            };
          });
      });
      
      const namedProviderResults = await Promise.all(providerPromises);
      
      // Log summary of results from each provider
      namedProviderResults.forEach(({ providerName, results }) => {
        logger.info(`Provider ${providerName} found ${results.length} results`, 'SearchSummary', {
          providerName,
          resultCount: results.length
        });
      });
      
      // Merge results from all providers
      const providerResults = namedProviderResults.map(npr => npr.results);
      let mergedResults = providerResults.flat();
      
      logger.info(`Merged ${mergedResults.length} total results from all providers`, 'SearchService', { 
        totalResults: mergedResults.length 
      });

      // Log pre-deduplication count
      logger.info(`Starting deduplication process with ${mergedResults.length} results`, 'Deduplication', {
        initialCount: mergedResults.length
      });
      
      // Remove duplicates based on github_url
      const uniqueUrls = new Set<string>();
      const duplicates: string[] = [];
      
      mergedResults = mergedResults.filter(server => {
        if (uniqueUrls.has(server.github_url)) {
          duplicates.push(server.github_url);
          return false;
        }
        uniqueUrls.add(server.github_url);
        return true;
      });
      
      // Log deduplication results
      logger.info(`Deduplication complete: removed ${duplicates.length} duplicates`, 'Deduplication', {
        removedCount: duplicates.length,
        remainingCount: mergedResults.length,
        duplicateUrls: duplicates.length > 0 ? duplicates : undefined
      });
      
      // Log pre-sorting information
      logger.info(`Sorting ${mergedResults.length} results by similarity score`, 'Sorting');
      
      // Sort by similarity score (highest first)
      mergedResults.sort((a, b) => b.similarity - a.similarity);
      
      // Log top results after sorting
      if (mergedResults.length > 0) {
        logger.info(`Top 3 results after sorting:`, 'Sorting', {
          topResults: mergedResults.slice(0, 3).map(r => ({
            title: r.title,
            similarity: r.similarity,
            github_url: r.github_url
          }))
        });
      }
      
      // Apply filtering based on options
      let filteredCount = 0;
      let originalCount = mergedResults.length;
      
      // Apply minimum similarity filter
      if (mergedOptions.minSimilarity !== undefined && mergedResults.length > 5) {
        logger.info(`Applying minimum similarity filter: ${mergedOptions.minSimilarity}`, 'Filtering', {
          minSimilarity: mergedOptions.minSimilarity,
          beforeCount: mergedResults.length
        });
        
        mergedResults = filterFromEndUntilLimit(
          mergedResults,  
          server => server.similarity >= mergedOptions.minSimilarity!,
          5
        );
        
        filteredCount += (originalCount - mergedResults.length);
        originalCount = mergedResults.length;
        
        logger.info(`After similarity filtering: ${mergedResults.length} results remain`, 'Filtering', {
          afterCount: mergedResults.length,
          removedCount: filteredCount
        });
      }
      
      // Apply limit filter
      if (mergedOptions.limit !== undefined && mergedOptions.limit > 0) {
        logger.info(`Applying result limit: ${mergedOptions.limit}`, 'Filtering', {
          limit: mergedOptions.limit,
          beforeCount: mergedResults.length
        });
        
        const beforeLimit = mergedResults.length;
        mergedResults = mergedResults.slice(0, mergedOptions.limit);
        filteredCount += (beforeLimit - mergedResults.length);
        
        logger.info(`After limit filtering: ${mergedResults.length} results remain`, 'Filtering', {
          afterCount: mergedResults.length,
          removedCount: beforeLimit - mergedResults.length
        });
      }
      
      // Log final results with full details
      logger.info(`Final search results: ${mergedResults.length} servers`, 'SearchResults', {
        resultCount: mergedResults.length,
        results: mergedResults.map(r => ({
          title: r.title,
          similarity: r.similarity.toFixed(4),
          github_url: r.github_url
        }))
      });

      logger.debug(`Merged results: ${mergedResults.length} servers after filtering`);
      return mergedResults;
    } catch (error) {
      logger.error(`Error in search service: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 静态离线搜索方法，不需要创建 SearchService 实例
   * @param query 搜索查询
   * @param options 搜索选项
   * @param fallbackDataPath 备用数据路径
   * @param useEnhanced 是否使用增强型离线搜索提供者，默认为 true
   * @returns 搜索结果
   */
  static async searchOffline(
    query: string, 
    options: SearchOptions = {}, 
    fallbackDataPath?: string,
    textMatchWeight: number = 0.7
  ): Promise<MCPServerResponse[]> {
    try {
      logger.info(`Searching offline with query: "${query}"`, 'OfflineSearch', { query, options });
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 创建离线搜索提供者
      logger.debug('Using OfflineSearchProvider', 'OfflineSearch');
      const provider = new OfflineSearchProvider({
        fallbackDataPath,
        minSimilarity: options.minSimilarity || 0.3,
        textMatchWeight: textMatchWeight,
        vectorSearchWeight: 1 - textMatchWeight
      });
      
      const results = await provider.search(query);
      
      const duration = Date.now() - startTime;
      
      logger.info(`Offline search completed in ${duration}ms with ${results.length} results`, 'OfflineSearch', {
        duration,
        resultCount: results.length
      });
      
      // 应用限制
      if (options.limit && options.limit > 0) {
        return results.slice(0, options.limit);
      }
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error searching offline: ${errorMessage}`, 'OfflineSearch', { error: errorMessage });
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
      logger.info(`Searching GetMCP with query: "${query}"`, 'GetMcpSearch', { query, options });
      
      // 创建 GetMcpSearchProvider 实例
      const provider = new GetMcpSearchProvider();
      logger.debug('Created GetMcpSearchProvider instance', 'GetMcpSearch');
      
      // 创建 SearchService 实例
      const service = new SearchService([provider]);
      logger.debug('Created SearchService with GetMcpSearchProvider', 'GetMcpSearch');
      
      // 执行搜索
      const startTime = Date.now();
      const results = await service.search(query, options);
      const duration = Date.now() - startTime;
      
      logger.info(`GetMCP search completed in ${duration}ms with ${results.length} results`, 'GetMcpSearch', {
        duration,
        resultCount: results.length
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error searching GetMCP: ${errorMessage}`, 'GetMcpSearch', { error: errorMessage });
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
      logger.info(`Searching Compass with query: "${query}"`, 'CompassSearch', { query, options });
      
      // 创建 CompassSearchProvider 实例
      const provider = new CompassSearchProvider();
      logger.debug('Created CompassSearchProvider instance', 'CompassSearch');
      
      // 创建 SearchService 实例
      const service = new SearchService([provider]);
      logger.debug('Created SearchService with CompassSearchProvider', 'CompassSearch');
      
      // 执行搜索
      const startTime = Date.now();
      const results = await service.search(query, options);
      const duration = Date.now() - startTime;
      
      logger.info(`Compass search completed in ${duration}ms with ${results.length} results`, 'CompassSearch', {
        duration,
        resultCount: results.length
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error searching Compass: ${errorMessage}`, 'CompassSearch', { error: errorMessage });
      throw error;
    }
  }
  
  /**
   * 使用 Meilisearch 搜索提供者搜索
   * 便捷方法，直接使用 MeilisearchSearchProvider
   */
  static async searchMeilisearch(
    query: string, 
    options: SearchOptions = {}
  ): Promise<MCPServerResponse[]> {
    try {
      logger.info(`Searching Meilisearch with query: "${query}"`, 'MeilisearchSearch', { query, options });
      
      // 创建 MeilisearchSearchProvider 实例
      const provider = new MeilisearchSearchProvider();
      logger.debug('Created MeilisearchSearchProvider instance', 'MeilisearchSearch');
      
      // 创建 SearchService 实例
      const service = new SearchService([provider]);
      logger.debug('Created SearchService with MeilisearchSearchProvider', 'MeilisearchSearch');
      
      // 执行搜索
      const startTime = Date.now();
      const results = await service.search(query, options);
      const duration = Date.now() - startTime;
      
      logger.info(`Meilisearch search completed in ${duration}ms with ${results.length} results`, 'MeilisearchSearch', {
        duration,
        resultCount: results.length
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error searching Meilisearch: ${errorMessage}`, 'MeilisearchSearch', { error: errorMessage });
      throw error;
    }
  }
}
