import { createSanitizer, DEFAULT_PLUGINS } from "../src";

const sanitizer = createSanitizer(DEFAULT_PLUGINS, 'https://test/workbench/');

describe("HTML", () => {
	test("handles normally", () => {
		const html = "<p>hello world</p>";
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual("<p>hello world</p>");
	});
	
	test("can parse a string", () => {
		const html = "<p>hello world</p>";
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual("<p>hello world</p>");
	});
	
	test("removes script tags", () => {
		const html = `<script></script><p>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual("<p>hello world</p>");
	});
	
	test("removes script tags with attributes", () => {
		const html = `<script defer type="text/javascript">alert('hello!');</script><p>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual("<p>hello world</p>");
	});
	
	test("removes script tags with attributes and content", () => {
		const html = `<script defer type="text/javascript">alert('hello!');</script><script defer type="text/javascript">let x = 5;</script><p>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual("<p>hello world</p>");
	});
	
	test("removes style tags", () => {
		const html = `<style>html { height: 100%; }</style><p>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual("<p>hello world</p>");
	});
	
	test("removes unsafe attributes", () => {
		const html = `<p onclick>hello world</p>`;
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual("<p>hello world</p>");
	});
	
	test("removes unsafe attributes with values", () => {
		const html = `<p onclick="alert('hello');">hello world</p>`;
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual("<p>hello world</p>");
	});
	
	test("resolves relative URLs on image tags and media tags", () => {
		const html = `<a href="about">About</a><a href="../home">Home</a>`;
		const result = sanitizer.cleanSync(html);
		expect(result).toEqual(`<a href="https://test/workbench/about">About</a><a href="https://test/home">Home</a>`);
	});
});
