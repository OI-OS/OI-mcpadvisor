/**
 * Meilisearch 搜索提供者实现
 * 使用 Meilisearch 搜索引擎和 GetMCP API 资源获取器
 */

import { MCPServerResponse, SearchProvider } from '../../types/index.js';
import type { SearchParams } from '../../types/search.js';
import { ICache } from '../interfaces/cache.js';
import { MemoryCache } from '../cache/memoryCache.js';
import { GETMCP_API_URL, CACHE_TTL_MS } from '../../config/constants.js';
import {
  GetMcpApiResponse,
  GetMcpResourceFetcher,
  IGetMcpResourceFetcher,
} from '../api/getMcpResourceFetcher.js';
import { meilisearchClient } from '../database/meilisearch/controller.js';
import logger from '../../utils/logger.js';

/**
 * 将 GetMCP API 响应转换为 Meilisearch 文档
 */
const convertToMeilisearchDocuments = (
  data: GetMcpApiResponse,
): Record<string, any>[] =>
  Object.entries(data).map(([id, server]) => ({
    id,
    title: server.display_name,
    description: server.description,
    github_url: server.repository.url,
    categories: Array.isArray(server.categories)
      ? server.categories.join(',')
      : '',
    tags: Array.isArray(server.tags) ? server.tags.join(',') : '',
    installations: server.installations || {},
  }));

/**
 * 将 Meilisearch 搜索结果转换为 MCPServerResponse
 */
const convertHitToServerResponse = (
  hit: Record<string, any>,
): MCPServerResponse => ({
  id: hit.id,
  title: hit.title,
  description: hit.description,
  github_url: hit.github_url,
  similarity: hit._rankingScore || 0.5,
  installations: hit.installations || {},
});

/**
 * Meilisearch 搜索提供者实现
 * 注意：由于 API 密钥只有读取权限，此实现只支持搜索操作
 */
export class MeilisearchSearchProvider implements SearchProvider {
  private resourceFetcher: IGetMcpResourceFetcher;
  private cache: ICache<GetMcpApiResponse>;

  /**
   * 构造函数
   */
  constructor(
    resourceFetcher?: IGetMcpResourceFetcher,
    cache?: ICache<GetMcpApiResponse>,
  ) {
    this.resourceFetcher =
      resourceFetcher || new GetMcpResourceFetcher(GETMCP_API_URL);
    this.cache = cache || new MemoryCache<GetMcpApiResponse>(CACHE_TTL_MS);

    logger.info('MeilisearchSearchProvider initialized');
  }

  /**
   * 搜索 MCP 服务器
   */
  async search(params: SearchParams): Promise<MCPServerResponse[]> {
    const query = [params.taskDescription, ...(params.keywords || []), ...(params.capabilities || [])].join(' ').trim();
    try {
      logger.info(`Searching for MCP servers with query: ${query}`);

      // 确保数据已加载
      await this.ensureDataLoaded();

      // 执行 Meilisearch 搜索
      const results = await meilisearchClient.search(query, { limit: 10 });
      const serverResponses = results.hits.map(convertHitToServerResponse);

      logger.debug(`Found ${serverResponses.length} results from Meilisearch`);
      return serverResponses;
    } catch (error) {
      logger.error(
        `Error searching with Meilisearch: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 确保数据已从 API 加载
   */
  private async ensureDataLoaded(): Promise<void> {
    // 检查是否有有效的缓存数据
    const cachedData = this.cache.get();

    if (cachedData) {
      return;
    }

    try {
      // 从 API 获取数据
      const data = await this.resourceFetcher.fetchData();

      // 缓存数据
      this.cache.set(data);

      // 将数据转换为 Meilisearch 文档格式
      const documents = convertToMeilisearchDocuments(data);

      logger.info(`Loaded ${documents.length} MCP servers`);
    } catch (error) {
      logger.error(
        `Error loading data: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
