import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseHTML } from "../src";

describe("HTML parser elements", () => {
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

	test("parses raw text, void elements, and attribute forms", () => {
		assert.deepEqual(
			parseHTML(`<script>if (1 &lt; 2) alert("ok")</script><input disabled value=test>`),
			[
				{
					type: "tag",
					name: "script",
					attribs: {},
					children: [{ type: "text", data: `if (1 < 2) alert("ok")` }],
				},
				{
					type: "tag",
					name: "input",
					attribs: { disabled: "", value: "test" },
					children: [],
				},
			],
		);
	});

	test("normalizes tag and attribute names while preserving decoded values", () => {
		assert.deepEqual(
			parseHTML(`<DIV DATA-ID='Tom &amp; Jerry'><BR><IMG SRC=test.png></DIV>`),
			[
				{
					type: "tag",
					name: "div",
					attribs: { "data-id": "Tom & Jerry" },
					children: [
						{ type: "tag", name: "br", attribs: {}, children: [] },
						{ type: "tag", name: "img", attribs: { src: "test.png" }, children: [] },
					],
				},
			],
		);
	});
});

describe("HTML parser non-content tokens", () => {
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

describe("HTML parser recovery", () => {
	test("treats malformed markup as text", () => {
		assert.deepEqual(parseHTML(`<3 <p title="unterminated`), [
			{ type: "text", data: `<3 <p title="unterminated` },
		]);
	});

	test("recovers from nested malformed markup without dropping later siblings", () => {
		assert.deepEqual(parseHTML(`<section><p>one<strong>two</p><em>three</em></section>`), [
			{
				type: "tag",
				name: "section",
				attribs: {},
				children: [
					{
						type: "tag",
						name: "p",
						attribs: {},
						children: [
							{ type: "text", data: "one" },
							{
								type: "tag",
								name: "strong",
								attribs: {},
								children: [{ type: "text", data: "two" }],
							},
						],
					},
					{
						type: "tag",
						name: "em",
						attribs: {},
						children: [{ type: "text", data: "three" }],
					},
				],
			},
		]);
	});

	test("handles unmatched and empty closing tags", () => {
		assert.deepEqual(parseHTML(`<p>hello</span></><em>there</em>`), [
			{
				type: "tag",
				name: "p",
				attribs: {},
				children: [
					{ type: "text", data: "hello" },
					{
						type: "tag",
						name: "em",
						attribs: {},
						children: [{ type: "text", data: "there" }],
					},
				],
			},
		]);
	});
});
