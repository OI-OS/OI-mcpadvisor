## 背景

searchService.ts 中 CompassSearchProvider 提供了一个搜索的接口，我们希望在 GetMcpSearchProvider 同样实现一个搜索的接口。
不一样的是，GetMcpSearchProvider 接受到的是一个 mcp.json 文件，而不是一个现成的 api base url。
mcp.json 文件的格式如下：

```json
{
    "rabbitmq": {
        "name": "rabbitmq",
        "display_name": "RabbitMQ",
        "description": "The MCP server that interacts with RabbitMQ to publish and consume messages.",
        "repository": {
            "type": "git",
            "url": "https://github.com/kenliao94/mcp-server-rabbitmq"
        },
        "homepage": "https://github.com/kenliao94/mcp-server-rabbitmq",
        "author": {
            "name": "kenliao94"
        },
        "license": "MIT",
        "categories": [
            "RabbitMQ",
            "Messaging"
        ],
        "tags": [
            "rabbitmq",
            "server",
            "messaging"
        ],
        "installations": {
            "uvx": {
                "type": "uvx",
                "command": "uvx",
                "args": [
                    "--from",
                    "https://github.com/kenliao94/mcp-server-rabbitmq",
                    "mcp-server-rabbitmq",
                    "--rabbitmq-host",
                    "${RABBITMQ_HOST}",
                    "--port",
                    "${RABBITMQ_PORT}",
                    "--username",
                    "${RABBITMQ_USERNAME}",
                    "--password",
                    "${RABBITMQ_PASSWORD}",
                    "--use-tls",
                    "${USE_TLS}"
                ]
            }
        },
        "examples": [
            {
                "title": "Publish Message",
                "description": "Ask Claude to publish a message to a queue.",
                "prompt": "Please publish a message to the queue."
            }
        ],
        "arguments": {
            "RABBITMQ_HOST": {
                "description": "The hostname of the RabbitMQ server (e.g., test.rabbit.com, localhost).",
                "required": true,
                "example": "test.rabbit.com"
            },
            "RABBITMQ_PORT": {
                "description": "The port number to connect to the RabbitMQ server (e.g., 5672).",
                "required": true,
                "example": "5672"
            },
            "RABBITMQ_USERNAME": {
                "description": "The username to authenticate with the RabbitMQ server.",
                "required": true,
                "example": "guest"
            },
            "RABBITMQ_PASSWORD": {
                "description": "The password for the RabbitMQ username provided.",
                "required": true,
                "example": "guest"
            },
            "USE_TLS": {
                "description": "Set to true if using TLS (AMQPS), otherwise false.",
                "required": false,
                "example": "true or false"
            }
        }
    }
}
```

获取的 GET URL：https://getmcp.io/api/servers.json

实现时应该注意技术的优雅。
1. 按照最佳实践实现 GET 资源的获取，包含缓存，一个小时缓存失效
2. 实现一个搜索的接口，接收一个从 URL 中获取的 mcp.json 文件，返回一个可以搜索的 MCP 服务器的列表
  2.1 数据库选择 OceanBase 单机版，使用向量索引
  2.2 接口设计参考 CompassSearchProvider
3. 根据实现的搜索接口实现 GetMcpSearchProvider
## 技术实现

## 测试