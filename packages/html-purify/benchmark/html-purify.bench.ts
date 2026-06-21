import { performance } from "node:perf_hooks";
import { createSanitizer, DEFAULT_PLUGINS } from "../src";

const sanitizer = createSanitizer(DEFAULT_PLUGINS, "https://example.com/articles/");
const html = Array.from(
	{ length: 50 },
	(_, index) =>
		`<p data-index="${index}" onclick="alert(1)">Hello <strong>world</strong></p><script>alert(1)</script><a href="../post-${index}">Read</a>`,
).join("");

const iterations = 500;
const start = performance.now();

for (let index = 0; index < iterations; index += 1) {
	sanitizer.cleanSync(html);
}

const total = performance.now() - start;

console.log(
	`html-purify cleanSync: ${total.toFixed(2)}ms total, ${(total / iterations).toFixed(3)}ms/op`,
);
