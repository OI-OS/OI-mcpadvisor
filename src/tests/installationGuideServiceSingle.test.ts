import { InstallationGuideService } from '../services/installation/installationGuideService.js';
import { fetchGitHubReadme } from '../utils/githubUtils.js';

/**
 * 针对单个仓库测试 InstallationGuideService 的安装指南生成功能
 * 特别关注带有表情符号标题的 README 文件
 */
describe('InstallationGuideService - SQLite Explorer', () => {
  // 创建服务实例
  const installationGuideService = new InstallationGuideService();
  
  // 测试仓库
  const repo = {
    name: 'sqlite-explorer-fastmcp-mcp-server',
    url: 'https://github.com/hannesrudolph/sqlite-explorer-fastmcp-mcp-server',
    description: 'SQLite Explorer MCP Server'
  };
  
  // 直接测试提取方法
  test('should correctly extract installation section with emoji in title', async () => {
    // 设置较长的超时时间，因为需要从 GitHub 获取内容
    jest.setTimeout(30000);
    
    console.log(`Testing README extraction for ${repo.name}...`);
    
    // 获取 README 内容
    const readmeContent = await fetchGitHubReadme(repo.url);
    expect(readmeContent).toBeTruthy();
    
    if (!readmeContent) {
      throw new Error("Failed to fetch README content");
    }
    
    console.log(`\n--- README Content (first 300 chars) ---`);
    console.log(readmeContent.substring(0, 300));
    
    // 直接测试提取方法
    const service = installationGuideService as any; // 访问私有方法
    const extractedSection = service.extractInstallationSection(readmeContent);
    
    console.log(`\n--- Extracted Installation Section ---`);
    console.log(extractedSection);
    
    // 验证提取的内容
    expect(extractedSection).toBeTruthy();
    expect(extractedSection).toContain('Installation Options');
    expect(extractedSection).toContain('Option 1: Install for Claude Desktop');
    
    // 测试完整的指南生成
    const guide = await installationGuideService.generateInstallationGuide(repo.url, repo.name);
    console.log(`\n--- Full Installation Guide ---`);
    console.log(guide.substring(0, 500) + '...');
    
    // 验证指南包含安装选项部分
    expect(guide).toContain('Installation Options');
    
    console.log(`Test for ${repo.name} completed successfully.\n`);
  }, 30000); // 设置 30 秒超时
});
