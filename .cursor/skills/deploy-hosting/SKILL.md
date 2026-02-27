---
name: deploy-hosting
description: Commit changes, push to remote, build the app, and deploy only Firebase hosting. Use when the user wants to ship frontend changes, deploy hosting only, or run the full commit-push-deploy workflow.
---

# Deploy Hosting Only

## When to Use

Apply this skill when the user asks to:
- Deploy hosting only
- Commit, push, and deploy
- Ship frontend changes to hosting

## Workflow

Execute these steps in order:

### 1. Build the app

Hosting deploys from the `dist` folder. Build before deploying:

```bash
npm run build
```

If the build fails, fix the errors (lint, type, or test failures as reported), then run `npm run build` again. Repeat until the build succeeds before proceeding.

### 2. Commit and push

```bash
git add -A
git status
git commit -m "<descriptive message>"
git push
```

Generate a descriptive commit message from the staged changes (conventional format: `feat:`, `fix:`, `chore:`, etc.). Do not ask the user unless they explicitly want to provide one.

### 3. Deploy hosting only

```bash
firebase deploy --only hosting
```

This deploys only the hosting target; functions and Firestore are not touched.

## Project context

- Hosting public dir: `dist` (from `firebase.json`)
- Build output: `dist/` (gitignored; built locally before deploy)
