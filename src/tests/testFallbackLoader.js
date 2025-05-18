// 测试脚本：验证离线数据加载功能
import { OfflineDataLoader } from '../../build/services/database/memory/offlineDataLoader.js';

async function testFallbackLoader() {
  console.log('开始测试离线数据加载器...');
  
  try {
    // 创建离线数据加载器实例
    const loader = new OfflineDataLoader();
    console.log('创建了离线数据加载器实例');
    
    // 尝试加载数据
    const data = await loader.loadFallbackData();
    
    // 验证数据
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`✅ 成功加载了 ${data.length} 个 MCP 服务器数据`);
      console.log(`第一个服务器: ${data[0].title}`);
      console.log(`最后一个服务器: ${data[data.length - 1].title}`);
    } else {
      console.log('❌ 加载数据失败或数据为空');
    }
    
    // 尝试加载带嵌入向量的数据
    console.log('\n测试加载带嵌入向量的数据...');
    const dataWithEmbeddings = await loader.loadFallbackDataWithEmbeddings();
    
    if (dataWithEmbeddings && Array.isArray(dataWithEmbeddings) && dataWithEmbeddings.length > 0) {
      console.log(`✅ 成功加载了 ${dataWithEmbeddings.length} 个带嵌入向量的 MCP 服务器数据`);
      console.log(`第一个服务器: ${dataWithEmbeddings[0].data.title}`);
      console.log(`向量维度: ${dataWithEmbeddings[0].vector.length}`);
    } else {
      console.log('❌ 加载带嵌入向量的数据失败或数据为空');
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 执行测试
testFallbackLoader().catch(console.error);
