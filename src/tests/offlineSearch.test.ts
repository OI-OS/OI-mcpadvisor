/**
 * 离线搜索功能测试
 * 测试离线模式下的推荐效果，特别是针对小红书相关查询
 */

import { SearchService } from '../services/searchService.js';
import { OfflineSearchProvider } from '../services/search/OfflineSearchProvider.js';
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
 * 主测试函数
 */
async function runTest() {
  console.log('开始测试离线搜索功能...\n');
  
  try {
    // 测试查询
    const query = '我想要看看小红书今天的热点问题，你再锐评一下';
    console.log(`测试查询: "${query}"\n`);
    
    // 直接从数据文件读取内容，进行简单的文本匹配
    console.log(`使用兜底数据: ${FALLBACK_DATA_PATH}\n`);
    
    // 读取数据文件
    const fs = await import('fs');
    const rawData = fs.readFileSync(FALLBACK_DATA_PATH, 'utf8');
    const servers = JSON.parse(rawData);
    
    // 先进行简单的文本匹配，找出所有小红书相关的服务器
    console.log('进行文本匹配搜索...');
    const keywords = ['小红书', 'xiaohongshu', 'rednote', '热点', '社交媒体', 'social media', '新闻', 'news'];
    
    const textMatchResults = servers.filter((server: any) => {
      const searchText = `${server.name} ${server.display_name} ${server.description} ${JSON.stringify(server.categories || [])} ${JSON.stringify(server.tags || [])}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
    
    console.log(`文本匹配找到 ${textMatchResults.length} 个相关服务器\n`);
    
    // 创建离线搜索提供者
    console.log('使用增强功能的离线搜索提供者...');
    const offlineProvider = new OfflineSearchProvider({
      fallbackDataPath: FALLBACK_DATA_PATH,
      minSimilarity: 0.1,
      textMatchWeight: 0.7,  // 增加文本匹配权重
      vectorSearchWeight: 0.3 // 降低向量搜索权重
    });
    
    // 创建搜索服务
    const searchService = new SearchService([offlineProvider], { enabled: false });
    
    // 执行搜索
    console.log('执行离线搜索...\n');
    const startTime = Date.now();
    const results = await searchService.search(query, { 
      limit: 10,  // 增加结果数量
      minSimilarity: 0.1  // 降低相似度阈值
    });
    const duration = Date.now() - startTime;
    
    // 打印结果
    console.log(`搜索完成，耗时 ${duration}ms\n`);
    printSearchResults(results);
    
    // 检查是否包含小红书相关结果
    const hasRedNoteResults = results.some(result => 
      result.title.toLowerCase().includes('rednote') || 
      result.title.toLowerCase().includes('红书') ||
      (Array.isArray(result.tags) && result.tags.some(tag => 
        tag.toLowerCase().includes('xiaohongshu') || 
        tag.toLowerCase().includes('红书')
      ))
    );
    
    if (hasRedNoteResults) {
      console.log('\n✅ 测试通过：搜索结果中包含小红书相关服务器');
    } else {
      console.log('\n❌ 测试失败：搜索结果中未包含小红书相关服务器');
    }
    
    // 比较向量搜索结果与文本匹配结果
    console.log('\n比较向量搜索与文本匹配结果:');
    
    // 检查每个文本匹配的结果是否出现在向量搜索结果中
    const matchedInBoth = textMatchResults.filter((textMatch: any) => 
      results.some(vectorResult => 
        vectorResult.github_url === textMatch.repository?.url ||
        vectorResult.title === textMatch.display_name
      )
    );
    
    console.log(`文本匹配结果中有 ${matchedInBoth.length} 个出现在向量搜索结果中\n`);
    
    // 如果有文本匹配的结果未出现在向量搜索中，打印这些结果
    if (textMatchResults.length > matchedInBoth.length) {
      console.log('以下文本匹配的结果未出现在向量搜索中:');
      textMatchResults
        .filter((textMatch: any) => 
          !results.some(vectorResult => 
            vectorResult.github_url === textMatch.repository?.url ||
            vectorResult.title === textMatch.display_name
          )
        )
        .forEach((missed: any, index: number) => {
          console.log(`${index + 1}. ${missed.display_name}`);
          console.log(`   描述: ${missed.description}`);
          console.log(`   GitHub: ${missed.repository?.url}`);
          console.log(`   分类: ${missed.categories?.join(', ') || ''}`);
          console.log(`   标签: ${missed.tags?.join(', ') || ''}`);
          console.log('');
        });
    }
    
    // 使用向量搜索为主的离线搜索提供者进行测试对比
    console.log('\n使用向量搜索为主的离线搜索提供者进行测试对比...');
    const vectorFocusedProvider = new OfflineSearchProvider({
      fallbackDataPath: FALLBACK_DATA_PATH,
      minSimilarity: 0.1,
      textMatchWeight: 0.3,  // 降低文本匹配权重
      vectorSearchWeight: 0.7  // 增加向量搜索权重
    });
    
    const vectorFocusedResults = await vectorFocusedProvider.search(query);
    console.log(`向量搜索为主的离线搜索提供者返回 ${vectorFocusedResults.length} 个结果\n`);
    printSearchResults(vectorFocusedResults.slice(0, 5)); // 只打印前5个结果
    
    // 检查向量为主的提供者是否返回小红书相关结果
    const hasVectorFocusedRedNoteResults = vectorFocusedResults.some(result => 
      result.title.toLowerCase().includes('rednote') || 
      result.title.toLowerCase().includes('红书') ||
      (Array.isArray(result.tags) && result.tags.some(tag => 
        tag.toLowerCase().includes('xiaohongshu') || 
        tag.toLowerCase().includes('红书')
      ))
    );
    
    if (hasVectorFocusedRedNoteResults) {
      console.log('\n✅ 向量为主的提供者测试通过：搜索结果中包含小红书相关服务器');
    } else {
      console.log('\n❌ 向量为主的提供者测试失败：搜索结果中未包含小红书相关服务器');
    }
    
    // 使用静态方法测试（文本匹配为主）
    console.log('\n使用静态方法测试离线搜索（文本匹配为主）...\n');
    const staticResults = await SearchService.searchOffline(query, {
      limit: 10,
      minSimilarity: 0.1
    }, FALLBACK_DATA_PATH, 0.7); // 文本匹配权重为 0.7
    
    console.log(`静态方法搜索完成，找到 ${staticResults.length} 个结果\n`);
    printSearchResults(staticResults);
    
    // 检查是否返回小红书相关结果
    const hasStaticRedNoteResults = staticResults.some(result => 
      result.title.toLowerCase().includes('rednote') || 
      result.title.toLowerCase().includes('红书') ||
      (Array.isArray(result.tags) && result.tags.some(tag => 
        tag.toLowerCase().includes('xiaohongshu') || 
        tag.toLowerCase().includes('红书')
      ))
    );
    
    if (hasStaticRedNoteResults) {
      console.log('\n✅ 静态方法测试通过：搜索结果中包含小红书相关服务器');
    } else {
      console.log('\n❌ 静态方法测试失败：搜索结果中未包含小红书相关服务器');
    }
    
    // 使用静态方法测试（向量搜索为主）
    console.log('\n使用静态方法测试离线搜索（向量搜索为主）...\n');
    const staticVectorResults = await SearchService.searchOffline(query, {
      limit: 10,
      minSimilarity: 0.1
    }, FALLBACK_DATA_PATH, 0.3); // 文本匹配权重为 0.3，向量搜索权重为 0.7
    
    console.log(`静态方法（向量搜索为主）搜索完成，找到 ${staticVectorResults.length} 个结果\n`);
    printSearchResults(staticVectorResults);
    
    // 检查是否返回小红书相关结果
    const hasStaticVectorRedNoteResults = staticVectorResults.some(result => 
      result.title.toLowerCase().includes('rednote') || 
      result.title.toLowerCase().includes('红书') ||
      (Array.isArray(result.tags) && result.tags.some(tag => 
        tag.toLowerCase().includes('xiaohongshu') || 
        tag.toLowerCase().includes('红书')
      ))
    );
    
    if (hasStaticVectorRedNoteResults) {
      console.log('\n✅ 静态方法（向量为主）测试通过：搜索结果中包含小红书相关服务器');
    } else {
      console.log('\n❌ 静态方法（向量为主）测试失败：搜索结果中未包含小红书相关服务器');
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行测试
runTest().catch(console.error);
