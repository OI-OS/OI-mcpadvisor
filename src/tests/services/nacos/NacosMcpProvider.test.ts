import { NacosMcpProvider } from '../../../services/search/NacosMcpProvider.js';
import { SearchParams } from '../../../types/search.js';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('NacosMcpProvider', () => {
  let provider: NacosMcpProvider;
  
  const mockConfig = {
    serverAddr: 'http://localhost:8848',
    username: 'test',
    password: 'test123',
    mcpHost: 'localhost',
    mcpPort: 3000,
    authToken: 'test-token',
    minSimilarity: 0.3,
    limit: 10,
    debug: true,
  };

  let mockNacosClient: any;
  
  beforeEach(async () => {
    // Create a new instance in test mode to skip real initialization
    provider = new NacosMcpProvider(mockConfig, true);
    
    // Create a mock NacosClient
    mockNacosClient = {
      init: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      searchMcpByKeyword: vi.fn().mockResolvedValue([{
        name: 'test-server',
        description: 'Test server',
        agentConfig: {},
        toDict: () => ({
          name: 'test-server',
          description: 'Test server',
          agentConfig: {}
        })
      }]),
      getMcpServer: vi.fn().mockResolvedValue([{
        name: 'test-server',
        description: 'Test server',
        agentConfig: {},
        toDict: () => ({
          name: 'test-server',
          description: 'Test server',
          agentConfig: {}
        })
      }])
    };
    
    // Set up the mock client and mark as initialized
    (provider as any).nacosClient = mockNacosClient;
    (provider as any).isInitialized = true;
  });

  afterEach(async () => {
    // Clean up after each test
    await provider.close();
  });

  describe('search', () => {
    it('should return an array of MCPServerResponse', async () => {
      // Setup mock return value - match the actual response structure
      const mockServer = {
        name: 'test-server',
        description: 'Test server description',
        agentConfig: {
          categories: ['test'],
          tags: ['test']
        },
        toDict: () => ({
          name: 'test-server',
          description: 'Test server description',
          agentConfig: {
            categories: ['test'],
            tags: ['test']
          }
        })
      };
      
      // Mock the searchMcpByKeyword to return our test server
      mockNacosClient.searchMcpByKeyword.mockResolvedValueOnce([mockServer]);

      const searchParams: SearchParams = {
        taskDescription: 'test search',
        keywords: ['test'],
      };

      const results = await provider.search(searchParams);
      
      // Verify we got an array with at least one result
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check the structure of the first result
      const result = results[0];
      expect(result).toMatchObject({
        id: 'test-server',
        title: 'test-server',
        description: 'Test server description',
        sourceUrl: expect.stringContaining('nacos://'),
        similarity: expect.any(Number),
        score: expect.any(Number),
        installations: expect.any(Object),
        categories: expect.arrayContaining([expect.any(String)]),
        tags: expect.arrayContaining([expect.any(String)])
      });
      
      // Verify search was called with the first keyword
      expect(mockNacosClient.searchMcpByKeyword).toHaveBeenCalledWith('test');
    });

    it('should handle empty keywords by extracting from task description', async () => {
      // Setup mock return value - match the actual response structure
      const mockServer = {
        name: 'test-server',
        description: 'Test server description',
        agentConfig: {
          categories: ['test'],
          tags: ['test']
        },
        toDict: () => ({
          name: 'test-server',
          description: 'Test server description',
          agentConfig: {
            categories: ['test'],
            tags: ['test']
          }
        })
      };
      mockNacosClient.searchMcpByKeyword.mockResolvedValueOnce([mockServer]);

      const searchParams: SearchParams = {
        taskDescription: 'test search with no keywords',
      };

      const results = await provider.search(searchParams);
      
      // Verify we got an array with at least one result
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check the structure of the first result
      const result = results[0];
      expect(result).toMatchObject({
        id: 'test-server',
        title: 'test-server',
        description: 'Test server description',
        sourceUrl: expect.stringContaining('nacos://'),
        similarity: expect.any(Number),
        score: expect.any(Number),
        installations: expect.any(Object),
        categories: expect.arrayContaining([expect.any(String)]),
        tags: expect.arrayContaining([expect.any(String)])
      });
      
      // Verify search was called with the first word of the task description
      // Note: The actual implementation might call it multiple times with different keywords
      expect(mockNacosClient.searchMcpByKeyword).toHaveBeenCalledWith('test');
    });

    it('should handle errors during search', async () => {
      // Mock the searchNacosMcpServers method to throw an error
      vi.spyOn(provider as any, 'searchNacosMcpServers').mockRejectedValue(new Error('Search failed'));
      
      const searchParams: SearchParams = {
        taskDescription: 'test error handling',
        keywords: ['test'],
      };

      await expect(provider.search(searchParams)).rejects.toThrow('Search failed');
    });
  });

  describe('close', () => {
    it('should close the Nacos client', async () => {
      // Setup mock for close
      mockNacosClient.close.mockResolvedValueOnce(undefined);
      
      await provider.close();
      
      // Verify that the client's close method was called
      expect(mockNacosClient.close).toHaveBeenCalled();
      
      // Verify that the provider is marked as not initialized
      expect((provider as any).isInitialized).toBe(false);
      
      // Verify that search throws an error when called after close
      await expect(
        provider.search({ taskDescription: 'test after close' })
      ).rejects.toThrow('NacosClient is not available');
    });
  });
});
