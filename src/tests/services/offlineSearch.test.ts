/**
 * 离线搜索功能测试
 * 测试离线模式下的推荐效果，包括小红书、GitHub、文档等不同场景
 */

import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { SearchService } from '../../services/searchService.js';
import { getMcpServerListPath } from '../../utils/pathUtils.js';
import { 
  redbookTestCases,
  githubTestCases,
  prompxTestCases,
  edgeCaseTestCases 
} from '../fixtures/search/cases/index.js';
import { createSearchTest } from '../fixtures/search/testUtils.js';

// 使用路径工具获取兜底数据路径
const FALLBACK_DATA_PATH = getMcpServerListPath();

// 合并所有测试用例
const ALL_TEST_CASES = [
  ...redbookTestCases,
  ...githubTestCases,
  ...edgeCaseTestCases,
  ...prompxTestCases,
];

// 测试套件
describe('离线搜索功能测试', () => {
  // 测试前准备
  beforeAll(() => {
    console.log('开始执行离线搜索测试...');
  });

  afterAll(() => {
    console.log('离线搜索测试执行完毕');
  });

  // 动态生成测试用例
  ALL_TEST_CASES.forEach(testCase => 
    createSearchTest(
      testCase,
      SearchService.searchOffline,
      FALLBACK_DATA_PATH,
    )
  );

  // 特殊场景测试
  describe('特殊场景测试', () => {
    // 分页功能测试暂时移除
    
    test('排序功能', async () => {
      const results = await SearchService.searchOffline(
        'MCP服务器',
        { limit: 5, minSimilarity: 0.1, sortBy: 'score', sortOrder: 'desc' },
        FALLBACK_DATA_PATH,
      );
      
      // 检查结果是否按分数降序排列
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          const current = results[i] as any;
          const next = results[i + 1] as any;
          expect(current.score).toBeGreaterThanOrEqual(next.score);
        }
      }
    });
  });
});
