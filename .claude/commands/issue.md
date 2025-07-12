Please analyze and fix the Github issue: $ARGUMENTS.

Follow these steps for comprehensive issue resolution:

# PLAN

1. **Get issue details**:
   ```bash
   gh issue view $ISSUE_NUMBER
   ```

2. **Understand the problem** described in the issue:
   - Read the issue description carefully
   - Check any attached screenshots or logs
   - Understand the expected vs actual behavior
   - Identify the scope (bug fix vs feature implementation)

3. **Ask clarifying questions** if necessary in issue comments

4. **Research prior art and context**:
   - Search existing documentation in `docs/` for related information
   - Search PRs to see if you can find history on this issue:
     ```bash
     gh pr list --search "keyword from issue"
     ```
   - Search the codebase for relevant files using Grep/Glob tools
   - Check if similar issues have been resolved before

5. **Break down the work** using TodoWrite tool:
   - Identify all components that need changes
   - Plan implementation steps
   - Consider testing requirements
   - Plan documentation updates

6. **Create documentation plan**:
   - Determine which `docs/` files need updates
   - Plan new documentation if implementing features
   - Consider updating:
     - `docs/USER_GUIDE.md` for user-facing features
     - `docs/DEVELOPER_GUIDE.md` for development changes
     - `docs/ARCHITECTURE.md` for architectural changes
     - `docs/TECHNICAL_DETAILS.md` for technical implementations
     - Create issue-specific docs in `docs/` with appropriate categorization

# PRE-TEST VALIDATION

- **Create new branch** for the issue:
  ```bash
  git checkout -b issue-$ISSUE_NUMBER-brief-description
  ```

- **Run the full test suite** to ensure clean environment:
  ```bash
  pnpm run check          # Lint and format check
  pnpm run test           # Unit tests
  pnpm run test:coverage  # Coverage report
  pnpm run test:e2e       # End-to-end tests (if applicable)
  ```

- **Document baseline state** - if tests are failing, investigate and report
- **Ensure all tests pass** before implementing changes

# IMPLEMENTATION (TEST-DRIVEN DEVELOPMENT)

## For Bug Fixes:
1. **Write failing test** that reproduces the bug
2. **Implement minimal fix** to make test pass
3. **Refactor** if needed while keeping tests green
4. **Add edge case tests** to prevent regressions

## For Feature Implementation:
1. **Write unit tests** describing expected behavior:
   - Test happy path scenarios
   - Test error conditions and edge cases
   - Avoid unnecessary mocks - use real implementations when possible
2. **Implement feature incrementally**:
   - Start with core functionality
   - Add supporting features
   - Integrate with existing systems
3. **Add integration tests** if the feature affects multiple components
4. **Use Playwright tests** if UI changes are involved:
   ```bash
   pnpm exec playwright test
   ```

## Implementation Best Practices:
- **Follow project conventions** from `CLAUDE.md`
- **Use TodoWrite tool** to track progress through implementation steps
- **Commit frequently** after meaningful test-driven milestones:
  ```bash
  git add .
  git commit -m "feat: implement core functionality for issue #$ISSUE_NUMBER

  - Add basic feature implementation
  - Include unit tests for happy path
  - Follow existing code patterns

  🤖 Generated with [Claude Code](https://claude.ai/code)

  Co-Authored-By: Claude <noreply@anthropic.com>

  Progress on #$ISSUE_NUMBER"
  ```

# DOCUMENTATION UPDATES

**CRITICAL**: Update relevant documentation in `docs/` directory:

## Required Documentation:
- **Bug fixes**: Update `docs/TROUBLESHOOTING.md` if applicable
- **New features**: Update `docs/USER_GUIDE.md` with usage examples
- **API changes**: Update `docs/TECHNICAL_DETAILS.md`
- **Architecture changes**: Update `docs/ARCHITECTURE.md`
- **Developer workflow changes**: Update `docs/DEVELOPER_GUIDE.md`

## Create Issue-Specific Documentation:
Based on issue type, create detailed documentation:

### For Features:
- Create `docs/prd/feature-[name].md` with product requirements
- Add implementation details to `docs/tech/[YYYYMM]/[feature-name].md`
- Update `docs/ROADMAP.md` if this affects future plans

### For Bug Fixes:
- Document fix in `docs/bugfix/[issue-description].md`
- Include root cause analysis and solution approach

### For Integrations:
- Create guide in `docs/guides/[integration-name].md`
- Update `docs/SEARCH_PROVIDERS.md` for search-related integrations

## Documentation Template:
```markdown
# Issue #$ISSUE_NUMBER: [Issue Title]

## Problem Description
[Describe the issue or feature request]

## Solution Approach
[Explain the implementation approach]

## Implementation Details
[Technical details of the solution]

## Testing Strategy
[How the solution was tested]

## Impact Assessment
[What this changes and potential side effects]

## Related Files
[List of files modified]

## Future Considerations
[Any follow-up work or considerations]
```

# POST-IMPLEMENTATION TESTING

- **Run comprehensive test suite**:
  ```bash
  pnpm run check          # Code quality
  pnpm run test           # Unit tests
  pnpm run test:coverage  # Ensure coverage maintained/improved
  pnpm run test:e2e       # End-to-end tests
  ```

- **Test the specific issue scenario** manually if applicable
- **Verify documentation** is accurate and helpful
- **Check for regressions** in related functionality
- **Performance testing** if the change affects performance

# SUBMIT

1. **Final commit** with documentation:
   ```bash
   git add docs/
   git commit -m "docs: add documentation for issue #$ISSUE_NUMBER

   - Update relevant user guides and technical docs
   - Add issue-specific documentation
   - Include implementation details and testing notes

   🤖 Generated with [Claude Code](https://claude.ai/code)

   Co-Authored-By: Claude <noreply@anthropic.com>

   Completes #$ISSUE_NUMBER"
   ```

2. **Push branch**:
   ```bash
   git push origin issue-$ISSUE_NUMBER-brief-description
   ```

3. **Create PR** with comprehensive description:
   ```bash
   gh pr create --title "Fix/Feature: [Issue Title] #$ISSUE_NUMBER" --body "$(cat <<'EOF'
   ## Summary
   [Brief description of changes]

   ## Changes Made
   - [List key changes]
   - [Include test additions]
   - [Note documentation updates]

   ## Testing
   - [Describe testing performed]
   - [Include any manual testing steps]

   ## Documentation
   - [List documentation files added/updated]
   - [Reference specific sections changed]

   ## Related Issue
   Fixes #$ISSUE_NUMBER

   🤖 Generated with [Claude Code](https://claude.ai/code)
   EOF
   )"
   ```

4. **Link PR to issue** and request review

# QUALITY CHECKLIST

Before considering the issue complete:

- [ ] Issue requirements fully understood and addressed
- [ ] All tests pass (unit, integration, e2e)
- [ ] Code follows project conventions and patterns
- [ ] **Documentation updated in appropriate `docs/` files**
- [ ] **Issue-specific documentation created**
- [ ] Edge cases considered and tested
- [ ] Performance impact assessed
- [ ] Security implications reviewed
- [ ] Backward compatibility maintained
- [ ] PR description clearly explains changes
- [ ] Issue is properly referenced and linked

Remember to use the GitHub CLI ('gh') for all GitHub-related tasks and maintain clear documentation throughout the implementation process.