import { fetchGitHubReadme } from '../../utils/githubUtils.js';
import logger from '../../utils/logger.js';

/**
 * 安装指南服务
 * 负责生成 MCP 服务器的安装指南
 */
export class InstallationGuideService {
  /**
   * 生成 MCP 安装指南
   * 从 GitHub 仓库获取 README 内容，并生成适合 Agent LLM 的安装指南
   *
   * @param githubUrl - GitHub 仓库 URL
   * @param mcpName - MCP 名称
   * @returns 安装指南内容
   */
  public async generateInstallationGuide(
    githubUrl: string,
    mcpName: string,
  ): Promise<string> {
    try {
      const readmeContent = await fetchGitHubReadme(githubUrl);

      if (!readmeContent) {
        return this.generateDefaultGuide(mcpName, githubUrl);
      }

      return this.formatGuideForAgentLLM(readmeContent, mcpName, githubUrl);
    } catch (error) {
      logger.error(
        `Failed to generate installation guide: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.generateDefaultGuide(mcpName, githubUrl);
    }
  }

  /**
   * 为 Agent LLM 格式化安装指南
   * 考虑 Agent LLM 的理解能力和使用场景
   *
   * @param readmeContent - README 内容
   * @param mcpName - MCP 名称
   * @param githubUrl - GitHub 仓库 URL
   * @returns 格式化的安装指南
   */
  private formatGuideForAgentLLM(
    readmeContent: string,
    mcpName: string,
    githubUrl: string,
  ): string {
    // 提取安装相关部分
    const installationSection = this.extractInstallationSection(readmeContent);

    // 构建适合 Agent LLM 的安装指南
    let guide = `我将指导你如何安装 ${mcpName} MCP 服务器。\n\n`;

    // 添加仓库信息
    guide += `首先，这是该 MCP 服务器的 GitHub 仓库地址：${githubUrl}\n\n`;

    // 添加安装说明
    if (installationSection) {
      guide += `根据项目 README 文档，以下是安装步骤：\n\n${installationSection}\n\n`;
    } else {
      // 如果没有找到明确的安装部分，添加 README 摘要
      const summary = this.summarizeReadme(readmeContent);
      guide += `项目 README 中没有明确的安装部分，但这里是项目的基本信息：\n\n${summary}\n\n`;
    }

    // 添加通用安装建议
    guide += `基于常见的 Node.js 项目模式，你可能需要执行以下步骤：\n\n`;
    guide += `1. 克隆仓库：\`git clone ${githubUrl}\`\n`;
    guide += `2. 进入项目目录：\`cd ${this.extractRepoName(githubUrl)}\`\n`;
    guide += `3. 安装依赖：\`npm install\` 或 \`yarn\` 或 \`pnpm install\`\n`;

    // 添加配置建议
    guide += `\n安装后，你可能需要：\n`;
    guide += `- 检查项目是否需要环境变量配置\n`;
    guide += `- 查看 package.json 中的脚本命令来运行服务器\n`;
    guide += `- 参考项目文档了解如何集成到你的应用中\n\n`;

    // 添加帮助信息
    guide += `如果你在安装过程中遇到任何问题，可以查看项目的 Issues 页面或创建新的 Issue 寻求帮助。\n`;

    return guide;
  }

  /**
   * 查找 README 中的所有二级标题
   *
   * @param readmeContent - README 内容
   * @returns 标题列表
   */
  private findAllHeadings(readmeContent: string): string[] {
    const headingRegex = /^##\s+.*$/gm;
    return [...readmeContent.matchAll(headingRegex)].map(match => match[0]);
  }

  /**
   * 提取指定标题下的内容，直到下一个同级或更高级别的标题
   *
   * @param content - 完整内容
   * @param heading - 标题
   * @param headingIndex - 标题在内容中的索引
   * @returns 提取的内容
   */
  private extractSectionContent(
    content: string,
    heading: string,
    headingIndex: number,
  ): string {
    // 从标题开始的内容
    const remainingContent = content.substring(headingIndex);

    // 分割为行
    const lines = remainingContent.split('\n');

    // 提取标题及其下的内容，直到下一个同级或更高级别的标题
    let sectionContent = '';
    let inSection = false;
    const headingLevel = (heading.match(/^#+/) || [''])[0].length;

    for (const line of lines) {
      if (!inSection) {
        if (line.trim() === heading.trim()) {
          inSection = true;
          sectionContent += `${line}\n`;
        }
      } else {
        // 检查是否到达下一个同级或更高级别的标题
        if (line.startsWith('#')) {
          const currentLevel = (line.match(/^#+/) || [''])[0].length;
          if (currentLevel <= headingLevel) {
            break;
          }
        }
        sectionContent += `${line}\n`;
      }
    }

    return sectionContent.trim();
  }

  /**
   * 从 README 内容中提取安装相关部分
   *
   * @param readmeContent - README 内容
   * @returns 安装部分内容或 null
   */
  private extractInstallationSection(readmeContent: string): string | null {
    // 调试输出 README 内容的前 500 个字符，帮助诊断问题
    console.log('README 内容前 500 个字符:', readmeContent.substring(0, 500));

    // 安装相关关键词
    const installationKeywords = [
      'installation',
      '安装',
      'setup',
      'getting started',
      'quick start',
      '快速开始',
      '使用方法',
      'usage',
      'deploy',
      '部署',
    ];

    // 查找 README 中的所有二级标题
    const headings = this.findAllHeadings(readmeContent);
    console.log('找到的所有标题:', headings);

    // 查找最匹配的安装相关标题
    let bestMatch: { heading: string; index: number } | null = null;
    let bestScore = 0;

    for (const heading of headings) {
      const lowerHeading = heading.toLowerCase();

      // 计算匹配分数
      let score = 0;

      // 检查是否包含安装相关关键词
      for (const keyword of installationKeywords) {
        if (lowerHeading.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // 特殊处理带表情符号的标题
      if (heading.includes('📦') && lowerHeading.includes('installation')) {
        score += 20; // 优先选择 "📦 Installation Options"
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          heading,
          index: readmeContent.indexOf(heading),
        };
      }
    }

    // 如果找到匹配的标题，提取该部分内容
    if (bestMatch) {
      console.log('最佳匹配标题:', bestMatch.heading);
      return this.extractSectionContent(
        readmeContent,
        bestMatch.heading,
        bestMatch.index,
      );
    }

    return null;
  }

  /**
   * 生成 README 内容的摘要
   *
   * @param readmeContent - README 内容
   * @returns README 摘要
   */
  private summarizeReadme(readmeContent: string): string {
    // 提取前 10 行非空行
    const lines = readmeContent
      .split('\n')
      .filter(line => line.trim().length > 0);
    return lines.slice(0, 10).join('\n');
  }

  /**
   * 从 GitHub URL 中提取仓库名称
   *
   * @param githubUrl - GitHub 仓库 URL
   * @returns 仓库名称
   */
  private extractRepoName(githubUrl: string): string {
    const match = githubUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
    return match ? match[1].replace('.git', '') : 'repository';
  }

  /**
   * 生成默认安装指南
   * 当无法获取 README 内容时使用
   *
   * @param mcpName - MCP 名称
   * @param githubUrl - GitHub 仓库 URL
   * @returns 默认安装指南
   */
  private generateDefaultGuide(mcpName: string, githubUrl: string): string {
    let guide = `我将帮助你安装 ${mcpName} MCP 服务器，但我无法从 GitHub 仓库获取详细说明。\n\n`;

    guide += `这是该 MCP 服务器的 GitHub 仓库：${githubUrl}\n\n`;

    guide += `以下是通用的安装步骤，适用于大多数 Node.js 项目：\n\n`;
    guide += `1. 克隆仓库：\`git clone ${githubUrl}\`\n`;
    guide += `2. 进入项目目录：\`cd ${this.extractRepoName(githubUrl)}\`\n`;
    guide += `3. 安装依赖：\`npm install\` 或 \`yarn\` 或 \`pnpm install\`\n`;
    guide += `4. 查看项目中的 README.md 或 package.json 获取更多信息\n\n`;

    guide += `安装后，你可能需要：\n`;
    guide += `- 检查是否需要配置环境变量\n`;
    guide += `- 查看 package.json 中的脚本命令\n`;
    guide += `- 阅读源码了解如何集成\n\n`;

    guide += `如果遇到问题，请查看项目的 Issues 页面或创建新的 Issue。\n`;

    return guide;
  }
}
