/**
 * Vitest 全局设置文件
 * 这个文件在所有测试运行之前执行，用于设置全局环境和模拟
 */

import { vi, beforeEach, afterEach } from 'vitest';

// 设置全局 fetch 模拟
global.fetch = vi.fn();

// 模拟 logger 以避免测试中的实际日志记录
vi.mock('../utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// 设置全局的测试超时时间为 30 秒
vi.setConfig({
  testTimeout: 30000,
});

// 在每个测试前重置所有模拟
beforeEach(() => {
  vi.clearAllMocks();
});

// 清理函数，在每个测试之后运行
afterEach(() => {
  vi.clearAllMocks();
});

// 直接在 setup.ts 中实现 Jest 兼容层
// 注意：这个兼容层只是临时的，最终应该完全迁移到 Vitest API
const setupJestCompat = () => {
  console.log('Jest 兼容层已加载，请尽快将测试文件迁移到 Vitest 原生 API');
  
  return {
    fn: vi.fn,
    mock: vi.mock,
    spyOn: vi.spyOn,
    setTimeout: (timeout: number) => {
      vi.setConfig({ testTimeout: timeout });
      return vi;
    },
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
  };
};

// 导出兼容层
export const jest = setupJestCompat();
