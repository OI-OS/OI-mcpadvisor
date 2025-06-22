# MCP Advisor 项目最佳实践指南

本文档提供了 MCP Advisor 项目的最佳实践指南，旨在帮助开发者提交高质量的 PR 并保持代码库的一致性和可维护性。

## 目录

- [代码风格与格式](#代码风格与格式)
- [TypeScript 最佳实践](#typescript-最佳实践)
- [函数式编程原则](#函数式编程原则)
- [路径处理最佳实践](#路径处理最佳实践)
- [测试最佳实践](#测试最佳实践)
- [NPM 包发布最佳实践](#npm-包发布最佳实践)
- [错误处理最佳实践](#错误处理最佳实践)
- [提交消息规范](#提交消息规范)

## 代码风格与格式

- **缩进**: 使用 2 个空格缩进
- **行长度**: 尽量保持在 80 个字符以内
- **字符串**: 优先使用模板字符串 `` `${variable}` ``
- **分号**: 语句末尾使用分号
- **引号**: 优先使用单引号 `'`，JSX 中使用双引号 `"`
- **命名约定**:
  - 类名: 使用 PascalCase (如 `OfflineDataLoader`)
  - 函数/方法名: 使用 camelCase (如 `loadFallbackData`)
  - 常量: 使用 UPPER_SNAKE_CASE (如 `DEFAULT_FALLBACK_DATA_PATH`)
  - 变量: 使用 camelCase (如 `serverResponses`)
  - 接口名: 使用 PascalCase 并以 `I` 开头 (如 `IVectorSearchEngine`)
  - 文件名: 使用 kebab-case (如 `offline-data-loader.ts`)

## TypeScript 最佳实践

- **类型安全**: 始终为函数参数和返回值定义类型
- **避免 `any`**: 尽量避免使用 `any` 类型，使用 `unknown` 或具体类型
- **接口优于类型别名**: 对于对象类型，优先使用接口而非类型别名
- **可空类型**: 使用联合类型 `string | null` 而非可选参数 `string?`
- **枚举**: 对于有限集合的值，使用枚举类型
- **类型守卫**: 使用类型守卫进行类型收窄，如 `if (typeof x === 'string')`
- **泛型**: 适当使用泛型提高代码复用性和类型安全性
- **导入/导出**: 使用命名导出而非默认导出，保持一致性

```typescript
// 好的实践
export interface SearchOptions {
  minSimilarity?: number;
  limit: number;
}

export function search<T>(query: string, options: SearchOptions): Promise<T[]> {
  // 实现
}

// 避免的实践
export default function search(query: any, options?: any): any {
  // 实现
}
```

## 函数式编程原则

- **纯函数**: 尽量使用纯函数，避免副作用
- **不可变性**: 避免修改传入的参数，返回新对象
- **函数组合**: 使用小函数组合成复杂功能
- **单一职责**: 每个函数只做一件事
- **高阶函数**: 适当使用高阶函数如 `map`, `filter`, `reduce`
- **避免深度嵌套**: 使用函数组合或 Promise 链避免回调地狱

```typescript
// 好的实践
function normalizeVector(vector: number[]): number[] {
  const magnitude = calculateMagnitude(vector);
  return vector.map(value => value / magnitude);
}

// 避免的实践
function processVector(vector: number[]): number[] {
  // 做多件事: 计算、归一化、过滤等
}
```

## 路径处理最佳实践

- **统一工具**: 使用 `pathUtils.ts` 处理所有路径相关操作
- **环境兼容**: 确保路径处理在不同环境（开发、测试、生产）中都能正常工作
- **ESM 兼容**: 处理 `import.meta.url` 在不同环境中的兼容性
- **相对路径**: 避免硬编码绝对路径，使用相对路径和项目根目录
- **路径分隔符**: 使用 `path.join()` 和 `path.resolve()` 处理路径分隔符
- **备用路径**: 提供备用路径机制，增强可靠性

```typescript
// 好的实践
import { getMcpServerListPath } from '../utils/pathUtils.js';
const dataPath = getMcpServerListPath(import.meta.url);

// 避免的实践
const dataPath = path.resolve(__dirname, '../../../../data/file.json');
```

## 测试最佳实践

### 核心原则
- **可预测性**: 测试结果应完全可预测，不依赖外部状态或执行顺序
- **隔离性**: 每个测试用例应独立运行，不依赖其他测试的状态
- **可维护性**: 测试代码应像生产代码一样保持整洁和可维护
- **明确性**: 测试名称和断言应清晰表达其意图和预期结果

### 测试结构
- 使用 `describe` 组织相关测试，`test`/`it` 定义具体测试用例
- 遵循 Given-When-Then 模式组织测试逻辑
- 使用 `beforeEach`/`afterEach` 设置和清理测试环境
- 避免在测试中使用 `console.log` 进行验证，使用断言

### 测试设计
- **单一职责**: 每个测试应只验证一个功能点
- **边界条件**: 测试边界值、空值、无效输入等边缘情况
- **错误处理**: 明确测试错误条件和异常处理
- **性能考量**: 测试应快速执行，避免不必要的等待和延迟

### 模拟与存根
- 使用 `vi.fn()` 创建模拟函数
- 模拟外部依赖，如 API 调用、文件系统操作等
- 保持模拟的简单性，仅模拟必要的部分
- 验证模拟的调用情况和参数

### 异步测试
- 始终使用 `async/await` 处理异步操作
- 避免使用 `setTimeout` 进行等待，使用框架提供的工具
- 测试 Promise 的解析和拒绝情况

### 测试质量
- 追求有意义的测试覆盖率，而非盲目追求高百分比
- 优先测试业务逻辑而非实现细节
- 测试应随需求变化而演进，保持同步
- 定期审查和重构测试代码

### 实用技巧
- 使用 `test.only` 和 `test.skip` 临时运行或跳过特定测试
- 利用快照测试验证复杂对象结构
- 使用 `expect.any()`、`expect.objectContaining()` 等匹配器使断言更具表现力
- 为测试数据使用工厂函数或 fixtures 提高可维护性

### 反模式
- 避免测试实现细节而非行为
- 避免脆弱的测试（过于依赖特定实现）
- 避免测试中的逻辑（测试应简单直接）
- 避免测试间的依赖和顺序假设

### 持续集成
- 在 CI/CD 流程中运行测试
- 设置合理的测试超时时间
- 并行运行测试以提高执行速度
- 监控测试执行时间和稳定性

### 文档与协作
- 为复杂的测试场景添加注释说明
- 在 PR 中包含相关测试
- 定期进行测试代码审查
- 维护测试相关的文档和示例

```typescript
// 示例：良好的测试结构
describe('UserService', () => {
  let service: UserService;
  let mockRepository: MockRepository;

  beforeEach(() => {
    mockRepository = {
      findUser: vi.fn(),
      saveUser: vi.fn().mockResolvedValue({ id: '1', name: 'Test' })
    };
    service = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('应成功创建用户并返回用户数据', async () => {
      // 准备
      const userData = { name: 'Test', email: 'test@example.com' };
      
      // 执行
      const result = await service.createUser(userData);
      
      // 验证
      expect(result).toHaveProperty('id');
      expect(mockRepository.saveUser).toHaveBeenCalledWith(expect.objectContaining(userData));
    });

    it('当名称为空时应抛出错误', async () => {
      await expect(service.createUser({ name: '', email: 'test@example.com' }))
        .rejects
        .toThrow('用户名不能为空');
    });
  });
});
```


## NPM 包发布最佳实践

- **版本控制**: 使用语义化版本（SemVer）
- **包含文件**: 在 `package.json` 的 `files` 字段明确指定要包含的文件和目录
- **脚本**: 提供有用的 npm 脚本，如 `build`, `test`, `lint`
- **依赖管理**: 区分 `dependencies` 和 `devDependencies`
- **入口点**: 正确设置 `main`, `module`, `types` 字段
- **README**: 提供清晰的安装和使用说明
- **验证**: 发布前验证包内容和功能

```json
// package.json 示例
{
  "name": "@xiaohui-wang/mcpadvisor",
  "version": "1.0.2",
  "files": [
    "build",
    "README.md",
    "LICENSE",
    "data"
  ],
  "scripts": {
    "build": "tsc && chmod +x build/index.js",
    "test": "jest",
    "prepublishOnly": "npm run build"
  }
}
```

## 错误处理最佳实践

- **明确错误类型**: 使用具体的错误类型而非通用 `Error`
- **错误消息**: 提供有用的错误消息，包含上下文信息
- **错误传播**: 适当传播错误，不吞噬错误
- **异步错误**: 使用 `try/catch` 或 Promise 的 `.catch()` 处理异步错误
- **日志记录**: 记录错误详情，便于调试
- **优雅降级**: 在错误情况下提供备用方案
- **错误边界**: 在适当的边界处理错误，避免级联失败

```typescript
// 好的实践
async function loadData(): Promise<Data[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpError(`请求失败: ${response.status}`, response.status);
    }
    return await response.json();
  } catch (error) {
    logger.error('加载数据失败', { error, url });
    return []; // 优雅降级，返回空数组
  }
}

// 避免的实践
async function loadData(): Promise<Data[]> {
  const response = await fetch(url); // 没有错误处理
  return await response.json();
}
```

## 提交消息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

- **类型**: 必须是以下之一:
  - `feat`: 新功能
  - `fix`: 错误修复
  - `docs`: 文档更改
  - `style`: 不影响代码含义的更改（空格、格式等）
  - `refactor`: 既不修复错误也不添加功能的代码更改
  - `perf`: 提高性能的代码更改
  - `test`: 添加或修正测试
  - `build`: 影响构建系统或外部依赖的更改
  - `ci`: 对 CI 配置文件和脚本的更改
  - `chore`: 其他不修改 src 或测试文件的更改

- **作用域**: 可选，表示更改的范围（如 `core`, `ui`, `api`）

- **描述**: 简短描述，使用现在时态，不要大写首字母，不要以句号结尾

- **正文**: 可选，提供更详细的更改说明

- **脚注**: 可选，用于引用问题 ID 或破坏性更改说明

示例:
```
fix(data): 确保 mcp_server_list.json 包含在 npm 包中

添加 data 目录到 package.json 的 files 字段，
并改进路径解析逻辑以支持在打包后环境中正确加载数据文件。

Fixes #123
```

---

遵循这些最佳实践将帮助我们保持代码库的一致性、可维护性和可靠性，同时提高开发效率和代码质量。如有任何问题或建议，请在 GitHub 上提交 issue 或 PR。
