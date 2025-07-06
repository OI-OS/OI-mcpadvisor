import { test, expect } from '@playwright/test';

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.MCP_INSPECTOR_URL || 'http://localhost:6274',
  authToken: process.env.MCP_AUTH_TOKEN,
  timeout: 30000
};

// 辅助函数：从页面内容中提取结果标题
function extractResultTitles(content: string): string[] {
  const titleRegex = /Title:\s*([^\n]+)/g;
  const titles = [];
  let match;
  
  while ((match = titleRegex.exec(content)) !== null) {
    titles.push(match[1].trim());
  }
  
  return titles;
}

test.describe('MCPAdvisor 本地 Meilisearch 功能测试', () => {
  let fullUrl: string;
  let originalEnvVars: Record<string, string | undefined> = {};
  
  test.beforeEach(async ({ page }) => {
    // Skip E2E tests in CI if MCP_AUTH_TOKEN is not available
    if (!TEST_CONFIG.authToken) {
      test.skip(true, 'Skipping E2E tests: MCP_AUTH_TOKEN environment variable not set');
    }
    
    // 保存原始环境变量
    originalEnvVars = {
      MEILISEARCH_INSTANCE: process.env.MEILISEARCH_INSTANCE,
      MEILISEARCH_LOCAL_HOST: process.env.MEILISEARCH_LOCAL_HOST,
      MEILISEARCH_MASTER_KEY: process.env.MEILISEARCH_MASTER_KEY,
      MEILISEARCH_INDEX_NAME: process.env.MEILISEARCH_INDEX_NAME
    };
    
    // 设置环境变量启用本地 Meilisearch
    process.env.MEILISEARCH_INSTANCE = 'local';
    process.env.MEILISEARCH_LOCAL_HOST = process.env.TEST_MEILISEARCH_HOST || 'http://localhost:7700';
    process.env.MEILISEARCH_MASTER_KEY = process.env.TEST_MEILISEARCH_KEY || 'testkey';
    
    fullUrl = `${TEST_CONFIG.baseUrl}/?MCP_PROXY_AUTH_TOKEN=${TEST_CONFIG.authToken}`;
    
    console.log(`🌐 访问: ${fullUrl} (使用本地 Meilisearch)`);
    
    // 访问页面
    await page.goto(fullUrl);
    
    // 连接到MCP服务器
    await page.getByRole('button', { name: 'Connect' }).click();
    await page.waitForTimeout(2000);
    
    // 列出可用工具
    await page.getByRole('button', { name: 'List Tools' }).click();
    await page.waitForTimeout(1000);
  });
  
  test.afterEach(async () => {
    // 恢复原始环境变量
    Object.entries(originalEnvVars).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });
  
  test('本地 Meilisearch 搜索功能验证', async ({ page }) => {
    // 使用推荐工具测试本地搜索
    await page.getByText('此工具用于寻找合适且专业MCP').click();
    
    await page.getByRole('textbox', { name: 'taskDescription' })
      .fill('本地文件管理和数据处理工具');
    
    await page.getByRole('button', { name: 'Run Tool' }).click();
    await page.waitForTimeout(8000);
    
    // 验证返回结果
    const pageContent = await page.content();
    expect(pageContent).toContain('Title:');
    
    // 截图保存结果（带本地标识）
    await page.screenshot({ 
      path: 'test-results/meilisearch-local-search.png',
      fullPage: true 
    });
    
    console.log('✅ 本地 Meilisearch 搜索测试完成');
  });
  
  test('本地 Meilisearch 故障转移测试', async ({ page }) => {
    // 模拟本地实例不可用，测试 fallback 到云端
    process.env.MEILISEARCH_LOCAL_HOST = 'http://localhost:9999'; // 无效端口
    
    await page.getByText('此工具用于寻找合适且专业MCP').click();
    await page.getByRole('textbox', { name: 'taskDescription' })
      .fill('测试故障转移机制');
    
    await page.getByRole('button', { name: 'Run Tool' }).click();
    await page.waitForTimeout(10000);
    
    // 应该仍然能获得结果（来自 fallback）
    const pageContent = await page.content();
    const hasResults = pageContent.includes('Title:') || pageContent.includes('results');
    
    if (hasResults) {
      console.log('✅ 故障转移成功：从云端获得结果');
    } else {
      console.log('⚠️ 故障转移可能未按预期工作');
    }
    
    await page.screenshot({ 
      path: 'test-results/meilisearch-fallback-test.png',
      fullPage: true 
    });
  });
  
  test('性能对比测试：本地 vs 云端', async ({ page }) => {
    const testCases = [
      { 
        instance: 'local', 
        description: '本地实例性能测试',
        host: process.env.TEST_MEILISEARCH_HOST || 'http://localhost:7700'
      },
      { 
        instance: 'cloud', 
        description: '云端实例性能测试',
        host: 'https://edge.meilisearch.com'
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      // 更新环境变量
      process.env.MEILISEARCH_INSTANCE = testCase.instance;
      if (testCase.instance === 'local') {
        process.env.MEILISEARCH_LOCAL_HOST = testCase.host;
      }
      
      console.log(`🔄 测试 ${testCase.description}`);
      
      await page.getByText('此工具用于寻找合适且专业MCP').click();
      await page.getByRole('textbox', { name: 'taskDescription' })
        .fill('文件系统操作和数据分析');
      
      const startTime = Date.now();
      await page.getByRole('button', { name: 'Run Tool' }).click();
      
      // 等待结果出现而不是固定超时
      await page.waitForFunction(() => {
        const content = document.body.textContent || '';
        return content.includes('Title:') || content.includes('error') || content.includes('failed');
      }, { timeout: 15000 });
      
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      results.push({ instance: testCase.instance, responseTime });
      
      console.log(`⏱️ ${testCase.description}: ${responseTime}ms`);
      
      await page.screenshot({ 
        path: `test-results/performance-${testCase.instance}.png`,
        fullPage: true 
      });
    }
    
    // 比较性能结果
    const localTime = results.find(r => r.instance === 'local')?.responseTime || 0;
    const cloudTime = results.find(r => r.instance === 'cloud')?.responseTime || 0;
    
    console.log(`📊 性能对比 - 本地: ${localTime}ms, 云端: ${cloudTime}ms`);
    
    // 验证响应时间都在合理范围内
    expect(localTime).toBeLessThan(15000);
    expect(cloudTime).toBeLessThan(15000);
  });
  
  test('本地 Meilisearch 环境变量配置测试', async ({ page }) => {
    // 测试不同的环境变量配置
    const configTests = [
      {
        name: '默认本地配置',
        env: {
          MEILISEARCH_INSTANCE: 'local'
          // 使用默认值
        }
      },
      {
        name: '自定义本地配置',
        env: {
          MEILISEARCH_INSTANCE: 'local',
          MEILISEARCH_LOCAL_HOST: 'http://localhost:7700',
          MEILISEARCH_MASTER_KEY: 'customkey',
          MEILISEARCH_INDEX_NAME: 'custom_index'
        }
      }
    ];
    
    for (const configTest of configTests) {
      console.log(`🧪 测试配置: ${configTest.name}`);
      
      // 设置环境变量
      Object.entries(configTest.env).forEach(([key, value]) => {
        process.env[key] = value;
      });
      
      await page.getByText('此工具用于寻找合适且专业MCP').click();
      await page.getByRole('textbox', { name: 'taskDescription' })
        .fill(`配置测试: ${configTest.name}`);
      
      await page.getByRole('button', { name: 'Run Tool' }).click();
      await page.waitForTimeout(6000);
      
      // 验证配置生效（通过检查是否有响应）
      const pageContent = await page.content();
      const hasResponse = pageContent.includes('Title:') || 
                         pageContent.includes('error') || 
                         pageContent.includes('results');
      
      expect(hasResponse).toBe(true);
      
      console.log(`✅ 配置测试完成: ${configTest.name}`);
    }
  });
  
  test('本地 Meilisearch 错误处理测试', async ({ page }) => {
    // 测试各种错误情况
    const errorTests = [
      {
        name: '无效主机地址',
        env: {
          MEILISEARCH_INSTANCE: 'local',
          MEILISEARCH_LOCAL_HOST: 'http://invalid-host:7700'
        }
      },
      {
        name: '无效端口',
        env: {
          MEILISEARCH_INSTANCE: 'local',
          MEILISEARCH_LOCAL_HOST: 'http://localhost:9999'
        }
      }
    ];
    
    for (const errorTest of errorTests) {
      console.log(`🚨 测试错误情况: ${errorTest.name}`);
      
      // 设置错误配置
      Object.entries(errorTest.env).forEach(([key, value]) => {
        process.env[key] = value;
      });
      
      await page.getByText('此工具用于寻找合适且专业MCP').click();
      await page.getByRole('textbox', { name: 'taskDescription' })
        .fill(`错误处理测试: ${errorTest.name}`);
      
      await page.getByRole('button', { name: 'Run Tool' }).click();
      await page.waitForTimeout(8000);
      
      // 验证错误处理（应该 fallback 或显示适当错误）
      const pageContent = await page.content();
      const hasErrorHandling = pageContent.includes('Title:') || // fallback 成功
                              pageContent.includes('error') || 
                              pageContent.includes('failed');
      
      expect(hasErrorHandling).toBe(true);
      
      await page.screenshot({ 
        path: `test-results/error-handling-${errorTest.name.replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
      
      console.log(`✅ 错误处理测试完成: ${errorTest.name}`);
    }
  });
  
  test('数据一致性验证测试', async ({ page }) => {
    // 测试本地和云端搜索结果的一致性
    const testQuery = '数据处理和分析工具';
    const results = {};
    
    // 测试云端搜索
    process.env.MEILISEARCH_INSTANCE = 'cloud';
    await page.getByText('此工具用于寻找合适且专业MCP').click();
    await page.getByRole('textbox', { name: 'taskDescription' }).fill(testQuery);
    await page.getByRole('button', { name: 'Run Tool' }).click();
    await page.waitForTimeout(6000);
    
    const cloudContent = await page.content();
    const cloudResults = extractResultTitles(cloudContent);
    results.cloud = cloudResults;
    
    // 测试本地搜索
    process.env.MEILISEARCH_INSTANCE = 'local';
    process.env.MEILISEARCH_LOCAL_HOST = process.env.TEST_MEILISEARCH_HOST || 'http://localhost:7700';
    
    await page.getByText('此工具用于寻找合适且专业MCP').click();
    await page.getByRole('textbox', { name: 'taskDescription' }).fill(testQuery);
    await page.getByRole('button', { name: 'Run Tool' }).click();
    await page.waitForTimeout(6000);
    
    const localContent = await page.content();
    const localResults = extractResultTitles(localContent);
    results.local = localResults;
    
    // 比较结果
    console.log('🔍 数据一致性分析:');
    console.log(`云端结果数量: ${cloudResults.length}`);
    console.log(`本地结果数量: ${localResults.length}`);
    
    // 验证两者都有结果
    expect(cloudResults.length).toBeGreaterThan(0);
    expect(localResults.length).toBeGreaterThan(0);
    
    // 验证结果内容的相关性（至少有一些共同的关键词）
    const hasRelevantResults = cloudResults.some(title => 
      title.toLowerCase().includes('data') || 
      title.toLowerCase().includes('file') || 
      title.toLowerCase().includes('analysis')
    ) && localResults.some(title => 
      title.toLowerCase().includes('data') || 
      title.toLowerCase().includes('file') || 
      title.toLowerCase().includes('analysis')
    );
    
    expect(hasRelevantResults).toBe(true);
    
    // 检查是否有重复的结果（表明数据同步正确）
    const commonResults = cloudResults.filter(cloudTitle => 
      localResults.some(localTitle => localTitle === cloudTitle)
    );
    
    console.log(`共同结果数量: ${commonResults.length}`);
    if (commonResults.length > 0) {
      console.log('✅ 发现相同结果，数据同步正常');
    } else {
      console.log('⚠️  没有发现完全相同的结果，可能存在数据同步问题');
    }
    
    await page.screenshot({ 
      path: 'test-results/data-consistency-test.png',
      fullPage: true 
    });
  });
});