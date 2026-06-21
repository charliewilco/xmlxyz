# @xmlxyz/xmlkit

XMLKit is a small XML parser and builder with an xml2js-style object shape. It is
used by `@xmlxyz/rsskit`, but it can also stand alone for simple XML documents,
fixtures, scripts, and content tooling.

## Install

```sh
npm install @xmlxyz/xmlkit
```

The package is currently private inside the `xmlxyz` workspace. For local
development, install from the workspace root with `npm install`.

## Parse XML

```ts
import { XML } from "@xmlxyz/xmlkit";

const document = await XML.parse<{
	feed: {
		$: Record<string, string>;
		title: Array<{ $: Record<string, string>; _: string }>;
		link: Array<{ $: Record<string, string> }>;
	};
}>(`
<feed xmlns="https://www.w3.org/2005/Atom">
	<title type="text">Hello &amp; Goodbye</title>
	<link href="https://example.com/feed.xml" rel="self"/>
</feed>
`);

console.log(document.feed.$.xmlns);
console.log(document.feed.title[0]._);
console.log(document.feed.link[0].$.href);
```

Parsed XML follows these conventions:

- attributes live under `$`
- text content lives under `_` when an element also has attributes or children
- repeated child elements are arrays
- empty elements become an empty string or an object with attributes
- comments, processing instructions, and document type declarations are skipped
- entity references such as `&amp;`, `&#169;`, and `&#x1F44B;` are decoded

## Parser Class

Use `Parser` when you want to configure parsing once and reuse it.

```ts
import { Parser } from "@xmlxyz/xmlkit";

const parser = new Parser({
	trim: true,
	normalize: true,
});

const document = await parser.parseStringPromise(`<root> Hello   world </root>`);
// { root: "Hello world" }
```

Callback-style parsing is also available:

```ts
parser.parseString(`<root>ok</root>`, (error, document) => {
	if (error) {
		throw error;
	}

	console.log(document);
});
```

## Build XML

```ts
import { XML } from "@xmlxyz/xmlkit";

const xml = XML.build(
	{
		$: { type: "xhtml" },
		p: [
			{
				_: "Hi ",
				b: ["there"],
			},
		],
	},
	{
		headless: true,
		rootName: "div",
	},
);

console.log(xml);
// <div type="xhtml"><p>Hi <b>there</b></p></div>
```

## Builder Class

```ts
import { Builder } from "@xmlxyz/xmlkit";

const builder = new Builder({
	headless: false,
	rootName: "message",
});

builder.buildObject({ _: "Hello", $: { lang: "en" } });
// <?xml version="1.0" encoding="UTF-8"?><message lang="en">Hello</message>
```

## Options

Parser options:

| Option      | Purpose                                                        |
| ----------- | -------------------------------------------------------------- |
| `trim`      | Trim leading and trailing whitespace in text nodes.            |
| `normalize` | Collapse runs of whitespace in text nodes into a single space. |

Builder options:

| Option              | Purpose                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| `headless`          | Omit the XML declaration when `true`.                                      |
| `rootName`          | Root element name to use when serializing. Defaults to `root`.             |
| `renderOpts.pretty` | Accepted for xml2js compatibility. Pretty output is not currently emitted. |

## API

```ts
class Parser {
	parseString<T = XMLDocument>(
		xml: string,
		callback: (error: Error | null, result?: T) => void,
	): void;
	parseStringPromise<T = XMLDocument>(xml: string): Promise<T>;
}

class Builder {
	buildObject(value: unknown): string;
}

class XML {
	static parse<T = XMLDocument>(xml: string, options?: XMLParserOptions): Promise<T>;
	static build(value: unknown, options?: XMLBuilderOptions): string;
}
```

## Scope

XMLKit is deliberately compact. It is a good fit for feeds and controlled XML
documents, not a full validating XML processor. It does not evaluate external
entities, validate against schemas, preserve comments, or round-trip every source
formatting detail.
