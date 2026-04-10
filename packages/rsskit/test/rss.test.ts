import { describe, expect, test } from "bun:test";
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

		expect(output.title).toBe("The Guardian");
		expect(output.items.length).toEqual(90);
	});

	test("can parse a podcast RSS feed", async () => {
		const feed = await getFixtureAsString("serial.rss");
		const output = await parser.parse(feed);
		expect(output.title).toBe("Serial");
		expect(output.items.length).toEqual(46);
		expect(output.feedUrl).toBe("https://feeds.simplecast.com/xl36XBC2");
		expect(output.itunes?.image).toContain("serial-itunes-logo.png");
		expect(output.itunes?.owner).toEqual({
			name: "Serial Productions & The New York Times",
			email: "rich@thislife.org",
		});
		expect(output.itunes?.categories).toEqual(["News", "True Crime"]);
		expect(output.items[0].itunes?.duration).toBe("00:48:50");
		expect(output.items[0].contentSnippet).toContain("The Improvement Association PAC");
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

		expect(output.title).toBe("Example Feed");
		expect(output.link).toBe("https://example.com/");
		expect(output.feedUrl).toBe("https://example.com/feed.xml");
		expect(output.items[0]).toMatchObject({
			link: "https://example.com/posts/1",
			author: "Example Author",
			id: "tag:example.com,2026:1",
			summary: "Short summary",
		});
		expect(output.items[0].content).toContain("<p>Hi <b>there</b></p>");
		expect(output.items[0].contentSnippet).toBe("Hi there");
	});
});
