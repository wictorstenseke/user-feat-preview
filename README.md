# Customer Feedback Previewer 🚀

A public, GitHub-connected feedback portal where users can submit feature and bug reports, see their status, and try live previews of in-progress changes.

## What this app does

- **Collects feedback** through an AI-style composer that helps users write structured feature/bug reports.
- **Uses an LLM** to generate a draft ticket (title + summary, and bug details) plus at most one clarifying question.
- **Detects duplicates** and lets users upvote existing items instead of creating new ones.
- **Shows a feedback list** with cards for each item, including type, status, votes, comments, and preview button.
- **Stores votes and comments in Firestore**, with GitHub Issues and labels as the source of truth for status.
- **Integrates with GitHub PR previews** so users can click through to a deployed PR build for a given item.

For the full product description, see `backlog/mvp-desc.md`.  
For implementation-level stories, see the individual files in `backlog/` (for example `US-01-feedback-list.md`, `FEAT-01-github-integration.md`).

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS v4
- shadcn/ui (Radix-based UI components)
- TanStack Router
- TanStack Query
- Firebase (Firestore + Cloud Functions)
- GitHub Issues, Actions, and Pages
- Vitest, ESLint, Prettier

## Project structure (high level)

```text
src/
  components/
    layout/AppShell.tsx
    ui/...
  lib/
    api.ts
    queryClient.ts
    utils.ts
  pages/
    Landing.tsx
  routes/
    __root.tsx
    index.tsx
  types/
    api.ts
  main.tsx
  router.tsx
  index.css

backlog/
  mvp-desc.md
  US-01-feedback-list.md
  US-02-feedback-composer.md
  US-03-llm-draft-generation.md
  US-04-duplicate-detection.md
  US-05-item-detail.md
  US-06-voting.md
  US-07-comments.md
  US-08-spam-protection.md
  FEAT-01-github-integration.md
  FEAT-02-pr-preview-flow.md

docs/
  setup.md
  implementation-summary.md
  testing.md
  testing-guide.md
  testing-strategy-findings.md
  PERFORMANCE_IMPROVEMENTS.md
  deployment-github-pages.md
```

## Getting started

For first-time setup (Firebase, GitHub, environment variables), see [docs/setup.md](docs/setup.md).

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

The app will start on the Vite dev server (check the terminal output for the exact URL).

### Build for production

```bash
npm run build
```

### Run tests and quality checks

```bash
npm run test         # Unit tests
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run check        # CI-style combined checks
```

For more detailed testing guidance, see `docs/testing.md`, `docs/testing-guide.md`, and `docs/testing-strategy-findings.md`.

## Deployment

This project is designed to deploy static builds (including PR previews) via GitHub Pages, driven by GitHub Actions.  
See `docs/deployment-github-pages.md` for the current deployment workflow and configuration.

## Performance and implementation notes

- Performance considerations and optimizations are tracked in `docs/PERFORMANCE_IMPROVEMENTS.md`.
- The backlog in `backlog/` is the main place to understand current and planned behavior for the feedback flow and GitHub integration.

