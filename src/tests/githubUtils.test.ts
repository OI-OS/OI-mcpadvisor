// Mock the logger to prevent errors in tests
jest.mock('../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

import { parseGitHubUrl, fetchGitHubReadme } from '../utils/githubUtils.js';

describe('GitHub Utils', () => {
  describe('parseGitHubUrl', () => {
    test('should parse a simple GitHub URL', () => {
      const url = 'https://github.com/seansoreilly/abs';
      const result = parseGitHubUrl(url);
      
      expect(result).toEqual({
        owner: 'seansoreilly',
        repo: 'abs',
        branch: 'main'
      });
    });

    test('should parse a GitHub URL with a specific branch', () => {
      const url = 'https://github.com/seansoreilly/abs/tree/develop';
      const result = parseGitHubUrl(url);
      
      expect(result).toEqual({
        owner: 'seansoreilly',
        repo: 'abs',
        branch: 'develop'
      });
    });

    test('should handle a URL with .git suffix', () => {
      const url = 'https://github.com/seansoreilly/abs.git';
      const result = parseGitHubUrl(url);
      
      expect(result).toEqual({
        owner: 'seansoreilly',
        repo: 'abs',
        branch: 'main'
      });
    });

    test('should return null for invalid GitHub URLs', () => {
      const url = 'https://example.com/some/path';
      const result = parseGitHubUrl(url);
      
      expect(result).toBeNull();
    });
  });

  // These tests require network access, so they might be skipped in CI environments
  describe('fetchGitHubReadme', () => {
    test('should fetch README content for a valid repository', async () => {
      // This test may take some time as it makes actual network requests
      jest.setTimeout(10000);
      
      const url = 'https://github.com/seansoreilly/abs';
      const content = await fetchGitHubReadme(url);
      
      expect(content).toBeTruthy();
      expect(typeof content).toBe('string');
      // Basic validation that it looks like markdown content
      expect(content).toContain('#');
    }, 10000);

    test('should return null for a non-existent repository', async () => {
      const url = 'https://github.com/non-existent-user/non-existent-repo';
      const content = await fetchGitHubReadme(url);
      
      expect(content).toBeNull();
    }, 10000);
  });
});
