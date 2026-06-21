import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { RSSKit } from "../src";

const feed = await readFile(new URL("../test/fixtures/guardian.rss", import.meta.url), {
	encoding: "utf-8",
});
const parser = new RSSKit();
const iterations = 50;
const start = performance.now();

for (let index = 0; index < iterations; index += 1) {
	await parser.parse(feed);
}

const total = performance.now() - start;

console.log(
	`rsskit guardian parse: ${total.toFixed(2)}ms total, ${(total / iterations).toFixed(3)}ms/op`,
);
