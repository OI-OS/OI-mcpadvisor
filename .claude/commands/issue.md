Please analyze and fix the Github issue: $ARGUMENTS.

Follow these steps:

# PLAN

1. Use 'gh issue view' to get the issue details
2. Understand the problem described in the issue
3. Ask clarifying questions if necessary
4. Understand the prior art for this issue
    - Search the scratchpads for previous thoughts related to the issue
    - Search PRs to see if you can find history on this issue
    - Search the codebase for relevant files
5. Think harder about how to break the issue down into a series of small, manageable tasks.
6. Document your plan in a new scratchpad
    - include the issue name in the filename
    - include a link to the issue in the scratchpad.

# PRE-TEST
- Run the full test suite to ensure we have a clean environment
- If the tests are failing, stop and report them
- Ensure that all tests are passing before moving on to the next step

# TEST-DRIVEN-DEVELOPMENT
- Create a new branch for the issue
- Write unit tests to describe the expected behavior of your code. Avoid the uneccessary mocks.
- Use `pnpm exec playwright test` to test the changes if you have made changes to the UI
- Solve the issue in small, manageable steps, according to your plan and unit tests.
- Commit your changes after every meaningfule unit tests being passed.

# TEST
- Run the full test suite to ensure you haven't broken anything
- If the tests are failing, stop and report them
- Ensure that all tests are passing before moving on to the next step

# SUBMIT
- Push and open a PR on Github.

Remember to use the GitHub CLI ('gh') for all Github-related tasks.