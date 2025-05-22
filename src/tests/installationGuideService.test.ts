import { InstallationGuideService } from '../services/installation/installationGuideService.js';

/**
 * 测试 InstallationGuideService 的安装指南生成功能
 * 使用多个真实 GitHub 仓库验证提取和格式化功能
 */
describe('InstallationGuideService', () => {
  // 创建服务实例
  const installationGuideService = new InstallationGuideService();

  // 测试仓库列表
  const testRepos = [
    {
      name: 'sqlite-explorer-fastmcp-mcp-server',
      url: 'https://github.com/hannesrudolph/sqlite-explorer-fastmcp-mcp-server',
      description: 'SQLite Explorer MCP Server',
    },
    {
      name: 'abs',
      url: 'https://github.com/seansoreilly/abs',
      description: 'ABS Project',
    },
    {
      name: 'maven-mcp-server',
      url: 'https://github.com/Bigsy/maven-mcp-server',
      description: 'Maven MCP Server',
    },
    {
      name: 'chromia-mcp',
      url: 'https://github.com/chromindscan/chromia-mcp',
      description: 'Chromia MCP',
    },
  ];

  // 为每个仓库创建测试用例
  testRepos.forEach(repo => {
    test(`should generate installation guide for ${repo.name}`, async () => {
      // 设置较长的超时时间，因为需要从 GitHub 获取内容
      jest.setTimeout(30000);

      console.log(`Testing installation guide generation for ${repo.name}...`);

      // 生成安装指南
      const guide = await installationGuideService.generateInstallationGuide(
        repo.url,
        repo.name,
      );

      // 输出生成的指南，方便手动检查
      console.log(`\n--- Installation Guide for ${repo.name} ---`);
      console.log(`${guide.substring(0, 500)}...\n`); // 只显示前 500 个字符

      // 基本验证
      expect(guide).toBeTruthy();
      expect(typeof guide).toBe('string');
      expect(guide.length).toBeGreaterThan(100); // 指南应该有一定长度

      // 验证指南包含必要的部分
      expect(guide).toContain(repo.name);
      expect(guide).toContain(repo.url);

      // 验证指南格式
      expect(guide).toContain('安装');
      expect(guide).toContain('克隆仓库');

      console.log(`Test for ${repo.name} completed successfully.\n`);
    }, 30000); // 设置 30 秒超时
  });

  // 测试私有方法（通过公共方法间接测试）
  describe('Private methods (tested indirectly)', () => {
    // 创建一个访问私有方法的实例（仅用于测试）
    const service = installationGuideService as any;

    test('extractInstallationSection should find installation sections', () => {
      // 测试各种安装部分标题格式
      const testCases = [
        {
          content:
            '# Project\n\n## Installation\nInstall steps here\n\n## Usage\nUsage info',
          expected: '## Installation\nInstall steps here',
        },
        {
          content: '# Project\n\n## 安装\n安装步骤\n\n## 使用\n使用说明',
          expected: '## 安装\n安装步骤',
        },
        {
          content:
            '# Project\n\n## Quick Start\nQuick start guide\n\n## API\nAPI docs',
          expected: '## Quick Start\nQuick start guide',
        },
      ];

      testCases.forEach(({ content, expected }) => {
        const result = service.extractInstallationSection(content);
        expect(result).toBe(expected);
      });
    });

    test('summarizeReadme should extract first lines', () => {
      const readme =
        '# Title\n\nLine 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\nLine 11';
      const summary = service.summarizeReadme(readme);

      // 应该提取前 10 行非空行
      expect(summary.split('\n').length).toBeLessThanOrEqual(10);
      expect(summary).toContain('# Title');
      expect(summary).toContain('Line 9');
      expect(summary).not.toContain('Line 11');
    });

    test('extractRepoName should extract repository name from URL', () => {
      const testCases = [
        { url: 'https://github.com/user/repo', expected: 'repo' },
        { url: 'https://github.com/user/repo.git', expected: 'repo' },
        { url: 'https://github.com/user/repo/tree/main', expected: 'repo' },
        {
          url: 'https://github.com/user/repo-with-dashes',
          expected: 'repo-with-dashes',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        const result = service.extractRepoName(url);
        expect(result).toBe(expected);
      });
    });
  });
});
