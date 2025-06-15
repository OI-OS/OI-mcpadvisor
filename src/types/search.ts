/**
 * Search parameter structure for advanced search.
 * Part of 202506 search interface refactor.
 */
export interface SearchParams {
  /** 任务描述 */
  taskDescription: string;
  /** 搜索关键词（可选） */
  keywords?: string[];
  /** 所需能力（可选） */
  capabilities?: string[];
}
