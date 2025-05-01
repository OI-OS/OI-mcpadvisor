/**
 * OceanBase 搜索提供者实现模块
 * 提供基于 OceanBase 的向量搜索功能
 */

import { MCPServerResponse } from '../../types/index.js';
import { IVectorSearchEngine } from '../interfaces/vectorSearchEngine.js';
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
    title: server.display_name,
    description: server.description,
    github_url: server.repository.url,
    similarity: 0 // 将在搜索时计算
  };
};

/**
 * 处理并索引数据
 */
export const processAndIndexData = async (
  data: GetMcpApiResponse,
  vectorEngine: IVectorSearchEngine,
  createSearchableText: (server: GetMcpServerEntry) => string
): Promise<void> => {
  // 清除现有索引
  await vectorEngine.clear();
  
  // 处理每个服务器条目
  const entries = Object.entries(data);
  
  for (const [key, server] of entries) {
    // 创建可搜索文本
    const searchableText = createSearchableText(server);
    
    // 获取文本嵌入
    const embedding = getTextEmbedding(searchableText);
    
    // 转换为 MCPServerResponse 格式
    const serverResponse = convertToServerResponse(key, server);
    
    // 添加到向量索引
    await vectorEngine.addEntry(key, embedding, serverResponse);
  }
  
  logger.info(`Indexed ${entries.length} MCP servers`);
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
    const results = await vectorEngine.search(queryEmbedding,5);
    
    logger.debug(`Found ${results.length} results from vector search`);
    return results;
  } catch (error) {
    logger.error(`Error in vector search: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};
