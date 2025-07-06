# Testing Guide

This guide covers all aspects of testing MCP Advisor, from unit tests to comprehensive end-to-end testing workflows.

## Overview

MCP Advisor includes a comprehensive testing suite designed to ensure code quality, functionality, and reliability:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test interactions between services and providers  
- **End-to-End Tests**: Test complete workflows using MCP Inspector
- **Manual Testing**: Interactive testing for development and debugging

## Test Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── services/          # Service layer tests
│   ├── providers/         # Provider tests
│   └── utils/             # Utility function tests
├── integration/           # Integration tests for provider interactions
│   ├── providers/         # Provider integration tests
│   └── database/          # Database integration tests
└── e2e/                   # End-to-end tests using Playwright
    ├── mcp-inspector.spec.ts         # General MCP functionality
    └── meilisearch-local-e2e.spec.ts # Meilisearch-specific tests
```

## Quick Start

### Run All Tests
```bash
# Complete test suite
pnpm run check && pnpm run test && pnpm run test:e2e
```

### Automated E2E Testing
```bash
# Automated script that builds, starts inspector, and runs tests
./scripts/run-e2e-test.sh
```

## Unit Testing

Unit tests focus on testing individual components in isolation.

### Running Unit Tests

```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode (development)
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage

# Run Jest tests (alternative test runner)
pnpm run test:jest
```

### Unit Test Framework

- **Primary**: Vitest (modern, fast test runner)
- **Alternative**: Jest (legacy support)
- **Assertions**: Expect API
- **Mocking**: vi.fn() for Vitest

### Writing Unit Tests

```typescript
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../src/services/searchService.js';

describe('SearchService', () => {
  let service: SearchService;
  let mockProvider: MockProvider;

  beforeEach(() => {
    mockProvider = {
      search: vi.fn().mockResolvedValue([
        { title: 'Test Server', similarity: 0.9 }
      ])
    };
    service = new SearchService([mockProvider]);
  });

  test('should return search results', async () => {
    const results = await service.search('test query');
    
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Test Server');
    expect(mockProvider.search).toHaveBeenCalledWith('test query');
  });
});
```

## Integration Testing

Integration tests verify that different components work together correctly.

### Running Integration Tests

Integration tests are included in the main test suite:

```bash
# Integration tests run as part of the main test suite
pnpm run test

# Run specific integration tests
pnpm run test -- integration
```

### Key Integration Test Areas

1. **Provider Integration**
   - Meilisearch local/cloud connectivity
   - Nacos service discovery
   - External API interactions

2. **Database Integration**
   - Vector database operations
   - Index creation and management
   - Search functionality

3. **Service Integration**
   - Search service coordination
   - Provider fallback mechanisms
   - Result aggregation

### Example Integration Test

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { MeilisearchSearchProvider } from '../src/services/providers/meilisearch/index.js';

describe('Meilisearch Integration', () => {
  let provider: MeilisearchSearchProvider;

  beforeEach(() => {
    // Setup real Meilisearch connection for integration testing
    provider = new MeilisearchSearchProvider();
  });

  test('should connect to local Meilisearch instance', async () => {
    const results = await provider.search('file management');
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });
});
```

## End-to-End Testing

E2E tests verify complete workflows using real MCP Inspector interactions.

### Running E2E Tests

```bash
# Run E2E tests with browser UI (recommended for development)
pnpm run test:e2e:headed

# Run E2E tests in headless mode (CI/CD)
pnmp run test:e2e

# Debug E2E tests interactively
pnpm run test:e2e:debug

# Run E2E tests with Playwright UI
pnpm run test:e2e:ui
```

### Automated E2E Testing Script

The automated script handles the complete testing workflow:

```bash
# Run complete E2E test suite
./scripts/run-e2e-test.sh

# Available modes:
./scripts/run-e2e-test.sh headed    # Browser visible (default)
./scripts/run-e2e-test.sh headless # Background testing
./scripts/run-e2e-test.sh debug    # Debug mode
./scripts/run-e2e-test.sh ui       # Playwright UI mode
```

### Smart Meilisearch E2E Testing

For Meilisearch-specific testing, use the smart automation script that automatically handles all dependencies:

```bash
# Smart Meilisearch E2E testing (auto-starts all services)
pnpm run test:meilisearch:e2e

# Available modes:
pnpm run test:meilisearch:e2e:headed    # Browser visible (default)
pnpm run test:meilisearch:e2e:headless  # Background testing
pnpm run test:meilisearch:e2e:debug     # Debug mode
pnpm run test:meilisearch:e2e:ui        # Playwright UI mode

# With additional options:
./scripts/run-meilisearch-e2e.sh headless --verbose --force
```

#### Smart Script Features

The `run-meilisearch-e2e.sh` script provides:

- ✅ **Auto-dependency checking** - Verifies all required tools
- ✅ **Auto-service startup** - Starts Meilisearch and MCP Inspector automatically  
- ✅ **Latest MCP Inspector** - Uses `npx @modelcontextprotocol/inspector` for latest version
- ✅ **Environment setup** - Configures all required environment variables
- ✅ **Token extraction** - Automatically extracts session token from MCP Inspector
- ✅ **Connection validation** - Verifies MCP server connectivity
- ✅ **Intelligent error handling** - Graceful error recovery and reporting
- ✅ **Auto-cleanup** - Stops services after testing
- ✅ **Flexible options** - Force restart, verbose output, skip build, etc.

#### Smart Script Options

```bash
# Show help
./scripts/run-meilisearch-e2e.sh --help

# Verbose output
./scripts/run-meilisearch-e2e.sh --verbose

# Force restart services
./scripts/run-meilisearch-e2e.sh --force

# Skip build step
./scripts/run-meilisearch-e2e.sh --no-build

# Don't cleanup services after testing
./scripts/run-meilisearch-e2e.sh --no-cleanup
```

### What E2E Tests Cover

The automated E2E testing covers:

✅ **Recommendation Functionality**
- Natural language MCP server discovery
- Query processing and result ranking
- Multiple search provider coordination

✅ **Installation Guide Generation**
- Automated installation instruction generation
- Multiple MCP client support (Claude Desktop, Cursor, etc.)
- Configuration validation

✅ **Error Handling**
- Graceful error responses
- Fallback mechanism validation
- Network failure recovery

✅ **Performance Testing**
- Response time validation (< 15 seconds)
- Local vs cloud performance comparison
- Concurrent request handling

✅ **Meilisearch Integration**
- Local instance connectivity
- Failover to cloud instances
- Data consistency validation
- Environment variable configuration

### E2E Test Environment

E2E tests require:

1. **MCP Inspector**: Automatically started by the test script
2. **Authentication Token**: Set via `MCP_AUTH_TOKEN` environment variable
3. **Meilisearch Instance**: Local instance for integration testing
4. **Network Access**: For external provider testing

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('MCP server recommendation workflow', async ({ page }) => {
  // Navigate to MCP Inspector
  await page.goto('http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=token');
  
  // Connect to MCP server
  await page.getByRole('button', { name: 'Connect' }).click();
  await page.waitForTimeout(2000);
  
  // List available tools
  await page.getByRole('button', { name: 'List Tools' }).click();
  
  // Use recommendation tool
  await page.getByRole('tabpanel', { name: 'Tools' })
    .getByText('此工具用于寻找合适且专业MCP').first().click();
  
  // Fill search query
  await page.getByRole('textbox', { name: 'taskDescription' })
    .fill('natural language processing tools');
  
  // Execute search
  await page.getByRole('button', { name: 'Run Tool' }).click();
  await page.waitForTimeout(8000);
  
  // Verify results
  const pageContent = await page.content();
  expect(pageContent).toContain('Title:');
  
  // Take screenshot for documentation
  await page.screenshot({ 
    path: 'test-results/recommendation-workflow.png',
    fullPage: true 
  });
});
```

## Manual Testing

For interactive testing and development, use MCP Inspector directly.

### Starting MCP Inspector

```bash
# Start with file logging enabled
ENABLE_FILE_LOGGING=true npx @modelcontextprotocol/inspector node build/index.js
```

### Manual Testing Workflow

1. **Build the project**:
   ```bash
   pnpm run build
   ```

2. **Start MCP Inspector** (opens browser automatically)

3. **Connect to MCPAdvisor server**

4. **Test functionality**:
   - List available tools
   - Test recommendation queries
   - Test installation guide generation
   - Verify error handling

### Interactive Testing Script

For automated manual testing setup:

```bash
# Interactive testing script with browser
node scripts/test-mcp-inspector.js [INSPECTOR_URL] [AUTH_TOKEN]
```

## Test Configuration

### Environment Variables

Key environment variables for testing:

```bash
# E2E Testing
MCP_AUTH_TOKEN=your-auth-token-here
MCP_INSPECTOR_URL=http://localhost:6274

# Meilisearch Testing
TEST_MEILISEARCH_HOST=http://localhost:7700
TEST_MEILISEARCH_KEY=developmentKey123
MEILISEARCH_INSTANCE=local

# General Testing
NODE_ENV=test
ENABLE_FILE_LOGGING=true
```

### Test Data

Test data is organized in:

```
tests/
├── fixtures/          # Test data files
├── mocks/             # Mock implementations
└── __mocks__/         # Module mocks
```

### Playwright Configuration

E2E tests use Playwright with configuration in `playwright.config.ts`:

- **Browser**: Chromium (default)
- **Timeout**: 30 seconds per test
- **Retries**: 1 retry on failure
- **Screenshots**: On failure
- **Videos**: On failure
- **Trace**: On failure

## Best Practices

### Unit Testing

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Use mocks for external services
3. **Clear Test Names**: Describe what the test validates
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Edge Cases**: Test boundary conditions and error scenarios

### Integration Testing

1. **Real Dependencies**: Use actual services when possible
2. **Environment Setup**: Ensure test environment is consistent
3. **Cleanup**: Clean up resources after tests
4. **Network Resilience**: Test network failure scenarios
5. **Data Consistency**: Verify data integrity across services

### E2E Testing

1. **User Workflows**: Test complete user journeys
2. **Browser Compatibility**: Test on target browsers
3. **Responsive Design**: Test different screen sizes
4. **Network Conditions**: Test slow/fast network scenarios
5. **Error Recovery**: Test error handling and recovery

### Test Data Management

1. **Predictable Data**: Use consistent test data
2. **Isolation**: Don't share data between tests
3. **Cleanup**: Remove test data after tests
4. **Realistic Data**: Use data similar to production
5. **Privacy**: Never use real user data in tests

## Debugging Tests

### Unit Test Debugging

```bash
# Run specific test file
pnpm run test src/tests/unit/services/searchService.test.ts

# Run with debug output
DEBUG=* pnpm run test

# Run single test
pnpm run test -t "should return search results"
```

### E2E Test Debugging

```bash
# Run with browser visible
pnpm run test:e2e:headed

# Run in debug mode (pauses on failure)
pnpm run test:e2e:debug

# Run with Playwright UI
pnpm run test:e2e:ui

# Run specific test file
pnpm run test:e2e tests/e2e/mcp-inspector.spec.ts
```

### Common Debugging Techniques

1. **Screenshots**: Automatic screenshots on test failure
2. **Browser DevTools**: Use developer tools for E2E debugging
3. **Logging**: Add console.log statements for debugging
4. **Breakpoints**: Use debugger statements or IDE breakpoints
5. **Test Reports**: Review HTML test reports for detailed information

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Push to main branch
- Release workflows

### Test Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run check
      - run: pnpm run test
      - run: pnpm run test:e2e
```

### Test Reports

- **Coverage Reports**: Automatically generated and uploaded
- **Test Results**: Available in GitHub Actions logs
- **Screenshots**: E2E test screenshots saved as artifacts
- **Videos**: Test execution videos for failed tests

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 6274 (Inspector) and 7700 (Meilisearch) are available
2. **Authentication**: Set MCP_AUTH_TOKEN environment variable
3. **Network Issues**: Check internet connectivity for external provider tests
4. **Browser Issues**: Update browser dependencies with `npx playwright install`
5. **Timing Issues**: Increase timeouts for slow systems

### Test Failures

1. **Check Logs**: Review test output and error messages
2. **Screenshots**: Examine failure screenshots in test-results/
3. **Network**: Verify external services are accessible
4. **Environment**: Ensure all required environment variables are set
5. **Dependencies**: Verify all dependencies are installed correctly

### Performance Issues

1. **Parallel Execution**: Tests run in parallel by default
2. **Resource Limits**: Ensure sufficient system resources
3. **Network Bandwidth**: Some tests require good internet connectivity
4. **Browser Resources**: Close unnecessary browser tabs/applications

## Contributing to Tests

When contributing new features:

1. **Add Unit Tests**: Cover new functions and classes
2. **Add Integration Tests**: Test new provider integrations
3. **Update E2E Tests**: Add tests for new user workflows
4. **Update Documentation**: Keep this testing guide current
5. **Test Coverage**: Maintain high test coverage (>80%)

### Test Review Checklist

- [ ] Unit tests cover new functionality
- [ ] Integration tests verify component interactions
- [ ] E2E tests validate user workflows
- [ ] Tests are deterministic and reliable
- [ ] Test names clearly describe what is being tested
- [ ] Error scenarios are tested
- [ ] Documentation is updated

For more information about development and contribution guidelines, see the [Developer Guide](DEVELOPER_GUIDE.md).