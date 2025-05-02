import { MCPServerResponse } from '../../../types/index.js';
import { IWritableVectorSearchEngine } from '../../interfaces/vectorSearchEngines.js';
import logger from '../../../utils/logger.js';

/**
 * 内存向量条目
 */
interface VectorEntry {
  id: string;
  vector: number[];
  data: MCPServerResponse;
}

/**
 * 计算余弦相似度
 */
const calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  // 确保向量长度相同
  const length = Math.min(vecA.length, vecB.length);
  
  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  // 避免除以零
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * 计算条目相似度
 */
const calculateEntrySimilarity = (entry: VectorEntry, queryVector: number[]): MCPServerResponse => {
  const similarity = calculateCosineSimilarity(queryVector, entry.vector);
  
  return {
    ...entry.data,
    similarity
  };
};

/**
 * 按相似度排序结果
 */
const sortByHighestSimilarity = (a: MCPServerResponse, b: MCPServerResponse): number => 
  b.similarity - a.similarity;

/**
 * 内存向量搜索引擎实现
 * 用于开发和测试，或作为 OceanBase 的备选方案
 * 实现 IWritableVectorSearchEngine 接口，支持读写操作
 */
export class InMemoryVectorEngine implements IWritableVectorSearchEngine {
  private entries: VectorEntry[] = [];
  
  /**
   * 构造函数
   */
  constructor() {
    logger.info('In-memory vector engine initialized');
  }
  
  /**
   * 添加向量条目
   */
  async addEntry(id: string, vector: number[], data: MCPServerResponse): Promise<void> {
    try {
      this.entries.push({ id, vector, data });
      logger.debug(`Added vector entry for server: ${data.title}`);
    } catch (error) {
      this.handleError(error, 'adding vector entry');
    }
  }
  
  /**
   * 向量相似度搜索
   */
  async search(queryVector: number[], limit: number = 10): Promise<MCPServerResponse[]> {
    try {
      // 计算每个条目的相似度
      const results = this.entries.map(entry => 
        calculateEntrySimilarity(entry, queryVector)
      );
      
      // 按相似度排序
      results.sort(sortByHighestSimilarity);
      
      // 返回前 N 个结果
      const limitedResults = results.slice(0, limit);
      logger.debug(`Found ${limitedResults.length} results from in-memory search`);
      
      return limitedResults;
    } catch (error) {
      this.handleError(error, 'in-memory search');
    }
  }
  
  /**
   * 清除所有向量数据
   */
  async clear(): Promise<void> {
    try {
      this.entries = [];
      logger.info('Cleared all in-memory vector entries');
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
