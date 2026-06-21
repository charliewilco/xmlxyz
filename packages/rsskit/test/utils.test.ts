import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	copyFromXML,
	getEncodingFromContentType,
	getLink,
	isJSON,
	maybePromisify,
} from "../src/utils";

describe("RSS XML field copying", () => {
	test("copies XML fields with options", () => {
		const destination: Record<string, unknown> = {};

		copyFromXML(
			{
				title: [{ _: "Hello" }],
				category: ["a", "b"],
				description: ["<p>Tom &amp;amp; Jerry</p>"],
			} as any,
			destination,
			[
				"title",
				["category", "categories", { keepArray: true }],
				["description", "content", { includeSnippet: true }],
			],
		);

		assert.deepEqual(destination, {
			title: "Hello",
			categories: ["a", "b"],
			content: "<p>Tom &amp;amp; Jerry</p>",
			contentSnippet: "Tom &amp; Jerry",
		});
	});
});

describe("RSS link utilities", () => {
	test("selects matching or fallback links", () => {
		assert.equal(
			getLink(
				[{ $: { rel: "self", href: "feed.xml" } }, { $: { href: "fallback.xml" } }],
				"alternate",
				1,
			),
			"fallback.xml",
		);
		assert.equal(getLink(undefined as any, "self", 0), undefined);
	});
});

describe("RSS content-type utilities", () => {
	test("normalizes charset names", () => {
		assert.equal(getEncodingFromContentType("text/xml; charset=UTF-8"), "utf8");
		assert.equal(getEncodingFromContentType("text/xml; charset=made-up"), "utf8");
	});
});

describe("RSS JSON utilities", () => {
	test("detects JSON strings", () => {
		assert.equal(isJSON<{ ok: true }>(`{"ok":true}`), true);
		assert.equal(isJSON("not json"), false);
	});
});

describe("RSS callback utilities", () => {
	test("bridges resolved and rejected promises into callbacks", async () => {
		await new Promise<void>((resolve, reject) => {
			maybePromisify((error, value) => {
				try {
					assert.equal(error, null);
					assert.equal(value, "done");
					resolve();
				} catch (assertionError) {
					reject(assertionError);
				}
			}, Promise.resolve("done"));
		});

		await new Promise<void>((resolve, reject) => {
			maybePromisify(
				(error) => {
					try {
						assert.equal(error.message, "nope");
						resolve();
					} catch (assertionError) {
						reject(assertionError);
					}
				},
				Promise.reject(new Error("nope")),
			);
		});
	});
});
