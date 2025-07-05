import { BaseToolHandler } from '../tools/BaseToolHandler.js';
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
