# Repository Guidelines

## Project Structure & Module Organization

This pnpm monorepo provides a framework-agnostic accessibility toolbar.

- `packages/`: core runtime, shared utilities, types, and the `a11y-now` aggregate package.
- `packages-plugins/`, `packages-themes/`, `packages-frameworks/`: plugins, theme data, and framework adapters. Each package keeps implementation in `src/` and tests in `tests/`.
- `tests/`: integration tests; `tests/browser/`: browser interactions and accessibility audits.
- `docs/`: Chinese VitePress documentation; `docs/en/`: English counterparts.
- `playground/`: vanilla, Vue, and React demos; `scripts/`: workspace and publishing utilities.

## Build, Test, and Development Commands

Run from the repository root using the pnpm version pinned in `package.json`. Apply the agent command wrapper below when applicable.

- `pnpm install`: install workspace dependencies.
- `pnpm build`: build publishable packages with tsdown.
- `pnpm dev`: watch and rebuild core.
- `pnpm docs:dev`: serve documentation locally.
- `pnpm --filter playground-vanilla dev`: run the vanilla demo after building packages.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`: check formatting, lint rules, and TypeScript.
- `pnpm publint`, `pnpm attw`: validate built package exports and type resolution.

## Coding Style & Naming Conventions

Use TypeScript and ESM. Follow `.editorconfig` and Oxfmt: two-space indentation, LF endings, single quotes, no semicolons, trailing commas, and an 80-column target. Run `pnpm format` to format; Oxlint handles linting. Use camelCase functions/variables, PascalCase types, and kebab-case package directories such as `reading-mask`. Keep plugin cleanup complete: remove injected DOM, styles, listeners, and subscriptions on disposal.

## Testing Guidelines

Use Vitest with Node or happy-dom environments; name tests `tests/**/*.test.ts`. Run `pnpm test` for unit/integration tests and `pnpm test:coverage` for V8 coverage. Core and each plugin require at least 90% line coverage. Cover behavior, keyboard interaction, persistence, and clean unmounting where relevant. Run `pnpm test:browser` for Playwright Chromium and axe-core audits; install Chromium first with `pnpm exec playwright install chromium`.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style: `feat(core): ...`, `fix(plugin-help): ...`, `test: ...`, or `docs: ...`. Keep changes focused. Describe behavior changes, link relevant issues, report validation, and include screenshots for visual changes. Update both documentation languages when changing public behavior. Ensure relevant CI checks pass.

## Agent-Specific Instructions

Read and follow `/Users/ntnyq/.codex/RTK.md`. Prefix shell commands with `rtk`. For pnpm, use `rtk proxy env PATH="/Users/ntnyq/Library/pnpm/bin:$PATH" pnpm <command>`. The exception is `PATH="/Users/ntnyq/Library/pnpm/bin:$PATH" pnpm typecheck`. Preserve the active Node.js version; never modify Codex's bundled pnpm or runtime cache.
