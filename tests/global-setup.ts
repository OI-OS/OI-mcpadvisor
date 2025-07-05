import { FullConfig } from '@playwright/test';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('🔧 开始全局测试设置...');
  
  // 创建测试结果目录
  const resultDir = 'test-results';
  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
    console.log(`📁 创建测试结果目录: ${resultDir}`);
  }
  
  // 检查环境变量
  const authToken = process.env.MCP_AUTH_TOKEN;
  if (!authToken) {
    console.log('⚠️ 警告: 未设置 MCP_AUTH_TOKEN 环境变量');
    console.log('请设置令牌: export MCP_AUTH_TOKEN=your-token-here');
  } else {
    console.log('✅ MCP认证令牌已设置');
  }
  
  // 检查 MCP Inspector 是否运行
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:6274/health');
    if (response.ok) {
      console.log('✅ MCP Inspector 运行正常');
    } else {
      console.log('⚠️ 警告: MCP Inspector 可能未正常运行');
    }
  } catch (error) {
    console.log('⚠️ 警告: 无法连接到 MCP Inspector (http://localhost:6274)');
    console.log('请确保 MCP Inspector 正在运行');
  }
  
  console.log('✅ 全局设置完成\n');
}

export default globalSetup;