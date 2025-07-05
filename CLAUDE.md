# Claude Instructions for MCPAdvisor

## Project Overview
MCPAdvisor is a TypeScript-based CLI tool for discovering and recommending MCP (Model Context Protocol) servers. It helps users find the right MCP server for their needs and provides installation guidance.

## Development Commands

### Build & Test
- `pnpm run build` - Compile TypeScript and make executable
- `pnpm run test` - Run tests with Vitest
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:coverage` - Run tests with coverage report
- `pnpm run test:jest` - Run Jest tests (alternative test runner)

### Code Quality
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Run ESLint with auto-fix
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting
- `pnpm run check` - Run both lint and format check

### Dependencies
- `pnpm run deps:update` - Update all dependencies to latest
- `pnpm run deps:check` - Check for outdated dependencies
- `pnpm run deps:clean` - Clean and reinstall dependencies

## Architecture

### Core Services
- **Search Service** (`src/services/searchService.ts`) - Main search orchestration
- **Vector Engines** (`src/services/database/`) - Vector database implementations
  - Memory-based vector engine
  - Meilisearch integration
  - OceanBase integration
  - Nacos integration
- **Installation Service** (`src/services/installation/`) - Installation guide generation
- **Server Service** (`src/services/server/`) - MCP server management

### Search Providers
- **Offline Search** - Memory-based search with local data
- **Meilisearch** - Full-text search with vector capabilities
- **Nacos** - Service discovery integration
- **Compass Search** - External search provider

### Key Directories
- `src/services/` - Core business logic
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `src/tests/` - Test files (Vitest and Jest)
- `docs/` - Documentation files
- `config/` - Configuration files

## Code Style & Best Practices

### Naming Conventions
- **Classes**: PascalCase (e.g., `OfflineDataLoader`)
- **Functions/Methods**: camelCase (e.g., `loadFallbackData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_FALLBACK_DATA_PATH`)
- **Variables**: camelCase (e.g., `serverResponses`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IVectorSearchEngine`)
- **Files**: kebab-case (e.g., `offline-data-loader.ts`)

### Code Formatting
- Use 2 spaces for indentation
- Keep lines under 80 characters when possible
- Use template strings `` `${variable}` `` instead of concatenation
- Use single quotes `'` for strings, double quotes `"` in JSX
- Always use semicolons

### TypeScript Best Practices
- Always define types for function parameters and return values
- Avoid `any` type; use `unknown` or specific types
- Prefer interfaces over type aliases for objects
- Use union types `string | null` instead of optional `string?`
- Use enums for finite value sets
- Use type guards for type narrowing
- Use named exports instead of default exports

```typescript
// Good practice
export interface SearchOptions {
  minSimilarity?: number;
  limit: number;
}

export function search<T>(query: string, options: SearchOptions): Promise<T[]> {
  // implementation
}

// Avoid
export default function search(query: any, options?: any): any {
  // implementation
}
```

### Functional Programming Principles
- Write pure functions without side effects
- Avoid mutating parameters; return new objects
- Use function composition for complex functionality
- Follow single responsibility principle
- Use higher-order functions (`map`, `filter`, `reduce`)
- Avoid deep nesting; use function composition or Promise chains

```typescript
// Good practice
function normalizeVector(vector: number[]): number[] {
  const magnitude = calculateMagnitude(vector);
  return vector.map(value => value / magnitude);
}

// Avoid
function processVector(vector: number[]): number[] {
  // doing multiple things: calculate, normalize, filter, etc.
}
```

### Path Handling
- Use `pathUtils.ts` for all path-related operations
- Ensure compatibility across development, test, and production environments
- Handle `import.meta.url` compatibility properly
- Avoid hardcoded absolute paths; use relative paths
- Use `path.join()` and `path.resolve()` for path separators
- Provide fallback path mechanisms

```typescript
// Good practice
import { getMcpServerListPath } from '../utils/pathUtils.js';
const dataPath = getMcpServerListPath(import.meta.url);

// Avoid
const dataPath = path.resolve(__dirname, '../../../../data/file.json');
```

### Error Handling
- Use specific error types instead of generic `Error`
- Provide useful error messages with context
- Properly propagate errors; don't swallow them
- Use `try/catch` or Promise `.catch()` for async errors
- Log error details for debugging
- Provide graceful fallbacks when possible

```typescript
// Good practice
async function loadData(): Promise<Data[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpError(`Request failed: ${response.status}`, response.status);
    }
    return await response.json();
  } catch (error) {
    logger.error('Failed to load data', { error, url });
    return []; // Graceful fallback
  }
}
```

## Testing Guidelines

### Core Testing Principles
- **Predictability**: Test results should be completely predictable
- **Isolation**: Each test should run independently
- **Maintainability**: Test code should be as clean as production code
- **Clarity**: Test names and assertions should clearly express intent

### Test Structure
- Use `describe` to organize related tests, `test`/`it` for specific cases
- Follow Given-When-Then pattern
- Use `beforeEach`/`afterEach` for setup and cleanup
- Use assertions instead of `console.log` for verification

### Test Design
- **Single responsibility**: Each test should verify one functionality
- **Edge cases**: Test boundary values, null values, invalid inputs
- **Error handling**: Explicitly test error conditions and exception handling
- **Performance**: Tests should execute quickly

### Mocking & Stubs
- Use `vi.fn()` to create mock functions
- Mock external dependencies (API calls, file system operations)
- Keep mocks simple; only mock necessary parts
- Verify mock call counts and parameters

### Async Testing
- Always use `async/await` for async operations
- Avoid `setTimeout` for waiting; use framework tools
- Test both Promise resolution and rejection

```typescript
// Example: Good test structure
describe('UserService', () => {
  let service: UserService;
  let mockRepository: MockRepository;

  beforeEach(() => {
    mockRepository = {
      findUser: vi.fn(),
      saveUser: vi.fn().mockResolvedValue({ id: '1', name: 'Test' })
    };
    service = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('should successfully create user and return user data', async () => {
      // Given
      const userData = { name: 'Test', email: 'test@example.com' };
      
      // When
      const result = await service.createUser(userData);
      
      // Then
      expect(result).toHaveProperty('id');
      expect(mockRepository.saveUser).toHaveBeenCalledWith(expect.objectContaining(userData));
    });

    it('should throw error when name is empty', async () => {
      await expect(service.createUser({ name: '', email: 'test@example.com' }))
        .rejects
        .toThrow('Username cannot be empty');
    });
  });
});
```

### Test Frameworks
- Use Vitest for new tests (primary test runner)
- Jest is available for legacy tests
- Test files should be in `src/tests/` directory
- Use `__mocks__/` for mocking external dependencies
- Use `fixtures/` for test data

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `build`: Build system or dependency changes
- `ci`: CI configuration changes
- `chore`: Other changes that don't modify src or test files

### Example
```
fix(data): ensure mcp_server_list.json is included in npm package

Add data directory to package.json files field and improve path
resolution logic to support proper data file loading in packaged
environments.

Fixes #123
```

## Important Technical Notes
- This is a TypeScript project using ES modules (`"type": "module"`)
- Uses pnpm as package manager
- Main entry point is `src/index.ts`
- Built files go to `build/` directory
- Husky is configured for git hooks

## When Working on This Project
1. Always run `pnpm run check` before committing
2. Use `pnpm run test` to ensure tests pass
3. Follow the existing code patterns and architecture
4. Add tests for new functionality
5. Update documentation when adding new features
6. Use `pathUtils.ts` for all path operations
7. Write pure functions when possible
8. Provide proper error handling with context
9. Follow the naming conventions consistently
10. Write meaningful commit messages following Conventional Commits