/**
 * Type definitions for the application
 */

/**
 * Response structure from the COMPASS API
 */
export interface MCPServerResponse {
  id?: string;
  title: string;
  description: string;
  github_url: string;
  similarity: number;
  installations?: Record<string, any>;
  /**
   * 服务器分类
   * 可以是字符串数组或逗号分隔的字符串
   */
  categories?: string[] | string;
  /**
   * 服务器标签
   * 可以是字符串数组或逗号分隔的字符串
   */
  tags?: string[] | string;
}

/**
 * Search provider interface for extensibility
 */
/**
 * @deprecated 旧版搜索提供者接口，预计在 v2.2.0 移除。
 */
import type { SearchParams } from './search.js';

/**
 * @deprecated 使用 SearchProviderV2。此处保持兼容但参数已结构化。
 */
export interface SearchProvider {
  search(params: SearchParams): Promise<MCPServerResponse[]>;
}

/**
 * V2 搜索提供者接口，采用结构化搜索参数。
 */
export interface SearchProviderV2 {
  search(params: SearchParams): Promise<MCPServerResponse[]>;
}

/**
 * Search options for configuring search behavior
 */
export interface SearchOptions {
  limit?: number;
  minSimilarity?: number;
}
