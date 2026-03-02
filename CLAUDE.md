# Claude Code Instructions

## Project Overview

React 19 SPA with TanStack Router, TanStack Query, Firebase, and Tailwind CSS v4. Built with Vite (rolldown-vite) and TypeScript strict mode.

## Common Commands

```bash
npm run dev           # Start dev server
npm run build         # Generate routes + type-check + lint + test + build
npm run test          # Run tests once (vitest run)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run type-check    # tsr generate + tsc --noEmit
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier write
npm run check         # audit + type-check + lint + test (CI)
npm run generate:routes # Regenerate route tree manually
```

## Activating Agent Mode

The chat uses **fake mode** (local keyword-based draft) by default. To switch to **agent mode** (LLM via `generateDraft` Cloud Function):

1. **API key**: Add `ANTHROPIC_API_KEY` to Firebase Functions
   - Local emulator: `functions/.env`
   - Production: Firebase Console → Project → Functions → Environment variables
2. **Toggle**: Add `VITE_USE_LLM_DRAFT=true` to project root `.env`
3. **Deploy**: `firebase deploy --only functions` then `npm run build` and `firebase deploy --only hosting`

The toggle lives in `src/lib/chatConfig.ts` (`USE_AGENT_MODE`). Change that constant or the env var to switch modes.

## Project Structure

```
src/
  components/   # Shared UI components
    ui/         # Shadcn/Radix UI primitives
  hooks/        # TanStack Query hooks
  lib/          # API client, utilities
  pages/        # Page components (imported by route files)
  routes/       # TanStack Router file-based routes
    __root.tsx  # Root layout
  routeTree.gen.ts  # GENERATED — never edit manually
  test/         # Shared test helpers and setup
  types/        # Shared TypeScript types
```

## TypeScript

- Strict mode; avoid `any`
- Prefer `const` arrow functions with explicit types over `function` declarations
- Use `@/*` path aliases for all imports

## Code Style

- Early returns for readability
- Descriptive variable and function names
- No TODO comments, placeholders, or incomplete implementations
- Do not guess when uncertain — ask or state limitations

## React Components (`src/**/*.tsx`)

- Named exports only (no default exports)
- Event handlers prefixed with `handle` (e.g., `handleClick`, `handleSubmit`)
- Props interfaces named `ComponentNameProps`
- Styling: use `cn()` from `@/lib/utils` for conditional Tailwind classes; no inline styles
- Accessibility: ARIA labels, keyboard handlers, semantic HTML; prefer `button`/`a` over clickable `div`

## TanStack Router (`src/routes/**/*.tsx`)

- Route files export `Route` via `createFileRoute()`; page components live in `src/pages/`
- Root layout: `src/routes/__root.tsx`
- `routeTree.gen.ts` is generated — never edit manually
- Use typed `Link` from `@tanstack/react-router`; no raw `<a>` for internal nav
- Validate route params with Zod; use `useParams()` and `useSearch()` hooks
- Regenerate routes with `tsr generate`; generation is wired to `prepare` script (not `postinstall`)

## TanStack Query (`src/hooks/**/*.ts`)

- Query key factories co-located with hooks: `postKeys.list()`, `postKeys.detail(id)`
- Hook naming: `use[Entity]Query` / `use[Action][Entity]Mutation`
- Mutations: include optimistic updates, `onError` rollback, `onSettled` invalidation
- Conditional fetching: use `enabled` option

## API Client (`src/lib/api.ts`)

- All HTTP calls through shared `fetchApi` wrapper
- Validate external payloads with Zod before returning typed data
- Single error class `ApiException` with codes: `HTTP_ERROR`, `NETWORK_ERROR`, `TIMEOUT_ERROR`, `ABORT_ERROR`, `PARSE_ERROR`, `VALIDATION_ERROR`
- Support request timeouts with `AbortController`; respect caller-provided abort signals
- `204`/`205` responses treated as `undefined` payloads
- Parse JSON only when `content-type` indicates JSON
- Group resource operations behind domain clients (e.g., `postsApi`)

## UI Components (`src/components/ui/**/*.tsx`)

- Check Shadcn before building custom components: `npx shadcn@latest add <component>`
- Migrate Radix imports: `npx shadcn@latest migrate radix`
- Primary primitive: `radix-ui` (unified imports); secondary: `@base-ui/react` only if Shadcn generates it
- Follow Shadcn structure: `cva` for variants, `React.ComponentProps` for extension, `React.forwardRef`
- Icons: `lucide-react` — `import { IconName } from "lucide-react"`

## Testing (`**/*.test.ts`, `**/*.test.tsx`)

- Co-locate unit tests with source (e.g., `utils.test.ts` next to `utils.ts`)
- Cross-cutting integration tests go in `src/test/`
- Shared helpers: `src/test/utils.tsx`; setup: `src/test/setup.ts`
- Import from `vitest` directly
- Use `describe` blocks; test names: `it("should [verb] when [condition]")`
