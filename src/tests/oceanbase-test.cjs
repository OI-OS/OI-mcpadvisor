/**
 * OceanBase 连接测试 (CommonJS 版本)
 * 用于验证 OceanBase 向量搜索功能
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 测试数据
const testData = [
  {
    title: 'AI Assistant MCP Server',
    description: 'A powerful MCP server for AI assistants with advanced capabilities',
    github_url: 'https://github.com/example/ai-assistant-mcp'
  },
  {
    title: 'Data Processing MCP Server',
    description: 'Process and transform data with this efficient MCP server',
    github_url: 'https://github.com/example/data-processing-mcp'
  },
  {
    title: 'Vector Search Engine',
    description: 'High-performance vector search engine for similarity matching',
    github_url: 'https://github.com/example/vector-search-engine'
  }
];

// OceanBase 连接配置
const CERT_PATH = path.resolve(process.cwd(), 'certs/ca.pem');
const DB_CONFIG = {
  host: 'obmt6pb9nrl5dk0w-mi.aliyun-cn-hangzhou-internet.oceanbase.cloud',
  port: 3306,
  user: 'xiaohui0501',
  password: 'YQGWE*XNWMbpTg',
  database: 'mcpadvisor',
  ssl: false,
  connectionLimit: 10,
  waitForConnections: true
};

// 表名
const TABLE_NAME = 'mcp_vector_data';

/**
 * 测试 OceanBase 连接
 */
async function testConnection() {
  let connection;
  try {
    console.log('Testing OceanBase connection...');
    console.log(`Connecting to: ${DB_CONFIG.host}:${DB_CONFIG.port} as ${DB_CONFIG.user}`);
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connection successful!');
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }
}

/**
 * 创建测试表
 */
async function createTestTable() {
  let connection;
  try {
    console.log('\nCreating test table...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // 检查表是否存在
    const [tables] = await connection.query(`SHOW TABLES LIKE '${TABLE_NAME}'`);
    if (tables.length > 0) {
      console.log(`Table ${TABLE_NAME} already exists`);
    } else {
      // 创建表
      await connection.query(`
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          vector VECTOR(1536) NOT NULL,
          server_id VARCHAR(50) NOT NULL,
          server_name VARCHAR(100) NOT NULL,
          description TEXT,
          github_url VARCHAR(255) NOT NULL,
          createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // 创建向量索引
      await connection.query(`
        CREATE VECTOR INDEX IF NOT EXISTS vector_index ON ${TABLE_NAME}(vector) 
        WITH (distance=inner_product, type=hnsw, m=32, ef_construction=128);
      `);
      
      console.log('Test table created successfully!');
    }
    return true;
  } catch (error) {
    console.error('Failed to create test table:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * 插入测试数据
 */
async function insertTestData() {
  let connection;
  try {
    console.log('\nInserting test data...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // 清除现有数据
    await connection.query(`DELETE FROM ${TABLE_NAME}`);
    
    // 创建简单的向量生成函数
    function createSimpleVector(text, size = 1536) {
      const vector = new Array(size).fill(0);
      for (let i = 0; i < text.length; i++) {
        vector[i % size] += text.charCodeAt(i) / 255;
      }
      return vector;
    }
    
    // 插入测试数据
    for (let i = 0; i < testData.length; i++) {
      const item = testData[i];
      const searchText = `${item.title} ${item.description}`;
      const vector = createSimpleVector(searchText);
      
      await connection.query(
        `INSERT INTO ${TABLE_NAME} (vector, server_id, server_name, description, github_url) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          `[${vector}]`,
          `test${i+1}`,
          item.title,
          item.description,
          item.github_url
        ]
      );
      
      console.log(`Added: ${item.title}`);
    }
    
    console.log('Test data inserted successfully!');
    return true;
  } catch (error) {
    console.error('Failed to insert test data:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * 执行向量搜索测试
 */
async function testVectorSearch() {
  let connection;
  try {
    console.log('\nTesting vector search...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // 创建简单的向量生成函数
    function createSimpleVector(text, size = 1536) {
      const vector = new Array(size).fill(0);
      for (let i = 0; i < text.length; i++) {
        vector[i % size] += text.charCodeAt(i) / 255;
      }
      return vector;
    }
    
    // 测试查询
    const searchQuery = 'AI assistant for chatbots';
    console.log(`\nSearch query: "${searchQuery}"`);
    const queryVector = createSimpleVector(searchQuery);
    
    // 执行向量搜索
    const [rows] = await connection.query(
      `BEGIN;
       SET ob_hnsw_ef_search = 100;
       SELECT id, server_id, server_name, description, github_url, inner_product(vector, [${queryVector}]) AS score
         FROM ${TABLE_NAME}
         ORDER BY score DESC APPROXIMATE LIMIT 3;
       COMMIT;`
    );
    
    // 获取结果 (在第三个结果集中)
    const results = rows[2];
    
    console.log(`Found ${results.length} results:`);
    results.forEach((result, i) => {
      console.log(`${i+1}. ${result.server_name} (similarity: ${result.score.toFixed(4)})`);
      console.log(`   ${result.description}`);
    });
    
    console.log('\nVector search test completed successfully!');
    return true;
  } catch (error) {
    console.error('Vector search test failed:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('=== OceanBase Integration Test (CommonJS) ===\n');
  
  try {
    // 测试连接
    const connectionSuccess = await testConnection();
    if (!connectionSuccess) {
      console.error('Connection test failed, aborting further tests');
      return;
    }
    
    // 创建测试表
    const tableCreated = await createTestTable();
    if (!tableCreated) {
      console.error('Table creation failed, aborting further tests');
      return;
    }
    
    // 插入测试数据
    const dataInserted = await insertTestData();
    if (!dataInserted) {
      console.error('Data insertion failed, aborting further tests');
      return;
    }
    
    // 测试向量搜索
    await testVectorSearch();
    
    console.log('\n=== Test Suite Completed ===');
  } catch (error) {
    console.error('Test suite failed with unexpected error:', error.message);
  }
}

// 执行测试
runTests();
