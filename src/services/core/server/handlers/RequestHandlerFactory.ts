import { BaseToolHandler } from '../tools/BaseToolHandler.js';
import { BaseResourceHandler } from '../resources/BaseResourceHandler.js';
import logger from '../../../../utils/logger.js';

export class RequestHandlerFactory {
  public static createListToolsHandler(toolHandlers: BaseToolHandler[]) {
    return async () => {
      logger.debug('Handling ListTools request');
      return {
        tools: toolHandlers.map(handler => handler.getToolDefinition()),
      };
    };
  }

  public static createCallToolHandler(toolHandlers: BaseToolHandler[]) {
    return async (request: any) => {
      const { name } = request.params;
      logger.info(`Handling tool call: ${name}`);

      try {
        const handler = toolHandlers.find(h => h.canHandle(name));
        if (!handler) {
          return RequestHandlerFactory.createErrorResponse(`Unknown tool: ${name}`);
        }
        return await handler.handleRequest(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error handling request: ${message}`);
        return RequestHandlerFactory.createErrorResponse(message);
      }
    };
  }

  public static createListResourcesHandler(resourceHandlers: BaseResourceHandler[]) {
    return async () => {
      logger.debug('Handling ListResources request');
      
      try {
        const allResources = [];
        
        for (const handler of resourceHandlers) {
          const resources = await handler.listResources();
          allResources.push(...resources);
        }

        logger.info(`Listed ${allResources.length} resources`);
        return { resources: allResources };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error listing resources: ${message}`);
        return { resources: [] };
      }
    };
  }

  public static createReadResourceHandler(resourceHandlers: BaseResourceHandler[]) {
    return async (request: any) => {
      const { uri } = request.params;
      logger.info(`Handling resource read: ${uri}`);

      try {
        // Find a handler that supports this URI
        const handler = resourceHandlers.find(h => h.supportsUri(uri));
        
        if (!handler) {
          throw new Error(`No handler found for URI: ${uri}`);
        }

        const content = await handler.readResource(uri);
        logger.info(`Successfully read resource: ${uri}`);
        return content;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error reading resource: ${message}`);
        throw error; // Re-throw to let MCP handle the error response
      }
    };
  }

  private static createErrorResponse(message: string) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${message}`,
      }],
      isError: true,
    };
  }
}
