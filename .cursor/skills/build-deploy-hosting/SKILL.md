---
name: build-deploy-hosting
description: Build the app and deploy only Firebase hosting. Use when the user wants to ship frontend changes to hosting without touching functions or Firestore.
---

# Build and Deploy Hosting Only

## When to Use

Apply this skill when the user asks to:
- Build and deploy hosting
- Deploy hosting only
- Ship frontend to Firebase hosting
- Deploy the site

## Workflow

Execute these steps in order:

### 1. Build the app

Hosting deploys from the `dist` folder. Build before deploying:

```bash
npm run build
```

If the build fails, fix the errors (lint, type, or test failures as reported), then run `npm run build` again. Repeat until the build succeeds before proceeding.

### 2. Deploy hosting only

```bash
firebase deploy --only hosting
```

This deploys only the hosting target; functions and Firestore are not touched.

## Project context

- Hosting public dir: `dist` (from `firebase.json`)
- Build output: `dist/` (gitignored; built locally before deploy)

## Notes

- This skill does not commit or push; use `commit-push-github` to sync changes to GitHub first.
- For the full workflow (commit → push → build → deploy), run both skills in sequence.
