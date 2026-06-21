import { readFile } from "node:fs/promises";

export const getFixtureAsString = async (filePath: string) => {
	const buffer = await readFile(new URL(`./fixtures/${filePath}`, import.meta.url), {
		encoding: "utf-8",
	});

	return buffer.toString();
};
