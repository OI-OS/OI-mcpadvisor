#!/usr/bin/env node

import { NacosMcpProvider } from '../../../services/search/NacosMcpProvider.js';
import { SearchParams } from '../../../types/search.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testNacosProvider() {
  console.log('Starting Nacos MCP Provider test...');

  // Configuration from environment variables with defaults
  const config = {
    serverAddr: process.env.NACOS_SERVER_ADDR || 'http://localhost:8848',
    username: process.env.NACOS_USERNAME || 'nacos',
    password: process.env.NACOS_PASSWORD || 'nacos',
    mcpHost: process.env.MCP_HOST || 'localhost',
    mcpPort: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000,
    authToken: process.env.MCP_AUTH_TOKEN || 'test-token',
    debug: true,
  };

  console.log('Using configuration:', {
    ...config,
    password: '***', // Don't log the actual password
  });

  // Create provider instance
  const provider = new NacosMcpProvider(config);

  try {
    // Test 1: Search with keywords
    console.log('\n--- Test 1: Search with keywords ---');
    const searchWithKeywords: SearchParams = {
      taskDescription: 'Find MCP servers for testing',
      keywords: ['test', 'mcp'],
    };
    
    try {
      const results = await provider.search(searchWithKeywords);
      console.log('✅ Search with keywords completed successfully');
      console.log(`📊 Results found: ${results.length}`);
      if (results.length > 0) {
        console.log('Sample result:', JSON.stringify(results[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Search with keywords failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 2: Search without keywords (should extract from task description)
    console.log('\n--- Test 2: Search without keywords ---');
    const searchWithoutKeywords: SearchParams = {
      taskDescription: 'Find MCP servers for testing without keywords',
    };
    
    try {
      const results = await provider.search(searchWithoutKeywords);
      console.log('✅ Search without keywords completed successfully');
      console.log(`📊 Results found: ${results.length}`);
      if (results.length > 0) {
        console.log('Sample result:', JSON.stringify(results[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Search without keywords failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 3: Empty search
    console.log('\n--- Test 3: Empty search ---');
    try {
      const results = await provider.search({ taskDescription: '' });
      console.log('✅ Empty search completed successfully');
      console.log(`📊 Results found: ${results.length}`);
    } catch (error) {
      console.error('❌ Empty search failed:', error instanceof Error ? error.message : String(error));
    }

    // Test 4: Error handling - invalid configuration
    console.log('\n--- Test 4: Error handling - invalid configuration ---');
    const invalidProvider = new NacosMcpProvider({
      ...config,
      serverAddr: 'http://invalid-nacos-server:8848',
      debug: true,
    });
    
    try {
      // Give it a short timeout since we expect it to fail
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), 5000)
      );
      
      const searchPromise = invalidProvider.search({ taskDescription: 'This should fail' });
      await Promise.race([searchPromise, timeoutPromise]);
      
      console.log('❌ Expected search to fail with invalid configuration, but it succeeded');
    } catch (error) {
      console.log('✅ Expected error caught:', error instanceof Error ? error.message : String(error));
    } finally {
      await invalidProvider.close();
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Clean up
    console.log('\nCleaning up...');
    await provider.close();
    console.log('Test completed.');
  }
}

// Run the test
testNacosProvider().catch(console.error);
