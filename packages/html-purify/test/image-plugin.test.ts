import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ImageSanitizerPlugin } from "../src/plugins/images";

describe("ImageSanitizerPlugin", () => {
	test("allows image tags with remote sources", () => {
		const plugin = new ImageSanitizerPlugin();

		assert.equal(plugin.onTag("img", { src: "https://example.com/image.png" }), "img");
	});

	test("allows srcset when all candidates are remote images", () => {
		const plugin = new ImageSanitizerPlugin();

		assert.equal(
			plugin.onTag("img", {
				src: "https://example.com/image.png",
				srcset: "https://example.com/image.png 1x, https://example.com/image@2x.png 2x",
			}),
			"img",
		);
	});

	test("rejects data URLs, non-image sources, missing sources, and unsafe srcsets", () => {
		const plugin = new ImageSanitizerPlugin();

		assert.equal(plugin.onTag("img", { src: "data:image/png;base64,abc" }), "");
		assert.equal(plugin.onTag("img", { src: "https://example.com/image.svg" }), "");
		assert.equal(plugin.onTag("img", {}), "");
		assert.equal(
			plugin.onTag("img", {
				src: "https://example.com/image.png",
				srcset: "https://example.com/image.png 1x, javascript:alert(1) 2x",
			}),
			"",
		);
	});
});
