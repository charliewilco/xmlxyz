import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { RSSKit } from "../src";

const parser = new RSSKit();

describe("Atom feeds", () => {
	test("parses rich HTML content", async () => {
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
