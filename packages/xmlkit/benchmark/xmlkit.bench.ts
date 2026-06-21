import { performance } from "node:perf_hooks";
import { Builder, Parser } from "../src";

const xml = `<feed xmlns:atom="https://www.w3.org/2005/Atom">${Array.from(
	{ length: 100 },
	(_, index) =>
		`<entry id="${index}"><title>Post ${index}</title><summary><![CDATA[<p>Hello ${index}</p>]]></summary><atom:link href="https://example.com/${index}" rel="alternate"/></entry>`,
).join("")}</feed>`;
const parser = new Parser();
const builder = new Builder({
	headless: true,
	rootName: "feed",
});
const iterations = 500;

let start = performance.now();

for (let index = 0; index < iterations; index += 1) {
	await parser.parseStringPromise(xml);
}

let total = performance.now() - start;

console.log(
	`xmlkit parse: ${total.toFixed(2)}ms total, ${(total / iterations).toFixed(3)}ms/op`,
);

const object = await parser.parseStringPromise(xml);

start = performance.now();

for (let index = 0; index < iterations; index += 1) {
	builder.buildObject(object.feed);
}

total = performance.now() - start;

console.log(
	`xmlkit build: ${total.toFixed(2)}ms total, ${(total / iterations).toFixed(3)}ms/op`,
);
