import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseUrl } from "../src/parse-url";

describe("parseUrl", () => {
	test("marks relative and absolute URLs", () => {
		const absolute = parseUrl("https://example.com/a");
		const relative = parseUrl("../a");
		const urlInstance = parseUrl(new URL("relative://relative-site/a"));

		assert.equal(absolute.isRelativeUrl, false);
		assert.equal(relative.isRelativeUrl, true);
		assert.equal(urlInstance.isRelativeUrl, true);
	});

	test("rejects string input that targets the relative sentinel protocol", () => {
		assert.throws(() => parseUrl("relative://relative-site/a"), /relative: exploit attempt/);
	});
});
