import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Builder, XML } from "../src";

describe("XML builder objects", () => {
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

describe("XML builder primitives", () => {
	test("serializes primitives, empty values, arrays, and escaped attributes", () => {
		assert.equal(
			XML.build("hello", { rootName: "message" }),
			`<?xml version="1.0" encoding="UTF-8"?><message>hello</message>`,
		);
		assert.equal(
			XML.build(
				{
					$: { title: `Tom & "Jerry"` },
					item: ["one", null, undefined],
				},
				{ headless: true, rootName: "root" },
			),
			`<root title="Tom &amp; &quot;Jerry&quot;"><item>one</item><item/><item/></root>`,
		);
	});
});
