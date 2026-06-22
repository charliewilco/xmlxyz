import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Parser } from "../src";

describe("XML parser document shapes", () => {
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

	test("skips comments and processing instructions around elements", async () => {
		const parser = new Parser();
		const document = await parser.parseStringPromise<{
			root: {
				item: string[];
			};
		}>(`<?xml version="1.0"?><root><!--ignore--><?meta value?><item>kept</item></root>`);

		assert.deepEqual(document.root.item, ["kept"]);
	});

	test("parses self-closing elements with decoded attributes", async () => {
		const parser = new Parser();
		const document = await parser.parseStringPromise<{
			root: {
				link: Array<{ $: Record<string, string> }>;
			};
		}>(`<root><link href="https://example.com/?a=1&amp;b=2"/></root>`);

		assert.deepEqual(document.root.link[0], {
			$: {
				href: "https://example.com/?a=1&b=2",
			},
		});
	});
});

describe("XML parser text options", () => {
	test("normalizes and trims parsed text when configured", async () => {
		const parser = new Parser({ normalize: true, trim: true });
		const document = await parser.parseStringPromise<{ root: string }>(
			`<root>  hello
			world  </root>`,
		);

		assert.equal(document.root, "hello world");
	});
});

describe("XML parser failures", () => {
	test("rejects mismatched closing tags", async () => {
		const parser = new Parser();

		await assert.rejects(
			parser.parseStringPromise(`<root><item></root>`),
			/Expected closing tag <\/item> but found <\/root>/,
		);
	});

	test("includes line, column, and index in parser errors", async () => {
		const parser = new Parser();

		await assert.rejects(
			parser.parseStringPromise(`<root>\n\t<item></root>`),
			/line 2, column \d+ \(index \d+\)/,
		);
	});

	test("rejects input that exceeds configured parser limits", async () => {
		await assert.rejects(
			new Parser({ maxDepth: 2 }).parseStringPromise(`<root><item><nested/></item></root>`),
			/XML depth exceeds maxDepth of 2/,
		);

		await assert.rejects(
			new Parser({ maxInputLength: 10 }).parseStringPromise(`<root>too long</root>`),
			/Input exceeds maxInputLength of 10/,
		);
	});

	test("surfaces parser failures through callbacks and promises", async () => {
		const parser = new Parser();

		await assert.rejects(
			parser.parseStringPromise(`<root><item></root>`),
			/Expected closing tag/,
		);

		await new Promise<void>((resolve) => {
			parser.parseString(`<root><item></root>`, (error) => {
				assert.match(error?.message ?? "", /Expected closing tag/);
				resolve();
			});
		});
	});

	test("rejects malformed XML", async () => {
		const parser = new Parser();

		await assert.rejects(
			parser.parseStringPromise(`<root></root><extra/>`),
			/Unexpected content/,
		);
		await assert.rejects(parser.parseStringPromise(`</root>`), /Unexpected token/);
		await assert.rejects(parser.parseStringPromise(`<root attr=value/>`), /Expected quoted/);
		await assert.rejects(
			parser.parseStringPromise(`<root attr="value/>`),
			/Unterminated attribute/,
		);
		await assert.rejects(
			parser.parseStringPromise(`<root><![CDATA[value</root>`),
			/Unterminated CDATA/,
		);
		await assert.rejects(
			parser.parseStringPromise(`<root><!-- comment</root>`),
			/Unterminated XML comment/,
		);
		await assert.rejects(
			parser.parseStringPromise(`<root><?meta value</root>`),
			/Unterminated XML processing instruction/,
		);
		await assert.rejects(
			parser.parseStringPromise(`<!DOCTYPE root [ <!ENTITY x "y"> <root/>`),
			/Unterminated DOCTYPE/,
		);
	});
});
