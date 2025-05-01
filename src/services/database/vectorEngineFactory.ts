import { IVectorSearchEngine } from '../interfaces/vectorSearchEngine.js';
import { InMemoryVectorEngine } from './memory/vectorEngine.js';
import { OceanBaseVectorEngine } from './oceanbase/vectorEngine.js';
import { VECTOR_ENGINE_TYPE } from '../../config/constants.js';
import logger from '../../utils/logger.js';

/**
 * 向量引擎类型
 */
export enum VectorEngineType {
  MEMORY = 'memory',
  OCEANBASE = 'oceanbase'
}

/**
 * 解析向量引擎类型
 */
const parseEngineType = (typeString: string): VectorEngineType => {
  if (typeString === 'oceanbase') {
    return VectorEngineType.OCEANBASE;
  }
  return VectorEngineType.MEMORY;
};

/**
 * 创建内存向量引擎
 */
const createMemoryEngine = (): IVectorSearchEngine => {
  logger.info('Creating in-memory vector engine');
  return new InMemoryVectorEngine();
};

/**
 * 创建 OceanBase 向量引擎
 */
const createOceanBaseEngine = (): IVectorSearchEngine => {
  logger.info('Creating OceanBase vector engine');
  return new OceanBaseVectorEngine();
};

/**
 * 向量引擎工厂
 */
export class VectorEngineFactory {
  /**
   * 创建向量引擎实例
   */
  static createEngine(type?: VectorEngineType): IVectorSearchEngine {
    // 如果未指定类型，使用环境变量配置
    const engineType = type || parseEngineType(VECTOR_ENGINE_TYPE);
    
    switch (engineType) {
      case VectorEngineType.OCEANBASE:
        return createOceanBaseEngine();
      
      case VectorEngineType.MEMORY:
      default:
        return createMemoryEngine();
    }
  }
}
