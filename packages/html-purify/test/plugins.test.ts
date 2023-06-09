import { HTMLSanitizer } from "../src/sanitizer";
import { ScriptAndStyleTagRemoverPlugin } from "../src/plugins/remove-js-css";
import { XSSSanitizerPlugin } from "../src/plugins/xss";

describe.skip("XSSSanitizerPlugin", () => {
	describe("onText", () => {
		test("replaces special characters with HTML entities", () => {
			const plugin = new XSSSanitizerPlugin();
			const text = '<script>alert("XSS");</script>';
			const sanitizedText = plugin.onText(text);
			expect(sanitizedText).toEqual("&lt;script&gt;alert(&quot;XSS&quot;);&lt;/script&gt;");
		});
	});
});

describe("ScriptAndStyleTagRemoverPlugin", () => {
	test("removes script tags from HTML", () => {
		const sanitizer = new HTMLSanitizer([new ScriptAndStyleTagRemoverPlugin()]);
		const inputHtml = '<script>alert("XSS!");</script>';
		const outputHtml = sanitizer.cleanSync(inputHtml);
		expect(outputHtml).toEqual("");
	});

	test("removes style tags from HTML", () => {
		const sanitizer = new HTMLSanitizer([new ScriptAndStyleTagRemoverPlugin()]);
		const inputHtml = "<style>body { font-size: 16px; }</style>";
		const outputHtml = sanitizer.cleanSync(inputHtml);
		expect(outputHtml).toEqual("");
	});

	test("allows allowed tags to pass through", () => {
		const sanitizer = new HTMLSanitizer([new ScriptAndStyleTagRemoverPlugin()]);
		const inputHtml = '<p>Hello, world!</p><a href="#">Link</a>';
		const outputHtml = sanitizer.cleanSync(inputHtml);
		expect(outputHtml).toEqual('<p>Hello, world!</p><a href="#">Link</a>');
	});

	test("removes disallowed tags from HTML", () => {
		const sanitizer = new HTMLSanitizer([new ScriptAndStyleTagRemoverPlugin()]);
		const inputHtml =
			'<img src="image.png"><div><iframe src="https://example.com"></iframe></div>';
		const outputHtml = sanitizer.cleanSync(inputHtml);
		expect(outputHtml).toEqual("");
	});
});
