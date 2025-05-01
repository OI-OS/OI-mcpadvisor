/**
 * GetMCP 资源获取模块
 * 负责从 GetMCP API 获取服务器数据
 */

import { GETMCP_API_URL } from '../../config/constants.js';
import logger from '../../utils/logger.js';

/**
 * GetMCP 服务器条目类型
 */
export interface GetMcpServerEntry {
  name: string;
  display_name: string;
  description: string;
  repository: {
    type: string;
    url: string;
  };
  homepage: string;
  author: {
    name: string;
  };
  license: string;
  categories: string[];
  tags: string[];
  installations: Record<string, any>;
  examples: Array<{
    title: string;
    description: string;
    prompt: string;
  }>;
  arguments: Record<string, {
    description: string;
    required: boolean;
    example: string;
  }>;
}

/**
 * GetMCP API 响应映射
 */
export interface GetMcpApiResponse {
  [key: string]: GetMcpServerEntry;
}

/**
 * GetMCP 资源获取器接口
 */
export interface IGetMcpResourceFetcher {
  /**
   * 获取 MCP 服务器数据
   */
  fetchData(): Promise<GetMcpApiResponse>;
}

/**
 * GetMCP 资源获取器实现
 */
export class GetMcpResourceFetcher implements IGetMcpResourceFetcher {
  private apiUrl: string;
  
  /**
   * 构造函数
   */
  constructor(apiUrl: string = GETMCP_API_URL) {
    this.apiUrl = apiUrl;
    logger.info(`GetMcpResourceFetcher initialized with API URL: ${this.apiUrl}`);
  }
  
  /**
   * 获取 MCP 服务器数据
   */
  async fetchData(): Promise<GetMcpApiResponse> {
    try {
      logger.info(`Fetching MCP server data from ${this.apiUrl}`);
      
      const response = await fetch(this.apiUrl);
      
      if (!response.ok) {
        const errorMsg = `GetMCP API request failed with status ${response.status}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data: GetMcpApiResponse = await response.json();
      logger.info(`Fetched ${Object.keys(data).length} MCP servers from API`);
      
      return data;
    } catch (error) {
      logger.error(`Error fetching MCP data: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * 创建可搜索文本
   */
  static createSearchableText(server: GetMcpServerEntry): string {
    // 初始化文本数组
    const textParts = [
      server.display_name,
      server.description
    ];
    
    // 安全地处理categories
    if (server.categories) {
      if (Array.isArray(server.categories)) {
        textParts.push(...server.categories);
      } else if (typeof server.categories === 'string') {
        textParts.push(server.categories);
      }
    }
    
    // 安全地处理tags
    if (server.tags) {
      if (Array.isArray(server.tags)) {
        textParts.push(...server.tags);
      } else if (typeof server.tags === 'string') {
        textParts.push(server.tags);
      }
    }
    
    // 添加作者名称
    if (server.author && server.author.name) {
      textParts.push(server.author.name);
    }
    
    return textParts.filter(Boolean).join(' ');
  }
}
