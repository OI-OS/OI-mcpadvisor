/**
 * 离线搜索功能测试
 * 测试离线模式下的推荐效果，特别是针对小红书相关查询
 */

import { SearchService } from '../services/searchService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPServerResponse } from '../types/index.js';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 兜底数据路径
const FALLBACK_DATA_PATH = path.resolve(
  __dirname, '../../data/mcp_server_list.json'
);

/**
 * 打印搜索结果
 */
function printSearchResults(results: MCPServerResponse[]): void {
  console.log(`找到 ${results.length} 个结果：\n`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.title} (相似度: ${result.similarity?.toFixed(4)})`);
    console.log(`   描述: ${result.description}`);
    console.log(`   GitHub: ${result.github_url}`);
    console.log(`   分类: ${Array.isArray(result.categories) ? result.categories.join(', ') : ''}`);
    console.log(`   标签: ${Array.isArray(result.tags) ? result.tags.join(', ') : ''}`);
    console.log('');
  });
}

/**
 * 检查结果中是否包含小红书相关服务器
 */
function containsRedNoteServer(results: MCPServerResponse[]): boolean {
  return results.some(result => 
    result.title.toLowerCase().includes('rednote') || 
    result.title.toLowerCase().includes('红书') ||
    (Array.isArray(result.tags) && result.tags.some(tag => 
      tag.toLowerCase().includes('xiaohongshu') || 
      tag.toLowerCase().includes('红书')
    ))
  );
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log('开始测试离线搜索功能...\n');
  
  try {
    // 测试查询
    const query = '我想要看看小红书今天的热点问题，你再锐评一下';
    console.log(`测试查询: "${query}"\n`);
    console.log(`使用兜底数据: ${FALLBACK_DATA_PATH}\n`);
    
    // 测试 1: 使用静态方法进行离线搜索（文本匹配为主）
    console.log('测试 1: 使用静态方法进行离线搜索（文本匹配为主）');
    const textFocusedResults = await SearchService.searchOffline(query, {
      limit: 5,
      minSimilarity: 0.1
    }, FALLBACK_DATA_PATH, 0.7); // 文本匹配权重为 0.7
    
    printSearchResults(textFocusedResults);
    
    const textFocusedPassed = containsRedNoteServer(textFocusedResults);
    console.log(textFocusedPassed 
      ? '✅ 测试 1 通过：文本匹配为主的搜索结果中包含小红书相关服务器' 
      : '❌ 测试 1 失败：文本匹配为主的搜索结果中未包含小红书相关服务器');
    
    // 测试 2: 使用静态方法进行离线搜索（向量搜索为主）
    console.log('\n测试 2: 使用静态方法进行离线搜索（向量搜索为主）');
    const vectorFocusedResults = await SearchService.searchOffline(query, {
      limit: 5,
      minSimilarity: 0.1
    }, FALLBACK_DATA_PATH, 0.3); // 文本匹配权重为 0.3
    
    printSearchResults(vectorFocusedResults);
    
    const vectorFocusedPassed = containsRedNoteServer(vectorFocusedResults);
    console.log(vectorFocusedPassed 
      ? '✅ 测试 2 通过：向量搜索为主的搜索结果中包含小红书相关服务器' 
      : '❌ 测试 2 失败：向量搜索为主的搜索结果中未包含小红书相关服务器');
    
    // 测试结果总结
    console.log('\n测试结果总结:');
    if (textFocusedPassed && vectorFocusedPassed) {
      console.log('✅ 所有测试通过：离线搜索功能正常工作，能够识别小红书相关服务器');
    } else {
      console.log('❌ 测试失败：离线搜索功能未能正确识别小红书相关服务器');
    }

    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行测试
runTest().catch(console.error);
