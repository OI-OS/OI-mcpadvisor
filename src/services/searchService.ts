import { 
  SearchProvider, 
  MCPServerResponse, 
  SearchOptions
} from '../types/index.js';
import type { SearchParams } from '../types/search.js';
import { OfflineSearchProvider } from './search/OfflineSearchProvider.js';
import logger from '../utils/logger.js';

/**
 * 提供者优先级配置
 */
const PROVIDER_PRIORITIES: Record<string, number> = {
  OfflineSearchProvider: 5,
  GetMcpSearchProvider: 5,
  CompassSearchProvider: 10,
  MeilisearchSearchProvider: 9,
};

/**
 * 默认搜索选项
 */
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  limit: 5,
  minSimilarity: 0.5,
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
  minSimilarity: 0.3,
};

/**
 * Search service that can use multiple search providers
 */
export class SearchService {
  private providers: SearchProvider[] = [];

  /**
   * Combine structured params to plain query string for legacy providers
   */


  /**
   * 离线搜索提供者
   * 用于在网络不可用时提供兜底推荐
   */
  private offlineProvider?: SearchProvider;

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
    offlineConfig: Partial<OfflineConfig> = {},
  ) {
    this.providers = providers;

    // 合并离线模式配置
    this.offlineConfig = {
      ...DEFAULT_OFFLINE_CONFIG,
      ...offlineConfig,
    };

    // 如果启用了离线模式，初始化离线搜索提供者
    if (this.offlineConfig.enabled) {
      this.initOfflineProvider();
    }

    logger.info(
      `SearchService initialized with ${providers.length} providers`,
      {
        providerCount: providers.length,
        offlineMode: this.offlineConfig.enabled,
      },
    );
  }

  /**
   * 初始化离线搜索提供者
   */
  private initOfflineProvider(): void {
    try {
      this.offlineProvider = new OfflineSearchProvider({
        fallbackDataPath: this.offlineConfig.fallbackDataPath,
        minSimilarity: this.offlineConfig.minSimilarity,
      });
      logger.info('Offline search provider initialized');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize offline search provider: ${message}`, {
        error,
      });
    }
  }

  /**
   * Add a new search provider
   * @param provider - The search provider to add
   */
  addProvider(provider: SearchProvider): void {
    this.providers.push(provider);
    logger.info(
      `New provider added, total providers: ${this.providers.length}`,
    );
  }

  /**
   * Remove a search provider
   * @param index - The index of the provider to remove
   */
  removeProvider(index: number): void {
    if (index >= 0 && index < this.providers.length) {
      this.providers.splice(index, 1);
      logger.info(
        `Provider removed, total providers: ${this.providers.length}`,
      );
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
   * Search for MCP servers using all providers (v2 params)
   * @param params - Structured search parameters
   * @param options - Optional search configuration
   */
  // 兼容重载签名
  async search(params: SearchParams, options?: SearchOptions): Promise<MCPServerResponse[]>;
  async search(query: string, options?: SearchOptions): Promise<MCPServerResponse[]>;
  async search(
    arg: string | SearchParams,
    options?: SearchOptions,
  ): Promise<MCPServerResponse[]> {
    // 解析参数
    const params: SearchParams =
      typeof arg === 'string'
        ? { taskDescription: arg }
        : arg;

    if (this.providers.length === 0 && !this.offlineProvider) {
      logger.warn('No search providers available');
      return [];
    }

    try {
      // 合并默认选项
      const mergedOptions = { ...DEFAULT_SEARCH_OPTIONS, ...options };

      logger.info(
        `Searching with ${this.providers.length} providers for task: ${params.taskDescription}`,
        'SearchService',
        { providerCount: this.providers.length },
      );
      const allProviders = [...this.providers];
      let offlineProviderIndex = -1;

      // 如果启用了离线模式，添加离线提供者
      if (this.offlineConfig.enabled && this.offlineProvider) {
        offlineProviderIndex = allProviders.length;
        allProviders.push(this.offlineProvider);
      }

      // Collect results from all providers in parallel
      const providerPromises = this.searchAllProviders(allProviders, params);

      const namedProviderResults = await Promise.all(providerPromises);
      this.logProviderResults(namedProviderResults);
      return this.reRank(namedProviderResults, mergedOptions);
    } catch (error) {
      logger.error(
        `Error in search service: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }


  private searchAllProviders(allProviders: SearchProvider[], params: SearchParams) {
    return allProviders.map((provider, index) => {
      const providerName = provider.constructor.name;
      logger.info(
        `Starting search with provider ${index + 1}/${this.providers.length}: ${providerName}`,
        'Provider',
        {
          providerName,
          providerIndex: index,
          params,
        }
      );

      return provider
        .search(params)
        .then(results => {
          logger.info(
            `Provider ${providerName} returned ${results.length} results`,
            'Provider',
            {
              providerName,
              resultCount: results.length,
              topResults: results.slice(0, 3).map(r => ({
                title: r.title,
                similarity: r.similarity,
                github_url: r.sourceUrl,
              })),
            }
          );

          // Log full results at debug level
          if (results.length > 0) {
            logger.debug(
              `Full results from provider ${providerName}:`,
              'Provider',
              {
                providerName,
                results,
              }
            );
          }

          return {
            providerName,
            results,
          };
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(
            `Provider ${providerName} search failed: ${errorMessage}`,
            'Provider',
            {
              providerName,
              error: errorMessage,
            }
          );
          return {
            providerName,
            results: [] as MCPServerResponse[],
          };
        });
    });
  }

  private logProviderResults(namedProviderResults: ({ providerName: string; results: MCPServerResponse[]; } | { providerName: string; results: MCPServerResponse[]; })[]) {
    namedProviderResults.forEach(({ providerName, results }) => {
      logger.info(
        `Provider ${providerName} found ${results.length} results`,
        'SearchSummary',
        {
          providerName,
          resultCount: results.length,
        }
      );
    });
  }

  private reRank(namedProviderResults: ({ providerName: string; results: MCPServerResponse[]; } | { providerName: string; results: MCPServerResponse[]; })[], mergedOptions: { limit?: number; minSimilarity?: number; sortBy?: string; sortOrder?: "asc" | "desc"; }) {
    const resultsMap = new Map<
      string,
      MCPServerResponse & { providerPriority?: number; }
    >();
    const duplicates: string[] = [];

    // 处理每个提供者的结果
    for (const { providerName, results } of namedProviderResults) {
      // 获取提供者优先级
      const priority = PROVIDER_PRIORITIES[providerName] || 0;

      for (const result of results) {
        // 为结果添加提供者优先级信息
        const resultWithPriority = { ...result, providerPriority: priority };

        const key = result.sourceUrl || `title:${result.title}`;

        if (!resultsMap.has(key)) {
          // 新结果，直接添加
          resultsMap.set(key, resultWithPriority);
        } else {
          // 已存在结果，检查是否需要替换
          const existingResult = resultsMap.get(key)!;

          // 在相似度相同的情况下，优先级高的提供者的结果排在前面
          if (existingResult.similarity < result.similarity ||
            (existingResult.similarity === result.similarity &&
              (existingResult.providerPriority || 0) < priority)) {
            resultsMap.set(key, resultWithPriority);
          }

          // 记录重复项
          duplicates.push(key);
        }
      }
    }

    // 转换为数组
    let mergedResults = Array.from(resultsMap.values());

    logger.info(
      `Merged ${mergedResults.length} total results from all providers`,
      'SearchService',
      {
        totalResults: mergedResults.length,
      }
    );

    // Log deduplication results
    logger.info(
      `Deduplication complete: removed ${duplicates.length} duplicates`,
      'Deduplication',
      {
        removedCount: duplicates.length,
        remainingCount: mergedResults.length,
        duplicateUrls: duplicates.length > 0 ? [...new Set(duplicates)] : undefined,
      }
    );

    // Log pre-sorting information
    logger.info(
      `Sorting ${mergedResults.length} results by similarity score`,
      'Sorting'
    );

    // Sort by similarity score (highest first)
    mergedResults.sort((a, b) => b.similarity - a.similarity);

    // Log top results after sorting
    if (mergedResults.length > 0) {
      logger.info(`Top 3 results after sorting:`, 'Sorting', {
        topResults: mergedResults.slice(0, 3).map(r => ({
          title: r.title,
          similarity: r.similarity,
          github_url: r.sourceUrl,
        })),
      });
    }

    // Apply filtering based on options
    let filteredCount = 0;
    let originalCount = mergedResults.length;

    if (mergedOptions.minSimilarity !== undefined &&
      mergedResults.length > 0) {
      logger.info(
        `Applying minimum similarity filter: ${mergedOptions.minSimilarity}`,
        'Filtering',
        {
          minSimilarity: mergedOptions.minSimilarity,
          beforeCount: mergedResults.length,
        }
      );

      // 保存原始排序的结果，以便在过滤后结果太少时使用
      const originalResults = [...mergedResults];

      // 首先按相似度过滤
      mergedResults = mergedResults.filter(
        server => server.similarity >= mergedOptions.minSimilarity!
      );

      // 如果过滤后结果太少，保留至少5个最相似的结果
      if (mergedResults.length < 5 && originalResults.length > 5) {
        // 使用原始排序的前5个结果
        mergedResults =
          mergedResults.length > 0
            ? mergedResults
            : originalResults.slice(0, Math.min(5, originalResults.length));
      }

      filteredCount += originalCount - mergedResults.length;
      originalCount = mergedResults.length;

      logger.info(
        `After similarity filtering: ${mergedResults.length} results remain`,
        'Filtering',
        {
          afterCount: mergedResults.length,
          removedCount: filteredCount,
        }
      );
    }

    // Apply limit filter
    if (mergedOptions.limit !== undefined && mergedOptions.limit > 0) {
      logger.info(
        `Applying result limit: ${mergedOptions.limit}`,
        'Filtering',
        {
          limit: mergedOptions.limit,
          beforeCount: mergedResults.length,
        }
      );

      const beforeLimit = mergedResults.length;
      mergedResults = mergedResults.slice(0, mergedOptions.limit);
      filteredCount += beforeLimit - mergedResults.length;

      logger.info(
        `After limit filtering: ${mergedResults.length} results remain`,
        'Filtering',
        {
          afterCount: mergedResults.length,
          removedCount: beforeLimit - mergedResults.length,
        }
      );
    }

    // Log final results with full details
    logger.info(
      `Final search results: ${mergedResults.length} servers`,
      'SearchResults',
      {
        resultCount: mergedResults.length,
        results: mergedResults.map(r => ({
          title: r.title,
          similarity: r.similarity.toFixed(4),
          github_url: r.sourceUrl,
        })),
      }
    );

    logger.debug(
      `Merged results: ${mergedResults.length} servers after filtering`
    );
    return mergedResults;
  }
}
