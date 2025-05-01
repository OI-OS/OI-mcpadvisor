/**
 * MCP Server service
 * Handles server setup and tool registration
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import cors from "cors";

import { SERVER_NAME, SERVER_VERSION } from '../config/constants.js';
import { formatServersToMCPContent } from '../utils/formatter.js';
import { SearchService } from './searchService.js';
import logger from '../utils/logger.js';
import { RestServerTransport } from "@chatmcp/sdk/server/rest.js";
import { addAdditionalSources, McpSources } from './loadService.js';

// Define Zod schemas for validation
const GeneralArgumentsSchema = z.object({
  query: z.string().min(1),
});

// Schema for additional sources
const SourcesSchema = z.object({
  remote_urls: z.array(z.string()).optional(),
  local_files: z.array(z.string()).optional(),
  field_map: z.record(z.string(), z.array(z.string())).optional(),
});

/**
 * Transport type enum
 */
export enum TransportType {
  STDIO = 'stdio',
  SSE = 'sse',
  REST = 'rest',
}

/**
 * SSE transport configuration
 */
export interface TransportConfig {
  port: number;
  host?: string;
  path?: string;
  messagePath?: string;
  endpoint?: string;
}

/**
 * MCP Server service
 */
export class ServerService {
  private server: Server;
  private searchService: SearchService;
  private sseTransports: { [sessionId: string]: SSEServerTransport } = {};
  private expressApp?: express.Application;

  /**
   * Create a new server service
   * @param searchService - The search service to use for queries
   */
  constructor(searchService: SearchService) {
    this.searchService = searchService;
    logger.info(`Initializing ServerService with ${SERVER_NAME} v${SERVER_VERSION}`);
    
    // Create server instance
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registerHandlers();
    logger.info('Server handlers registered');
  }

  /**
   * Register request handlers for the server
   */
  private registerHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Handling ListTools request');
      return {
        tools: [
          {
            name: "recommend-mcp-servers",
            description: `
              此工具用于寻找合适且专业MCP服务器。
              基于您的具体需求，从互联网资源库以及内部MCP库中筛选并推荐最适合的MCP服务器解决方案。
              返回结果包含服务器名称、功能描述、所属类别，为您的业务成功提供精准技术支持。
              `,
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: `
                    请提供所需MCP服务器的精确描述。
                    
                    有效查询示例：
                    - '用于风控策略部署的MCP服务器'
                    - '保险产品精算定价的MCP服务器'
                    
                    无效查询示例：
                    - '保险MCP服务器'（过于宽泛）
                    - '风控系统'（缺乏具体保险场景）
                    - '精算工具'（未指明具体功能需求）
                    
                    查询应明确指定：
                    1. 业务流程（如产品定价、核保、理赔、准备金计算等）
                    2. 具体功能需求（如风险分析、策略部署、策略研发、特征研发等）
                    `,
                },
              },
              required: ["query"],
            },
          }
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      logger.info(`Handling tool call: ${name}`);

      try {
        if (name === "recommend-mcp-servers") {
          const { query } = GeneralArgumentsSchema.parse(args);
          logger.info(`Processing recommend-mcp-servers request with query: ${query}`);
          
          const servers = await this.searchService.search(query);
          logger.debug(`Found ${servers.length} servers matching query`);
          
          return {
            content: formatServersToMCPContent(servers),
          };
        } else {
          const errorMsg = `Unknown tool: ${name}`;
          logger.error(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (error) {
        logger.error(`Error handling request: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  }

  /**
   * @param config - SSE configuration
   */
  private setupExpressServer(config: TransportConfig): void {
    const { port, host = 'localhost', path = '/sse', messagePath = '/messages' } = config;
    
    this.expressApp = express();
    
    // 如果使用 express.json()，会报错  InternalServerError: stream is not readable
    // this.expressApp.use(express.json());
    this.expressApp.use(cors());
    
    // SSE endpoint
    this.expressApp.get(path, async (req: Request, res: Response) => {      
      const transport = new SSEServerTransport(messagePath, res);
      this.sseTransports[transport.sessionId] = transport;

      res.on('close', () => {
        logger.info(`SSE connection closed for session ${transport.sessionId}`);
        delete this.sseTransports[transport.sessionId];
      });
      
      try {
        logger.info(`New SSE connection started on ${path}`);
        await this.server.connect(transport);
        logger.info(`SSE connection established for session ${transport.sessionId}`);
      } catch (error) {
        logger.error(`Error connecting transport: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).end();
      }
    });
    
    // Message handling endpoint
    this.expressApp.post(messagePath, async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string;
      logger.info(`Received message for session ${sessionId}`);
      
      const transport = this.sseTransports[sessionId];
      if (transport) {
        try {
          await transport.handlePostMessage(req, res);
        } catch (error) {
          logger.error(`Error handling message: ${error instanceof Error ? error.message : String(error)}`);
          res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        logger.warn(`No transport found for session ${sessionId}, 
          sseTransports length: ${Object.keys(this.sseTransports).length},
          first: ${this.sseTransports[Object.keys(this.sseTransports)[0]].sessionId}`);
        res.status(400).json({ error: 'No transport found for sessionId' });
      }
    });
    
    // Health check endpoint
    this.expressApp.get('/health', (_: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        server: SERVER_NAME,
        version: SERVER_VERSION,
        connections: Object.keys(this.sseTransports).length,
      });
    });
  }

  /**
   * Start the server with stdio transport
   */
  async startWithStdio(): Promise<void> {
    try {
      logger.info('Starting server with stdio transport');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info(`${SERVER_NAME} Server running on stdio`);
    } catch (error) {
      logger.error(`Failed to start server with stdio: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Start the server with SSE transport
   * @param config - SSE configuration
   */
  async startWithSSE(config: TransportConfig): Promise<void> {
    try {
      const { port, host = 'localhost' } = config;
      
      logger.info(`Starting server with SSE transport on ${host}:${port}`);
      this.setupExpressServer(config);
      
      if (!this.expressApp) {
        throw new Error('Express app not initialized');
      }
      
      // Add endpoint for adding sources dynamically
      this.expressApp.post('/api/sources', express.json(), async (req: Request, res: Response) => {
        try {
          const { remote_urls, local_files, field_map } = SourcesSchema.parse(req.body);
          
          const sources: Partial<McpSources> = {};
          if (remote_urls?.length) sources.remote_urls = remote_urls;
          if (local_files?.length) sources.local_files = local_files;
          
          const items = await addAdditionalSources(sources, field_map);
          
          res.status(200).json({
            success: true,
            message: 'Sources added successfully',
            itemCount: items.length
          });
        } catch (error) {
          logger.error(`Error adding sources: ${error instanceof Error ? error.message : String(error)}`);
          res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid request',
          });
        }
      });
      
      // Start the HTTP server
      this.expressApp.listen(port, host, () => {
        logger.info(`${SERVER_NAME} Server running on http://${host}:${port}`);
        logger.info(`SSE endpoint available at http://${host}:${port}${config.path || '/sse'}`);
        logger.info(`Messages endpoint available at http://${host}:${port}${config.messagePath || '/messages'}`);
      });
    } catch (error) {
      logger.error(`Failed to start server with SSE: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Start the server with REST transport
   */
    async startWithRest(config:TransportConfig) {
      logger.info('Starting server with REST transport');
      const transport = new RestServerTransport({
        port: config.port,
        endpoint: config.endpoint,
      });
      await this.server.connect(transport);
      await transport.startServer();
    }

  /**
   * Start the server with the specified transport
   * @param transportType - Type of transport to use
   * @param transportConfig - SSE configuration (required if transportType is SSE)
   */
  async start(transportType: TransportType = TransportType.STDIO, transportConfig?: TransportConfig): Promise<void> {
    try {
      if (transportType === TransportType.SSE) {
        if (!transportConfig) {
          throw new Error('SSE configuration required for SSE transport');
        }
        await this.startWithSSE(transportConfig);
      } else if (transportType === TransportType.REST) {
        if (!transportConfig) {
          throw new Error('SSE configuration required for REST transport');
        }
        await this.startWithRest(transportConfig);
      }
      else {
        await this.startWithStdio();
      }
    } catch (error) {
      logger.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
