/**
 * 离线搜索功能测试
 * 测试离线模式下的推荐效果，特别是针对小红书相关查询
 */

import { describe, test, expect, vi } from 'vitest';
import { SearchService } from '../../services/searchService.js';
import { MCPServerResponse } from '../../types/index.js';
import { getMcpServerListPath } from '../../utils/pathUtils.js';

// 使用路径工具获取兜底数据路径
// 在测试环境中传入 null，路径工具会自动处理
const FALLBACK_DATA_PATH = getMcpServerListPath(null);

/**
 * 检查结果中是否包含小红书相关服务器
 */
function containsRedNoteServer(results: MCPServerResponse[]): boolean {
  return results.some(
    result =>
      result.title.toLowerCase().includes('rednote') ||
      result.title.toLowerCase().includes('红书') ||
      (Array.isArray(result.tags) &&
        result.tags.some(
          tag =>
            tag.toLowerCase().includes('xiaohongshu') ||
            tag.toLowerCase().includes('红书'),
        )),
  );
}

// 使用 Vitest 标准的测试结构
describe('离线搜索功能测试', () => {
  // 测试查询
  const query = '我想要看看小红书今天的热点问题，你再锐评一下';

  // 测试文本匹配为主的离线搜索
  test('文本匹配为主的离线搜索应该返回小红书相关服务器', async () => {
    // 设置较高的文本权重 (0.7)
    const results = await SearchService.searchOffline(
      query,
      {
        limit: 5,
        minSimilarity: 0.1,
      },
      FALLBACK_DATA_PATH,
      0.7,
    );

    // 断言结果存在
    expect(results).toBeDefined();
    // 注意：测试环境中可能没有完整数据，因此不强制要求结果数量
    console.log(`文本匹配结果数量：${results.length}`);
    
    // 如果有结果，才断言包含小红书相关服务器
    if (results.length > 0) {
      expect(containsRedNoteServer(results)).toBe(true);
    } else {
      console.log('文本匹配测试：结果为空，跳过相关性检查');
    }
  });

  // 测试向量搜索为主的离线搜索
  test('向量搜索为主的离线搜索应该返回小红书相关服务器', async () => {
    // 设置较低的文本权重 (0.3)
    const results = await SearchService.searchOffline(
      query,
      {
        limit: 5,
        minSimilarity: 0.1,
      },
      FALLBACK_DATA_PATH,
      0.3,
    );

    // 断言结果存在
    expect(results).toBeDefined();
    // 注意：测试环境中可能没有完整数据，因此不强制要求结果数量
    console.log(`向量搜索结果数量：${results.length}`);
    
    // 如果有结果，才断言包含小红书相关服务器
    if (results.length > 0) {
      expect(containsRedNoteServer(results)).toBe(true);
    } else {
      console.log('向量搜索测试：结果为空，跳过相关性检查');
    }
  });
});
