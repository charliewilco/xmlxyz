import { RSSKit } from "../src";

import { readFile } from "node:fs/promises";
import path from "node:path";

export const getFixtureAsString = async (filePath: string) => {
	const buffer = await readFile(path.join("test/fixtures", filePath), {
		encoding: "utf-8",
	});

	return buffer.toString();
};

const parser = new RSSKit();

describe("RSS", () => {
	test("can parse a string", async () => {
		const feed = await getFixtureAsString("guardian.rss");
		const output = await parser.parse(feed);

		expect(output.title).toBe("The Guardian");
		expect(output.items.length).toEqual(90);
	});

	test("can parse a podcast RSS feed", async () => {
		const feed = await getFixtureAsString("serial.rss");
		const output = await parser.parse(feed);
		expect(output.title).toBe("Serial");
		expect(output.items.length).toEqual(46);
	});
});
