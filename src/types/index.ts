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
export interface SearchProvider {
  search(query: string): Promise<MCPServerResponse[]>;
}

/**
 * Search options for configuring search behavior
 */
export interface SearchOptions {
  limit?: number;
  minSimilarity?: number;
}
