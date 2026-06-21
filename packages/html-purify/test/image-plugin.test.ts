import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ImageSanitizerPlugin } from "../src/plugins/images";

describe("ImageSanitizerPlugin", () => {
	test("allows image tags with remote sources", () => {
		const plugin = new ImageSanitizerPlugin();

		assert.equal(plugin.onTag("img", { src: "https://example.com/image.png" }), "img");
	});

	test("rejects data URLs and missing sources", () => {
		const plugin = new ImageSanitizerPlugin();

		assert.equal(plugin.onTag("img", { src: "data:image/png;base64,abc" }), "");
		assert.equal(plugin.onTag("img", {}), "");
	});
});
