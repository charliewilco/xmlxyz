# xmlxyz

Small TypeScript workspace for XML-adjacent utilities, now wired for Bun.

## Packages

- `@xmlxyz/rsskit`: RSS and Atom parsing helpers built on `xml2js`
- `@xmlxyz/html-purify`: plugin-based HTML sanitization utilities
- `@xmlxyz/xmlkit`: very small XML package scaffold

## Requirements

- Bun `1.3.9` or newer

## Getting Started

```sh
bun install
```

## Common Commands

```sh
bun run build
bun run test
bun run typecheck
bun run format
```

Bun fans those commands out across the workspace, and package-level scripts still work if you want to run inside an individual package.

## Testing

Jest has been removed in favor of Bun's built-in test runner. Package tests run with:

```sh
bun test
```

from the package directory, or:

```sh
bun run test
```

from the repo root.

## Releases

Changesets is still configured for release management:

```sh
bunx changeset
```

Commit the generated `bun.lock` file instead of the old Yarn lockfile.

## Automation

GitHub Actions now runs the workspace verification flow on pull requests and pushes to `main`, and Dependabot checks both Bun dependencies and GitHub Actions weekly.
