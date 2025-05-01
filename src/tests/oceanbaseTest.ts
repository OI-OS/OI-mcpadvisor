/**
 * OceanBase 连接测试
 * 用于验证 OceanBase 向量搜索功能
 */

import { oceanBaseClient } from '../services/database/oceanbase/controller.js';
import { OceanBaseVectorEngine } from '../services/database/oceanbase/vectorEngine.js';
import { getTextEmbedding } from '../utils/embedding.js';
import { MCPServerResponse } from '../types/index.js';
import logger from '../utils/logger.js';

/**
 * 测试数据
 */
const testData: MCPServerResponse[] = [
  {
    title: 'AI Assistant MCP Server',
    description: 'A powerful MCP server for AI assistants with advanced capabilities',
    github_url: 'https://github.com/example/ai-assistant-mcp',
    similarity: 0
  },
  {
    title: 'Data Processing MCP Server',
    description: 'Process and transform data with this efficient MCP server',
    github_url: 'https://github.com/example/data-processing-mcp',
    similarity: 0
  },
  {
    title: 'Vector Search Engine',
    description: 'High-performance vector search engine for similarity matching',
    github_url: 'https://github.com/example/vector-search-engine',
    similarity: 0
  }
];

/**
 * 测试 OceanBase 连接和初始化
 */
async function testOceanBaseConnection() {
  try {
    console.log('Testing OceanBase connection...');
    await oceanBaseClient.connect();
    console.log('Connection successful!');
    
    console.log('Initializing database schema...');
    await oceanBaseClient.initDatabase();
    console.log('Schema initialized successfully!');
    
    return true;
  } catch (error) {
    console.error('Connection test failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * 测试 OceanBase 向量引擎
 */
async function testOceanBaseVectorEngine() {
  try {
    console.log('\nTesting OceanBase vector engine...');
    const vectorEngine = new OceanBaseVectorEngine();
    
    // 清除现有数据
    console.log('Clearing existing data...');
    await vectorEngine.clear();
    
    // 添加测试数据
    console.log('Adding test data...');
    for (let i = 0; i < testData.length; i++) {
      const item = testData[i];
      const embedding = getTextEmbedding(`${item.title} ${item.description}`);
      await vectorEngine.addEntry(`test${i+1}`, embedding, item);
      console.log(`Added: ${item.title}`);
    }
    
    // 执行搜索测试
    console.log('\nPerforming search tests:');
    
    // 测试 1: 搜索 AI 相关
    const aiQuery = 'AI assistant for chatbots';
    console.log(`\nSearch query: "${aiQuery}"`);
    const aiResults = await vectorEngine.search(getTextEmbedding(aiQuery), 3);
    console.log(`Found ${aiResults.length} results:`);
    aiResults.forEach((result, i) => {
      console.log(`${i+1}. ${result.title} (similarity: ${result.similarity.toFixed(4)})`);
      console.log(`   ${result.description}`);
    });
    
    // 测试 2: 搜索向量相关
    const vectorQuery = 'vector similarity search';
    console.log(`\nSearch query: "${vectorQuery}"`);
    const vectorResults = await vectorEngine.search(getTextEmbedding(vectorQuery), 3);
    console.log(`Found ${vectorResults.length} results:`);
    vectorResults.forEach((result, i) => {
      console.log(`${i+1}. ${result.title} (similarity: ${result.similarity.toFixed(4)})`);
      console.log(`   ${result.description}`);
    });
    
    console.log('\nVector engine test completed successfully!');
    return true;
  } catch (error) {
    console.error('Vector engine test failed:', error instanceof Error ? error.message : String(error));
    return false;
  } finally {
    // 断开连接
    try {
      await oceanBaseClient.disconnect();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error disconnecting:', err instanceof Error ? err.message : String(err));
    }
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('=== OceanBase Integration Test ===\n');
  
  try {
    // 测试连接
    const connectionSuccess = await testOceanBaseConnection();
    if (!connectionSuccess) {
      console.error('Connection test failed, aborting further tests');
      return;
    }
    
    // 测试向量引擎
    await testOceanBaseVectorEngine();
    
    console.log('\n=== Test Suite Completed ===');
  } catch (error) {
    console.error('Test suite failed with unexpected error:', 
      error instanceof Error ? error.message : String(error));
  }
}

// 执行测试
runTests();
