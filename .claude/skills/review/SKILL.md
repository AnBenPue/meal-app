---
name: review
description: Review code changes, files, or pull requests for quality, bugs, and improvements
argument-hint: [file-path, PR number, or blank for staged changes]
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash(git *)
---

# Code Review

Perform a thorough code review of the provided target.

## Determine what to review

- If a file path is given: review that file
- If a PR number is given: review the PR diff
- If no argument: review staged/unstaged changes via `git diff`
- If `--last` is given: review the last commit via `git diff HEAD~1`

## Review checklist

### Correctness
- Logic errors, off-by-one, null/undefined access
- Async/await misuse, missing error handling
- Incorrect types or unsafe casts

### Security
- XSS, injection, or OWASP top 10 risks
- Secrets or credentials in code
- Unsafe user input handling

### Performance
- Unnecessary re-renders (React)
- N+1 queries or missing indexes (Supabase)
- Large bundle imports that could be lazy-loaded

### Style & maintainability
- Naming clarity
- Dead code or unused imports
- Overly complex logic that could be simplified
- Consistency with existing project patterns

## Output format

For each finding, provide:
1. **Severity**: critical / major / minor / suggestion
2. **Location**: file:line
3. **Issue**: what's wrong
4. **Fix**: how to fix it (with code snippet if helpful)

End with a brief **summary** and overall assessment.
