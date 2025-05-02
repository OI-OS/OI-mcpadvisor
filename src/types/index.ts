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
