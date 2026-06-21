# xmlxyz

Small TypeScript workspace for XML-adjacent utilities, now wired for npm.

## Packages

- `@xmlxyz/rsskit`: RSS and Atom parsing helpers built on the in-repo `xmlkit` parser
- `@xmlxyz/html-purify`: plugin-based HTML sanitization utilities
- `@xmlxyz/xmlkit`: a small zero-dependency XML parser/builder for the workspace

## Requirements

- Node.js 22 or newer
- npm 11 or newer

## Getting Started

```sh
npm install
```

## Common Commands

```sh
npm run build
npm run test
npm run typecheck
npm run format
```

npm fans those commands out across the workspace, and package-level scripts still work if you want to run inside an individual package.

## Testing

Package tests run with Node's built-in test runner:

```sh
npm test
```

from the package directory, or:

```sh
npm run test
```

from the repo root.

## Releases

Changesets is still configured for release management:

```sh
npm exec changeset
```

Commit the generated `package-lock.json` file.

## Automation

GitHub Actions now runs the workspace verification flow on pull requests and pushes to `main`, and Dependabot checks both npm dependencies and GitHub Actions weekly.
