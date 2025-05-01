import { SearchService } from '../services/searchService.js';
import { MCPServerResponse } from '../types/index.js';

/**
 * 简单测试 SearchService
 */
async function testSearchService() {
  try {
    console.log('Testing SearchService...');
    
    // 测试基本搜索功能
    console.log('Searching for "AI" with default options:');
    const results: MCPServerResponse[] = await SearchService.searchGetMcp('AI');
    console.log(`Found ${results.length} results`);
    
    // 打印前三个结果
    if (results.length > 0) {
      console.log('Top 3 results:');
      results.slice(0, 3).forEach((result: MCPServerResponse, index: number) => {
        console.log(`${index + 1}. ${result.title} (similarity: ${result.similarity.toFixed(4)})`);
        console.log(`   Description: ${result.description.substring(0, 100)}...`);
        console.log(`   GitHub: ${result.github_url}`);
      });
    }
    
    // 测试限制结果数量
    console.log('\nSearching for "data" with limit=2:');
    const limitedResults: MCPServerResponse[] = await SearchService.searchGetMcp('data', { limit: 2 });
    console.log(`Found ${limitedResults.length} results (limited to 2)`);
    
    // 测试最小相似度
    console.log('\nSearching for "vector" with minSimilarity=0.7:');
    const highSimilarityResults: MCPServerResponse[] = await SearchService.searchGetMcp('vector', { minSimilarity: 0.7 });
    console.log(`Found ${highSimilarityResults.length} results with similarity >= 0.7`);
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// 执行测试
testSearchService();
