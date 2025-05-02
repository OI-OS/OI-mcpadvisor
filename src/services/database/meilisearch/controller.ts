/**
 * Meilisearch 客户端控制器
 * 提供与 Meilisearch 交互的功能
 */

import { MeiliSearch } from 'meilisearch';
import { MEILISEARCH_CONFIG } from '../../../config/meilisearch.js';
import logger from '../../../utils/logger.js';

/**
 * Meilisearch 客户端接口
 */
export interface MeilisearchClient {
  /**
   * 搜索文档
   */
  search(query: string, options?: Record<string, any>): Promise<any>;
}

/**
 * 创建 Meilisearch 客户端
 */
const createMeilisearchClient = (): MeilisearchClient => {
  try {
    // 使用配置文件中的配置创建客户端
    const client = new MeiliSearch({
      host: MEILISEARCH_CONFIG.host,
      apiKey: MEILISEARCH_CONFIG.apiKey
    });

    // 获取索引
    const index = client.index(MEILISEARCH_CONFIG.indexName);

    logger.info(`Meilisearch client initialized with host: ${MEILISEARCH_CONFIG.host}`);
    logger.info(`Using index: ${MEILISEARCH_CONFIG.indexName}`);

    // 返回客户端接口实现
    return {
      /**
       * 搜索文档
       */
      search: async (query: string, options: Record<string, any> = {}): Promise<any> => {
        try {
          const results = await index.search(query, options);
          logger.debug(`Meilisearch search for "${query}" returned ${results.hits.length} results`);
          return results;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.error(`Meilisearch search error: ${message}`);
          throw error;
        }
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to initialize Meilisearch client: ${message}`);
    
    // 返回一个空的客户端实现，避免应用崩溃
    return {
      search: async (): Promise<any> => {
        logger.warn('Using fallback Meilisearch client implementation');
        return { hits: [] };
      }
    };
  }
};

/**
 * Meilisearch 客户端实例
 */
export const meilisearchClient = createMeilisearchClient();
