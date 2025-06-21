import type { SearchParams } from './search.js';


/**
 * Response structure from the COMPASS API
 */
export interface MCPServerResponse {
  id?: string;
  title: string;
  description: string;
  github_url: string;
  similarity: number;
  /**
   * 用于排序的分数，通常与 similarity 相同
   */
  score?: number;
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
  /**
   * 来源，标记结果是在线还是离线获取
   */
  source?: 'online' | 'offline';
}



export interface SearchProvider {
  search(params: SearchParams): Promise<MCPServerResponse[]>;
}


/**
 * Search options for configuring search behavior
 */
export interface SearchOptions {
  limit?: number;
  minSimilarity?: number;
  /**
   * 排序字段
   */
  sortBy?: string;
  /**
   * 排序方向，默认为降序 (desc)
   */
  sortOrder?: 'asc' | 'desc';
  /**
   * 分类过滤
   */
  categories?: string[];
}
