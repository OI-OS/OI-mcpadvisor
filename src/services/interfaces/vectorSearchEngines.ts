/**
 * 向量搜索引擎接口定义
 * 遵循接口隔离原则，将读写操作分离
 */

import { MCPServerResponse } from '../../types/index.js';

/**
 * 基础向量搜索引擎接口 - 只读操作
 */
export interface IVectorSearchEngine {
  /**
   * 向量相似度搜索
   * @param queryVector 查询向量
   * @param limit 返回结果数量限制
   * @returns 搜索结果列表
   */
  search(queryVector: number[], limit?: number): Promise<MCPServerResponse[]>;
}

/**
 * 可写向量搜索引擎接口 - 扩展基础接口，添加写操作
 */
export interface IWritableVectorSearchEngine extends IVectorSearchEngine {
  /**
   * 添加向量条目
   * @param id 条目ID
   * @param vector 向量数据
   * @param data 服务器响应数据
   */
  addEntry(id: string, vector: number[], data: MCPServerResponse): Promise<void>;
  
  /**
   * 清除所有向量数据
   */
  clear(): Promise<void>;
}
