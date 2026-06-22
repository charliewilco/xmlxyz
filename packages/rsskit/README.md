# @xmlxyz/rsskit

RSSKit parses common feed formats into a predictable TypeScript object. It handles
RSS 0.9, RSS 1.0, RSS 2.0, Atom, and iTunes podcast metadata, using
`@xmlxyz/xmlkit` for XML parsing and `@xmlxyz/htmlkit` for content snippets.

## Install

```sh
npm install @xmlxyz/rsskit
```

For local workspace development, install from the repository root with
`npm install`.

## Basic Usage

```ts
import { RSSKit } from "@xmlxyz/rsskit";

const parser = new RSSKit();
const feed = await parser.parse(xml);

console.log(feed.title);

for (const item of feed.items) {
	console.log(item.title, item.link, item.isoDate);
}
```

`parse` accepts a feed XML string and returns a promise. If the string is already
JSON, RSSKit returns the parsed JSON object.

## Fetch And Parse

```ts
import { DEFAULT_HEADERS, RSSKit } from "@xmlxyz/rsskit";

const response = await fetch("https://example.com/feed.xml", {
	headers: DEFAULT_HEADERS,
});

if (!response.ok) {
	throw new Error(`Feed request failed: ${response.status}`);
}

const parser = new RSSKit();
const feed = await parser.parse(await response.text());
```

## Podcast Metadata

RSSKit reads iTunes podcast fields from RSS 2.0 feeds that declare the iTunes
namespace.

```ts
import { RSSKit } from "@xmlxyz/rsskit";

const feed = await new RSSKit().parse(xml);

console.log(feed.itunes?.author);
console.log(feed.itunes?.owner?.email);
console.log(feed.itunes?.categories);
console.log(feed.items[0]?.itunes?.duration);
```

## Media RSS

RSSKit extracts common item-level Media RSS fields when present.

```ts
const feed = await new RSSKit().parse(xml);
const media = feed.items[0]?.media;

console.log(media?.thumbnails?.[0]?.url);
console.log(media?.content?.[0]?.type);
console.log(media?.credit);
```

## Atom Content

Atom entries with XHTML content are serialized back into HTML strings and also get
a text snippet.

```ts
const feed = await new RSSKit().parse(atomXml);
const item = feed.items[0];

console.log(item.content);
// <div xmlns="http://www.w3.org/1999/xhtml"><p>Hi <b>there</b></p></div>

console.log(item.contentSnippet);
// Hi there
```

## Types

```ts
import { RSSKit, type RSSOutput } from "@xmlxyz/rsskit";

interface FeedExtras {
	language?: string;
}

interface ItemExtras {
	author?: string;
	id?: string;
}

const parser = new RSSKit<FeedExtras, ItemExtras>();
const feed: FeedExtras & RSSOutput<ItemExtras> = await parser.parse(xml);
```

The generic parameters let you model fields that your application expects in
addition to the built-in RSS fields.

## Custom Fields

Use `customFields` when your feeds carry namespaced or application-specific
fields. The shape matches the familiar `rss-parser` style.

```ts
import { RSSKit } from "@xmlxyz/rsskit";

const parser = new RSSKit({
	customFields: {
		feed: [["custom:owner", "owner"]],
		item: [
			["custom:score", "score"],
			["custom:tag", "customTags", { keepArray: true }],
			["custom:html", "customHtml", { includeSnippet: true }],
		],
	},
});
```

## Output Shape

Feed-level fields include:

- `title`
- `link`
- `feedUrl`
- `description`
- `image`
- `paginationLinks`
- `itunes`
- `items`

Item-level fields include:

- `title`
- `link`
- `guid`
- `pubDate`
- `isoDate`
- `creator`
- `summary`
- `content`
- `contentSnippet`
- `categories`
- `enclosure`
- `media`

## Parser Options

```ts
import { RSSKit } from "@xmlxyz/rsskit";

const parser = new RSSKit({
	defaultRSS: 2,
	xml2js: {
		trim: true,
		normalize: true,
	},
});
```

| Option             | Purpose                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `defaultRSS`       | Version to assume when a feed has an RSS root but no recognized version. Supports `0.9`, `1`, and `2`. |
| `xml2js.trim`      | Trim text nodes while XML is parsed.                                                                   |
| `xml2js.normalize` | Collapse runs of whitespace in text nodes.                                                             |
| `customFields`     | Extra feed and item fields to copy into the output.                                                    |

## Errors

RSSKit rejects the parse promise when the XML is malformed or the feed type is not
recognized.

```ts
try {
	await new RSSKit().parse(xml);
} catch (error) {
	console.error(error);
}
```
