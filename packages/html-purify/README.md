# @xmlxyz/html-purify

HTML Purify sanitizes small HTML fragments with a plugin pipeline. It is designed
for feed content, excerpts, comments, and other snippets where you want a compact
allow-list instead of a full browser DOM sanitizer.

## Install

```sh
npm install @xmlxyz/html-purify
```

For local workspace development, install from the repository root with
`npm install`.

## Basic Usage

```ts
import { createSanitizer } from "@xmlxyz/html-purify";

const sanitizer = createSanitizer();

sanitizer.cleanSync(`<p onclick="alert(1)">Hello <strong>world</strong></p>`);
// <p>Hello <strong>world</strong></p>
```

## Resolve Relative Links

Pass a base URL as the second argument to resolve relative `href` values.

```ts
import { createSanitizer } from "@xmlxyz/html-purify";

const sanitizer = createSanitizer(undefined, "https://example.com/posts/2026/");

sanitizer.cleanSync(`<a href="../about">About</a>`);
// <a href="https://example.com/posts/about">About</a>
```

## Default Behavior

The default sanitizer:

- keeps common text tags such as `p`, `strong`, `em`, `ul`, `ol`, and `li`
- removes `script` and `style` tags
- removes unsafe event-handler attributes such as `onclick`
- escapes text and attribute values during serialization
- allows HTTP and HTTPS links
- resolves relative links when a base URL is provided
- allows image tags only when `src` is an HTTP(S) `.jpg`, `.jpeg`, `.gif`, or `.png`
  URL
- allows `srcset` only when every candidate is an HTTP(S) `.jpg`, `.jpeg`, `.gif`,
  or `.png` URL
- allows YouTube embed iframes from `https://www.youtube.com/embed/`

## Custom Plugins

Plugins declare the tags and attributes they participate in, then optionally
rewrite or reject tags, attributes, and text.

```ts
import { createSanitizer, type SanitizerPlugin } from "@xmlxyz/html-purify";

const mentionPlugin: SanitizerPlugin = {
	allowedTags: new Set(["span"]),
	allowedAttributes: new Set(["data-user-id"]),
	onTag(tag, attrs) {
		return attrs["data-user-id"] ? tag : "";
	},
	onAttribute(attr, value) {
		return attr === "data-user-id" ? value.trim() : value;
	},
};

const sanitizer = createSanitizer([mentionPlugin]);

sanitizer.cleanSync(`<span data-user-id=" 42 ">Charlie</span>`);
// <span data-user-id="42">Charlie</span>
```

Returning an empty string from `onTag` or `onText` removes that node. Returning a
tag name from `onTag` keeps or rewrites the tag. Returning a string from
`onAttribute` replaces the attribute value. Plugins should not return serialized
HTML from `onTag`; serialization is owned by the sanitizer.

Passing a custom plugin array replaces the defaults. To extend the default
sanitizer, include `DEFAULT_PLUGINS`:

```ts
import { createSanitizer, DEFAULT_PLUGINS } from "@xmlxyz/html-purify";

const sanitizer = createSanitizer([...DEFAULT_PLUGINS, mentionPlugin]);
```

## API

```ts
createSanitizer(plugins?, baseURI?): HTMLSanitizer
```

| Parameter | Purpose                                                  |
| --------- | -------------------------------------------------------- |
| `plugins` | Sanitizer plugins to run. Defaults to `DEFAULT_PLUGINS`. |
| `baseURI` | Base URL used by the built-in relative-link plugin.      |

```ts
class HTMLSanitizer {
	cleanSync(html: string): string;
}
```

## Security Notes

This package is intentionally small and should be treated as an allow-list
sanitizer for trusted application pipelines, not as a replacement for mature,
browser-grade sanitizers in high-risk user-generated-content surfaces.

For auth, billing, messaging, public profile HTML, or any surface where hostile
input is expected, use a battle-tested sanitizer and add defense-in-depth checks
at the rendering boundary.
