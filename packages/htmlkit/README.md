# @xmlxyz/htmlkit

HTMLKit provides small HTML primitives for the rest of the workspace: fragment
parsing, HTML entity decoding, and text or attribute escaping.

## Install

```sh
npm install @xmlxyz/htmlkit
```

For local workspace development, install from the repository root with
`npm install`.

## Parse HTML Fragments

```ts
import { parseHTML } from "@xmlxyz/htmlkit";

const nodes = parseHTML(`<p title="Tom &amp; Jerry">Hi <strong>there</strong></p>`);

console.log(nodes);
```

Output:

```ts
[
	{
		type: "tag",
		name: "p",
		attribs: { title: "Tom & Jerry" },
		children: [
			{ type: "text", data: "Hi " },
			{
				type: "tag",
				name: "strong",
				attribs: {},
				children: [{ type: "text", data: "there" }],
			},
		],
	},
];
```

The parser is intentionally fragment-oriented. It skips comments and directives,
normalizes tag and attribute names to lowercase, and decodes entities in text and
attribute values.

## Decode HTML Entities

```ts
import { decodeHTMLEntities } from "@xmlxyz/htmlkit";

decodeHTMLEntities("Tom &amp; Jerry &mdash; &#169;");
// "Tom & Jerry \u2014 \u00A9"
```

`decodeHTMLEntities` supports named references, decimal numeric references, hex
numeric references, and the browser-compatible Windows-1252 mappings for numeric
control references.

## Escape Output

Use the escaping helpers when serializing text back into HTML.

```ts
import { escapeHTMLAttribute, escapeHTMLText } from "@xmlxyz/htmlkit";

escapeHTMLText("<p>&</p>");
// &lt;p&gt;&amp;&lt;/p&gt;

escapeHTMLAttribute(`Tom & "Jerry"`);
// Tom &amp; &quot;Jerry&quot;
```

## Types

```ts
import type { HTMLElementNode, HTMLNode, HTMLTextNode } from "@xmlxyz/htmlkit";

const visit = (node: HTMLNode) => {
	if (node.type === "text") {
		const text: HTMLTextNode = node;
		return text.data;
	}

	const element: HTMLElementNode = node;
	return element.children.map(visit).join("");
};
```

`HTMLNode` is a discriminated union. In TypeScript terms, checking
`node.type === "text"` narrows the object to `HTMLTextNode`; otherwise it narrows
to `HTMLElementNode`.

## API

```ts
parseHTML(html: string): HTMLNode[]
decodeHTMLEntities(value: string): string
escapeHTMLText(value: string): string
escapeHTMLAttribute(value: string): string
```

## Scope

HTMLKit is a fragment parser and entity helper for content tooling. It is not a
browser DOM, does not implement full HTML tree-construction behavior, and should
not be used as a security boundary by itself.
