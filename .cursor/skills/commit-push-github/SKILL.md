---
name: commit-push-github
description: Commit all changes and push to the remote GitHub repository. Use when the user wants to save and sync changes to GitHub.
---

# Commit and Push to GitHub

## When to Use

Apply this skill when the user asks to:
- Commit and push
- Push to GitHub
- Save changes to the remote
- Sync to GitHub

## Workflow

Execute these steps in order:

### 1. Stage all changes

```bash
git add -A
git status
```

### 2. Commit with a descriptive message

```bash
git commit -m "<descriptive message>"
```

Generate a descriptive commit message from the staged changes. Use conventional format: `feat:`, `fix:`, `chore:`, etc. Do not ask the user unless they explicitly want to provide a message.

### 3. Push to remote

```bash
git push
```

## Notes

- If there are no changes to commit, report that and skip the commit step.
- If the push fails (e.g., due to diverged history), handle the situation or inform the user.
- This skill does not build or deploy; use `build-deploy-hosting` for Firebase hosting deployment.
