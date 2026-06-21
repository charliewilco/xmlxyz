import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { RSSKit } from "../src";

const parser = new RSSKit();

describe("JSON feeds", () => {
	test("returns parsed JSON feeds directly", async () => {
		const output = await parser.parse(`{"title":"JSON Feed","items":[]}`);

		assert.deepEqual(output, { title: "JSON Feed", items: [] });
	});
});

describe("Legacy RSS feeds", () => {
	test("parses RSS 0.9 feeds", async () => {
		const output = await new RSSKit({ defaultRSS: 0.9 }).parse(`
<rss>
	<channel>
		<title>Legacy</title>
		<link>https://example.com/</link>
		<item><title>One</title><link>https://example.com/one</link></item>
	</channel>
</rss>`);

		assert.equal(output.title, "Legacy");
		assert.equal(output.items[0].title, "One");
	});

	test("parses RSS 1.0 feeds", async () => {
		const output = await parser.parse(`
<rdf:RDF>
	<channel><title>RDF</title><link>https://example.com/</link></channel>
	<item><title>One</title><link>https://example.com/one</link></item>
</rdf:RDF>`);

		assert.equal(output.title, "RDF");
		assert.equal(output.items[0].link, "https://example.com/one");
	});
});

describe("Default RSS feeds", () => {
	test("parses RSS 2 feeds with optional channel and item fields", async () => {
		const output = await new RSSKit({ defaultRSS: 2 }).parse(`
<rss>
	<channel>
		<atom:link href="https://example.com/feed.xml" rel="self"/>
		<atom:link href="https://example.com/page/2" rel="next"/>
		<image>
			<link>https://example.com/</link>
			<url>https://example.com/image.png</url>
			<title>Example Image</title>
			<width>144</width>
			<height>144</height>
		</image>
		<title>Default RSS 2</title>
		<link>https://example.com/</link>
		<item>
			<title>One</title>
			<guid isPermaLink="false">guid-one</guid>
			<category>News</category>
			<category>Tech</category>
			<enclosure url="https://example.com/audio.mp3" type="audio/mpeg" length="123"/>
			<pubDate>not a real date</pubDate>
		</item>
	</channel>
</rss>`);

		assert.equal(output.feedUrl, "https://example.com/feed.xml");
		assert.deepEqual(output.paginationLinks, {
			self: "https://example.com/feed.xml",
			next: "https://example.com/page/2",
		});
		assert.deepEqual(output.image, {
			link: "https://example.com/",
			url: "https://example.com/image.png",
			title: "Example Image",
			width: "144",
			height: "144",
		});
		assert.deepEqual(output.items[0].categories, ["News", "Tech"]);
		assert.equal(output.items[0].guid, "guid-one");
		assert.deepEqual(output.items[0].enclosure, {
			url: "https://example.com/audio.mp3",
			type: "audio/mpeg",
			length: "123",
		});
		assert.equal(output.items[0].isoDate, undefined);
	});
});

describe("Feed recognition errors", () => {
	test("rejects unrecognized feeds and invalid default RSS versions", async () => {
		await assert.rejects(parser.parse(`<not-feed/>`), /Feed not recognized/);
		await assert.rejects(
			new RSSKit({ defaultRSS: 3 }).parse(`<rss><channel><title>Bad</title></channel></rss>`),
			/default RSS version not recognized/,
		);
	});
});
