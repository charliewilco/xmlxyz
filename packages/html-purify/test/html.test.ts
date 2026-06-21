import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createSanitizer, DEFAULT_PLUGINS } from "../src";

const sanitizer = createSanitizer(DEFAULT_PLUGINS, "https://test/workbench/");

describe("HTML", () => {
	test("handles normally", () => {
		const html = "<p>hello world</p>";
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello world</p>");
	});

	test("can parse a string", () => {
		const html = "<p>hello world</p>";
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello world</p>");
	});

	test("removes script tags", () => {
		const html = `<script></script><p>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello world</p>");
	});

	test("removes script tags with attributes", () => {
		const html = `<script defer type="text/javascript">alert('hello!');</script><p>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello world</p>");
	});

	test("removes script tags with attributes and content", () => {
		const html = `<script defer type="text/javascript">alert('hello!');</script><script defer type="text/javascript">let x = 5;</script><p>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello world</p>");
	});

	test("removes style tags", () => {
		const html = `<style>html { height: 100%; }</style><p>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello world</p>");
	});

	test("removes unsafe attributes", () => {
		const html = `<p onclick>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello world</p>");
	});

	test("removes unsafe attributes with values", () => {
		const html = `<p onclick="alert('hello');">hello world</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello world</p>");
	});

	test("preserves nested allowed markup", () => {
		const html = `<p>Hello <strong>careful</strong> world</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>Hello <strong>careful</strong> world</p>");
	});

	test("escapes decoded text and attribute values when serializing", () => {
		const html = `<p title="Tom &amp; Jerry">1 &lt; 2 &amp; 3</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, `<p title="Tom &amp; Jerry">1 &lt; 2 &amp; 3</p>`);
	});

	test("ignores comments and directives", () => {
		const html = `<!doctype html><!-- remove me --><p>hello</p>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(result, "<p>hello</p>");
	});

	test("resolves relative URLs on image tags and media tags", () => {
		const html = `<a href="about">About</a><a href="../home">Home</a>`;
		const result = sanitizer.cleanSync(html);
		assert.equal(
			result,
			`<a href="https://test/workbench/about">About</a><a href="https://test/home">Home</a>`,
		);
	});
});
