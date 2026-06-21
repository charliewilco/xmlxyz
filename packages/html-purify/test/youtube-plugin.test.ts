import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { YoutubeIframeSanitizerPlugin } from "../src/plugins/youtube";

describe("YoutubeIframeSanitizerPlugin", () => {
	test("allows YouTube iframe embeds", () => {
		const plugin = new YoutubeIframeSanitizerPlugin();

		assert.equal(
			plugin.onTag("iframe", {
				src: "https://www.youtube.com/embed/abc",
				width: "640",
				onload: "alert(1)",
			}),
			`<iframe src="https://www.youtube.com/embed/abc" width="640">`,
		);
	});

	test("ignores non-YouTube iframes and non-iframe tags", () => {
		const plugin = new YoutubeIframeSanitizerPlugin();

		assert.equal(plugin.onTag("iframe", { src: "https://example.com/embed/abc" }), undefined);
		assert.equal(plugin.onTag("div", { src: "https://www.youtube.com/embed/abc" }), undefined);
	});
});
