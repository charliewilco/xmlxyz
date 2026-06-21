import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { HrefSanitizerPlugin } from "../src/plugins/naughty-href";
import { RelativeHrefSanitizerPlugin } from "../src/plugins/relative-href";

describe("HrefSanitizerPlugin", () => {
	test("rejects missing and JavaScript hrefs", () => {
		const plugin = new HrefSanitizerPlugin();

		assert.equal(plugin.onTag("a", {}), "");
		assert.equal(plugin.onTag("a", { href: "javascript:alert(1)" }), "");
	});

	test("allows relative-looking hrefs and strips remote hosts", () => {
		const plugin = new HrefSanitizerPlugin();
		const attrs = { href: "https://evil.com/path" };

		assert.equal(plugin.onTag("a", { href: "notaurl" }), "a");
		assert.equal(plugin.onTag("a", attrs), "a");
		assert.deepEqual(attrs, {});
	});
});

describe("RelativeHrefSanitizerPlugin", () => {
	test("leaves non-href attributes alone", () => {
		const plugin = new RelativeHrefSanitizerPlugin("https://example.com/docs/");

		assert.equal(plugin.onAttribute("title", "About"), "About");
	});

	test("resolves relative href attributes", () => {
		const plugin = new RelativeHrefSanitizerPlugin("https://example.com/docs/");

		assert.equal(plugin.onAttribute("href", ""), "");
		assert.equal(
			plugin.onAttribute("href", "https://elsewhere.test/"),
			"https://elsewhere.test/",
		);
		assert.equal(plugin.onAttribute("href", "../about"), "https://example.com/about");
	});
});
