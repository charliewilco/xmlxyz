import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Builder, Parser } from "../src";

describe("xmlkit", () => {
	test("parses the XML shapes RSSKit depends on", async () => {
		const parser = new Parser();
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE feed>
<feed xmlns:atom="https://www.w3.org/2005/Atom">
	<title type="text">Hello &amp; Goodbye</title>
	<summary><![CDATA[<p>Hi there</p>]]></summary>
	<atom:link href="https://example.com/feed.xml" rel="self"/>
</feed>`;

		const document = await parser.parseStringPromise<{
			feed: {
				$: Record<string, string>;
				title: Array<{ $: Record<string, string>; _: string }>;
				summary: string[];
				"atom:link": Array<{ $: Record<string, string> }>;
			};
		}>(xml);

		assert.equal(document.feed.$["xmlns:atom"], "https://www.w3.org/2005/Atom");
		assert.deepEqual(document.feed.title[0], {
			$: { type: "text" },
			_: "Hello & Goodbye",
		});
		assert.equal(document.feed.summary[0], "<p>Hi there</p>");
		assert.deepEqual(document.feed["atom:link"][0], {
			$: {
				href: "https://example.com/feed.xml",
				rel: "self",
			},
		});
	});

	test("serializes xml2js-style objects for Atom content", () => {
		const builder = new Builder({
			headless: true,
			rootName: "div",
			renderOpts: { pretty: false },
		});

		assert.equal(
			builder.buildObject({
				$: { type: "xhtml" },
				p: [
					{
						_: "Hi ",
						b: ["there"],
					},
				],
			}),
			'<div type="xhtml"><p>Hi <b>there</b></p></div>',
		);
	});
});
