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

  beforeEach(() => {
    // Create a new instance before each test
    provider = new NacosMcpProvider(mockConfig);
  });

  afterEach(async () => {
    // Clean up after each test
    await provider.close();
  });

  describe('search', () => {
    it('should return an array of MCPServerResponse', async () => {
      const searchParams: SearchParams = {
        taskDescription: 'test search',
        keywords: ['test'],
      };

      const results = await provider.search(searchParams);
      
      expect(Array.isArray(results)).toBe(true);
      // Add more specific assertions based on expected behavior
    });

    it('should handle empty keywords by extracting from task description', async () => {
      const searchParams: SearchParams = {
        taskDescription: 'test search with no keywords',
      };

      const results = await provider.search(searchParams);
      
      expect(Array.isArray(results)).toBe(true);
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
      await provider.close();
      // Verify that the client is closed by checking if search throws an error
      await expect(
        provider.search({ taskDescription: 'test after close' })
      ).rejects.toThrow('NacosMcpProvider is not initialized');
    });
  });
});
