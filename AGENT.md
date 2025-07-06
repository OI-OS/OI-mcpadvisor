# AGENT.md - MCP Advisor Development Guide

## Build & Test Commands
- **Build**: `pnpm run build` (compiles TypeScript to build/)
- **Test**: `pnpm test` (runs vitest), `pnpm run test:watch` (watch mode)
- **Single test**: `pnpm test -- filename.test.ts` or `pnpm test -- --grep "test name"`
- **Lint**: `pnpm run lint` (ESLint), `pnpm run lint:fix` (auto-fix)
- **Format**: `pnpm run format` (Prettier), `pnpm run format:check` (check only)
- **Type check**: `tsc --noEmit` or `pnpm run check` (lint + format check)

## Architecture
- **Main**: ESM TypeScript project with Node.js MCP server
- **Core**: Search service with multiple providers (Meilisearch, GetMCP, Compass, Nacos, Offline)
- **Vector Search**: Hybrid search combining text matching + semantic vectors
- **Transport**: Stdio (CLI), SSE (web), REST API support
- **Database**: MySQL2, Meilisearch for vector search, Nacos service discovery
- **Key Directories**: `src/services/` (core logic), `src/types/` (TypeScript types), `src/utils/` (utilities)

## Code Style & Conventions
- **Import style**: Use .js extensions for TypeScript imports, ES modules only
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Types**: Use explicit TypeScript types, interfaces over types for objects
- **Async**: Prefer async/await over Promises, handle errors with try/catch
- **Testing**: Vitest framework, descriptive test names in Chinese, use vi.mock() for mocking
- **Formatting**: Prettier (single quotes, 2 spaces, trailing commas, 80 char width)
- **Logging**: Use winston logger from `utils/logger.js`, structured logging

## Security Best Practices
- **No hardcoded secrets**: Never commit API keys, passwords, or tokens to code
- **Environment variables**: Use `.env` files for local development, GitHub Secrets for CI/CD
- **Default security**: Avoid weak default passwords/keys, force users to set secure values
- **Error handling**: Scripts must return proper exit codes (0 for success, 1+ for failure)
- **Secrets management**: Use `process.env.VARIABLE_NAME` with required validation

## Testing Best Practices  
- **Environment isolation**: Save/restore environment variables in beforeEach/afterEach
- **Smart waiting**: Use `page.waitForFunction()` instead of fixed `page.waitForTimeout()`
- **Content validation**: Verify result content relevance, not just quantity
- **Cross-platform**: Use relative paths `$(pwd)` instead of hardcoded absolute paths
- **Timeout configuration**: Set appropriate timeouts (CI: 180s, local: 60s)

## Common Issues & Solutions
- **Interface naming**: Use `IClassName` for interfaces to avoid class/interface conflicts
- **Path portability**: Replace `/Users/username/...` with `$(pwd)/...` in scripts
- **CI timeouts**: GitHub Actions needs longer timeouts for container health checks
- **Test pollution**: Always clean up environment variables modified during tests
- **Health checks**: Ensure scripts return correct exit codes for monitoring
