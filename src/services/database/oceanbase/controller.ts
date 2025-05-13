import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { IVectorDBClient, SearchResult } from '../../interfaces/vectorDBClient.js';
import { OCEANBASE_URL, DB_MAX_CONNECTIONS, DB_TABLE_NAME } from '../../../config/constants.js';
import logger from '../../../utils/logger.js';

/**
 * 获取数据库连接池
 */
export const getClient = async (): Promise<Pool> => {
  if (!OCEANBASE_URL) {
    logger.warn('OCEANBASE_URL is not set, OceanBase client will not be available');
    return Promise.reject('OCEANBASE_URL is not set');
  }

  if (global.obClient) {
    return global.obClient;
  }

  try {
    // 检查证书文件是否存在
    /*
    if (!fs.existsSync(CERT_PATH)) {
      logger.error(`SSL certificate not found at ${CERT_PATH}`);
      throw new Error(`SSL certificate not found at ${CERT_PATH}`);
    }
    */

    // 解析连接URL以获取配置参数
    const connectionConfig = new URL(OCEANBASE_URL);
    const host = connectionConfig.hostname;
    const port = parseInt(connectionConfig.port || '3306');
    const user = connectionConfig.username;
    const password = connectionConfig.password;
    const database = connectionConfig.pathname.substring(1);

    global.obClient = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      // 禁用SSL连接，因为服务器不支持安全连接
      ssl: undefined,
      waitForConnections: true,
      connectionLimit: DB_MAX_CONNECTIONS,
      connectTimeout: 20000,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    logger.info(`OceanBase connected to ${OCEANBASE_URL}`);
    return global.obClient;
  } catch (error) {
    logger.error(`Failed to connect to OceanBase: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * 查询条件类型
 */
type WhereProps = (string | [string, string | number])[];

/**
 * 插入数据类型
 */
type ValuesProps = { key: string; value?: string | number }[];

/**
 * 构建 WHERE 子句
 */
const buildWhereClause = (where?: WhereProps): string => {
  if (!where || where.length === 0) {
    return '';
  }
  
  const whereStr = where
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      const val = typeof item[1] === 'number' ? item[1] : `'${String(item[1])}'`;
      return `${item[0]}=${val}`;
    })
    .join(' ');
    
  return `WHERE ${whereStr}`;
};

/**
 * 构建插入值字符串
 */
const buildInsertValues = (values: ValuesProps[]): string => {
  return values
    .map(
      (items) =>
        `(${items
          .map((item) =>
            typeof item.value === 'number'
              ? item.value
              : `'${String(item.value).replace(/\'/g, '"')}'`
          )
          .join(',')})`
    )
    .join(',');
};

/**
 * 执行自定义 SQL 查询
 */
const executeQuery = async <T extends RowDataPacket[]>(sql: string): Promise<T> => {
  const client = await getClient();
  const start = Date.now();
  
  try {
    const [rows] = await client.query<T>(sql);
    const time = Date.now() - start;

    if (time > 300) {
      logger.warn(`OceanBase query time: ${time}ms, sql: ${sql}`);
    }

    return rows;
  } catch (error) {
    logger.error(`OceanBase query error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * 插入数据
 */
const insertData = async (values: ValuesProps[]): Promise<{ insertId: string }> => {
  if (values.length === 0) {
    return { insertId: '' };
  }

  const fields = values[0].map((item) => item.key).join(',');
  const sql = `INSERT INTO ${DB_TABLE_NAME} (${fields}) VALUES ${buildInsertValues(values)}`;

  try {
    const client = await getClient();
    const [result] = await client.query<ResultSetHeader>(sql);
    
    return {
      insertId: String(result.insertId)
    };
  } catch (error) {
    logger.error(`OceanBase insert error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * 删除数据
 */
const deleteData = async (where: WhereProps): Promise<void> => {
  const whereClause = buildWhereClause(where);
  const sql = `DELETE FROM ${DB_TABLE_NAME} ${whereClause}`;
  
  try {
    await executeQuery(sql);
  } catch (error) {
    logger.error(`OceanBase delete error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * 向量相似度搜索
 */
const searchVectorsByInnerProduct = async (
  vector: number[], 
  limit: number = 10
): Promise<Array<{
  id: string;
  server_id: string;
  server_name: string;
  github_url: string;
  description: string;
  score: number;
}>> => {
  try {
    // 由于 OceanBase 返回的结果结构特殊，这里需要特殊处理
    const client = await getClient();
    const [results] = await client.query<RowDataPacket[][]>(
      `BEGIN;
        SET ob_hnsw_ef_search = ${global.systemEnv?.hnswEfSearch || 100};
        SELECT id, server_id, server_name, github_url, description, inner_product(vector, [${vector}]) AS score
          FROM ${DB_TABLE_NAME}
          ORDER BY score DESC APPROXIMATE LIMIT ${limit};
      COMMIT;`
    );
    
    // 结果在第三个数组中（BEGIN 和 SET 语句后）
    const rows = results[2] as unknown as Array<{
      id: string;
      server_id: string;
      server_name: string;
      github_url: string;
      description: string;
      score: number;
    } & RowDataPacket>;

    return rows.map((item) => ({
      id: String(item.id),
      server_id: item.server_id,
      server_name: item.server_name,
      github_url: item.github_url,
      description: item.description,
      score: item.score
    }));
  } catch (error) {
    logger.error(`OceanBase vector search error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * 初始化数据库表和索引
 */
const initDatabaseSchema = async (): Promise<void> => {
  try {
    // 创建表
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS ${DB_TABLE_NAME} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        vector VECTOR(1536) NOT NULL,
        server_id VARCHAR(50) NOT NULL,
        server_name VARCHAR(100) NOT NULL,
        description TEXT,
        github_url VARCHAR(255) NOT NULL,
        createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 检查并添加categories列
    try {
      // 检查列是否存在
      const checkCategoriesColumn = await executeQuery(`
        SELECT COUNT(*) as count FROM information_schema.columns 
        WHERE table_name = '${DB_TABLE_NAME}' 
        AND column_name = 'categories';
      `);
      
      const checkTagsColumn = await executeQuery(`
        SELECT COUNT(*) as count FROM information_schema.columns 
        WHERE table_name = '${DB_TABLE_NAME}' 
        AND column_name = 'tags';
      `);
      
      // 如果列不存在，则添加
      if (checkCategoriesColumn[0].count === 0) {
        await executeQuery(`ALTER TABLE ${DB_TABLE_NAME} ADD COLUMN categories VARCHAR(255);`);
        logger.info('Added categories column');
      }
      
      if (checkTagsColumn[0].count === 0) {
        await executeQuery(`ALTER TABLE ${DB_TABLE_NAME} ADD COLUMN tags VARCHAR(255);`);
        logger.info('Added tags column');
      }
    } catch (error) {
      logger.warn(`Could not check or add columns: ${error instanceof Error ? error.message : String(error)}`);
      // 列操作失败不应该阻止整个初始化过程
    }

    // 创建向量索引
    try {
      // 检查向量索引是否存在
      const checkVectorIndex = await executeQuery(`
        SELECT COUNT(*) as count FROM information_schema.statistics 
        WHERE table_name = '${DB_TABLE_NAME}' 
        AND index_name = 'vector_index';
      `);
      
      // 只有在索引不存在时才创建
      if (checkVectorIndex[0].count === 0) {
        try {
          await executeQuery(
            `CREATE VECTOR INDEX vector_index ON ${DB_TABLE_NAME}(vector) WITH (distance=inner_product, type=hnsw, m=32, ef_construction=128);`
          );
          logger.info('Created vector index successfully');
        } catch (indexError) {
          logger.warn(`Could not create vector index: ${indexError instanceof Error ? indexError.message : String(indexError)}`);
          // 向量索引创建失败不应该阻止整个初始化过程
        }
      } else {
        logger.info('Vector index already exists, skipping creation');
      }
    } catch (error) {
      logger.warn(`Could not check vector index existence: ${error instanceof Error ? error.message : String(error)}`);
      // 检查索引失败不应该阻止整个初始化过程
    }

    // 创建普通索引
    try {
      // 检查server_id索引是否存在
      const checkServerIdIndex = await executeQuery(`
        SELECT COUNT(*) as count FROM information_schema.statistics 
        WHERE table_name = '${DB_TABLE_NAME}' 
        AND index_name = 'server_id_index';
      `);
      
      // 检查createtime索引是否存在
      const checkCreateTimeIndex = await executeQuery(`
        SELECT COUNT(*) as count FROM information_schema.statistics 
        WHERE table_name = '${DB_TABLE_NAME}' 
        AND index_name = 'create_time_index';
      `);
      
      // 只有在索引不存在时才创建
      if (checkServerIdIndex[0].count === 0) {
        try {
          await executeQuery(`CREATE INDEX server_id_index ON ${DB_TABLE_NAME}(server_id);`);
          logger.info('Created server_id index successfully');
        } catch (indexError) {
          logger.warn(`Could not create server_id index: ${indexError instanceof Error ? indexError.message : String(indexError)}`);
        }
      } else {
        logger.info('server_id index already exists, skipping creation');
      }
      
      if (checkCreateTimeIndex[0].count === 0) {
        try {
          await executeQuery(`CREATE INDEX create_time_index ON ${DB_TABLE_NAME}(createtime);`);
          logger.info('Created createtime index successfully');
        } catch (indexError) {
          logger.warn(`Could not create createtime index: ${indexError instanceof Error ? indexError.message : String(indexError)}`);
        }
      } else {
        logger.info('createtime index already exists, skipping creation');
      }
    } catch (error) {
      logger.warn(`Could not check or create regular indexes: ${error instanceof Error ? error.message : String(error)}`);
      // 普通索引创建失败不应该阻止整个初始化过程
    }

    logger.info('OceanBase database schema initialized successfully');
  } catch (error) {
    logger.error(`OceanBase schema initialization error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * OceanBase 客户端实现
 */
export class OceanBaseClient implements IVectorDBClient {
  /**
   * 连接到数据库
   */
  async connect(): Promise<void> {
    await getClient();
  }
  
  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<void> {
    if (global.obClient) {
      await global.obClient.end();
      global.obClient = undefined;
      logger.info('OceanBase disconnected');
    }
  }
  
  /**
   * 添加向量到数据库
   */
  async addVector(id: string, vector: number[], metadata: Record<string, any>): Promise<void> {
    try {
      // 基本字段，这些是必须的
      const baseValues = [
        { key: 'vector', value: `[${vector}]` },
        { key: 'server_id', value: id },
        { key: 'server_name', value: metadata.title || '' },
        { key: 'description', value: metadata.description || '' },
        { key: 'github_url', value: metadata.github_url || '' }
      ];
      
      // 可选字段，如果存在则添加
      const optionalFields = [];
      
      // 检查metadata中是否有categories和tags
      if (metadata.categories) {
        optionalFields.push({ key: 'categories', value: metadata.categories });
      }
      
      if (metadata.tags) {
        optionalFields.push({ key: 'tags', value: metadata.tags });
      }
      
      // 合并所有字段
      const values = [baseValues.concat(optionalFields)];
      
      await insertData(values);
      logger.debug(`Added vector for server: ${metadata.title}`);
    } catch (error) {
      // 如果插入失败，尝试只使用基本字段
      if (error instanceof Error && error.message.includes('Unknown column')) {
        logger.warn(`Falling back to basic fields only: ${error.message}`);
        const values = [
          [
            { key: 'vector', value: `[${vector}]` },
            { key: 'server_id', value: id },
            { key: 'server_name', value: metadata.title || '' },
            { key: 'description', value: metadata.description || '' },
            { key: 'github_url', value: metadata.github_url || '' }
          ]
        ];
        
        await insertData(values);
        logger.debug(`Added vector with basic fields for server: ${metadata.title}`);
      } else {
        // 其他错误则抛出
        throw error;
      }
    }
  }
  
  /**
   * 搜索相似向量
   */
  async searchVectors(vector: number[], limit: number): Promise<SearchResult[]> {
    const results = await searchVectorsByInnerProduct(vector, limit);
    
    return results.map(item => ({
      id: item.id,
      similarity: item.score,
      metadata: {
        server_id: item.server_id,
        title: item.server_name,
        description: item.description,
        github_url: item.github_url
      }
    }));
  }
  
  /**
   * 删除所有向量
   */
  async deleteAll(): Promise<void> {
    await deleteData([]);
    logger.info('Deleted all vectors from database');
  }
  
  /**
   * 初始化数据库表和索引
   */
  async initDatabase(): Promise<void> {
    await initDatabaseSchema();
    
    // 初始化更新信息表
    try {
      const { DataUpdateManager } = await import('./dataUpdateManager.js');
      await DataUpdateManager.initUpdateInfoTable();
    } catch (error) {
      logger.error(`Error initializing update info table: ${error instanceof Error ? error.message : String(error)}`);
      // 不抛出错误，允许应用继续运行
    }
  }
}

// 导出单例
export const oceanBaseClient = new OceanBaseClient();
