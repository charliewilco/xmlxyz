# xmlxyz

Small, dependency-light tools for parsing feeds, XML, and HTML in TypeScript.

`xmlxyz` is a workspace of focused packages that share one shape: simple ESM
imports, TypeScript types, and APIs that are easy to drop into scripts, services,
static-site tooling, and content pipelines.

## Packages

| Package               | What it does                                                                 | Start here                                               |
| --------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| `@xmlxyz/rsskit`      | Parse RSS 0.9, RSS 1.0, RSS 2.0, Atom, and podcast feeds into plain objects. | [packages/rsskit](./packages/rsskit/README.md)           |
| `@xmlxyz/html-purify` | Sanitize small HTML fragments with composable allow-list plugins.            | [packages/html-purify](./packages/html-purify/README.md) |
| `@xmlxyz/htmlkit`     | Parse HTML fragments, decode HTML entities, and escape text or attributes.   | [packages/htmlkit](./packages/htmlkit/README.md)         |
| `@xmlxyz/xmlkit`      | Parse XML into xml2js-style objects and serialize objects back to XML.       | [packages/xmlkit](./packages/xmlkit/README.md)           |

The packages are intentionally small. They are useful when you want predictable
content utilities without bringing a browser DOM, a large feed reader, or a full
XML stack into your project.

## Quick Start

```sh
npm install
```

Run the whole workspace:

```sh
npm run build
npm run test
npm run typecheck
```

Run one package while iterating:

```sh
npm run test --workspace @xmlxyz/rsskit
npm run typecheck --workspace @xmlxyz/html-purify
```

## Examples

Parse a feed:

```ts
import { RSSKit } from "@xmlxyz/rsskit";

const parser = new RSSKit();
const feed = await parser.parse(xml);

console.log(feed.title);
console.log(feed.items.map((item) => item.title));
```

Sanitize a fragment:

```ts
import { createSanitizer } from "@xmlxyz/html-purify";

const sanitizer = createSanitizer(undefined, "https://example.com/posts/");

sanitizer.cleanSync(`<a href="../about" onclick="alert(1)">About</a>`);
// <a href="https://example.com/about">About</a>
```

Parse XML:

```ts
import { XML } from "@xmlxyz/xmlkit";

const document = await XML.parse<{
	feed: {
		title: string[];
	};
}>(`<feed><title>Hello</title></feed>`);

console.log(document.feed.title[0]);
```

Decode and escape HTML:

```ts
import { decodeHTMLEntities, escapeHTMLAttribute } from "@xmlxyz/htmlkit";

decodeHTMLEntities("Tom &amp; Jerry");
// Tom & Jerry

escapeHTMLAttribute(`Tom & "Jerry"`);
// Tom &amp; &quot;Jerry&quot;
```

## Workspace Commands

| Command                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Run package watch builds across the workspace.                      |
| `npm run build`        | Build every package with the shared `esbuild` script.               |
| `npm run test`         | Run package test suites with Node's built-in test runner and `tsx`. |
| `npm run typecheck`    | Run TypeScript checks without emitting files.                       |
| `npm run benchmark`    | Run package benchmarks where present.                               |
| `npm run format`       | Check formatting with Prettier.                                     |
| `npm run format:write` | Format the workspace with Prettier.                                 |

## Development Notes

- Source lives in `packages/*/src`.
- Tests live in `packages/*/test` and use Node's built-in `node:test` runner.
- Package builds emit dual ESM/CJS output through `scripts/build.mjs`, using
  `esbuild` for bundles and `tsc` for declarations.
- Generated files, such as `packages/htmlkit/src/generated/entities.ts`, should be
  regenerated from their source process rather than edited by hand.
- The packages are currently marked `private` while the workspace is being shaped.

## Releases

Changesets is configured for release bookkeeping:

```sh
npm exec changeset
```

Add a changeset when a package change has user-visible impact, then commit the
generated changeset and any lockfile updates.

## Requirements

- Node.js 22 or newer
- npm 11 or newer
