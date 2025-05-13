/**
 * 向量搜索管理器模块
 * 提供向量搜索相关的功能函数
 */

import { MCPServerResponse } from '../../types/index.js';
import { IVectorSearchEngine, IWritableVectorSearchEngine } from '../interfaces/vectorSearchEngines.js';
import { getTextEmbedding } from '../../utils/embedding.js';
import { GetMcpApiResponse, GetMcpServerEntry } from '../api/getMcpResourceFetcher.js';
import logger from '../../utils/logger.js';

/**
 * 转换为 MCPServerResponse 格式
 */
export const convertToServerResponse = (
  key: string, 
  server: GetMcpServerEntry
): MCPServerResponse => {
  return {
    id: key,
    title: server.display_name,
    description: server.description,
    github_url: server.repository.url,
    similarity: 0 // 将在搜索时计算
  };
};

/**
 * 处理并索引数据
 * 如果提供的引擎不支持写操作，将记录警告并跳过索引步骤
 * 实现基于时间的数据更新策略，只在数据过期时才重建索引
 */
export const processAndIndexData = async (
  data: GetMcpApiResponse,
  vectorEngine: IVectorSearchEngine,
  createSearchableText: (server: GetMcpServerEntry) => string,
  forceUpdate: boolean = false
): Promise<void> => {
  // 检查引擎是否支持写操作
  const writableEngine = vectorEngine as IWritableVectorSearchEngine;
  const supportsWriteOperations = typeof writableEngine.addEntry === 'function' && 
                                typeof writableEngine.clear === 'function';
  
  if (!supportsWriteOperations) {
    logger.warn('Vector engine does not support write operations, skipping indexing');
    return;
  }
  
  try {
    // 检查数据是否需要更新
    let needsUpdate = forceUpdate;
    
    if (!needsUpdate) {
      try {
        // 动态导入 DataUpdateManager，避免循环依赖
        const { DataUpdateManager, UpdateType } = await import('../database/oceanbase/dataUpdateManager.js');
        
        // 检查数据是否过期（默认 1 小时）
        needsUpdate = await DataUpdateManager.needsUpdate(UpdateType.VECTOR_DATA, 1);
        
        if (!needsUpdate) {
          logger.info('Vector data is still fresh, skipping indexing');
          return;
        }
        
        logger.info('Vector data is outdated, starting reindexing');
      } catch (error) {
        // 如果无法检查更新时间，默认需要更新
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`Could not check data update time, defaulting to update: ${message}`);
        needsUpdate = true;
      }
    }
    
    // 如果需要更新，清除并重建索引
    if (needsUpdate) {
      // 清除现有索引
      await writableEngine.clear();
      
      // 处理每个服务器条目
      const entries = Object.entries(data);
      const startTime = Date.now();
      
      for (const [key, server] of entries) {
        // 创建可搜索文本
        const searchableText = createSearchableText(server);
        
        // 获取文本嵌入
        const embedding = getTextEmbedding(searchableText);
        
        // 转换为 MCPServerResponse 格式
        const serverResponse = convertToServerResponse(key, server);
        
        // 添加到向量索引
        await writableEngine.addEntry(key, embedding, serverResponse);
      }
      
      const duration = (Date.now() - startTime) / 1000;
      logger.info(`Indexed ${entries.length} MCP servers in ${duration.toFixed(2)} seconds`);
      
      // 更新数据更新时间
      try {
        const { DataUpdateManager, UpdateType } = await import('../database/oceanbase/dataUpdateManager.js');
        await DataUpdateManager.updateLastUpdateTime(UpdateType.VECTOR_DATA);
        logger.info('Updated vector data timestamp');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`Could not update data timestamp: ${message}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error indexing data: ${message}`);
    throw error;
  }
};

/**
 * 执行向量搜索
 */
export const performVectorSearch = async (
  query: string,
  vectorEngine: IVectorSearchEngine
): Promise<MCPServerResponse[]> => {
  try {
    // 获取查询嵌入
    const queryEmbedding = getTextEmbedding(query);
    
    // 使用向量引擎搜索
    const results = await vectorEngine.search(queryEmbedding, 5);
    
    logger.debug(`Found ${results.length} results from vector search`);
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error in vector search: ${message}`);
    throw error;
  }
};
