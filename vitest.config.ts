import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // 启用类似 Jest 的全局 API
    globals: true,
    
    // 环境设置
    environment: 'node',
    
    // 测试文件匹配模式
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/jest-to-vitest.ts', '**/setup.ts', 'node_modules', 'build'],
    
    // 设置测试超时时间 (ms)
    testTimeout: 30000,
    
    // 启用源码映射以获得更好的堆栈跟踪
    setupFiles: ['src/tests/setup.ts'],
    
    // 转换设置
    testTransformMode: {
      web: ['\.js$', '\.ts$', '\.jsx$', '\.tsx$'],
    },
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
      ],
    },
    
    // 并行执行测试
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
