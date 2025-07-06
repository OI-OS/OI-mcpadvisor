/**
 * 本地 Meilisearch 集成测试
 * 使用真实的 Meilisearch 实例进行测试，不使用 mock
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LocalMeilisearchController } from '../../../services/providers/meilisearch/localController.js';
import { MeilisearchInstanceConfig } from '../../../config/meilisearch.js';

// 测试配置
const TEST_CONFIG: MeilisearchInstanceConfig = {
  type: 'local',
  host: process.env.TEST_MEILISEARCH_HOST || 'http://localhost:7700',
  masterKey: process.env.TEST_MEILISEARCH_KEY || process.env.MEILISEARCH_MASTER_KEY || 'developmentKey123',
  indexName: 'mcp_servers_test'
};

describe('Local Meilisearch Provider Integration', () => {
  let controller: LocalMeilisearchController;
  let isMeilisearchAvailable = false;
  
  beforeAll(async () => {
    // 创建控制器实例
    controller = new LocalMeilisearchController(TEST_CONFIG);
    
    console.log('Test config:', TEST_CONFIG);
    
    // 检查 Meilisearch 是否可用
    try {
      console.log('Checking Meilisearch health...');
      const isHealthy = await controller.healthCheck();
      console.log('Health check result:', isHealthy);
      
      if (isHealthy) {
        isMeilisearchAvailable = true;
        
        // 创建测试索引
        try {
          await controller.createIndex();
          await controller.configureSearchAttributes();
          
          // 添加测试数据
          const testDocuments = [
            {
              id: 'test-file-manager',
              title: 'File Manager MCP',
              description: 'A comprehensive file management system for organizing and manipulating files',
              github_url: 'https://github.com/test/file-manager-mcp',
              categories: 'file,management,system',
              tags: 'files,organize,manage',
              installations: { npm: 'npm install file-manager-mcp' }
            },
            {
              id: 'test-data-processor',
              title: 'Data Processor MCP',
              description: 'Advanced data processing and analysis tools for various data formats',
              github_url: 'https://github.com/test/data-processor-mcp',
              categories: 'data,processing,analysis',
              tags: 'data,process,analyze',
              installations: { npm: 'npm install data-processor-mcp' }
            },
            {
              id: 'test-social-media',
              title: 'Social Media Analyzer',
              description: 'Analyze social media content and trends across multiple platforms',
              github_url: 'https://github.com/test/social-media-analyzer',
              categories: 'social,media,analysis',
              tags: 'social,media,trends',
              installations: { npm: 'npm install social-media-analyzer' }
            }
          ];
          
          await controller.addDocuments(testDocuments);
          
          // 等待索引完成
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.warn('Test setup warning:', error);
        }
      }
    } catch (error) {
      console.log('Meilisearch not available, skipping integration tests');
      isMeilisearchAvailable = false;
    }
  }, 60000);
  
  afterAll(async () => {
    // 清理测试数据（可选）
    // 在实际测试环境中，可能需要删除测试索引
  });
  
  it('should perform basic search with local controller', async () => {
    if (!isMeilisearchAvailable) {
      console.log('Skipping test: Meilisearch not available');
      return;
    }
    
    const results = await controller.search('file management');
    
    expect(results).toBeDefined();
    expect(results.hits).toBeInstanceOf(Array);
    expect(results.hits.length).toBeGreaterThan(0);
    
    // 验证搜索结果包含相关内容
    const hasFileManager = results.hits.some((hit: any) => 
      hit.title?.toLowerCase().includes('file') || 
      hit.description?.toLowerCase().includes('file')
    );
    expect(hasFileManager).toBe(true);
  });
  
  it('should pass health check for local instance', async () => {
    if (!isMeilisearchAvailable) {
      console.log('Skipping test: Meilisearch not available');
      return;
    }
    
    const isHealthy = await controller.healthCheck();
    expect(isHealthy).toBe(true);
  });
  
  it('should handle document addition for local instance', async () => {
    if (!isMeilisearchAvailable) {
      console.log('Skipping test: Meilisearch not available');
      return;
    }
    
    const testDoc = {
      id: 'test-new-doc',
      title: 'Test Document',
      description: 'A test document for verification',
      github_url: 'https://github.com/test/test-doc',
      categories: 'test',
      tags: 'test,document',
      installations: {}
    };
    
    const task = await controller.addDocuments([testDoc]);
    expect(task).toBeDefined();
    expect(task.taskUid).toBeDefined();
  });
  
  it('should retrieve index information', async () => {
    if (!isMeilisearchAvailable) {
      console.log('Skipping test: Meilisearch not available');
      return;
    }
    
    if ('getIndexInfo' in controller) {
      const info = await (controller as any).getIndexInfo();
      expect(info).toBeDefined();
      expect(info.uid).toBe(TEST_CONFIG.indexName);
    } else {
      // Skip test if method not available
      console.log('getIndexInfo method not available, skipping test');
    }
  });
  
  it('should handle search with different options', async () => {
    if (!isMeilisearchAvailable) {
      console.log('Skipping test: Meilisearch not available');
      return;
    }
    
    const results = await controller.search('data processing', {
      limit: 5,
      attributesToRetrieve: ['title', 'description']
    });
    
    expect(results).toBeDefined();
    expect(results.hits).toBeInstanceOf(Array);
    expect(results.hits.length).toBeLessThanOrEqual(5);
  });
  
  it('should return empty results for non-existent queries', async () => {
    if (!isMeilisearchAvailable) {
      console.log('Skipping test: Meilisearch not available');
      return;
    }
    
    const results = await controller.search('nonexistentqueryterm12345');
    
    expect(results).toBeDefined();
    expect(results.hits).toBeInstanceOf(Array);
    expect(results.hits.length).toBe(0);
  });
  
  it('should handle Chinese search queries', async () => {
    if (!isMeilisearchAvailable) {
      console.log('Skipping test: Meilisearch not available');
      return;
    }
    
    const results = await controller.search('社交媒体分析');
    
    expect(results).toBeDefined();
    expect(results.hits).toBeInstanceOf(Array);
    // 可能没有完全匹配的结果，但应该不报错
  });
  
  it('should handle empty search queries gracefully', async () => {
    if (!isMeilisearchAvailable) {
      console.log('Skipping test: Meilisearch not available');
      return;
    }
    
    const results = await controller.search('');
    
    expect(results).toBeDefined();
    expect(results.hits).toBeInstanceOf(Array);
  });
});