import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { RSSKit } from "../src";
import { getFixtureAsString } from "./helpers";

const parser = new RSSKit();

describe("RSS feed fixtures", () => {
	test("parses a Guardian RSS feed", async () => {
		const feed = await getFixtureAsString("guardian.rss");
		const output = await parser.parse(feed);

		assert.equal(output.title, "The Guardian");
		assert.equal(output.items.length, 90);
	});

	test("parses a podcast RSS feed", async () => {
		const feed = await getFixtureAsString("serial.rss");
		const output = await parser.parse(feed);

		assert.equal(output.title, "Serial");
		assert.equal(output.items.length, 46);
		assert.equal(output.feedUrl, "https://feeds.simplecast.com/xl36XBC2");
		assert.ok(output.itunes?.image?.includes("serial-itunes-logo.png"));
		assert.deepEqual(output.itunes?.owner, {
			name: "Serial Productions & The New York Times",
			email: "rich@thislife.org",
		});
		assert.deepEqual(output.itunes?.categories, ["News", "True Crime"]);
		assert.equal(output.items[0].itunes?.duration, "00:48:50");
		assert.ok(output.items[0].contentSnippet?.includes("The Improvement Association PAC"));
	});
});

describe("RSS content extraction", () => {
	test("decodes HTML entities in content snippets", async () => {
		const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>Entity Feed</title>
		<link>https://example.com/</link>
		<description>Example</description>
		<item>
			<title>Entity Item</title>
			<link>https://example.com/item</link>
			<description>Tom &amp;amp; Jerry &amp;mdash; &#169;</description>
		</item>
	</channel>
</rss>`;
		const output = await parser.parse(feed);

		assert.equal(output.items[0].contentSnippet, "Tom & Jerry \u2014 \u00A9");
	});
});
