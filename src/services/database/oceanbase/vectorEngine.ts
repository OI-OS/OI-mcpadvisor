import { MCPServerResponse } from '../../../types/index.js';
import { IWritableVectorSearchEngine } from '../../interfaces/vectorSearchEngines.js';
import { oceanBaseClient } from './controller.js';
import { OCEANBASE_URL } from '../../../config/constants.js';
import logger from '../../../utils/logger.js';

/**
 * 将 MCPServerResponse 转换为元数据
 */
const serverResponseToMetadata = (data: MCPServerResponse): Record<string, any> => ({
  title: data.title,
  description: data.description,
  github_url: data.github_url,
  categories: '',
  tags: ''
});

/**
 * 将搜索结果转换为 MCPServerResponse
 */
const searchResultToServerResponse = (result: { 
  id: string;
  similarity: number;
  metadata: Record<string, any>;
}): MCPServerResponse => ({
  id: result.id,
  title: result.metadata.title,
  description: result.metadata.description,
  github_url: result.metadata.github_url,
  similarity: result.similarity
});

/**
 * OceanBase 向量搜索引擎实现
 * 实现 IWritableVectorSearchEngine 接口，支持读写操作
 */
export class OceanBaseVectorEngine implements IWritableVectorSearchEngine {
  private isInitialized: boolean = false;

  /**
   * 构造函数
   */
  constructor() {
    if (OCEANBASE_URL) {
      this.initDatabase().catch(error => {
        this.handleError(error, 'initializing OceanBase');
      });
    } else {
      logger.warn('OCEANBASE_URL is not set, OceanBase vector engine will not be initialized');
    }
  }

  /**
   * 初始化数据库
   */
  private async initDatabase(): Promise<void> {
    try {
      await oceanBaseClient.connect();
      await oceanBaseClient.initDatabase();
      this.isInitialized = true;
      logger.info('OceanBase vector engine initialized');
    } catch (error) {
      this.handleError(error, 'OceanBase initialization');
    }
  }

  /**
   * 添加向量条目
   */
  async addEntry(id: string, vector: number[], data: MCPServerResponse): Promise<void> {
    if (!OCEANBASE_URL || !this.isInitialized) {
      logger.warn('OceanBase vector engine is not initialized, cannot add entry');
      return;
    }
    
    try {
      const metadata = serverResponseToMetadata(data);
      await oceanBaseClient.addVector(id, vector, metadata);
      logger.debug(`Added vector entry for server: ${data.title}`);
    } catch (error) {
      this.handleError(error, 'adding vector entry');
    }
  }

  /**
   * 向量相似度搜索
   */
  async search(queryVector: number[], limit: number = 10): Promise<MCPServerResponse[]> {
    if (!OCEANBASE_URL || !this.isInitialized) {
      logger.warn('OceanBase vector engine is not initialized, returning empty search results');
      return [];
    }
    
    try {
      const results = await oceanBaseClient.searchVectors(queryVector, limit);
      const serverResponses = results.map(searchResultToServerResponse);
      
      logger.debug(`Found ${serverResponses.length} results from vector search`);
      return serverResponses;
    } catch (error) {
      this.handleError(error, 'vector search');
    }
  }

  /**
   * 清除所有向量数据
   */
  async clear(): Promise<void> {
    if (!OCEANBASE_URL || !this.isInitialized) {
      logger.warn('OceanBase vector engine is not initialized, cannot clear entries');
      return;
    }
    
    try {
      await oceanBaseClient.deleteAll();
      logger.info('Cleared all vector entries');
    } catch (error) {
      this.handleError(error, 'clearing vector entries');
    }
  }
  
  /**
   * 统一错误处理
   */
  private handleError(error: unknown, operation: string): never {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error in ${operation}: ${message}`);
    throw error;
  }
}
