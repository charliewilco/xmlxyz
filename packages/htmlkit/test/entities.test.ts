import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { decodeHTMLEntities, escapeHTMLAttribute, escapeHTMLText } from "../src";

describe("HTML entities", () => {
	test("decodes common named character references", () => {
		assert.equal(
			decodeHTMLEntities("Tom &amp; Jerry &mdash; &ldquo;classic&rdquo; &yuml;"),
			"Tom & Jerry \u2014 \u201Cclassic\u201D \u00FF",
		);
	});

	test("decodes numeric character references", () => {
		assert.equal(decodeHTMLEntities("&#169; &#x1F44B;"), "\u00A9 \u{1F44B}");
	});

	test("decodes longest matching named references", () => {
		assert.equal(decodeHTMLEntities("&NotEqualTilde; &notin;"), "\u2242\u0338 \u2209");
	});

	test("uses HTML replacement behavior for numeric edge cases", () => {
		assert.equal(decodeHTMLEntities("&#0; &#x80; &#xD800;"), "\uFFFD \u20AC \uFFFD");
	});

	test("escapes text and attribute values", () => {
		assert.equal(escapeHTMLText("<p>&</p>"), "&lt;p&gt;&amp;&lt;/p&gt;");
		assert.equal(escapeHTMLAttribute(`Tom & "Jerry"`), "Tom &amp; &quot;Jerry&quot;");
	});
});
