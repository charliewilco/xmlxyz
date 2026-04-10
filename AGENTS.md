# Repository Guidelines

## Project Structure & Module Organization

This repository is a small Yarn workspace monorepo. The root contains shared tooling in `package.json`, task orchestration in `turbo.json`, and release metadata in `.changeset/`. Library code lives under `packages/`:

- `packages/html-purify/src` with tests in `packages/html-purify/test`
- `packages/rsskit/src` with fixtures and tests in `packages/rsskit/test`
- `packages/xmlkit/src` for XML utilities

Keep source files in `src/`, test files in `test/`, and package-specific build config beside each package (`tsconfig.json`, `tsup.config.ts`, `jest.config.cjs`).

## Build, Test, and Development Commands

- `yarn dev`: runs all package `dev` tasks through Turbo for local iteration.
- `yarn build`: runs package builds with dependency ordering.
- `yarn test`: runs package test suites through Turbo.
- `yarn workspace @xmlxyz/html-purify test`: run one package’s Jest suite directly.
- `yarn workspace @xmlxyz/rsskit types`: run TypeScript type-checking for a single package.

Use workspace-scoped commands when changing one package; use root commands before opening a PR that affects multiple packages.

## Coding Style & Naming Conventions

TypeScript uses ESM modules and Prettier at the repo root. Follow the existing formatter settings: tabs for indentation, 95-character print width, and standard Prettier spacing. Prefer descriptive file names in kebab-case such as `parse-srcset.ts`, and export public APIs from package entrypoints like `src/index.ts`. Keep helpers and parser internals package-local unless they are part of the public surface.

## Testing Guidelines

Jest with `ts-jest` is the active test stack. Add tests under each package’s `test/` directory using the `*.test.ts` pattern. Keep fixture-driven parser tests close to the package, for example `packages/rsskit/test/fixtures/*.rss`. When behavior changes, add or update focused coverage before merging.

## Commit & Pull Request Guidelines

History is minimal, but the existing style favors short, lowercase, imperative summaries. Prefer messages like `add rss fixtures` or `tighten html sanitizer rules`. PRs should state which package(s) changed, describe behavior changes, include the commands you ran (`yarn test`, targeted workspace checks, etc.), and call out fixture or output changes when parsing behavior shifts.

## Release Notes

Use `.changeset/` when a package change should be captured for release bookkeeping. Keep the note scoped to the affected package and user-visible impact.
