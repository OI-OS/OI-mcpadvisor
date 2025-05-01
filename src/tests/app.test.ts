/**
 * Basic tests for the MCP Compass application
 */

import { SearchService } from '../services/searchService.js';
import { CompassSearchProvider } from '../services/search/CompassSearchProvider.js';
import { MCPServerResponse } from '../types/index.js';
import logger from '../utils/logger.js';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the logger to avoid actual logging during tests
jest.mock('../utils/logger.js', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('MCP Compass Application', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('Application can be initialized', () => {
    // Create the search provider and service
    const searchProvider = new CompassSearchProvider();
    const searchService = new SearchService([searchProvider]);
    
    // Verify that the services were created successfully
    expect(searchProvider).toBeDefined();
    expect(searchService).toBeDefined();
    expect(logger.info).toHaveBeenCalled();
  });

  test('SearchProvider can handle search requests', async () => {
    // Mock successful API response
    const mockResponse = [
      {
        title: 'Test MCP Server',
        description: 'A test MCP server for unit testing',
        github_url: 'https://github.com/test/mcp-server',
        similarity: 0.95
      }
    ] as MCPServerResponse[];
    
    // Setup the fetch mock
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    // Create the search provider
    const searchProvider = new CompassSearchProvider();
    
    // Perform a search
    const results = await searchProvider.search('test query');
    
    // Verify the results
    expect(results).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Searching for MCP servers'));
  });

  test('SearchProvider handles API errors', async () => {
    // Setup the fetch mock to simulate an error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });
    
    // Create the search provider
    const searchProvider = new CompassSearchProvider();
    
    // Expect the search to throw an error
    await expect(searchProvider.search('test query')).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });

  test('SearchService can handle multiple providers', async () => {
    // Create mock providers
    const mockProvider1 = {
      search: jest.fn().mockResolvedValue([
        {
          title: 'Provider 1 MCP Server',
          description: 'A test MCP server from provider 1',
          github_url: 'https://github.com/test/mcp-server-1',
          similarity: 0.9
        }
      ])
    };
    
    const mockProvider2 = {
      search: jest.fn().mockResolvedValue([
        {
          title: 'Provider 2 MCP Server',
          description: 'A test MCP server from provider 2',
          github_url: 'https://github.com/test/mcp-server-2',
          similarity: 0.95
        }
      ])
    };
    
    // Create search service with multiple providers
    const searchService = new SearchService([mockProvider1, mockProvider2]);
    
    // Perform a search
    const results = await searchService.search('test query');
    
    // Verify that both providers were called
    expect(mockProvider1.search).toHaveBeenCalledWith('test query');
    expect(mockProvider2.search).toHaveBeenCalledWith('test query');
    
    // Verify results are merged and sorted by similarity
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Provider 2 MCP Server'); // Higher similarity should be first
    expect(results[1].title).toBe('Provider 1 MCP Server');
  });
});
