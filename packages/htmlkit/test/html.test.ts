import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseHTML } from "../src";

describe("HTML parser", () => {
	test("parses nested tags, text, and decoded attributes", () => {
		assert.deepEqual(parseHTML(`<p title="Tom &amp; Jerry">Hi <strong>there</strong></p>`), [
			{
				type: "tag",
				name: "p",
				attribs: { title: "Tom & Jerry" },
				children: [
					{ type: "text", data: "Hi " },
					{
						type: "tag",
						name: "strong",
						attribs: {},
						children: [{ type: "text", data: "there" }],
					},
				],
			},
		]);
	});

	test("skips comments and directives", () => {
		assert.deepEqual(parseHTML(`<!doctype html><!-- comment --><p>hello</p>`), [
			{
				type: "tag",
				name: "p",
				attribs: {},
				children: [{ type: "text", data: "hello" }],
			},
		]);
	});
});
