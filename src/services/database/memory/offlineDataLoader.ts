/**
 * 离线数据加载器
 * 负责从本地文件加载兜底数据，确保在网络不可用时仍能提供推荐
 */

import fs from 'fs';
import path from 'path';
import logger from '../../../utils/logger.js';
import { getTextEmbedding } from '../../../utils/embedding.js';
import { MCPServerResponse } from '../../../types/index.js';
import { normalizeVector } from '../../../utils/vectorUtils.js';
import { getMcpServerListPath, getNodeModulesPath } from '../../../utils/pathUtils.js';

/**
 * 默认兜底数据路径
 * 使用路径工具获取路径，确保在打包后和测试环境中都能正确解析
 * 在 Jest 环境中传入 null，路径工具会自动处理
 */
const DEFAULT_FALLBACK_DATA_PATH = getMcpServerListPath(null);

// 备用路径，用于在默认路径无法访问时尝试
const ALTERNATIVE_FALLBACK_DATA_PATH = getNodeModulesPath(
  '@xiaohui-wang/mcpadvisor', 
  'data/mcp_server_list.json'
);

/**
 * 离线数据加载器类
 */
export class OfflineDataLoader {
  private fallbackDataPath: string;

  /**
   * 构造函数
   * @param fallbackDataPath 可选的自定义兜底数据路径
   */
  constructor(fallbackDataPath?: string) {
    this.fallbackDataPath = fallbackDataPath || DEFAULT_FALLBACK_DATA_PATH;
    logger.info(`Offline data loader initialized with path: ${this.fallbackDataPath}`);
  }

  /**
   * 加载兜底数据
   * @returns 兜底数据数组
   */
  async loadFallbackData(): Promise<MCPServerResponse[]> {
    try {
      logger.info(`Attempting to load fallback data from: ${this.fallbackDataPath}`);
      
      // 检查主要文件路径是否存在
      if (!fs.existsSync(this.fallbackDataPath)) {
        logger.warn(`Fallback data file not found at primary path: ${this.fallbackDataPath}`);
        
        // 尝试备用路径
        if (this.fallbackDataPath === DEFAULT_FALLBACK_DATA_PATH && fs.existsSync(ALTERNATIVE_FALLBACK_DATA_PATH)) {
          logger.info(`Trying alternative fallback data path: ${ALTERNATIVE_FALLBACK_DATA_PATH}`);
          this.fallbackDataPath = ALTERNATIVE_FALLBACK_DATA_PATH;
        } else {
          logger.error('No fallback data file found at any path');
          return [];
        }
      }
      
      // 读取并解析JSON文件
      const rawData = fs.readFileSync(this.fallbackDataPath, 'utf8');
      const parsedData = JSON.parse(rawData);
      
      // 转换为MCPServerResponse格式
      const serverResponses = parsedData.map((item: any) => ({
        title: item.display_name || item.name,
        description: item.description || '',
        github_url: item.repository?.url || item.homepage || '',
        categories: item.categories || [],
        tags: item.tags || []
      }));
      
      logger.info(`Successfully loaded ${serverResponses.length} fallback MCP servers from ${this.fallbackDataPath}`);
      return serverResponses;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error loading fallback data: ${message}`, { error, path: this.fallbackDataPath });
      
      // 如果主路径失败，尝试备用路径
      if (this.fallbackDataPath !== ALTERNATIVE_FALLBACK_DATA_PATH && 
          this.fallbackDataPath === DEFAULT_FALLBACK_DATA_PATH) {
        try {
          logger.info(`Trying alternative fallback data path after error: ${ALTERNATIVE_FALLBACK_DATA_PATH}`);
          this.fallbackDataPath = ALTERNATIVE_FALLBACK_DATA_PATH;
          return await this.loadFallbackData(); // 递归调用自身尝试备用路径
        } catch (alternativeError) {
          logger.error(`Error loading from alternative path: ${String(alternativeError)}`);
        }
      }
      
      return [];
    }
  }

  /**
   * 加载兜底数据并生成嵌入向量
   * @returns 带有嵌入向量的兜底数据
   */
  async loadFallbackDataWithEmbeddings(): Promise<{
    id: string;
    vector: number[];
    data: MCPServerResponse;
  }[]> {
    try {
      const serverResponses = await this.loadFallbackData();
      const result = [];
      
      for (const server of serverResponses) {
        try {
          // 生成文本用于嵌入
          const textForEmbedding = `${server.title}. ${server.description}. ${
            Array.isArray(server.categories) ? server.categories.join(', ') : ''
          }. ${Array.isArray(server.tags) ? server.tags.join(', ') : ''}`;
          
          // 获取嵌入向量
          const vector = await getTextEmbedding(textForEmbedding);
          
          // 归一化向量
          const normalizedVector = normalizeVector(vector);
          
          // 使用github_url作为唯一ID
          const id = server.github_url || `fallback-${server.title}`;
          
          result.push({
            id,
            vector: normalizedVector,
            data: server
          });
        } catch (embeddingError) {
          logger.error(`Error generating embedding for server ${server.title}`, { 
            error: embeddingError,
            server
          });
          // 继续处理下一个服务器
        }
      }
      
      logger.info(`Generated embeddings for ${result.length} fallback servers`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error loading fallback data with embeddings: ${message}`, { error });
      return [];
    }
  }

  /**
   * 设置自定义兜底数据路径
   * @param newPath 新的兜底数据路径
   */
  setFallbackDataPath(newPath: string): void {
    this.fallbackDataPath = newPath;
    logger.info(`Updated fallback data path to: ${newPath}`);
  }
}
