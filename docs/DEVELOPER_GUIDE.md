# 开发者指南

本文档提供了 MCP Advisor 的开发环境设置、代码贡献和最佳实践指南。

## 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [开发工作流](#开发工作流)
- [代码风格和约定](#代码风格和约定)
- [测试](#测试)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)

## 开发环境设置

### 前提条件

- Node.js (>= 16.x)
- npm (>= 8.x) 或 yarn (>= 1.22.x)
- Git

### 克隆仓库

```bash
git clone https://github.com/istarwyh/mcpadvisor.git
cd mcpadvisor
```

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 配置环境变量

创建 `.env` 文件：

```
# 开发模式
NODE_ENV=development

# 传输类型 (stdio, sse, rest)
TRANSPORT_TYPE=stdio

# 用于向量搜索的 OceanBase 连接字符串（可选）
OCEANBASE_URL=mysql://username:password@localhost:3306/mcpadvisor

# 日志配置
DEBUG=true
ENABLE_FILE_LOGGING=true
LOG_LEVEL=debug

# 向量引擎类型 (memory, oceanbase, meilisearch)
VECTOR_ENGINE_TYPE=memory
```

### 构建项目

```bash
npm run build
# 或
yarn build
```

### 运行开发服务器

```bash
npm run dev
# 或
yarn dev
```

## 项目结构

MCP Advisor 项目结构如下：

```
mcpadvisor/
├── .github/            # GitHub 工作流和配置
├── .husky/             # Git hooks
├── docs/               # 文档
├── src/                # 源代码
│   ├── config/         # 配置
│   ├── models/         # 数据模型和接口
│   ├── providers/      # 搜索提供者实现
│   ├── services/       # 核心服务
│   ├── transport/      # 传输层实现
│   ├── utils/          # 工具函数
│   ├── vector/         # 向量搜索实现
│   ├── index.ts        # 入口点
│   └── server.ts       # 服务器实现
├── test/               # 测试
├── .env.example        # 环境变量示例
├── .eslintrc.js        # ESLint 配置
├── .gitignore          # Git 忽略文件
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
└── README.md           # 项目说明
```

### 关键目录和文件

- **src/config/**: 包含应用程序配置
- **src/models/**: 定义数据模型和接口
- **src/providers/**: 实现各种搜索提供者
- **src/services/**: 包含核心业务逻辑
- **src/transport/**: 实现不同的传输方式
- **src/vector/**: 向量搜索和嵌入生成
- **src/utils/**: 通用工具函数
- **src/index.ts**: 应用程序入口点
- **src/server.ts**: 服务器实现

## 开发工作流

### 分支策略

我们采用以下分支策略：

- **main**: 生产就绪代码
- **develop**: 开发中的代码
- **feature/xxx**: 新功能分支
- **bugfix/xxx**: 错误修复分支
- **release/x.y.z**: 发布准备分支

### 开发新功能

1. 从 `develop` 创建新分支：

```bash
git checkout develop
git pull
git checkout -b feature/your-feature-name
```

2. 实现功能并提交更改：

```bash
git add .
git commit -m "feat: Add your feature"
```

3. 推送分支并创建 Pull Request：

```bash
git push -u origin feature/your-feature-name
```

4. 在 GitHub 上创建从你的分支到 `develop` 的 Pull Request

### 提交消息约定

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>: <description>

[optional body]

[optional footer]
```

类型必须是以下之一：

- **feat**: 新功能
- **fix**: 错误修复
- **docs**: 文档更改
- **style**: 不影响代码含义的更改（空格、格式等）
- **refactor**: 既不修复错误也不添加功能的代码更改
- **perf**: 提高性能的代码更改
- **test**: 添加或修正测试
- **chore**: 对构建过程或辅助工具的更改

示例：

```
feat: Add vector normalization to improve search precision

Implemented vector normalization to ensure all vectors have unit length,
which improves the consistency of cosine similarity calculations.

Closes #123
```

## 代码风格和约定

### TypeScript 风格指南

- 使用 2 个空格缩进
- 使用单引号 `'` 而不是双引号 `"`
- 每行最大长度为 80 个字符
- 使用 camelCase 命名变量和函数
- 使用 PascalCase 命名类和接口
- 使用 UPPER_CASE 命名常量
- 总是使用分号 `;`
- 优先使用箭头函数
- 优先使用模板字符串
- 使用类型注解和接口

### 代码组织

- 每个文件应该只有一个主要的导出
- 相关功能应该分组到同一个目录中
- 使用 `index.ts` 文件重新导出目录的公共 API
- 保持函数简短（理想情况下少于 30 行）
- 遵循单一责任原则

### 文档

- 为所有公共 API 添加 JSDoc 注释
- 包括参数和返回类型描述
- 提供使用示例（如适用）
- 记录可能的错误和边缘情况

示例：

```typescript
/**
 * 搜索 MCP 服务器
 * 
 * @param query - 搜索查询字符串
 * @param options - 搜索选项
 * @returns 匹配的 MCP 服务器列表
 * @throws {ValidationError} 如果查询为空
 * @example
 * ```typescript
 * const results = await searchService.search('vector database');
 * console.log(results);
 * ```
 */
async function search(
  query: string, 
  options?: SearchOptions
): Promise<SearchResult[]> {
  // 实现...
}
```

## 测试

### 测试框架

我们使用以下测试工具：

- **Jest**: 测试运行器和断言库
- **ts-jest**: TypeScript 支持
- **supertest**: HTTP 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- src/services/search.test.ts

# 运行带有特定名称的测试
npm test -- -t "should return search results"

# 监视模式
npm test -- --watch
```

### 测试结构

测试文件应与被测试的文件位于同一目录，并使用 `.test.ts` 或 `.spec.ts` 后缀。

```
src/
├── services/
│   ├── search.ts
│   └── search.test.ts
```

### 测试最佳实践

- 使用描述性的测试名称
- 遵循 AAA 模式（Arrange-Act-Assert）
- 为每个测试用例隔离设置和拆卸
- 模拟外部依赖
- 测试边缘情况和错误路径
- 保持测试简单和专注

示例：

```typescript
describe('SearchService', () => {
  let searchService: SearchService;
  let mockProvider: jest.Mocked<SearchProvider>;
  
  beforeEach(() => {
    // Arrange
    mockProvider = {
      search: jest.fn()
    };
    searchService = new SearchService([mockProvider]);
  });
  
  it('should return search results from provider', async () => {
    // Arrange
    const mockResults = [{ title: 'Test MCP', similarity: 0.9 }];
    mockProvider.search.mockResolvedValue(mockResults);
    
    // Act
    const results = await searchService.search('test query');
    
    // Assert
    expect(mockProvider.search).toHaveBeenCalledWith('test query');
    expect(results).toEqual(mockResults);
  });
  
  it('should throw error for empty query', async () => {
    // Act & Assert
    await expect(searchService.search('')).rejects.toThrow('Query cannot be empty');
  });
});
```

## 调试技巧

### 日志记录

使用内置的日志系统进行调试：

```typescript
import { logger } from '../utils/logger';

function myFunction() {
  logger.debug('Debug information');
  logger.info('Processing item', { id: 123 });
  logger.warn('Warning: resource is low');
  logger.error('Error occurred', new Error('Something went wrong'));
}
```

### 环境变量

设置以下环境变量以增强调试：

- `DEBUG=true`: 启用详细日志记录
- `LOG_LEVEL=debug`: 设置最低日志级别
- `ENABLE_FILE_LOGGING=true`: 启用文件日志记录

### 使用 VS Code 调试

1. 创建 `.vscode/launch.json` 文件：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/build/index.js",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/build/**/*.js"],
      "env": {
        "DEBUG": "true",
        "LOG_LEVEL": "debug"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasename}", "--config", "jest.config.js"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

2. 在代码中设置断点
3. 按 F5 或点击 "Run and Debug" 按钮

## 常见问题

### 类型错误

**问题**: TypeScript 编译器报告类型错误。

**解决方案**:
- 确保所有依赖项都有正确的类型定义
- 检查 `tsconfig.json` 中的配置
- 使用适当的类型注解
- 考虑使用 `as` 类型断言（谨慎使用）

### 测试失败

**问题**: 测试失败，特别是在 CI 环境中。

**解决方案**:
- 确保测试不依赖于特定的环境或配置
- 正确模拟外部依赖
- 检查异步代码是否正确处理
- 使用 `beforeEach` 和 `afterEach` 进行适当的设置和清理

### 性能问题

**问题**: 应用程序在处理大量数据时变慢。

**解决方案**:
- 使用性能分析工具识别瓶颈
- 实现缓存策略
- 优化数据库查询
- 考虑批处理操作
- 使用内存数据结构加速频繁操作

## 附录

### 有用的命令

```bash
# 检查代码风格
npm run lint

# 自动修复代码风格问题
npm run lint:fix

# 检查类型
npm run type-check

# 构建项目
npm run build

# 运行开发服务器
npm run dev

# 运行测试
npm test

# 生成文档
npm run docs
```

### 推荐的 VS Code 扩展

- ESLint
- Prettier
- TypeScript Hero
- Jest Runner
- GitLens
- Error Lens

### 学习资源

- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [Jest 文档](https://jestjs.io/docs/getting-started)
- [Conventional Commits](https://www.conventionalcommits.org/)
