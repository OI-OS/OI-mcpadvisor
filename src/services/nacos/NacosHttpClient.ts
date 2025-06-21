import axios from 'axios';
import { NacosMcpServer } from '../../types/nacos.js';
import logger from '../../utils/logger.js';

interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

interface NacosMcpServerConfig {
  name: string;
  description?: string;
  protocol?: string;
  remoteServerConfig?: {
    exportPath: string;
    serviceRef?: any;
  };
  backendEndpoints?: Array<{
    address: string;
    port: number;
  }>;
  toolSpec?: {
    tools?: Tool[];
    [key: string]: any;
  };
  [key: string]: any;
}

export class NacosHttpClient {
  private readonly nacosAddr: string;
  private readonly userName: string;
  private readonly passwd: string;
  private client: ReturnType<typeof axios.create>;

  constructor(nacosAddr: string, userName: string, passwd: string) {
    if (!nacosAddr) {
      throw new Error('nacosAddr cannot be an empty string');
    }
    if (!userName) {
      throw new Error('userName cannot be an empty string');
    }
    if (!passwd) {
      throw new Error('passwd cannot be an empty string');
    }

    this.nacosAddr = nacosAddr;
    this.userName = userName;
    this.passwd = passwd;

    this.client = axios.create({
      baseURL: `http://${this.nacosAddr}`,
      headers: {
        'Content-Type': 'application/json',
        'charset': 'utf-8',
        'userName': this.userName,
        'password': this.passwd
      }
    });
  }

  async isReady(): Promise<boolean> {
    try {
      const response = await this.client.get<{ data: unknown }>('/nacos/v3/admin/ai/mcp/list');
      return response.status === 200;
    } catch (error) {
      logger.warn(`Nacos health check failed: ${error}`);
      return false;
    }
  }

  async getMcpServerByName(name: string): Promise<NacosMcpServer> {
    const url = `/nacos/v3/admin/ai/mcp?mcpName=${name}`;
    const mcpServer: NacosMcpServer = {
      name,
      description: '',
      agentConfig: {},
    };

    try {
      interface McpServerResponse {
        data: NacosMcpServerConfig;
      }
      
      const response = await this.client.get<McpServerResponse>(url);
      if (response.status === 200) {
        const data = response.data.data;
        const server: NacosMcpServer = {
          name: data.name,
          description: data.description || '',
          agentConfig: {},
          mcpConfigDetail: data,
          getAgentConfig: () => ({}),
          toDict: () => ({
            ...data,
            description: data.description || ''
          })
        };
        
        // Add getName and getDescription methods if not present
        if (!server.getName) {
          server.getName = () => data.name;
        }
        if (!server.getDescription) {
          server.getDescription = () => data.description || '';
        }

        if (data.protocol !== 'stdio' && data.backendEndpoints?.length) {
          const endpoint = data.backendEndpoints[0];
          const httpSchema = endpoint.port === 443 ? 'https' : 'http';
          let url = `${httpSchema}://${endpoint.address}:${endpoint.port}`;
          
          if (data.remoteServerConfig?.exportPath) {
            const exportPath = data.remoteServerConfig.exportPath.startsWith('/') 
              ? data.remoteServerConfig.exportPath 
              : `/${data.remoteServerConfig.exportPath}`;
            url += exportPath;
          }

          server.agentConfig = {
            ...server.agentConfig,
            mcpServers: {
              [server.name]: {
                name: server.name,
                description: server.description,
                url: url
              }
            }
          };
        }
        return server;
      }
    } catch (error) {
      logger.warn(`Failed to get mcp server ${name}: ${error}`);
    }
    return mcpServer;
  }

  async getMcpServers(): Promise<NacosMcpServer[]> {
    const mcpServers: NacosMcpServer[] = [];
    try {
      const pageSize = 100;
      const pageNo = 1;
      const url = `/nacos/v3/admin/ai/mcp/list?pageNo=${pageNo}&pageSize=${pageSize}`;
      
      interface McpListResponse {
        data: {
          pageItems: Array<{ name: string; enabled: boolean }>;
        };
      }
      
      const response = await this.client.get<McpListResponse>(url);
      
      if (response.status !== 200) {
        logger.warn(`Failed to get mcp server list, status: ${response.status}`);
        return [];
      }

      for (const mcpServerDict of response.data.data.pageItems) {
        if (mcpServerDict.enabled) {
          const mcpServer = await this.getMcpServerByName(mcpServerDict.name);
          if (mcpServer.description) {
            mcpServers.push(mcpServer);
          }
        }
      }
    } catch (error) {
      logger.error('Error getting mcp servers:', error);
      throw new Error(`Failed to get mcp servers: ${error}`);
    }
    return mcpServers;
  }

  async updateMcpTools(mcpName: string, tools: Tool[]): Promise<boolean> {
    try {
      const url = `/nacos/v3/admin/ai/mcp?mcpName=${mcpName}`;
      const response = await this.client.get<{ data: NacosMcpServerConfig }>(url);

      if (response.status === 200) {
        const data = response.data.data;
        const toolList = tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }));

        const endpointSpecification: Record<string, any> = {};
        if (data.protocol !== 'stdio' && data.remoteServerConfig?.serviceRef) {
          endpointSpecification.data = data.remoteServerConfig.serviceRef;
          endpointSpecification.type = 'REF';
        }

        const toolSpecification = {
          ...(data.toolSpec || {}),
          tools: toolList
        };

        const serverSpecification = { ...data };
        delete serverSpecification.toolSpec;
        delete serverSpecification.backendEndpoints;

        const params = new URLSearchParams();
        params.append('mcpName', mcpName);
        params.append('serverSpecification', JSON.stringify(serverSpecification));
        params.append('endpointSpecification', JSON.stringify(endpointSpecification));
        params.append('toolSpecification', JSON.stringify(toolSpecification));

        logger.info(`Updating mcp tools for ${mcpName}`);

        const updateUrl = `http://${this.nacosAddr}/nacos/v3/admin/ai/mcp`;
        const updateResponse = await axios.put(updateUrl, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'charset': 'utf-8',
            'userName': this.userName,
            'password': this.passwd
          }
        });

        return updateResponse.status === 200;
      }
      return false;
    } catch (error) {
      logger.error('Error updating mcp tools:', error);
      return false;
    }
  }
}
