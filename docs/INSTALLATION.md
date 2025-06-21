# 安装指南

本文档提供了详细的 MCP Advisor 安装和配置说明。

## 目录

- [快速安装](#快速安装)
- [详细安装方法](#详细安装方法)
- [配置选项](#配置选项)
- [环境变量](#环境变量)
- [故障排除](#故障排除)

## 快速安装

### 通过 MCP 配置集成

最快的方式是通过 MCP 配置集成 MCP Advisor：

```json
{
  "mcpServers": {
    "mcpadvisor": {
      "command": "npx",
      "args": ["-y", "@xiaohui-wang/mcpadvisor"]
    }
  }
}
```

将此配置添加到您的 AI 助手的 MCP 设置文件中：

- MacOS/Linux: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%AppData%\Claude\claude_desktop_config.json`

## 详细安装方法

### NPM 包安装

```bash
# 使用 npm
npm install @xiaohui-wang/mcpadvisor

# 使用 yarn
yarn add @xiaohui-wang/mcpadvisor

# 使用 pnpm
pnpm add @xiaohui-wang/mcpadvisor
```

### 全局安装

```bash
# 全局安装
npm install -g @xiaohui-wang/mcpadvisor

# 运行
mcpadvisor
```

### 直接使用

```bash
# 使用 npx 运行（无需安装）
npx @xiaohui-wang/mcpadvisor

# 或者使用 npx 运行特定版本
npx @xiaohui-wang/mcpadvisor@1.0.4
```

## 配置选项

### 基本配置

MCP Advisor 可以通过以下方式配置：

1. 环境变量
2. 配置文件
3. 命令行参数

### 配置文件

创建 `.mcpadvisorrc.json` 文件：

```json
{
  "transport": "stdio",
  "port": 3000,
  "enableFileLogging": true,
  "logLevel": "info",
  "vectorEngineType": "memory"
}
```

## 环境变量

MCP Advisor 可以使用以下环境变量进行配置。所有环境变量都是可选的，除非另有说明。

### 核心配置

| `CORS_ORIGIN` | CORS 允许的源（逗号分隔） | `*` | 否 |

### Nacos Provider 配置

如果您选择使用 Nacos 作为搜索提供者，则需要配置以下环境变量：

| 环境变量 | 描述 | 默认值 | 必填 |
|---------|------|--------|------|
| `NACOS_SERVER_ADDR` | Nacos 服务器地址 | 无 | 是 |
| `NACOS_NAMESPACE` | Nacos 命名空间 | `public` | 否 |
| `NACOS_GROUP` | Nacos 分组 | `DEFAULT_GROUP` | 否 |
| `NACOS_USERNAME` | Nacos 用户名 | 无 | 如果 Nacos 需要认证 |
| `NACOS_PASSWORD` | Nacos 密码 | 无 | 如果 Nacos 需要认证 |
| `MCP_SERVICE_NAME` | MCP 服务在 Nacos 中的名称 | `mcp-servers` | 否 |

### API 配置

| 变量 | 描述 | 默认值 | 必需 |
|----------|-------------|---------|----------|
| `COMPASS_API_BASE` | COMPASS API 的基础 URL | `https://registry.mcphub.io` | 否 |
| `OCEANBASE_URL` | OceanBase 数据库连接字符串 | - | 使用 OceanBase 时必需 |

### 日志配置

| 变量 | 描述 | 默认值 | 必需 |
|----------|-------------|---------|----------|
| `DEBUG` | 启用调试日志 | `false` | 否 |
| `ENABLE_FILE_LOGGING` | 启用文件日志 | `false` | 否 |
| `LOG_LEVEL` | 日志级别 (`debug`, `info`, `warn`, `error`) | `info` | 否 |
| `LOG_DIR` | 日志文件目录 | `./logs` | 否 |

### 搜索配置

| 变量 | 描述 | 默认值 | 必需 |
|----------|-------------|---------|----------|
| `MIN_SIMILARITY` | 搜索结果的最小相似度分数 | `0.5` | 否 |
| `MAX_RESULTS` | 返回的最大搜索结果数 | `10` | 否 |
| `ENABLE_CACHE` | 启用搜索结果缓存 | `false` | 否 |
| `CACHE_TTL` | 缓存结果的生存时间（秒） | `3600` | 否 |
| `VECTOR_ENGINE_TYPE` | 向量引擎类型 (`memory`, `oceanbase`, `meilisearch`) | `memory` | 否 |

### 使用示例

#### 基本用法（stdio 传输）

```bash
node build/index.js
```

#### SSE 传输与调试日志

```bash
TRANSPORT_TYPE=sse SERVER_PORT=3000 DEBUG=true ENABLE_FILE_LOGGING=true node build/index.js
```

#### REST 传输与自定义 API 端点

```bash
TRANSPORT_TYPE=rest SERVER_PORT=8080 ENDPOINT=/api/mcp node build/index.js
```

#### 生产配置

```bash
TRANSPORT_TYPE=rest SERVER_PORT=8080 SERVER_HOST=0.0.0.0 LOG_LEVEL=warn ENABLE_FILE_LOGGING=true node build/index.js
```

### 注意事项

- 布尔变量接受 `true`、`1`、`yes` 作为真值，`false`、`0`、`no` 作为假值
- 使用 SSE 或 REST 传输时，确保端口未被其他应用程序占用
- 对于生产部署，考虑将 `SERVER_HOST` 设置为 `0.0.0.0` 以允许外部连接
- 设置 `DEBUG=true` 将覆盖 `LOG_LEVEL` 设置并将其设置为 `debug`

## 故障排除

### 常见安装问题

1. **权限错误**

   如果遇到权限错误，请尝试使用 `sudo` 或管理员权限：
   
   ```bash
   sudo npm install -g @xiaohui-wang/mcpadvisor
   ```

2. **版本冲突**

   如果与其他包有版本冲突，请尝试：
   
   ```bash
   npm install @xiaohui-wang/mcpadvisor --force
   ```

3. **找不到命令**

   确保全局 npm bin 目录在您的 PATH 中：
   
   ```bash
   export PATH="$PATH:$(npm bin -g)"
   ```

### 验证安装

运行以下命令验证安装：

```bash
mcpadvisor --version
```

或者：

```bash
npx @xiaohui-wang/mcpadvisor --version
```

如果显示版本号，则表示安装成功。
