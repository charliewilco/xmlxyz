import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ScriptAndStyleTagRemoverPlugin } from "../src/plugins/remove-js-css";
import { HTMLSanitizer } from "../src/sanitizer";

describe("ScriptAndStyleTagRemoverPlugin blocked tags", () => {
	test("removes script tags from HTML", () => {
		const sanitizer = new HTMLSanitizer([new ScriptAndStyleTagRemoverPlugin()]);
		const inputHtml = '<script>alert("XSS!");</script>';
		const outputHtml = sanitizer.cleanSync(inputHtml);

		assert.equal(outputHtml, "");
	});

	test("removes style tags from HTML", () => {
		const sanitizer = new HTMLSanitizer([new ScriptAndStyleTagRemoverPlugin()]);
		const inputHtml = "<style>body { font-size: 16px; }</style>";
		const outputHtml = sanitizer.cleanSync(inputHtml);

		assert.equal(outputHtml, "");
	});

	test("removes disallowed tags from HTML", () => {
		const sanitizer = new HTMLSanitizer([new ScriptAndStyleTagRemoverPlugin()]);
		const inputHtml =
			'<img src="image.png"><div><iframe src="https://example.com"></iframe></div>';
		const outputHtml = sanitizer.cleanSync(inputHtml);

		assert.equal(outputHtml, "");
	});
});

describe("ScriptAndStyleTagRemoverPlugin allowed tags", () => {
	test("allows allowed tags to pass through", () => {
		const sanitizer = new HTMLSanitizer([new ScriptAndStyleTagRemoverPlugin()]);
		const inputHtml = '<p>Hello, world!</p><a href="#">Link</a>';
		const outputHtml = sanitizer.cleanSync(inputHtml);

		assert.equal(outputHtml, '<p>Hello, world!</p><a href="#">Link</a>');
	});
});
