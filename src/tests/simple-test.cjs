/**
 * Simple test for the OceanBase integration
 * This uses CommonJS to avoid ESM-related issues
 */

console.log('=== Simple OceanBase Integration Test ===\n');

// Test the database connection
async function testConnection() {
  try {
    const mysql = require('mysql2/promise');
    const fs = require('fs');
    const path = require('path');
    
    // OceanBase connection configuration
    const CERT_PATH = path.resolve(process.cwd(), 'certs/ca.pem');
    const DB_CONFIG = {
      host: 'obmt6pb9nrl5dk0w-mi.aliyun-cn-hangzhou-internet.oceanbase.cloud',
      port: 3306,
      user: 'xiaohui0501',
      password: 'YQGWE*XNWMbpTg',
      database: 'mcpadvisor',
      ssl: false, // Disable SSL for testing
      connectionLimit: 10,
      waitForConnections: true
    };
    
    console.log('Testing OceanBase connection...');
    console.log(`Connecting to: ${DB_CONFIG.host}:${DB_CONFIG.port} as ${DB_CONFIG.user}`);
    
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connection successful!');
    
    // Test a simple query
    console.log('\nExecuting a simple query...');
    const [rows] = await connection.query('SHOW TABLES');
    
    console.log('Tables in database:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${Object.values(row)[0]}`);
    });
    
    // Close the connection
    await connection.end();
    console.log('\nConnection closed');
    
    console.log('\nTest completed successfully!');
    return true;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection();
