import { MCPServerResponse } from '../../../types/index.js';
import { IVectorSearchEngine } from '../../interfaces/vectorSearchEngine.js';
import { oceanBaseClient } from './controller.js';
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
  title: result.metadata.title,
  description: result.metadata.description,
  github_url: result.metadata.github_url,
  similarity: result.similarity
});

/**
 * OceanBase 向量搜索引擎实现
 */
export class OceanBaseVectorEngine implements IVectorSearchEngine {
  /**
   * 构造函数
   */
  constructor() {
    this.initDatabase().catch(error => {
      logger.error(`Failed to initialize OceanBase: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  /**
   * 初始化数据库
   */
  private async initDatabase(): Promise<void> {
    try {
      await oceanBaseClient.connect();
      await oceanBaseClient.initDatabase();
      logger.info('OceanBase vector engine initialized');
    } catch (error) {
      logger.error(`OceanBase initialization error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 添加向量条目
   */
  async addEntry(id: string, vector: number[], data: MCPServerResponse): Promise<void> {
    try {
      const metadata = serverResponseToMetadata(data);
      await oceanBaseClient.addVector(id, vector, metadata);
      logger.debug(`Added vector entry for server: ${data.title}`);
    } catch (error) {
      logger.error(`Error adding vector entry: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 向量相似度搜索
   */
  async search(queryVector: number[], limit: number = 10): Promise<MCPServerResponse[]> {
    try {
      const results = await oceanBaseClient.searchVectors(queryVector, limit);
      const serverResponses = results.map(searchResultToServerResponse);
      
      logger.debug(`Found ${serverResponses.length} results from vector search`);
      return serverResponses;
    } catch (error) {
      logger.error(`Error in vector search: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 清除所有向量数据
   */
  async clear(): Promise<void> {
    try {
      await oceanBaseClient.deleteAll();
      logger.info('Cleared all vector entries');
    } catch (error) {
      logger.error(`Error clearing vector entries: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
