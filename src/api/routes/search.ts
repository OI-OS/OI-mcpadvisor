import express, { Request, Response } from 'express';
import { SearchService } from '../../services/searchService.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * 搜索请求参数
 */
interface SearchRequest {
  query: string;
  limit?: number;
  minSimilarity?: number;
}

/**
 * 验证搜索请求
 */
const validateSearchRequest = (req: Request): { valid: boolean; message?: string } => {
  const { query } = req.body as Partial<SearchRequest>;
  
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return { valid: false, message: 'Query parameter is required and must be a non-empty string' };
  }
  
  return { valid: true };
};

/**
 * 处理搜索错误
 */
const handleSearchError = (error: unknown, res: Response): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Search API error: ${errorMessage}`);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: errorMessage
  });
};

/**
 * @route POST /api/search
 * @desc 搜索 MCP 服务器
 * @access Public
 */
router.post('/', (req: Request, res: Response) => {
  (async () => {
    try {
      // 验证请求
      const validation = validateSearchRequest(req);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          error: 'Bad Request',
          message: validation.message 
        });
      }
      
      // 获取请求参数
      const { query, limit, minSimilarity } = req.body as SearchRequest;
      
      logger.info(`API search request: "${query}"`);
      
      // 执行搜索
      const results = await SearchService.searchGetMcp(query, { limit, minSimilarity });
      
      // 返回结果
      return res.status(200).json({
        success: true,
        query,
        results,
        count: results.length
      });
    } catch (error) {
      handleSearchError(error, res);
    }
  })();
});

export default router;
