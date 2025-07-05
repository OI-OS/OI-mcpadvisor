import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 开始全局测试清理...');
  
  // 这里可以添加清理逻辑
  // 例如：关闭测试数据库、清理临时文件等
  
  console.log('✅ 全局清理完成');
}

export default globalTeardown;