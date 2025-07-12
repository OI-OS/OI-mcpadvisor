import { Resource, ResourceContents } from '@modelcontextprotocol/sdk/types.js';
import { BaseResourceHandler } from './BaseResourceHandler.js';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../../../utils/logger.js';

/**
 * MCP Resource handler for reading log files
 * Implements the BaseResourceHandler interface to provide log file access
 */
export class LogResourceHandler extends BaseResourceHandler {
  private logDirectories: string[];
  private supportedExtensions: string[] = ['.log', '.txt'];

  constructor() {
    super();
    this.logDirectories = this.getLogDirectories();
    logger.info('LogResourceHandler initialized', 'LogResourceHandler', {
      directories: this.logDirectories,
      extensions: this.supportedExtensions
    });
  }

  /**
   * Get configured log directories from environment variables
   */
  private getLogDirectories(): string[] {
    const logDir = process.env.LOG_DIR || process.env.LOGS_DIR;
    
    if (!logDir) {
      // Default log directories
      const defaultDirs = [
        path.join(process.cwd(), 'logs'),
        '/var/log',
        '/tmp'
      ];
      logger.info('No LOG_DIR configured, using defaults', 'LogResourceHandler', { defaultDirs });
      return defaultDirs;
    }

    // Support multiple directories separated by colon
    const directories = logDir.split(':').filter(Boolean);
    logger.info('Using configured log directories', 'LogResourceHandler', { directories });
    return directories;
  }

  /**
   * List all available log files as resources
   */
  async listResources(): Promise<Resource[]> {
    const resources: Resource[] = [];

    for (const directory of this.logDirectories) {
      try {
        await this.addResourcesFromDirectory(directory, resources);
      } catch (error) {
        logger.warn(`Failed to read log directory: ${directory}`, 'LogResourceHandler', { error });
        // Continue with other directories
      }
    }

    logger.info(`Found ${resources.length} log resources`, 'LogResourceHandler');
    return resources;
  }

  /**
   * Add resources from a specific directory
   */
  private async addResourcesFromDirectory(directory: string, resources: Resource[]): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        
        try {
          const stat = await fs.stat(filePath);
          
          if (stat.isFile() && this.isSupportedFile(file)) {
            const resource = this.createResourceFromFile(directory, file);
            resources.push(resource);
          }
        } catch (error) {
          logger.debug(`Failed to stat file: ${filePath}`, 'LogResourceHandler', { error });
          // Continue with other files
        }
      }
    } catch (error) {
      logger.warn(`Cannot access directory: ${directory}`, 'LogResourceHandler', { error });
      throw error; // Re-throw to be caught by caller
    }
  }

  /**
   * Check if a file is supported based on its extension
   */
  private isSupportedFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.supportedExtensions.includes(ext);
  }

  /**
   * Create a Resource object from a file
   */
  private createResourceFromFile(directory: string, filename: string): Resource {
    const filePath = path.join(directory, filename);
    const uri = this.createFileUri(filePath);
    
    return {
      uri,
      name: `Log: ${filename}`,
      description: `Log file from ${directory}`,
      mimeType: 'text/plain'
    };
  }

  /**
   * Create a file URI from a file path
   */
  private createFileUri(filePath: string): string {
    // Normalize path and encode URI components
    const normalizedPath = path.resolve(filePath);
    // Convert to URI format with proper encoding
    const encodedPath = normalizedPath.split(path.sep).map(encodeURIComponent).join('/');
    return `file:///${encodedPath.replace(/^\//, '')}`;
  }

  /**
   * Read the content of a resource by URI
   */
  async readResource(uri: string): Promise<any> {
    logger.info(`Reading resource: ${uri}`, 'LogResourceHandler');

    // Validate and parse URI
    const filePath = this.parseFileUri(uri);
    
    // Security check - ensure file is within allowed directories
    this.validateFilePath(filePath);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      logger.info(`Successfully read resource: ${uri}`, 'LogResourceHandler', {
        size: content.length
      });

      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: content
          }
        ]
      };
    } catch (error) {
      const errorCode = (error as any).code;
      const errorMessage = (error as Error).message;
      
      if (errorCode === 'ENOENT' || errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
        const notFoundError = new Error('File not found');
        logger.error('File not found', 'LogResourceHandler', { error: notFoundError, uri });
        throw notFoundError;
      } else if (errorCode === 'EACCES' || errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
        const permissionError = new Error('Permission denied');
        logger.error('Permission denied', 'LogResourceHandler', { error: permissionError, uri });
        throw permissionError;
      } else {
        logger.error('Failed to read file', 'LogResourceHandler', { error, uri });
        throw error;
      }
    }
  }

  /**
   * Parse a file URI to get the local file path
   */
  private parseFileUri(uri: string): string {
    if (!uri.startsWith('file://')) {
      throw new Error(`Invalid URI format: ${uri}`);
    }

    // Remove 'file://' prefix and decode URI components
    const pathPart = uri.substring(7); // Remove 'file://'
    const decodedPath = decodeURIComponent(pathPart);
    
    // Ensure it starts with '/' for absolute path
    return decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`;
  }

  /**
   * Validate that the file path is within allowed directories
   */
  private validateFilePath(filePath: string): void {
    const resolvedPath = path.resolve(filePath);
    
    // Check if the path is within any of the allowed log directories
    const isInAllowedDirectory = this.logDirectories.some(dir => {
      const resolvedDir = path.resolve(dir);
      return resolvedPath.startsWith(resolvedDir);
    });

    if (!isInAllowedDirectory) {
      throw new Error(`Invalid file path: ${filePath} is not within allowed log directories`);
    }

    // Additional security check for path traversal
    if (resolvedPath.includes('..')) {
      throw new Error(`Invalid file path: ${filePath} contains path traversal`);
    }
  }

  /**
   * Check if this handler supports a given URI
   */
  supportsUri(uri: string): boolean {
    try {
      const filePath = this.parseFileUri(uri);
      this.validateFilePath(filePath);
      
      const filename = path.basename(filePath);
      return this.isSupportedFile(filename);
    } catch {
      return false;
    }
  }
}