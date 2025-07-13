import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Reduce workers to prevent resource contention during E2E tests */
  workers: process.env.CI ? 1 : 2,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['line'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.MCP_INSPECTOR_URL || 'http://localhost:6274',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 8000,
    
    /* Global timeout for navigation */
    navigationTimeout: 20000,
    
    /* Force headless mode in CI environment */
    headless: process.env.CI ? true : undefined,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 注释掉其他浏览器以保持测试简洁和稳定
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'echo "Please ensure MCP Inspector is running on localhost:6274 before running tests"',
  //   port: 6274,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 60000,
  // },

  /* Global setup and teardown */
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  /* Output directory for test results */
  outputDir: 'test-results/',
  
  /* Test timeout - reduced for faster feedback */
  timeout: 45000,
  
  /* Expect timeout - reduced for faster failure detection */
  expect: {
    timeout: 8000,
  },
});