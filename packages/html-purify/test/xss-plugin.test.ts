import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { XSSSanitizerPlugin } from "../src/plugins/xss";

describe("XSSSanitizerPlugin text sanitization", () => {
	test("removes script markup from text", () => {
		const plugin = new XSSSanitizerPlugin();
		const text = '<script>alert("XSS");</script>';
		const sanitizedText = plugin.onText(text);

		assert.equal(sanitizedText, "");
	});
});

describe("XSSSanitizerPlugin attribute sanitization", () => {
	test("strips XSS content from tag attributes", () => {
		const plugin = new XSSSanitizerPlugin();
		const attrs = {
			href: `<script>alert("x")</script>https://example.com/?x=&onclick;`,
			title: `safe &onclick; title`,
		};

		assert.equal(plugin.onTag("a", attrs), "a");
		assert.equal(attrs.href, "https://example.com/?x=&onclick;");
		assert.equal(attrs.title, "safe &onclick; title");
	});
});
