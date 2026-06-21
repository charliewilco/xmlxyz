import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { RSSKit } from "../src";

import { readFile } from "node:fs/promises";

export const getFixtureAsString = async (filePath: string) => {
	const buffer = await readFile(new URL(`./fixtures/${filePath}`, import.meta.url), {
		encoding: "utf-8",
	});

	return buffer.toString();
};

const parser = new RSSKit();

describe("RSS", () => {
	test("can parse a string", async () => {
		const feed = await getFixtureAsString("guardian.rss");
		const output = await parser.parse(feed);

		assert.equal(output.title, "The Guardian");
		assert.equal(output.items.length, 90);
	});

	test("can parse a podcast RSS feed", async () => {
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

	test("can parse Atom feeds with rich HTML content", async () => {
		const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>Example Feed</title>
	<link href="https://example.com/"/>
	<link href="https://example.com/feed.xml" rel="self"/>
	<updated>2026-04-10T00:00:00Z</updated>
	<entry>
		<title type="html">Post <em>One</em></title>
		<link href="https://example.com/posts/1" rel="alternate"/>
		<id>tag:example.com,2026:1</id>
		<updated>2026-04-10T00:00:00Z</updated>
		<author>
			<name>Example Author</name>
		</author>
		<content type="xhtml">
			<div xmlns="http://www.w3.org/1999/xhtml">
				<p>Hi <b>there</b></p>
			</div>
		</content>
		<summary type="html">Short summary</summary>
	</entry>
</feed>`;
		const output = await parser.parse(feed);

		assert.equal(output.title, "Example Feed");
		assert.equal(output.link, "https://example.com/");
		assert.equal(output.feedUrl, "https://example.com/feed.xml");
		assert.deepEqual(
			{
				link: output.items[0].link,
				author: output.items[0].author,
				id: output.items[0].id,
				summary: output.items[0].summary,
			},
			{
				link: "https://example.com/posts/1",
				author: "Example Author",
				id: "tag:example.com,2026:1",
				summary: "Short summary",
			},
		);
		assert.ok(output.items[0].content?.includes("<p>Hi <b>there</b></p>"));
		assert.equal(output.items[0].contentSnippet, "Hi there");
	});
});
