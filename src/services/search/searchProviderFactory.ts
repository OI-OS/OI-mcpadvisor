import { SearchProvider } from '../../types/index.js';
import { GetMcpSearchProvider } from './GetMcpSearchProvider.js';
import logger from '../../utils/logger.js';

/**
 * 搜索提供者类型
 */
export enum SearchProviderType {
  GETMCP = 'getmcp',
  // 未来可以添加更多搜索提供者类型
}

/**
 * 搜索提供者工厂
 * 负责创建和管理不同类型的搜索提供者
 */
export class SearchProviderFactory {
  private static providers: Map<SearchProviderType, SearchProvider> = new Map();
  
  /**
   * 获取搜索提供者实例
   * 如果实例不存在，则创建新实例
   */
  static getProvider(type: SearchProviderType): SearchProvider {
    // 检查是否已有实例
    if (this.providers.has(type)) {
      return this.providers.get(type)!;
    }
    
    // 创建新实例
    let provider: SearchProvider;
    
    switch (type) {
      case SearchProviderType.GETMCP:
        logger.info(`Creating new GetMcpSearchProvider instance`);
        provider = new GetMcpSearchProvider();
        break;
        
      default:
        logger.warn(`Unknown provider type: ${type}, falling back to GetMcpSearchProvider`);
        provider = new GetMcpSearchProvider();
    }
    
    // 缓存实例
    this.providers.set(type, provider);
    
    return provider;
  }
  
  /**
   * 清除所有提供者实例
   * 主要用于测试和重置
   */
  static clearProviders(): void {
    this.providers.clear();
    logger.debug('All search providers cleared');
  }
}
